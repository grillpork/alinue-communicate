"use client";

import React from "react";
import { Plus, Loader2 } from "lucide-react";
import { PostCard } from "@/features/post";

export function PostsTab({
  posts = [],
  isLoading,
  isSelf,
  username,
  onOpenCreate,
  onEditPost,
  onDeletePost,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-xs">กำลังโหลดโพสต์...</p>
      </div>
    );
  }

  return (
    <div>
      {isSelf && (
        <div className="flex items-center justify-between mb-4 bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              โพสต์และอัปเดต (Posts)
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              แชร์เรื่องราวและพูดคุย
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-black p-3.5 sm:py-2 sm:px-4 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:block">สร้างโพสต์</span>
          </button>
        </div>
      )}

      {posts.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={onEditPost}
              onDelete={onDeletePost}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl mt-4">
          No posts shared by @{username} yet.
        </div>
      )}
    </div>
  );
}
