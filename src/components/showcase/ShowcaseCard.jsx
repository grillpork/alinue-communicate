'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Check, Play, Images, Trash2 } from 'lucide-react';
import { useToggleShowcaseLikeMutation, useDeleteShowcaseMutation } from '@/services/showcase';

export default function ShowcaseCard({ showcase, currentUserId, onDeleted }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const toggleLikeMutation = useToggleShowcaseLikeMutation();
  const deleteMutation = useDeleteShowcaseMutation();

  const isOwner = currentUserId && Number(currentUserId) === Number(showcase.user_id);
  const isLiked = Boolean(showcase.is_liked);
  const likesCount = showcase.likes_count || 0;

  // รายการ media (รองรับทั้ง Array หรือ JSON string)
  const mediaList = Array.isArray(showcase.media_urls || showcase.mediaUrls)
    ? showcase.media_urls || showcase.mediaUrls
    : typeof (showcase.media_urls || showcase.mediaUrls) === 'string'
    ? JSON.parse(showcase.media_urls || showcase.mediaUrls || '[]')
    : [];

  const mainMedia = mediaList[0] || showcase.cover_url || showcase.coverUrl || '';
  const isVideo =
    showcase.media_type === 'video' ||
    showcase.mediaType === 'video' ||
    /\.(mp4|webm|mov|ogg)$/i.test(mainMedia);

  const author = showcase.author || {
    id: showcase.user_id,
    name: showcase.author_name || showcase.author_username || 'Creator',
    username: showcase.author_username || 'user',
    avatar: showcase.author_avatar || showcase.author_avatar_url || null,
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLikeMutation.mutate(showcase.id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('คุณต้องการลบผลงาน Showcase นี้ใช่หรือไม่?')) {
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
      <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 transition-all duration-300 group-hover:shadow-md">
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
          />
        ) : (
          <div className="flex aspect-4/3 w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
            <span className="text-xs font-medium">No Image</span>
          </div>
        )}

        {/* Top-Left Badge: OPEN with Checkmark (ตรงตามแบบตัวอย่าง Pinterest) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-[#a3e635] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black shadow-xs">
          <span>OPEN</span>
          <Check className="h-3 w-3 stroke-[3]" />
        </div>

        {/* Top-Right Badge: Multi-image count (ถ้ามีมากกว่า 1 รูป) */}
        {mediaList.length > 1 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
            <Images className="h-3 w-3" />
            <span>{mediaList.length}</span>
          </div>
        )}

        {/* Bottom-Right: Floating Heart / Like Button */}
        <button
          type="button"
          onClick={handleLike}
          disabled={toggleLikeMutation.isPending}
          className={`absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
            isLiked
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/40 text-white hover:bg-black/60'
          }`}
          title={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              isLiked ? 'fill-current text-white' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* 2. Metadata Below Image (Pinterest Typography & Author) */}
      <div className="pt-2 px-0.5">
        {/* Title */}
        <h3 className="line-clamp-1 text-xs sm:text-[13px] font-bold text-gray-900 leading-snug group-hover:text-black">
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
                {(author.name || author.username || 'U')[0].toUpperCase()}
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
    </div>
  );
}
