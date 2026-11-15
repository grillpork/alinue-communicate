"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

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

  // 6. ส่งต่อ imageUrl และ index ไปยัง onImageClick หรือเปิด PostDetailModal โดยตรง
  const handleOpenDetailModal = (imageUrl, imageIndex) => {
    if (onImageClick) {
      onImageClick(imageUrl, imageIndex);
      return;
    }
    setInitialImageIndex(typeof imageIndex === "number" ? imageIndex : 0);
    setIsDetailModalOpen(true);
  };

  // 7. คัดลอกลิงก์โพสต์ด้วย async Clipboard API
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

      {/* 3. Carousel รูปภาพโพสต์ */}
      <PostImagesCarousel
        images={post?.images}
        onImageClick={handleOpenDetailModal}
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
          onOpenDetail={() => handleOpenDetailModal()}
        />
      )}

      {/* 7. Modal แชร์โพสต์ */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        post={{ ...post, sharesCount }}
      />

      {/* 8. Modal ดูโพสต์แบบเต็มพร้อมความคิดเห็น (PostDetailModal) */}
      {isDetailModalOpen && (
        <PostDetailModal
          post={post}
          isOpen={isDetailModalOpen}
          initialImageIndex={initialImageIndex}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={onEdit ? () => onEdit(post) : undefined}
          onDelete={onDelete ? () => onDelete(post.id) : undefined}
        />
      )}
    </article>
  );
}
