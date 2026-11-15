"use client";

import React from "react";
import { Plus, LayoutList, Loader2 } from "lucide-react";
import { ServiceCard } from "@/features/service";

export function ServicesTab({
  services = [],
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
        <p className="text-xs">กำลังโหลดรายการบริการรับงาน...</p>
      </div>
    );
  }

  return (
    <div>
      {isSelf && (
        <div className="flex items-center justify-between mb-4 bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              บริการและประกาศรับงาน
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              โพสต์รับงานมีอายุ 30 วัน (1 เดือน)
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-black p-3.5 sm:py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:block">โพสต์รับงาน</span>
          </button>
        </div>
      )}

      {services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          {services.map((srv) => (
            <ServiceCard
              key={srv.id}
              service={srv}
              currentUserId={currentUser?.id}
              isOwner={isSelf}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-2 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
            <LayoutList className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-gray-700">
            ยังไม่มีบริการหรือประกาศรับงาน
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            {isSelf
              ? "เปิดรับงาน คอมมิชชัน หรือบริการสร้างสรรค์ผลงานของคุณ พร้อมตัวอย่างงานและราคาเริ่มต้น"
              : `@${username} ยังไม่ได้เปิดรับงานในขณะนี้`}
          </p>
          {isSelf && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>สร้างโพสต์รับงานชิ้นแรก</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
