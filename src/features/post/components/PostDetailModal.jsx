"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Trash2,
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
import { useBookmarks } from "@/features/bookmark";
import {
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useToggleLikeMutation,
} from "@/features/post";
import { useMeQuery } from "@/features/auth";
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
 * PostDetailModal - หน้าดูโพสต์และรูปภาพเต็มจอสไตล์ Threads.com (Full-Screen Split View, พื้นหลังสีขาวสะอาดตา)
 */
export default function PostDetailModal({
  post,
  isOpen,
  onClose,
  initialImageIndex = 0,
  onShareSuccess,
  onEdit,
  onDelete,
  isDeleting = false,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(initialImageIndex);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialImageIndex,
    loop: false,
    duration: 22,
  });
  const [commentText, setCommentText] = useState("");
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'latest'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [likedComments, setLikedComments] = useState({});
  const sortMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);
  const commentsEndRef = useRef(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post?.id);

  // ใช้ค่าจาก post (React Query Cache) เป็น Source of Truth
  const isLiked = Boolean(post?.isLiked);
  const likesCount =
    typeof post?.likesCount === "number"
      ? post.likesCount
      : parseInt(post?.likesCount, 10) || 0;
  const commentsCount =
    typeof post?.commentsCount === "number"
      ? post.commentsCount
      : parseInt(post?.commentsCount, 10) || 0;
  const sharesCount =
    typeof post?.sharesCount === "number"
      ? post.sharesCount
      : parseInt(post?.sharesCount, 10) || 0;

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;
  const currentUserAvatar = currentUser?.avatarUrl || currentUser?.avatar || "";
  const isOwner = Boolean(
    currentUser?.id &&
      ((post?.userId != null &&
        String(post.userId) === String(currentUser.id)) ||
        (post?.author?.id != null &&
          String(post.author.id) === String(currentUser.id)) ||
        (currentUser?.username &&
          post?.author?.username &&
          currentUser.username.toLowerCase() ===
            post.author.username.toLowerCase())),
  );

  // ดึงความคิดเห็นจาก Backend เมื่อเปิดหน้าดูโพสต์
  const { data: commentsData, isLoading: isLoadingComments } = useCommentsQuery(
    post?.id,
    { enabled: Boolean(isOpen && post?.id) },
  );

  const toggleLikeMutation = useToggleLikeMutation();
  const addCommentMutation = useAddCommentMutation({
    onSuccess: () => {
      setCommentText("");
      setAttachPortfolio(false);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  const deleteCommentMutation = useDeleteCommentMutation();

  // Sync รูปเริ่มต้นเมื่อเปิดหน้า
  useEffect(() => {
    if (post && isOpen) {
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

  // ล็อค Scroll ของ Body เมื่อเปิดหน้าเต็มจอ
  useBodyScrollLock(isOpen);

  // รองรับปุ่ม Escape และลูกศรซ้าย-ขวาบนคีย์บอร์ด
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "ArrowLeft" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        emblaApi?.scrollPrev();
      } else if (
        e.key === "ArrowRight" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        emblaApi?.scrollNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, emblaApi]);

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
  const canScrollPrev = activeImageIndex > 0;
  const canScrollNext = activeImageIndex < images.length - 1;

  const handleToggleLike = () => {
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
            disabled={isDeleting}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              if (onDelete) {
                onDelete(post.id);
              }
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>{isDeleting ? "กำลังลบ..." : "ลบโพสต์"}</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white text-gray-900 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden animate-in fade-in duration-150">
      {/* =====================================================================
          1. LEFT STAGE: Full-Screen Media Viewer (พื้นหลังสีขาว ไม่ใช้สีดำ)
      ===================================================================== */}
      {hasImages && (
        <div className="relative shrink-0 lg:flex-1 bg-white flex items-center justify-center select-none overflow-hidden min-h-[55vh] sm:min-h-[65vh] lg:h-full border-b lg:border-b-0 lg:border-r border-gray-100">
          {/* ปุ่ม X มุมซ้ายบน: ย้อนกลับไปหน้า Feed */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 sm:top-5 sm:left-5 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-700 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
            aria-label="ย้อนกลับไปหน้าฟีด"
            title="ย้อนกลับไปหน้าฟีด"
          >
            <X className="h-5 w-5" />
          </button>

          {/* ปุ่มพับ/กางแถบความคิดเห็นด้านขวา (เฉพาะจอใหญ่ เหมือนใน Threads) */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className="hidden lg:flex absolute top-5 right-5 z-30 h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-700 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
            aria-label={
              isSidebarCollapsed ? "แสดงแถบความคิดเห็น" : "ซ่อนแถบความคิดเห็น"
            }
            title={
              isSidebarCollapsed ? "แสดงแถบความคิดเห็น" : "ซ่อนแถบความคิดเห็น"
            }
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>

          {/* Mobile-only Top Right: Options Dropdown */}
          <div
            className="absolute top-4 right-4 z-30 lg:hidden"
            ref={mobileMenuRef}
          >
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100/90 text-gray-700 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
              title="ตัวเลือกเพิ่มเติม"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && renderDropdownMenu()}
          </div>

          {/* Embla Viewport: แสดงรูปเต็มความสูงหน้าจอ */}
          <div
            ref={emblaRef}
            className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="flex h-full w-full">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center px-0 sm:px-12"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Post media ${idx + 1}`}
                    draggable={false}
                    className="max-h-[75vh] lg:max-h-screen w-auto max-w-full object-contain pointer-events-auto select-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่มลูกศรซ้าย (Prev Image) สไตล์ Threads */}
          {images.length > 1 && (
            <button
              type="button"
              disabled={!canScrollPrev}
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollPrev();
              }}
              className={`absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 transition-all cursor-pointer ${
                canScrollPrev
                  ? "hover:bg-gray-200 active:scale-95 opacity-100"
                  : "opacity-35 cursor-default"
              }`}
              aria-label="รูปก่อนหน้า"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* ปุ่มลูกศรขวา (Next Image) สไตล์ Threads */}
          {images.length > 1 && (
            <button
              type="button"
              disabled={!canScrollNext}
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollNext();
              }}
              className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 transition-all cursor-pointer ${
                canScrollNext
                  ? "hover:bg-gray-200 active:scale-95 opacity-100"
                  : "opacity-35 cursor-default"
              }`}
              aria-label="รูปถัดไป"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          2. RIGHT SIDEBAR: Post Header, Content, Inline Reply & Comments Thread
      ===================================================================== */}
      {(!hasImages || !isSidebarCollapsed) && (
        <div
          className={`flex flex-col bg-white h-full overflow-hidden ${
            hasImages
              ? "w-full lg:w-[400px] xl:w-[430px] shrink-0"
              : "w-full max-w-2xl mx-auto border-x border-gray-100"
          }`}
        >
          {/* หากโพสต์ไม่มีรูปภาพ ให้แสดงแถบปุ่มย้อนกลับด้านบนสุด */}
          {!hasImages && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black transition-all cursor-pointer"
                aria-label="ย้อนกลับไปหน้าฟีด"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
              <span className="text-sm font-bold text-gray-900">โพสต์</span>
            </div>
          )}

          {/* Scrollable Container (Post info + Inline Reply + Comments List) */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            {/* Post Header & Caption */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <PostAuthorProfileTrigger author={post.author} />
                  <span className="text-xs text-gray-400">•</span>
                  <span
                    className="text-xs text-gray-400 shrink-0"
                    title={formatFullDateTime(post.createdAt)}
                  >
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>

                <div
                  ref={desktopMenuRef}
                  className={`relative ${hasImages ? "hidden lg:block" : ""}`}
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

              {/* Post Text + ตัวนับลำดับภาพ (เช่น 1/2 แบบ Threads) */}
              {(post.content || images.length > 1) && (
                <div className="mt-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                  {post.content && renderFormattedText(post.content)}
                  {images.length > 1 && (
                    <span className="ml-2 inline-block text-xs font-medium text-gray-400">
                      {activeImageIndex + 1}/{images.length}
                    </span>
                  )}
                </div>
              )}

              {/* Linked Service */}
              {post.service && (
                <div className="mt-3">
                  <LinkedServiceCard
                    service={post.service}
                    authorUsername={post.author?.username}
                    compact
                  />
                </div>
              )}

              {/* Action Buttons: Heart, Comment, Share, Bookmark */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-600 pt-3">
                <div className="flex items-center gap-5">
                  {/* Like */}
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <MessageCircle className="h-4 w-4 text-gray-500" />
                    <span>{commentsCount}</span>
                  </div>

                  {/* Share */}
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer group"
                    title="แชร์โพสต์นี้"
                  >
                    <Send className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>{sharesCount}</span>
                  </button>
                </div>

                {/* Bookmark */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(post)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer p-1 rounded-md hover:bg-gray-100 ${
                    bookmarked
                      ? "text-gray-900 font-semibold"
                      : "text-gray-400 hover:text-gray-900"
                  }`}
                  title={bookmarked ? "ลบออกจากบุ๊กมาร์ก" : "บันทึกโพสต์"}
                >
                  <Bookmark
                    className={`h-4 w-4 transition-transform active:scale-125 ${
                      bookmarked ? "fill-gray-900 text-gray-900" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Filter / Sort Bar ("↓↑ ยอดนิยม", "ดูกิจกรรม >") + ช่องตอบกลับตรงกลางแบบ Threads */}
            <div className="px-4 py-3 space-y-3 bg-white">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div ref={sortMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-1 font-semibold text-gray-800 hover:text-black transition-colors cursor-pointer"
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
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <span>ล่าสุด</span>
                        {sortBy === "latest" && (
                          <Check className="h-3 w-3 text-blue-500" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                  ดูกิจกรรม &gt;
                </span>
              </div>

              {/* ช่องตอบกลับ Inline แบบเดียวกับในภาพตัวอย่าง Threads */}
              <form onSubmit={handleSubmitComment} className="pt-0.5">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={currentUserAvatar}
                    alt={currentUser?.name || "User"}
                    size="sm"
                    className="ring-1 ring-gray-100 shrink-0"
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
                      className="w-full rounded-full bg-gray-100/80 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-gray-300 py-2 pl-3.5 pr-16 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
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
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
                            attachPortfolio
                              ? "bg-black text-white"
                              : "text-gray-400 hover:text-gray-700 hover:bg-gray-200/70"
                          }`}
                        >
                          <FolderKanban className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={
                          !commentText.trim() ||
                          addCommentMutation.isPending ||
                          !currentUser
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Send comment"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
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
                  const canDelete = Boolean(
                    currentUser?.id &&
                      ((comment.user?.id != null &&
                        String(comment.user.id) === String(currentUser.id)) ||
                        (post.author?.id != null &&
                          String(post.author.id) === String(currentUser.id))),
                  );
                  const authorAvatar =
                    comment.user?.avatar || comment.user?.avatarUrl;

                  return (
                    <div
                      key={comment.id}
                      className="flex items-start gap-3 group/comment"
                    >
                      {/* Commenter Avatar & SVG Curved Thread Line */}
                      <div className="flex flex-col items-center shrink-0 w-9 mt-0.5">
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
                            size="sm"
                            className="ring-1 ring-gray-100"
                          />
                        </Link>
                        {comment.portfolioAttachment && (
                          <div className="relative w-full h-[125px]">
                            <svg
                              className="w-[48px] h-[125px] pointer-events-none overflow-visible"
                              viewBox="0 0 48 125"
                              fill="none"
                            >
                              <path
                                d="M 18 8 V 98 C 18 118, 28 118, 40 118"
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
                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              href={
                                comment.user?.username
                                  ? `/${comment.user.username}`
                                  : "#"
                              }
                              className="font-bold text-xs sm:text-sm text-gray-900 hover:underline truncate"
                            >
                              {comment.user?.username ||
                                comment.user?.name ||
                                "User"}
                            </Link>
                            <span className="text-xs text-gray-300">•</span>
                            <span
                              className="text-xs text-gray-400 font-normal shrink-0"
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
                        <p className="mt-1 text-xs sm:text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                          {comment.content}
                        </p>

                        {/* Attached Portfolio / Showcase Card */}
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
                            className={`flex items-center gap-1 transition-colors cursor-pointer ${
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
                            className="hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            className="hover:text-gray-700 transition-colors cursor-pointer"
                          >
                            <Repeat2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            className="hover:text-gray-700 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* Share Post Modal */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{ ...post, sharesCount }}
        onShareSuccess={(newCount) => {
          if (onShareSuccess) onShareSuccess(newCount);
        }}
      />
    </div>
  );
}
