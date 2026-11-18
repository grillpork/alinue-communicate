"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useMeQuery } from "@/features/auth";
import RedeemInviteModal, {
  PENDING_INVITE_STORAGE_KEY,
} from "@/features/auth/components/RedeemInviteModal";

/**
 * หน้า /join/[code] สำหรับรับคำเชิญจากลิงก์ One-Time Invite Code
 * - หากยังไม่ Login: บันทึกโค้ดลง localStorage แล้วพาไปหน้า /sign-in (หลัง Login จะเด้ง Modal โค้ดอัตโนมัติ)
 * - หาก Login อยู่แล้ว: เด้ง Modal ยืนยันโค้ดคำเชิญทันที
 */
export default function JoinInvitePage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params?.code) ? params.code[0] : params?.code;
  const normalizedCode = decodeURIComponent(String(rawCode || ""))
    .trim()
    .toUpperCase();

  const { data: meData, isLoading } = useMeQuery();
  const currentUser = meData?.user || null;

  useEffect(() => {
    if (!normalizedCode) {
      router.replace("/");
      return;
    }

    // บันทึกโค้ดไว้ใน localStorage เพื่อให้หลัง Login / Google OAuth เด้ง Modal อัตโนมัติ
    try {
      localStorage.setItem(PENDING_INVITE_STORAGE_KEY, normalizedCode);
    } catch {}

    // ถ้ายังไม่ได้เข้าสู่ระบบ ให้พาไปหน้า Login ทันที
    if (!isLoading && !currentUser) {
      router.replace(`/sign-in?invite=${encodeURIComponent(normalizedCode)}`);
    }
  }, [normalizedCode, isLoading, currentUser, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-gray-500">
        <Loader2 className="h-7 w-7 animate-spin text-gray-400 mb-3" />
        <p className="text-xs font-medium text-gray-500">
          กำลังตรวจสอบโค้ดคำเชิญ {normalizedCode}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RedeemInviteModal
        isOpen={true}
        initialCode={normalizedCode}
        onClose={() => router.replace("/")}
      />
    </div>
  );
}
