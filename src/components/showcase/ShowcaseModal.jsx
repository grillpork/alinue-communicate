'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Copy,
  Check,
  Trash2,
  Eye,
  ExternalLink,
  Sparkles,
  Calendar,
  Tag,
  Play,
  Briefcase,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import { useToggleShowcaseLikeMutation, useDeleteShowcaseMutation } from '@/services/showcase';
import { useMeQuery } from '@/services/auth';
import { formatRelativeTime } from '@/lib/date';
import EditShowcaseModal from './EditShowcaseModal';
import LinkedServiceCard from '@/components/common/LinkedServiceCard';

/**
 * ฟังก์ชันแปลงข้อความให้ Hashtags (#tag) และ Mentions (@user) กลายเป็นลิงก์คลิกได้
 */
function renderFormattedDescription(text) {
  if (!text) return null;
  const regex = /(#[^\s#.,!?]+|@[^\s@.,!?]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(tag)}`}
          className="text-blue-500 font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith('@')) {
      const username = part.slice(1);
      return (
        <Link
          key={index}
          href={`/${username}`}
          className="text-blue-500 font-semibold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * ShowcaseModal - ป๊อปอัปดูผลงาน Showcase ฉบับเต็ม (Full View Modal)
 * สไตล์ Behance / ArtStation / Pinterest Light Theme
 */
export default function ShowcaseModal({
  showcase,
  isOpen,
  onClose,
  currentUserId,
  isOwner: isOwnerProp,
  onDeleted,
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const toggleLikeMutation = useToggleShowcaseLikeMutation();
  const deleteMutation = useDeleteShowcaseMutation();
  const { data: meData } = useMeQuery();
  const loggedInUser = meData?.user;

  // Sync state เมื่อ showcase เปลี่ยน
  useEffect(() => {
    if (showcase) {
      setIsLiked(Boolean(showcase.is_liked ?? showcase.isLiked));
      setLikesCount(showcase.likes_count ?? showcase.likesCount ?? 0);
      setActiveMediaIndex(0);
      setIsVideoPlaying(false);
    }
  }, [showcase]);

  // ปิดเมนูเพิ่มเติมเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ล็อค Scroll ของบอดี้ และรองรับปุ่ม Escape / แป้นลูกศร ซ้าย-ขวา
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        const total = mediaList.length;
        setActiveMediaIndex((prev) => (prev < total - 1 ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !showcase) return null;

  // แปลงรายการ Media (รองรับ Array หรือ JSON string)
  const mediaList = Array.isArray(showcase.media_urls || showcase.mediaUrls)
    ? showcase.media_urls || showcase.mediaUrls
    : typeof (showcase.media_urls || showcase.mediaUrls) === 'string'
    ? JSON.parse(showcase.media_urls || showcase.mediaUrls || '[]')
    : [];

  if (mediaList.length === 0 && (showcase.cover_url || showcase.coverUrl)) {
    mediaList.push(showcase.cover_url || showcase.coverUrl);
  }

  const currentMedia = mediaList[activeMediaIndex] || '';
  const isVideo =
    showcase.media_type === 'video' ||
    showcase.mediaType === 'video' ||
    /\.(mp4|webm|mov|ogg)$/i.test(currentMedia);

  const author = showcase.author || {
    id: showcase.userId || showcase.user_id,
    name: showcase.author_name || showcase.author_username || 'Creator',
    username: showcase.author_username || 'user',
    avatar: showcase.author_avatar || showcase.author_avatar_url || null,
  };

  const effectiveUserId = currentUserId || loggedInUser?.id;
  const authorUsername = author?.username || showcase.authorUsername || showcase.author_username;

  const isOwner = isOwnerProp !== undefined
    ? Boolean(isOwnerProp)
    : Boolean(
        (effectiveUserId && (Number(effectiveUserId) === Number(showcase.userId || showcase.user_id || author.id))) ||
        (loggedInUser?.username && authorUsername && loggedInUser.username.toLowerCase() === authorUsername.toLowerCase())
      );

  const tags = Array.isArray(showcase.tags)
    ? showcase.tags
    : typeof showcase.tags === 'string'
    ? JSON.parse(showcase.tags || '[]')
    : [];

  const viewsCount = showcase.views_count ?? showcase.viewsCount ?? 0;
  const createdAt = showcase.createdAt || showcase.created_at;

  const handleToggleLike = (e) => {
    e?.stopPropagation?.();
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    toggleLikeMutation.mutate(showcase.id);
  };

  const handleCopyLink = (e) => {
    e?.stopPropagation?.();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${author.username}?showcase=${showcase.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (e) => {
    e?.stopPropagation?.();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${author.username}?showcase=${showcase.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: showcase.title || 'Showcase ผลงานบน Alinue',
            text: `ดูผลงาน "${showcase.title}" โดย @${author.username} บน Alinue`,
            url,
          });
        } catch {
          // ยกเลิกการแชร์
        }
      } else {
        handleCopyLink(e);
      }
    }
  };

  const handleDelete = (e) => {
    e?.stopPropagation?.();
    if (confirm('คุณต้องการลบผลงาน Showcase นี้ใช่หรือไม่?')) {
      deleteMutation.mutate(showcase.id, {
        onSuccess: () => {
          onClose();
          onDeleted?.(showcase.id);
        },
      });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full sm:h-[92vh] max-h-[900px] w-full max-w-6xl flex-col md:flex-row overflow-hidden bg-white sm:rounded-3xl shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150"
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md border border-gray-200/80 backdrop-blur-md hover:bg-white hover:text-black transition-all active:scale-95 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* 1. LEFT SIDE: Media Lightbox Viewer */}
        <div className="relative flex-1 bg-white flex flex-col items-center justify-center select-none overflow-hidden min-h-[300px] sm:min-h-[420px] md:min-h-full border-b md:border-b-0 md:border-r border-gray-100">
          {/* Active Media Container */}
          <div className="relative flex h-full w-full items-center justify-center p-2 sm:p-6">
            {isVideo ? (
              <div className="relative max-h-full max-w-full flex items-center justify-center">
                <video
                  src={currentMedia}
                  controls={isVideoPlaying}
                  playsInline
                  className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
                {!isVideoPlaying && (
                  <div
                    onClick={() => setIsVideoPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] cursor-pointer"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-xl transition-transform hover:scale-110">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                  </div>
                )}
              </div>
            ) : currentMedia ? (
              <img
                src={currentMedia}
                alt={showcase.title || 'Showcase image'}
                className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl transition-all"
                onError={(e) => {
                  e.currentTarget.src = '/empty/no-image.png';
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/empty/no-image.png"
                  alt="No image"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain opacity-90"
                />
              </div>
            )}
          </div>

          {/* Carousel Arrows */}
          {mediaList.length > 1 && (
            <>
              {activeMediaIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex((prev) => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md border border-gray-200/80 hover:bg-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {activeMediaIndex < mediaList.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex((prev) => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md border border-gray-200/80 hover:bg-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Counter Pill & Thumbnails Bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
                <span className="text-[11px] font-semibold text-white/90">
                  {activeMediaIndex + 1} / {mediaList.length}
                </span>
                <div className="mx-1 h-2.5 w-px bg-white/20" />
                <div className="flex items-center gap-1">
                  {mediaList.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === activeMediaIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. RIGHT SIDE: Showcase Details & Actions Panel */}
        <div className="w-full md:w-96 lg:w-[420px] shrink-0 flex flex-col bg-white overflow-y-auto border-t md:border-t-0 md:border-l border-gray-100">
          {/* A. Creator Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
            <Link
              href={`/${author.username}`}
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 group"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100 bg-gray-100">
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt={author.name || author.username}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-bold text-gray-700">
                    {(author.name || author.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate text-xs sm:text-sm font-bold text-gray-900 group-hover:text-black">
                    {author.name || author.username}
                  </h4>
                  <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                </div>
                <p className="truncate text-[11px] text-gray-400">
                  @{author.username}
                </p>
              </div>
            </Link>

            <Link
              href={`/${author.username}`}
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-all"
            >
              ดูโปรไฟล์
            </Link>
          </div>

          {/* B. Showcase Content Body */}
          <div className="flex-1 p-4 sm:p-5 space-y-4">
            {/* Title & Commission Badge */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex items-center gap-1 rounded-md bg-[#a3e635] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
                  <span>OPEN</span>
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                {createdAt && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(createdAt)}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-950 leading-snug">
                {showcase.title}
              </h2>
            </div>

            {/* Description */}
            {showcase.description ? (
              <div className="rounded-2xl bg-gray-50/70 p-3.5 border border-gray-100">
                <p className="text-xs sm:text-[13px] leading-relaxed text-gray-700 whitespace-pre-line">
                  {renderFormattedDescription(showcase.description)}
                </p>
              </div>
            ) : (
              <p className="text-xs italic text-gray-400">
                ครีเอเตอร์ไม่ได้ระบุคำอธิบายผลงาน
              </p>
            )}

            {/* Linked Service Card */}
            {showcase.service && (
              <LinkedServiceCard
                service={showcase.service}
                authorUsername={author?.username}
              />
            )}

            {/* Tags Pills */}
            {tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 mb-2">
                  <Tag className="h-3 w-3" />
                  <span>แท็กที่เกี่ยวข้อง</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      onClick={onClose}
                      className="rounded-lg bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Overview */}
            <div className="flex items-center gap-4 py-2 border-y border-gray-100 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                <strong className="text-gray-900 font-semibold">{likesCount}</strong> ไลก์
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-gray-400" />
                <strong className="text-gray-900 font-semibold">{viewsCount}</strong> ยอดวิว
              </span>
            </div>

            {/* Creator Profile CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">สนใจผลงานหรือต้องการจ้างงาน?</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    ดูผลงานอื่น ๆ เพิ่มเติมของ @{author.username}
                  </p>
                </div>
                <Link
                  href={`/${author.username}`}
                  onClick={onClose}
                  className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-gray-900 hover:bg-gray-100 transition-colors shrink-0 shadow-xs"
                >
                  ดูโปรไฟล์
                </Link>
              </div>
            </div>
          </div>

          {/* C. Footer Actions Bar */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={toggleLikeMutation.isPending}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200 shadow-2xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-transform active:scale-125 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-500'
                }`}
              />
              <span>{isLiked ? 'ถูกใจแล้ว' : 'ถูกใจ'}</span>
            </button>

            {/* Actions Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-2xs transition-all cursor-pointer"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 bottom-full mb-1.5 w-44 rounded-2xl bg-white shadow-xl border border-gray-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleCopyLink();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    )}
                    <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleShare();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-gray-500" />
                    <span>แชร์ผลงาน</span>
                  </button>

                  {isOwner && (
                    <>
                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setIsEditModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        <span>แก้ไขผลงาน</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          handleDelete();
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span>ลบผลงาน</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Showcase Modal */}
      <EditShowcaseModal
        showcase={showcase}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
