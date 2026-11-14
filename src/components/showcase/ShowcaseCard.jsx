"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Check,
  Play,
  Images,
  Trash2,
  MoreHorizontal,
  Copy,
  Share2,
  Flag,
  Pencil,
} from "lucide-react";
import {
  useToggleShowcaseLikeMutation,
  useDeleteShowcaseMutation,
} from "@/services/showcase";
import { useMeQuery } from "@/services/auth";
import ShowcaseModal from "./ShowcaseModal";
import EditShowcaseModal from "./EditShowcaseModal";

export default function ShowcaseCard({
  showcase,
  currentUserId,
  onDeleted,
  isOwner: isOwnerProp,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: meData } = useMeQuery();
  const loggedInUser = meData?.user;

  const toggleLikeMutation = useToggleShowcaseLikeMutation();
  const deleteMutation = useDeleteShowcaseMutation();

  const author = showcase.author || {
    id: showcase.userId || showcase.user_id,
    name:
      showcase.author_name ||
      showcase.author_username ||
      showcase.authorName ||
      "Creator",
    username: showcase.author_username || showcase.authorUsername || "user",
    avatar:
      showcase.author_avatar ||
      showcase.author_avatar_url ||
      showcase.authorAvatar ||
      null,
  };
  const ownerId = showcase.userId || showcase.user_id || author?.id;
  const effectiveUserId = currentUserId || loggedInUser?.id;
  const authorUsername =
    author?.username || showcase.authorUsername || showcase.author_username;

  const isOwner =
    isOwnerProp !== undefined
      ? Boolean(isOwnerProp)
      : Boolean(
          (effectiveUserId &&
            ownerId &&
            Number(effectiveUserId) === Number(ownerId)) ||
          (loggedInUser?.username &&
            authorUsername &&
            loggedInUser.username.toLowerCase() ===
              authorUsername.toLowerCase()),
        );
  const isLiked = Boolean(showcase.is_liked);
  const likesCount = showcase.likes_count || 0;

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/${author.username}?showcase=${showcase.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1200);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/${author.username}?showcase=${showcase.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: showcase.title || "Showcase ผลงานบน Alinue",
            text: `ดูผลงาน "${showcase.title}" โดย @${author.username} บน Alinue`,
            url,
          });
        } catch {
          // Ignore cancel
        }
      } else {
        handleCopyLink(e);
      }
    }
  };

  // รายการ media (รองรับทั้ง Array หรือ JSON string)
  const mediaList = Array.isArray(showcase.media_urls || showcase.mediaUrls)
    ? showcase.media_urls || showcase.mediaUrls
    : typeof (showcase.media_urls || showcase.mediaUrls) === "string"
      ? JSON.parse(showcase.media_urls || showcase.mediaUrls || "[]")
      : [];

  const mainMedia =
    mediaList[0] || showcase.cover_url || showcase.coverUrl || "";
  const isVideo =
    showcase.media_type === "video" ||
    showcase.mediaType === "video" ||
    /\.(mp4|webm|mov|ogg)$/i.test(mainMedia);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLikeMutation.mutate(showcase.id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("คุณต้องการลบผลงาน Showcase นี้ใช่หรือไม่?")) {
      deleteMutation.mutate(showcase.id, {
        onSuccess: () => {
          onDeleted?.(showcase.id);
        },
      });
    }
  };

  return (
    <div className="group relative flex flex-col">
      {/* 1. Pinterest-style Media Card */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="relative w-full overflow-hidden rounded-2xl bg-gray-100 transition-all duration-300 group-hover:shadow-md cursor-pointer"
      >
        {isVideo ? (
          <div className="relative w-full">
            <video
              src={mainMedia}
              poster={showcase.cover_url || showcase.coverUrl || undefined}
              className="w-full h-auto max-h-[550px] object-cover"
              controls={isPlaying}
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px] cursor-pointer transition-opacity group-hover:bg-black/35"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-md transition-transform group-hover:scale-110">
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>
        ) : mainMedia ? (
          <img
            src={mainMedia}
            alt={showcase.title}
            className="w-full h-auto max-h-[550px] object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/empty/no-image.png";
            }}
          />
        ) : (
          <div className="flex aspect-4/3 w-full items-center justify-center bg-gray-50 overflow-hidden">
            <img
              src="/empty/no-image.png"
              alt={showcase.title || "No Image"}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Top-Left Badges: OPEN with Checkmark & Multi-image count */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <div className="flex items-center gap-1 rounded-md bg-[#a3e635] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-xs">
            <span>OPEN</span>
            <Check className="h-3 w-3 stroke-[3]" />
          </div>

          {mediaList.length > 1 && (
            <div className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
              <Images className="h-3 w-3" />
              <span>{mediaList.length}</span>
            </div>
          )}
        </div>

        {/* Top-Right: Dropdown Menu (•••) */}
        <div ref={menuRef} className="absolute top-2.5 right-2.5 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-xs"
            aria-label="Showcase options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-30 animate-in fade-in zoom-in-95 duration-100 text-left"
            >
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                )}
                <span>{copied ? "คัดลอกลิงก์แล้ว!" : "คัดลอกลิงก์"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-gray-400" />
                <span>แชร์ผลงาน</span>
              </button>

              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      setIsEditModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    <span>แก้ไขผลงาน</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    <span>ลบผลงานนี้</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    alert("ส่งรายงานผลงานนี้ให้ผู้ดูแลระบบตรวจสอบแล้ว");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5 text-gray-400" />
                  <span>รายงานผลงาน</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom-Right: Floating Heart / Like Button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={toggleLikeMutation.isPending}
          className={`absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
            isLiked
              ? "bg-rose-500 text-white shadow-md"
              : "bg-black/40 text-white hover:bg-black/60"
          }`}
          title={isLiked ? "Unlike" : "Like"}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              isLiked ? "fill-current text-white" : "text-white"
            }`}
          />
        </button>
      </div>

      {/* 2. Metadata Below Image (Pinterest Typography & Author) */}
      <div className="pt-2 px-0.5">
        {/* Title */}
        <h3
          onClick={() => setIsModalOpen(true)}
          className="line-clamp-1 text-xs sm:text-[13px] font-bold text-gray-900 leading-snug group-hover:text-black cursor-pointer hover:underline"
        >
          {showcase.title}
        </h3>

        {/* Creator Info Line */}
        <div className="mt-1 flex items-center justify-between text-xs">
          <Link
            href={`/${author.username}`}
            className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
          >
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name || author.username}
                className="h-4.5 w-4.5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-700">
                {(author.name || author.username || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="text-[11px] font-medium text-gray-800 truncate">
              {author.name || author.username}
            </span>
            <span className="text-[10px] text-gray-400 truncate hidden sm:inline">
              @{author.username}
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {likesCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                <Heart className="h-2.5 w-2.5 fill-current text-gray-400" />
                {likesCount}
              </span>
            )}

            {isOwner && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-gray-300 hover:text-rose-500 transition-colors cursor-pointer"
                title="Delete Showcase"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Showcase Detail Modal */}
      <ShowcaseModal
        showcase={showcase}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUserId={effectiveUserId}
        isOwner={isOwner}
        onDeleted={onDeleted}
      />

      {/* 4. Edit Showcase Modal */}
      <EditShowcaseModal
        showcase={showcase}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
