'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Trash2,
  Eye,
  Pause,
  Play,
  BadgeCheck,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/date';
import {
  useViewStoryMutation,
  useToggleStoryLikeMutation,
  useDeleteStoryMutation,
} from '@/services/story';

const STORY_DURATION = 5000; // 5 วินาทีต่อ 1 story ตามมาตรฐาน Instagram

export default function StoryViewerModal({
  isOpen,
  onClose,
  storyGroups = [],
  initialGroupIndex = 0,
  currentUserId,
}) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 - 100%
  const [isPaused, setIsPaused] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState(null);

  const viewMutation = useViewStoryMutation();
  const toggleLikeMutation = useToggleStoryLikeMutation();
  const deleteMutation = useDeleteStoryMutation();

  const progressIntervalRef = useRef(null);
  const pressTimerRef = useRef(null);
  const isPressingRef = useRef(false);

  // Sync initial group index
  useEffect(() => {
    if (isOpen) {
      setGroupIndex(Math.max(0, Math.min(initialGroupIndex, storyGroups.length - 1)));
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialGroupIndex, storyGroups.length]);

  const currentGroup = storyGroups[groupIndex] || null;
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[storyIndex] || null;
  const author = currentGroup?.user || null;
  const isOwner = currentUserId && Number(currentUserId) === Number(author?.id);

  // บันทึกการรับชมเมื่อเปิดดู Story นี้
  useEffect(() => {
    if (isOpen && currentStory?.id && currentUserId) {
      viewMutation.mutate(currentStory.id);
    }
  }, [isOpen, currentStory?.id, currentUserId]);

  // ล็อค Scroll ของบอดี้ และจัดการปุ่ม Keyboard
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, groupIndex, storyIndex, storyGroups.length, currentStories.length]);

  // ฟังก์ชันข้ามไปยัง Story ถัดไป
  const handleNext = useCallback(() => {
    setProgress(0);
    if (storyIndex < currentStories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      // จบเรื่องราวทั้งหมดแล้ว ปิด Modal
      onClose();
    }
  }, [storyIndex, currentStories.length, groupIndex, storyGroups.length, onClose]);

  // ฟังก์ชันย้อนกลับไปยัง Story ก่อนหน้า
  const handlePrev = useCallback(() => {
    setProgress(0);
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(Math.max(0, (prevGroup?.stories?.length || 1) - 1));
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Timer จัดการแถบความคืบหน้า (Progress bar)
  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalTime = 50; // อัปเดตทุก 50ms เพื่อความลื่นไหล
    const step = (intervalTime / STORY_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, isPaused, currentStory, handleNext]);

  // ควบคุมการกดค้างเพื่อหยุดชั่วคราว (Hold to pause)
  const handlePointerDown = () => {
    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        setIsPaused(true);
      }
    }, 150);
  };

  const handlePointerUp = () => {
    isPressingRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    setIsPaused(false);
  };

  // จัดการกด Like Story
  const handleToggleLike = (e) => {
    e.stopPropagation();
    if (!currentStory?.id) return;
    toggleLikeMutation.mutate(currentStory.id);
  };

  // จัดการ Reaction Emojis
  const handleSendReaction = (emoji) => {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1200);
  };

  // ลบ Story
  const handleDelete = (e) => {
    e.stopPropagation();
    if (!currentStory?.id) return;
    if (confirm('คุณต้องการลบ Story นี้ใช่หรือไม่?')) {
      deleteMutation.mutate(currentStory.id, {
        onSuccess: () => {
          handleNext();
        },
      });
    }
  };

  if (!isOpen || !currentStory || !author) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-200 select-none p-0 sm:p-4"
    >
      {/* Outer Container (Desktop Arrows) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center w-full h-full max-h-[96vh] max-w-sm sm:max-w-md"
      >
        {/* Desktop Prev Button */}
        {(storyIndex > 0 || groupIndex > 0) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden sm:flex absolute -left-14 z-30 h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            aria-label="Previous story"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Story Phone Card Frame */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative flex flex-col h-full w-full bg-black overflow-hidden sm:rounded-3xl shadow-2xl border border-white/10"
        >
          {/* 1. TOP PROGRESS BARS (Segmented per story) */}
          <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
            {currentStories.map((s, idx) => {
              let fillWidth = '0%';
              if (idx < storyIndex) {
                fillWidth = '100%';
              } else if (idx === storyIndex) {
                fillWidth = `${progress}%`;
              }

              return (
                <div
                  key={s.id || idx}
                  className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur-xs"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* 2. TOP HEADER (Author Info & Close Button) */}
          <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between text-white drop-shadow-md">
            <Link
              href={`/${author.username}`}
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              {/* Avatar with Ring */}
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/80 bg-gray-900">
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt={author.name || author.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-xs font-bold text-white">
                    {(author.name || author.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold truncate group-hover:underline">
                    {author.name || author.username}
                  </p>
                  {author.isVerified && (
                    <BadgeCheck className="h-3.5 w-3.5 fill-blue-500 text-white shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-white/70">
                  {formatRelativeTime(currentStory.createdAt)}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {isPaused && (
                <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-md">
                  <Pause className="h-2.5 w-2.5" />
                  <span>Paused</span>
                </span>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-full bg-black/40 p-1.5 text-white/80 hover:text-rose-400 hover:bg-black/60 backdrop-blur-md transition-colors cursor-pointer"
                  title="ลบ Story นี้"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 3. MEDIA VIEWPORT */}
          <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
            {currentStory.mediaUrl ? (
              <img
                src={currentStory.mediaUrl}
                alt={currentStory.caption || 'Story media'}
                className="h-full w-full object-contain pointer-events-none select-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/50">
                <p className="text-xs">ไม่พบรูปภาพ</p>
              </div>
            )}

            {/* Left / Right Invisible Tap Zones */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
              aria-label="Previous"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-0 inset-y-0 w-2/3 z-20 cursor-pointer"
              aria-label="Next"
            />

            {/* Floating Reaction Animation */}
            {floatingReaction && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-bounce text-6xl">
                {floatingReaction}
              </div>
            )}
          </div>

          {/* 4. BOTTOM CAPTION & INTERACTION BAR */}
          <div className="relative z-30 p-3.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-2.5">
            {/* Caption Text (ถ้ามี) */}
            {currentStory.caption && (
              <div className="rounded-xl bg-black/50 p-2.5 backdrop-blur-md text-xs text-white text-center font-medium leading-relaxed">
                {currentStory.caption}
              </div>
            )}

            {/* Quick Reactions Bar + Like Button */}
            <div className="flex items-center justify-between gap-2">
              {/* Emojis Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none]">
                {['🔥', '❤️', '👏', '😂', '😮', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReaction(emoji);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-base transition-transform active:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Like / Heart Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                  currentStory.isLiked
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${
                    currentStory.isLiked ? 'fill-current text-white' : 'text-white'
                  }`}
                />
                {currentStory.likesCount > 0 && (
                  <span>{currentStory.likesCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Next Button */}
        {(storyIndex < currentStories.length - 1 || groupIndex < storyGroups.length - 1) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden sm:flex absolute -right-14 z-30 h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            aria-label="Next story"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}

