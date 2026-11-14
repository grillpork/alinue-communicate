'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  Heart,
  MessageCircle,
  Send,
  User,
  Loader2,
  FolderKanban,
  Check,
  Bookmark,
} from 'lucide-react';
import {
  useToggleLikeMutation,
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} from '@/services/post';
import { useMeQuery } from '@/services/auth';
import { useBookmarks } from '@/services/bookmark';
import { formatRelativeTime, formatFullDateTime } from '@/lib/date';
import PostDetailModal from './PostDetailModal';
import SharePostModal from './SharePostModal';
import CommentPortfolioCard from './CommentPortfolioCard';
import CommentActionsMenu from './CommentActionsMenu';
import PostAuthorProfileTrigger from './PostAuthorProfileTrigger';
import UserAvatar from '@/components/common/UserAvatar';

/**
 * แปลงข้อความที่มี #hashtag หรือ @user ให้เป็นสีฟ้า
 */
function renderPostText(text) {
  if (!text) return null;
  const regex = /(#[^\s]+|@[^\s]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('#') || part.startsWith('@')) {
      return (
        <span
          key={index}
          className="text-blue-500 font-medium hover:underline cursor-pointer transition-colors"
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Embla Carousel สำหรับเลื่อนดูรูปภาพใน PostCard (สไตล์ Threads / Card Peek สไลด์ด้วย Mouse Drag)
 */
function PostImagesCarousel({ images, onImageClick }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps',
    duration: 25,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const syncEmbla = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', syncEmbla);
    emblaApi.on('reInit', syncEmbla);

    const rafId = requestAnimationFrame(syncEmbla);

    return () => {
      cancelAnimationFrame(rafId);
      emblaApi.off('select', syncEmbla);
      emblaApi.off('reInit', syncEmbla);
    };
  }, [emblaApi]);

  const scrollPrev = (e) => {
    e.stopPropagation();
    emblaApi?.scrollPrev();
  };

  const scrollNext = (e) => {
    e.stopPropagation();
    emblaApi?.scrollNext();
  };

  // ปรับรูปภาพให้อยู่ใน Format { id, url, name } เสมอ รองรับทั้ง Array of String ("https://...") และ Array of Object ({ url: "..." })
  const normalizedImages = (images || [])
    .map((img, idx) => {
      if (!img) return null;
      if (typeof img === 'string') {
        return { id: String(idx), url: img, name: 'Post image' };
      }
      return {
        id: img.id || String(idx),
        url: img.url || '',
        name: img.name || 'Post image',
      };
    })
    .filter((img) => Boolean(img?.url));

  if (normalizedImages.length === 0) return null;

  // กรณี 1 รูป: แสดงตามสัดส่วนจริงของภาพ สไตล์ Threads (ล็อคความสูงสูงสุดเท่ากัน ไม่ crop ภาพทิ้ง)
  if (normalizedImages.length === 1) {
    const singleImage = normalizedImages[0];
    return (
      <div className="mt-3 px-3.5 sm:px-4 flex">
        <div
          onClick={() => onImageClick && onImageClick(singleImage.url)}
          className="relative inline-block max-w-full overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50/50 shadow-2xs cursor-pointer group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={singleImage.url}
            alt={singleImage.name || 'Post image'}
            className="block h-auto max-h-[400px] sm:max-h-[460px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    );
  }

  // กรณี 2 รูปขึ้นไป: Card Carousel แบบเห็นการ์ดถัดไปยื่นออกมา (Peek Style) เหมือนใน Threads
  return (
    <div className="relative mt-3 group select-none">
      {/* Embla Viewport */}
      <div
        ref={emblaRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="flex gap-2.5 px-3.5 sm:px-4">
          {normalizedImages.map((img, idx) => (
            <div
              key={img.id || idx}
              className="relative min-w-0 flex-[0_0_72%] sm:flex-[0_0_66%] h-[360px] sm:h-[440px] overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50 shadow-2xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name || `Image ${idx + 1}`}
                draggable={false}
                onClick={() => onImageClick && onImageClick(img.url)}
                className="h-full w-full object-cover pointer-events-auto transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Prev Navigation Arrow (ปรากฏเมื่อ Hover บนจอ Desktop) */}
      {canScrollPrev && (
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 hover:bg-white transition-all active:scale-95 border border-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Next Navigation Arrow (ปรากฏเมื่อ Hover บนจอ Desktop) */}
      {canScrollNext && (
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 hover:bg-white transition-all active:scale-95 border border-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function PostCard({
  post,
  onLike,
  onEdit,
  onDelete,
  onImageClick,
}) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [sharesCount, setSharesCount] = useState(post.sharesCount ?? 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const menuRef = useRef(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post?.id);

  const contentText = post.content || '';
  const isLongContent = useMemo(() => {
    const lines = contentText.split('\n');
    return lines.length > 5 || contentText.length > 260;
  }, [contentText]);

  const displayContent = useMemo(() => {
    if (!isLongContent || isContentExpanded) {
      return contentText;
    }
    const lines = contentText.split('\n');
    const maxLines = 4;
    const maxChars = 240;
    let resultLines = [];
    let chars = 0;

    for (let i = 0; i < lines.length && i < maxLines; i++) {
      const line = lines[i];
      if (chars + line.length > maxChars) {
        const remaining = Math.max(0, maxChars - chars);
        resultLines.push(line.slice(0, remaining).trimEnd() + '...');
        return resultLines.join('\n');
      }
      resultLines.push(line);
      chars += line.length + 1;
    }
    return resultLines.join('\n');
  }, [contentText, isLongContent, isContentExpanded]);

  useEffect(() => {
    if (typeof post.commentsCount === 'number') {
      setCommentsCount(post.commentsCount);
    }
  }, [post.commentsCount]);

  useEffect(() => {
    if (typeof post.sharesCount === 'number') {
      setSharesCount(post.sharesCount);
    }
  }, [post.sharesCount]);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;
  const currentUserAvatar = currentUser?.avatarUrl || currentUser?.avatar || '';
  const currentUserName =
    currentUser?.displayName || currentUser?.username || currentUser?.name || 'User';

  const { data: commentsData, isLoading: isLoadingComments } = useCommentsQuery(
    post.id,
    { enabled: showComments }
  );
  const comments = commentsData?.comments || [];

  const addCommentMutation = useAddCommentMutation({
    onSuccess: () => {
      setCommentText('');
      setAttachPortfolio(false);
      setCommentsCount((prev) => prev + 1);
    },
  });

  const deleteCommentMutation = useDeleteCommentMutation({
    onSuccess: () => {
      setCommentsCount((prev) => Math.max(0, prev - 1));
    },
  });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || addCommentMutation.isPending) return;
    addCommentMutation.mutate({
      postId: post.id,
      content: commentText.trim(),
      attachPortfolio,
    });
  };

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLikeMutation = useToggleLikeMutation();

  const handleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => {
      const current = typeof prev === 'number' ? prev : parseInt(prev, 10) || 0;
      return nextState ? current + 1 : Math.max(0, current - 1);
    });
    toggleLikeMutation.mutate(post.id);
    if (onLike) onLike(post.id, nextState);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1200);
    }
  };

  return (
    <article className="border-b border-gray-100 bg-white py-4 px-0 transition-colors">
      {/* Header: Author Avatar, Name, Dot, Time, More Options */}
      <div className="flex items-center justify-between px-3.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          {/* Post Author Profile Trigger (Hover = Mini Popup, Toggle/Click = Modal Profile) */}
          <PostAuthorProfileTrigger author={post.author} />
          <span className="text-gray-400 text-xs">•</span>
          <span
            className="text-gray-400 hover:text-gray-600 transition-colors text-xs cursor-default"
            title={formatFullDateTime(post.createdAt)}
          >
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>

        {/* More Options (•••) with Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-30">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-gray-400" />
                <span>{copied ? 'Copied Link!' : 'Copy link'}</span>
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(post);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-400" />
                  <span>Edit post</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(post.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Delete post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content (มีปุ่มดูเพิ่มเติมเมื่อข้อความยาวเกินไป) */}
      {post.content && (
        <div className="mt-2.5 text-xs sm:text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words px-3.5 sm:px-4">
          {renderPostText(displayContent)}
          {isLongContent && (
            <button
              type="button"
              onClick={() => setIsContentExpanded((prev) => !prev)}
              className="mt-1 block text-xs sm:text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              {isContentExpanded ? 'ดูน้อยลง' : 'ดูเพิ่มเติม'}
            </button>
          )}
        </div>
      )}

      {/* Post Images (Embla Carousel with mouse drag slide) */}
      <PostImagesCarousel
        images={post.images}
        onImageClick={onImageClick || (() => setIsDetailModalOpen(true))}
      />

      {/* Footer Actions: Heart, Comment, Share, Bookmark */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600 px-3.5 sm:px-4">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked ? 'text-red-500 font-semibold' : 'hover:text-gray-900'
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform active:scale-125 ${
                isLiked ? 'fill-red-500 text-red-500' : 'text-gray-500'
              }`}
            />
            <span>{likesCount}</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              showComments ? 'text-black font-semibold' : 'hover:text-gray-900'
            }`}
          >
            <MessageCircle
              className={`h-4 w-4 ${showComments ? 'stroke-[2.5px]' : ''}`}
            />
            <span>{commentsCount}</span>
          </button>

          {/* Share Button (Paper plane) */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors cursor-pointer group"
            title="แชร์โพสต์นี้"
          >
            <Send className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="font-medium">{sharesCount}</span>
          </button>
        </div>

        {/* Bookmark */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(post);
          }}
          className={`flex items-center transition-colors cursor-pointer p-1 rounded-md hover:bg-gray-100 ${
            bookmarked ? 'text-gray-900 font-semibold' : 'text-gray-400 hover:text-gray-900'
          }`}
          title={bookmarked ? 'ลบออกจากบุ๊กมาร์ก' : 'บันทึกในบุ๊กมาร์ก'}
          aria-label="Bookmark"
        >
          <Bookmark
            className={`h-4 w-4 transition-transform active:scale-125 ${
              bookmarked ? 'fill-gray-900 text-gray-900' : ''
            }`}
          />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-3 px-3.5 sm:px-4">
          {/* View in Full Modal Button */}
          {commentsCount > 0 && (
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="text-gray-500 font-medium">ความคิดเห็น ({commentsCount})</span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <span>ดูทั้งหมด</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
          {/* Add Comment Input Form */}
          <form
            onSubmit={handleSubmitComment}
            className="flex flex-col gap-2 py-1"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <UserAvatar
                src={currentUserAvatar}
                alt={currentUserName}
                className="h-10 w-10 sm:h-11 sm:w-11 ring-1 ring-gray-200/80 shrink-0"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={
                    currentUser
                      ? 'เขียนความคิดเห็น...'
                      : 'เข้าสู่ระบบเพื่อแสดงความคิดเห็น'
                  }
                  value={commentText}
                  disabled={!currentUser || addCommentMutation.isPending}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full rounded-full bg-gray-50/90 hover:bg-gray-100/70 focus:bg-white border border-gray-200/80 focus:border-gray-400 py-2.5 sm:py-3 pl-4 sm:pl-5 pr-20 sm:pr-24 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setAttachPortfolio(!attachPortfolio)}
                      title={
                        attachPortfolio
                          ? `แนบ Portfolio (${currentUser.username}) แล้ว (คลิกเพื่อยกเลิก)`
                          : `แนบ Portfolio (${currentUser.username})`
                      }
                      aria-label="แนบ Portfolio"
                      className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                        attachPortfolio
                          ? 'bg-black text-white shadow-xs'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/70'
                      }`}
                    >
                      <FolderKanban className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={
                      !commentText.trim() || addCommentMutation.isPending || !currentUser
                    }
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                    aria-label="Send comment"
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-3 text-xs text-gray-400 gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>กำลังโหลดความคิดเห็น...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center py-2 text-xs text-gray-400">
              ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
            </p>
          ) : (
            <div className="space-y-4 pt-1">
              {comments.map((comment) => {
                const canDelete =
                  currentUser &&
                  (currentUser.id === comment.user?.id ||
                    currentUser.id === post.author?.id);
                const commentAvatar =
                  comment.user?.avatar || comment.user?.avatarUrl;

                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-3 group/comment"
                  >
                    {/* Left: Avatar + SVG Curved Thread line connecting down to card if has attachment */}
                    <div className="flex flex-col items-center shrink-0 w-10 mt-0.5">
                      <Link
                        href={
                          comment.user?.username
                            ? `/${comment.user.username}`
                            : '#'
                        }
                        className="shrink-0"
                      >
                        <UserAvatar
                          src={commentAvatar}
                          alt={comment.user?.name || 'User'}
                          size="md"
                          className="ring-1 ring-gray-100"
                        />
                      </Link>
                      {comment.portfolioAttachment && (
                        <div className="relative w-full h-[125px]">
                          <svg
                            className="w-[52px] h-[125px] pointer-events-none overflow-visible"
                            viewBox="0 0 52 125"
                            fill="none"
                          >
                            <path
                              d="M 20 8 V 98 C 20 118, 40 118, 38 118"
                              stroke="#d1d5db"
                              strokeWidth="1"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Link
                            href={
                              comment.user?.username
                                ? `/${comment.user.username}`
                                : '#'
                            }
                            className="font-bold text-sm sm:text-base text-gray-900 hover:underline truncate"
                          >
                            {comment.user?.name || 'User'}
                          </Link>
                          <span className="text-gray-300 text-xs">•</span>
                          <span
                            className="text-gray-400 text-xs sm:text-[13px] shrink-0 font-normal"
                            title={formatFullDateTime(comment.createdAt)}
                          >
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>

                        <CommentActionsMenu
                          comment={comment}
                          canDelete={canDelete}
                          onDelete={() =>
                            deleteCommentMutation.mutate({
                              postId: post.id,
                              commentId: comment.id,
                            })
                          }
                          isDeleting={deleteCommentMutation.isPending}
                        />
                      </div>
                      <p className="text-sm sm:text-[15px] text-gray-900 whitespace-pre-wrap break-words mt-1 leading-relaxed">
                        {comment.content}
                      </p>

                      {/* Attached Portfolio / Showcase Card (สไตล์ UI ตัวอย่าง) */}
                      {comment.portfolioAttachment && (
                        <CommentPortfolioCard data={comment.portfolioAttachment} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Post Detail & All Comments Modal (สไตล์ Threads ตาม UI ตัวอย่าง) */}
      <PostDetailModal
        post={{ ...post, sharesCount }}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onShareSuccess={(newCount) => setSharesCount(newCount)}
      />

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{ ...post, sharesCount }}
        onShareSuccess={(newCount) => setSharesCount(newCount)}
      />
    </article>
  );
}
