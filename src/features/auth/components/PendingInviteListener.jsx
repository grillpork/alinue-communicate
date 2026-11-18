"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMeQuery } from "../hooks/use-auth";
import RedeemInviteModal, {
  PENDING_INVITE_STORAGE_KEY,
} from "./RedeemInviteModal";

/**
 * PendingInviteListener - ตรวจจับโค้ดคำเชิญที่ค้างอยู่หลังผู้ใช้ Login ผ่านลิงก์ /join/[code]
 * แล้วเด้ง RedeemInviteModal ขึ้นมาอัตโนมัติทันที
 */
export default function PendingInviteListener() {
  const pathname = usePathname();
  const { data: meData, isLoading } = useMeQuery();
  const currentUser = meData?.user || null;
  const [pendingCode, setPendingCode] = useState("");

  useEffect(() => {
    if (isLoading || !currentUser) return;
    if (pathname?.startsWith("/join/")) return;

    try {
      const savedCode = localStorage.getItem(PENDING_INVITE_STORAGE_KEY);
      if (savedCode && savedCode.trim()) {
        setPendingCode(savedCode.trim().toUpperCase());
      }
    } catch {
      // ignore localStorage errors
    }
  }, [currentUser, isLoading, pathname]);

  if (!pendingCode || !currentUser) return null;

  return (
    <RedeemInviteModal
      isOpen={Boolean(pendingCode)}
      initialCode={pendingCode}
      onClose={() => setPendingCode("")}
      onSuccess={() => setPendingCode("")}
    />
  );
}
