"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useToggleLikeMutation } from "../hooks/use-posts";
import { useMeQuery } from "@/features/auth";
import { useBookmarks } from "@/features/bookmark";
import { getPostPath } from "@/lib/slug";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import PostImagesCarousel from "./PostImagesCarousel";
import PostActions from "./PostActions";
import PostComments from "./PostComments";
import SharePostModal from "./SharePostModal";
import PostDetailModal from "./PostDetailModal";
import PostImageLightbox from "./PostImageLightbox";
import LinkedServiceCard from "@/components/common/LinkedServiceCard";

/**
 * PostCard - การ์ดแสดงผลโพสต์ใน Feed และ Profile
 * ทำหน้าที่เป็น Orchestrator ประกอบ Components ย่อยเข้าด้วยกัน
 */
export default function PostCard({
  post,
  onLike,
  onEdit,
  onDelete,
  onImageClick,
}) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const previousUrlRef = useRef(null);

  // 1. ดึงข้อมูลผู้ใช้งานปัจจุบัน
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  // 2. ข้อมูลผู้แต่งและสิทธิ์ความเป็นเจ้าของ (เปรียบเทียบ ID แบบปลอดภัย)
  const postAuthorUsername = post?.author?.username || "user";
  const isOwner = Boolean(
    currentUser?.id &&
      ((post?.userId != null &&
        String(post.userId) === String(currentUser.id)) ||
        (post?.author?.id != null &&
          String(post.author.id) === String(currentUser.id))),
  );

  // 3. Derived State: ให้ React Query Cache เป็น Single Source of Truth
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

  // 4. บุ๊กมาร์ก
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(post?.id);

  // 5. Like Mutation พร้อม Optimistic Update & Auto Rollback ใน React Query
  const toggleLikeMutation = useToggleLikeMutation();

  const handleLike = () => {
    const nextState = !isLiked;
    toggleLikeMutation.mutate(post.id);
    if (onLike) onLike(post.id, nextState);
  };

  // 6. คลิกที่รูปภาพ: ขยายรูปใหญ่เต็มจอทันที (PostImageLightbox พื้นหลังสีขาว)
  const handleImageClick = useCallback(
    (imageUrl, imageIndex) => {
      if (onImageClick) {
        onImageClick(imageUrl, imageIndex);
        return;
      }
      setInitialImageIndex(typeof imageIndex === "number" ? imageIndex : 0);
      setIsLightboxOpen(true);
    },
    [onImageClick],
  );

  // 7. เปิดหน้าดูรายละเอียดโพสต์และความคิดเห็นทั้งหมด (เมื่อกด "ดูทั้งหมด")
  const handleOpenDetailModal = useCallback(
    (imageUrl, imageIndex) => {
      setInitialImageIndex(typeof imageIndex === "number" ? imageIndex : 0);
      setIsDetailModalOpen(true);

      if (typeof window !== "undefined") {
        previousUrlRef.current =
          window.location.pathname + window.location.search;
        const postPath = getPostPath(postAuthorUsername, post);
        window.history.pushState({ postView: post?.id }, "", postPath);
      }
    },
    [postAuthorUsername, post],
  );

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    if (typeof window !== "undefined" && previousUrlRef.current) {
      window.history.replaceState({}, "", previousUrlRef.current);
      previousUrlRef.current = null;
    }
  }, []);

  // รองรับการกดปุ่ม Back ของเบราว์เซอร์ขณะเปิดหน้าดูโพสต์เต็มจอ
  useEffect(() => {
    if (!isDetailModalOpen) return;
    const handlePopState = () => {
      setIsDetailModalOpen(false);
      previousUrlRef.current = null;
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDetailModalOpen]);

  // 8. คัดลอกลิงก์โพสต์ด้วย async Clipboard API
  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        const url = `${window.location.origin}${getPostPath(postAuthorUsername, post)}`;
        await navigator.clipboard.writeText(url);
        alert("คัดลอกลิงก์โพสต์เรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <article className="border-b border-gray-100 bg-white py-4 px-0 transition-colors">
      {/* 1. Header: รูปผู้แต่ง, ชื่อ, เวลา, เมนูตัวเลือก */}
      <PostHeader
        author={post?.author}
        createdAt={post?.createdAt}
        isOwner={isOwner}
        onCopyLink={handleCopyLink}
        onShare={() => setIsShareModalOpen(true)}
        onEdit={() => onEdit?.(post)}
        onDelete={() => onDelete?.(post.id)}
      />

      {/* 2. เนื้อหาข้อความโพสต์ */}
      <PostContent content={post?.content} />

      {/* 3. Carousel / Grid รูปภาพโพสต์ (คลิกแล้วขยายรูปใหญ่เต็มจอทันที) */}
      <PostImagesCarousel
        images={post?.images}
        onImageClick={handleImageClick}
      />

      {/* 4. การ์ดบริการที่แนบมา (Linked Service) */}
      {post?.service && (
        <div className="px-3.5 sm:px-4 mt-2.5">
          <LinkedServiceCard
            service={post.service}
            authorUsername={post.author?.username}
            compact
          />
        </div>
      )}

      {/* 5. แถบปุ่ม Action: Like, Comment, Share, Bookmark */}
      <PostActions
        isLiked={isLiked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={sharesCount}
        bookmarked={bookmarked}
        showComments={showComments}
        onLike={handleLike}
        onToggleComments={() => setShowComments((prev) => !prev)}
        onShare={() => setIsShareModalOpen(true)}
        onToggleBookmark={(e) => {
          e.stopPropagation();
          toggleBookmark(post);
        }}
      />

      {/* 6. กล่องความคิดเห็นใต้โพสต์ */}
      {showComments && (
        <PostComments
          postId={post?.id}
          commentsCount={commentsCount}
          currentUser={currentUser}
          postAuthorId={post?.author?.id ?? post?.userId}
          onOpenDetail={() => handleOpenDetailModal(undefined, 0)}
        />
      )}

      {/* 7. Modal แชร์โพสต์ */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{ ...post, sharesCount }}
      />

      {/* 8. ขยายรูปภาพเต็มจอทันทีเมื่อคลิกที่รูป (พื้นหลังสีขาว ไม่ใช้สีดำ) */}
      {isLightboxOpen && (
        <PostImageLightbox
          images={post?.images}
          initialIndex={initialImageIndex}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}

      {/* 9. หน้าดูโพสต์และความคิดเห็นทั้งหมดแบบเต็มจอ */}
      {isDetailModalOpen && (
        <PostDetailModal
          post={post}
          isOpen={isDetailModalOpen}
          initialImageIndex={initialImageIndex}
          onClose={handleCloseDetailModal}
          onEdit={onEdit ? () => onEdit(post) : undefined}
          onDelete={onDelete ? () => onDelete(post.id) : undefined}
        />
      )}
    </article>
  );
}
