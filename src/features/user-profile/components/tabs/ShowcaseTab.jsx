"use client";

import React from "react";
import { Plus, Briefcase, Loader2 } from "lucide-react";
import { ShowcaseCard } from "@/features/showcase";

export function ShowcaseTab({
  showcases = [],
  isLoading,
  isSelf,
  username,
  currentUser,
  onOpenCreate,
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-xs">กำลังโหลดผลงาน Showcase...</p>
      </div>
    );
  }

  return (
    <div>
      {isSelf && (
        <div className="flex items-center justify-between mb-4 bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              ผลงาน (Showcase)
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              แกลเลอรีภาพและวิดีโอผลงาน
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-black p-3.5 sm:py-2 sm:px-4 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:block">เพิ่มผลงาน</span>
          </button>
        </div>
      )}

      {showcases.length > 0 ? (
        <div className="columns-2 sm:columns-3 gap-3.5 [column-fill:_balance]">
          {showcases.map((sc) => (
            <div key={sc.id} className="break-inside-avoid mb-4">
              <ShowcaseCard
                showcase={sc}
                currentUserId={currentUser?.id}
                isOwner={
                  isSelf ||
                  (currentUser &&
                    (Number(currentUser.id) ===
                      Number(sc.userId || sc.author?.id) ||
                      currentUser.username?.toLowerCase() ===
                        sc.author?.username?.toLowerCase()))
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-2 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
            <Briefcase className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            ยังไม่มีผลงาน Showcase
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            {isSelf
              ? "เริ่มอัปโหลดรูปภาพหรือคลิปผลงานของคุณเพื่อให้คอมมูนิตี้เข้ามากด Like และชื่นชมได้เลย!"
              : `@${username} ยังไม่ได้โพสต์ผลงาน Showcase`}
          </p>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>เพิ่มผลงานชิ้นแรก</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
