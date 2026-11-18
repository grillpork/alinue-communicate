"use client";

import React, { useState } from "react";
import {
  Plus,
  LayoutList,
  Loader2,
  Gift,
  Share2,
  Sparkles,
} from "lucide-react";
import { ServiceCard } from "@/features/service";
import { InviteCodeModal } from "@/features/auth";

export function ServicesTab({
  services = [],
  isLoading,
  isSelf,
  username,
  currentUser,
  onOpenCreate,
}) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const isReferralUnlocked = Boolean(
    currentUser?.isReferralUnlocked ||
      Number(currentUser?.serviceQuota) >= 2 ||
      currentUser?.preferences?.serviceQuotaBonus ||
      currentUser?.preferences?.referredBy ||
      currentUser?.inviteCodeUsed ||
      Number(currentUser?.preferences?.referralCount) >= 1,
  );

  const maxQuota = isReferralUnlocked ? 2 : 1;
  const usedCount = services.length;
  const isAtQuotaLimit = usedCount >= maxQuota;

  const handlePlusClick = () => {
    if (isAtQuotaLimit) {
      setIsInviteModalOpen(true);
      return;
    }
    onOpenCreate?.();
  };

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
        <div className="mb-4 space-y-2.5">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
            <div className="min-w-0 pr-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                  บริการและประกาศรับงาน
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isReferralUnlocked
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-white text-gray-700 border border-gray-200/90"
                  }`}
                >
                  {isReferralUnlocked && <Sparkles className="h-3 w-3" />}
                  <span>
                    โควตา {usedCount}/{maxQuota} โพสต์
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                โพสต์รับงานมีอายุ 30 วัน (1 เดือน) • สูงสุด {maxQuota} โพสต์
              </p>
            </div>

            <button
              type="button"
              onClick={handlePlusClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-black p-3.5 sm:px-4 sm:py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:block">
                {usedCount >= 1 && !isReferralUnlocked
                  ? "ปลดล็อกโพสต์ที่ 2"
                  : "โพสต์รับงาน"}
              </span>
            </button>
          </div>

          {/* Referral Banner (แสดงเมื่อยังไม่ได้ปลดล็อกโควตาเป็น 2 โพสต์) */}
          {!isReferralUnlocked && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-gray-200/90 bg-white px-4 py-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Gift className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    อยากโพสต์รับงานเพิ่มเป็น 2 โพสต์ไหม?
                  </p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    ส่งโค้ดเชิญใช้ครั้งเดียวให้เพื่อน รับโควตาเพิ่มจาก 1 เป็นสูงสุด 2 โพสต์ทั้งคุณและเพื่อน!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-900 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>ชวนเพื่อน (+1 โพสต์)</span>
              </button>
            </div>
          )}
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
              onClick={handlePlusClick}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>สร้างโพสต์รับงานชิ้นแรก</span>
            </button>
          )}
        </div>
      )}

      {/* One-Time Invite Code Modal (UI สไตล์ตามภาพตัวอย่าง) */}
      <InviteCodeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        currentUser={currentUser}
        isReferralUnlocked={isReferralUnlocked}
        usedCount={usedCount}
        maxQuota={maxQuota}
      />
    </div>
  );
}
