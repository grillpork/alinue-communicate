"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Trash2,
  User,
  Loader2,
  ArrowUpDown,
  ChevronDown,
  Check,
  FolderKanban,
  Bookmark,
  Pencil,
  Share2,
  Flag,
} from "lucide-react";
import { useBookmarks } from "@/services/bookmark";
import {
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useToggleLikeMutation,
} from "@/services/post";
import { useMeQuery } from "@/services/auth";
import { formatRelativeTime, formatFullDateTime } from "@/lib/date";
import CommentPortfolioCard from "./CommentPortfolioCard";
import PostAuthorProfileTrigger from "./PostAuthorProfileTrigger";
import CommentActionsMenu from "./CommentActionsMenu";
import SharePostModal from "./SharePostModal";
import UserAvatar from "@/components/common/UserAvatar";
import LinkedServiceCard from "@/components/common/LinkedServiceCard";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import useEmblaCarousel from "embla-carousel-react";

/**
 * ฟังก์ชันแปลง Hashtag และ Mention เป็นตัวหนังสือสีฟ้า
 */
function renderFormattedText(text) {
  if (!text) return null;
  const regex = /(#[^\s]+|@[^\s]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("#") || part.startsWith("@")) {
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
 * PostDetailModal - หน้าต่างดูโพสต์และดูความคิดเห็นทั้งหมด (All Comments) สไตล์ Light & Clean Theme
 */
export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
  onShareSuccess,
  onEdit,
  onDelete,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialImageIndex,
    loop: false,
    duration: 25,
  });
  const [commentText, setCommentText] = useState("");
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [likesCount, setLikesCount] = useState(post?.likesCount ?? 0);
  const [commentsCount, setCommentsCount] = useState(post?.commentsCount ?? 0);
  const [sharesCount, setSharesCount] = useState(post?.sharesCount ?? 0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sortBy, setSortBy] = useState("latest"); // 'latest' | 'popular'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [likedComments, setLikedComments] = useState({});
  const sortMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const commentsEndRef = useRef(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post?.id);

  useEffect(() => {
    if (typeof post?.sharesCount === "number") {
      setSharesCount(post.sharesCount);
    }
  }, [post?.sharesCount]);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;
  const currentUserAvatar = currentUser?.avatarUrl || currentUser?.avatar || "";
  const isOwner = Boolean(
    currentUser?.id &&
    (Number(post?.userId) === Number(currentUser.id) ||
      Number(post?.author?.id) === Number(currentUser.id) ||
      (currentUser?.username &&
        post?.author?.username &&
        currentUser.username.toLowerCase() ===
          post.author.username.toLowerCase())),
  );

  // ดึงความคิดเห็นจาก Backend เมื่อเปิด Modal
  const { data: commentsData, isLoading: isLoadingComments } = useCommentsQuery(
    post?.id,
    { enabled: Boolean(isOpen && post?.id) },
  );

  const toggleLikeMutation = useToggleLikeMutation();
  const addCommentMutation = useAddCommentMutation({
    onSuccess: () => {
      setCommentText("");
      setAttachPortfolio(false);
      setCommentsCount((prev) => prev + 1);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  const deleteCommentMutation = useDeleteCommentMutation({
    onSuccess: () => {
      setCommentsCount((prev) => Math.max(0, prev - 1));
    },
  });

  // Sync state จาก post เมื่อเปิด Modal
  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false);
      setLikesCount(post.likesCount ?? 0);
      setCommentsCount(post.commentsCount ?? 0);
      const startIdx = initialImageIndex || 0;
      setActiveImageIndex(startIdx);
      if (emblaApi) {
        emblaApi.scrollTo(startIdx, true);
      }
    }
  }, [post, initialImageIndex, isOpen, emblaApi]);

  // Sync Embla Carousel กับ activeImageIndex
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveImageIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // ล็อค Scroll ของ Body เมื่อเปิด Modal
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // ปิดเมนู sort และ options เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
      const clickedMobile =
        mobileMenuRef.current && mobileMenuRef.current.contains(e.target);
      const clickedDesktop =
        desktopMenuRef.current && desktopMenuRef.current.contains(e.target);
      if (!clickedMobile && !clickedDesktop) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || !post) return null;

  const rawImages = post.images || [];
  const images = rawImages
    .map((img, idx) => {
      if (!img) return null;
      if (typeof img === "string") return { id: String(idx), url: img };
      return { id: img.id || String(idx), url: img.url || "" };
    })
    .filter((img) => Boolean(img?.url));

  const hasImages = images.length > 0;

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    toggleLikeMutation.mutate(post.id);
  };

  const handleToggleCommentLike = (commentId) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || addCommentMutation.isPending || !currentUser)
      return;
    addCommentMutation.mutate({
      postId: post.id,
      content: commentText.trim(),
      attachPortfolio,
    });
  };

  // จัดการลำดับความคิดเห็น
  const rawComments = commentsData?.comments || [];
  const sortedComments = [...rawComments].sort((a, b) => {
    if (sortBy === "popular") {
      return (b.content?.length || 0) - (a.content?.length || 0);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const renderDropdownMenu = () => (
    <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(false);
          setIsShareModalOpen(true);
        }}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Share2 className="h-3.5 w-3.5 text-gray-500" />
        <span>แชร์โพสต์</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(false);
          alert("ส่งรายงานโพสต์นี้ให้ผู้ดูแลระบบตรวจสอบแล้ว");
        }}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Flag className="h-3.5 w-3.5 text-gray-400" />
        <span>รายงานโพสต์</span>
      </button>

      {isOwner && (
        <>
          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              if (onEdit) onEdit(post);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-500" />
            <span>แก้ไขโพสต์</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              if (onDelete) {
                onDelete(post.id);
                onClose();
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>ลบโพสต์</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-200"
    >
      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full h-full md:h-[90vh] md:max-h-[860px] bg-white text-gray-900 overflow-hidden shadow-2xl flex flex-col md:flex-row md:rounded-3xl border border-gray-100 ${
          hasImages ? "md:max-w-6xl" : "md:max-w-2xl"
        }`}
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

        {/* Mobile-only Top Right: Options Dropdown on Image */}
        {hasImages && (
          <div
            className="absolute top-4 right-4 z-40 md:hidden"
            ref={mobileMenuRef}
          >
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md border border-gray-200/80 backdrop-blur-md hover:bg-white hover:text-black transition-all active:scale-95 cursor-pointer"
              title="ตัวเลือกเพิ่มเติม"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>

            {showMenu && renderDropdownMenu()}
          </div>
        )}
        {/* 1. LEFT SIDE: Media Carousel (Image View with Embla Carousel) */}
        {hasImages && (
          <div className="relative shrink-0 md:flex-1 bg-gray-50 flex items-center justify-center select-none overflow-hidden h-[420px] sm:h-[560px] md:h-full min-h-[420px] sm:min-h-[560px] md:min-h-full border-b md:border-b-0 md:border-r border-gray-100 group">
            {/* Embla Viewport */}
            <div
              ref={emblaRef}
              className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <div className="flex h-full w-full">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center p-3 sm:p-5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Post media ${idx + 1}`}
                      draggable={false}
                      className="max-h-full max-w-full object-contain pointer-events-auto rounded-xl shadow-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Prev Arrow */}
            {/* {images.length > 1 && activeImageIndex > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white hover:text-black shadow-md border border-gray-200/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )} */}

            {/* Next Arrow */}
            {/* {images.length > 1 && activeImageIndex < images.length - 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  emblaApi?.scrollNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white hover:text-black shadow-md border border-gray-200/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )} */}

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      emblaApi?.scrollTo(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? "w-4 bg-black"
                        : "w-1.5 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. RIGHT SIDE: Post Header, Content & All Comments Thread */}
        <div
          className={`flex flex-col bg-white overflow-hidden ${
            hasImages ? "w-full md:w-[440px] lg:w-[480px]" : "w-full"
          }`}
        >
          {/* Scrollable Container (Post info + Comments List) */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            {/* Post Header & Caption */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PostAuthorProfileTrigger author={post.author} />
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>

                <div
                  ref={desktopMenuRef}
                  className={`relative ${hasImages ? "hidden md:block" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {showMenu && renderDropdownMenu()}
                </div>
              </div>

              {/* Post Text */}
              {post.content && (
                <div className="mt-3.5 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                  {renderFormattedText(post.content)}
                </div>
              )}

              {/* Linked Service */}
              {post.service && (
                <LinkedServiceCard
                  service={post.service}
                  authorUsername={post.author?.username}
                  compact
                />
              )}

              {/* Action Buttons: Heart, Comment, Repost, Share */}
              <div className="mt-4 flex items-center gap-5 text-xs text-gray-500 pt-3 border-t border-gray-100">
                {/* Like */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 transition-colors ${
                    isLiked
                      ? "text-red-500 font-semibold"
                      : "hover:text-gray-900"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 transition-transform active:scale-125 ${
                      isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                    }`}
                  />
                  <span>{likesCount}</span>
                </button>

                {/* Comment */}
                <div className="flex items-center gap-1.5 text-gray-900 font-semibold">
                  <MessageCircle className="h-4 w-4 text-gray-900" />
                  <span>{commentsCount}</span>
                </div>

                {/* Share */}
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer group"
                  title="แชร์โพสต์นี้"
                >
                  <Send className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span>{sharesCount}</span>
                </button>

                {/* Bookmark */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(post)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    bookmarked
                      ? "text-gray-900 font-semibold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title={bookmarked ? "ลบออกจากบุ๊กมาร์ก" : "บันทึกโพสต์"}
                >
                  <Bookmark
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      bookmarked ? "fill-gray-900 text-gray-900" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter / Sort Bar (เช่น "↓↑ ยอดนิยม", "ดูกิจกรรม >") */}
            <div className="px-4 py-2.5 flex items-center justify-between text-xs text-gray-600 bg-gray-50/70 border-y border-gray-100">
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-1 font-medium hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  <span>{sortBy === "popular" ? "ยอดนิยม" : "ล่าสุด"}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {showSortMenu && (
                  <div className="absolute left-0 mt-1.5 w-32 rounded-xl bg-white p-1 shadow-xl border border-gray-100 z-30 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("popular");
                        setShowSortMenu(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>ยอดนิยม</span>
                      {sortBy === "popular" && (
                        <Check className="h-3 w-3 text-blue-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy("latest");
                        setShowSortMenu(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>ล่าสุด</span>
                      {sortBy === "latest" && (
                        <Check className="h-3 w-3 text-blue-500" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                ดูกิจกรรม &gt;
              </span>
            </div>

            {/* Comments Thread List */}
            <div className="p-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-400 gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span>กำลังโหลดความคิดเห็น...</span>
                </div>
              ) : sortedComments.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-700 font-medium">
                    ยังไม่มีความคิดเห็น
                  </p>
                  <p className="text-gray-400 mt-1">
                    เป็นคนแรกที่เริ่มการสนทนา
                  </p>
                </div>
              ) : (
                sortedComments.map((comment) => {
                  const isCommentLiked = Boolean(likedComments[comment.id]);
                  const canDelete =
                    currentUser &&
                    (currentUser.id === comment.user?.id ||
                      currentUser.id === post.author?.id);
                  const authorAvatar =
                    comment.user?.avatar || comment.user?.avatarUrl;

                  return (
                    <div
                      key={comment.id}
                      className="flex items-start gap-3 group/comment"
                    >
                      {/* Commenter Avatar & SVG Curved Thread Line */}
                      <div className="flex flex-col items-center shrink-0 w-10 mt-0.5">
                        <Link
                          href={
                            comment.user?.username
                              ? `/${comment.user.username}`
                              : "#"
                          }
                          className="shrink-0"
                        >
                          <UserAvatar
                            src={authorAvatar}
                            alt={comment.user?.name || "User"}
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
                                d="M 20 8 V 98 C 20 118, 30 118, 44 118"
                                stroke="#d1d5db"
                                strokeWidth="1.25"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Content & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link
                              href={
                                comment.user?.username
                                  ? `/${comment.user.username}`
                                  : "#"
                              }
                              className="font-bold text-sm sm:text-base text-gray-900 hover:underline truncate"
                            >
                              {comment.user?.username ||
                                comment.user?.name ||
                                "User"}
                            </Link>
                            <span className="text-xs text-gray-300">•</span>
                            <span
                              className="text-xs sm:text-[13px] text-gray-400 font-normal"
                              title={formatFullDateTime(comment.createdAt)}
                            >
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>

                          {/* Comment Options Dropdown (•••) */}
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

                        {/* Comment Text */}
                        <p className="mt-1 text-sm sm:text-[15px] text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                          {comment.content}
                        </p>

                        {/* Attached Portfolio / Showcase Card (สไตล์ UI ตัวอย่าง) */}
                        {comment.portfolioAttachment && (
                          <CommentPortfolioCard
                            data={comment.portfolioAttachment}
                          />
                        )}

                        {/* Reactions below comment */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                          <button
                            type="button"
                            onClick={() => handleToggleCommentLike(comment.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              isCommentLiked
                                ? "text-red-500"
                                : "hover:text-gray-700"
                            }`}
                          >
                            <Heart
                              className={`h-3.5 w-3.5 ${
                                isCommentLiked
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                            {isCommentLiked && <span>1</span>}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCommentText(`@${comment.user?.username} `);
                            }}
                            className="hover:text-gray-700 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            className="hover:text-gray-700 transition-colors"
                          >
                            <Repeat2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            className="hover:text-gray-700 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* 3. BOTTOM STICKY INPUT BAR (ตอบกลับ @author...) */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
            <form
              onSubmit={handleSubmitComment}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <UserAvatar
                  src={currentUserAvatar}
                  alt={currentUser?.name || "User"}
                  className="h-10 w-10 sm:h-11 sm:w-11 ring-1 ring-gray-100 shrink-0"
                />

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={
                      currentUser
                        ? `ตอบกลับ ${post.author?.username || post.author?.name || ""}...`
                        : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"
                    }
                    value={commentText}
                    disabled={!currentUser || addCommentMutation.isPending}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full rounded-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200/80 focus:border-gray-400 py-2.5 sm:py-3 pl-4 sm:pl-5 pr-20 sm:pr-24 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs"
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
                            ? "bg-black text-white shadow-xs"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-200/70"
                        }`}
                      >
                        <FolderKanban className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={
                        !commentText.trim() ||
                        addCommentMutation.isPending ||
                        !currentUser
                      }
                      className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                      aria-label="Send comment"
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{ ...post, sharesCount }}
        onShareSuccess={(newCount) => {
          setSharesCount(newCount);
          if (onShareSuccess) onShareSuccess(newCount);
        }}
      />
    </div>
  );
}
