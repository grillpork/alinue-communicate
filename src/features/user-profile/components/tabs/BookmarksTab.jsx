"use client";

import React from "react";
import { Bookmark } from "lucide-react";
import { PostCard } from "@/features/post";

export function BookmarksTab({ bookmarkedPosts = [], isSelf, username }) {
  return (
    <div>
      {isSelf ? (
        bookmarkedPosts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookmarkedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
              <Bookmark className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-gray-700">
              ยังไม่มีโพสต์ที่บันทึกไว้ในบุ๊กมาร์ก
            </p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
              กดไอคอน Bookmark บนโพสต์ที่คุณสนใจ เพื่อเก็บไว้ดูย้อนหลังได้ทุกเมื่อ
            </p>
          </div>
        )
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
            <Bookmark className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            รายการบุ๊กมาร์กเป็นข้อมูลส่วนตัว
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            เฉพาะเจ้าของบัญชี @{username} เท่านั้นที่สามารถดูโพสต์ที่บันทึกไว้ได้
          </p>
        </div>
      )}
    </div>
  );
}
