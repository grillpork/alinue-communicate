"use client";

import React from "react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";

/**
 * PostActions - แถบปุ่ม Action ใต้โพสต์ (Like, Comment, Share, Bookmark)
 */
export default function PostActions({
  isLiked,
  likesCount,
  commentsCount,
  sharesCount,
  bookmarked,
  showComments,
  onLike,
  onToggleComments,
  onShare,
  onToggleBookmark,
}) {
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-gray-600 px-3.5 sm:px-4">
      <div className="flex items-center gap-5">
        {/* Like */}
        <button
          type="button"
          onClick={onLike}
          aria-label={isLiked ? "Unlike post" : "Like post"}
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            isLiked ? "text-red-500 font-semibold" : "hover:text-gray-900"
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
        <button
          type="button"
          onClick={onToggleComments}
          aria-label="Toggle comments"
          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
            showComments ? "text-black font-semibold" : "hover:text-gray-900"
          }`}
        >
          <MessageCircle
            className={`h-4 w-4 ${showComments ? "stroke-[2.5px]" : ""}`}
          />
          <span>{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors cursor-pointer group"
          title="แชร์โพสต์นี้"
          aria-label="Share post"
        >
          <Send className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="font-medium">{sharesCount}</span>
        </button>
      </div>

      {/* Bookmark */}
      <button
        type="button"
        onClick={onToggleBookmark}
        className={`flex items-center transition-colors cursor-pointer p-1 rounded-md hover:bg-gray-100 ${
          bookmarked
            ? "text-gray-900 font-semibold"
            : "text-gray-400 hover:text-gray-900"
        }`}
        title={bookmarked ? "ลบออกจากบุ๊กมาร์ก" : "บันทึกในบุ๊กมาร์ก"}
        aria-label={bookmarked ? "ลบออกจากบุ๊กมาร์ก" : "บันทึกในบุ๊กมาร์ก"}
      >
        <Bookmark
          className={`h-4 w-4 transition-transform active:scale-125 ${
            bookmarked ? "fill-gray-900 text-gray-900" : ""
          }`}
        />
      </button>
    </div>
  );
}
