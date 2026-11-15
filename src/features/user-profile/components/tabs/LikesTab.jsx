"use client";

import React from "react";
import { Heart, Loader2 } from "lucide-react";
import { PostCard } from "@/features/post";

export function LikesTab({ likedPosts = [], isLoading, isSelf, username }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-xs">กำลังโหลดโพสต์ที่ถูกใจ...</p>
      </div>
    );
  }

  return (
    <div>
      {likedPosts.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {likedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
            <Heart className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            ยังไม่มีโพสต์ที่ถูกใจ
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            {isSelf
              ? "เมื่อคุณกดถูกใจโพสต์ โพสต์เหล่านั้นจะมาแสดงอยู่ที่นี่"
              : `@${username} ยังไม่ได้กดถูกใจโพสต์ใดๆ`}
          </p>
        </div>
      )}
    </div>
  );
}
