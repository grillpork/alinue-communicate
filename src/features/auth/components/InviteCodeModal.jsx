"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Loader2, Ticket } from "lucide-react";
import { authService } from "../api/auth.client";
import RedeemInviteModal from "./RedeemInviteModal";

function formatSpacedCode(code) {
  if (!code) return "---- - ---- - ----";
  return String(code).trim().toUpperCase().split("-").join(" - ");
}

/**
 * InviteCodeModal - Modal โค้ดชวนเพื่อนแบบมินิมอล กระชับ และทันสมัย
 */
export default function InviteCodeModal({
  isOpen,
  onClose,
  currentUser,
  isReferralUnlocked = false,
  usedCount = 0,
  maxQuota = 1,
}) {
  const [inviteData, setInviteData] = useState(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRedeemMode, setShowRedeemMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowRedeemMode(false);
      return;
    }

    if (currentUser?.inviteCode) {
      setInviteData({
        inviteCode: currentUser.inviteCode,
        isUsed: Boolean(currentUser.inviteCodeUsed),
        usedBy: currentUser.inviteCodeUsedBy || null,
        remainingUses: currentUser.inviteCodeUsed ? 0 : 1,
      });
    }

    let isMounted = true;
    const fetchCode = async () => {
      try {
        setIsLoadingCode(!currentUser?.inviteCode);
        const res = await authService.getInviteCode();
        if (isMounted && res?.inviteCode) {
          setInviteData(res);
        }
      } catch (err) {
        console.error("Failed to fetch invite code:", err);
      } finally {
        if (isMounted) setIsLoadingCode(false);
      }
    };

    fetchCode();
    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    currentUser?.inviteCode,
    currentUser?.inviteCodeUsed,
    currentUser?.inviteCodeUsedBy,
  ]);

  if (!isOpen) return null;

  if (showRedeemMode) {
    return (
      <RedeemInviteModal
        isOpen={true}
        onClose={() => {
          setShowRedeemMode(false);
          onClose?.();
        }}
      />
    );
  }

  const inviteCode = inviteData?.inviteCode || currentUser?.inviteCode || "";
  const isUsed = Boolean(inviteData?.isUsed || currentUser?.inviteCodeUsed);
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://catako.site";
  const joinUrl = `${origin}/join/${encodeURIComponent(inviteCode)}`;

  const shareMessageText = [
    `You're in, but only with this invite: ${inviteCode}`,
    `Limited spots. Don't share it publicly.`,
    joinUrl,
  ].join("\n");

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(shareMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[380px] rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Minimal Icon Badge */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F6F8] text-gray-900">
          <Ticket className="h-5 w-5 stroke-[1.8]" />
        </div>

        {/* Concise Title & Subtitle */}
        {isUsed || isReferralUnlocked ? (
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              ปลดล็อกโควตาครบแล้ว ({usedCount}/{maxQuota})
            </h3>
            <p className="text-xs text-gray-500">
              {isUsed
                ? `ใช้งานแล้วโดย @${inviteData?.usedBy || "เพื่อน"}`
                : "คุณได้รับสิทธิ์โพสต์สูงสุด 2 โพสต์แล้ว"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">
              ชวนเพื่อนรับเพิ่ม +1 โพสต์
            </h3>
            <p className="text-xs text-gray-500">
              โค้ดใช้ได้ 1 ครั้ง • ได้รับสิทธิ์ทั้งคุณและเพื่อน
            </p>
          </div>
        )}

        {/* Minimal Code Box */}
        <div className="mt-5 rounded-2xl bg-[#F6F6F8] px-4 py-4">
          {isLoadingCode ? (
            <div className="flex items-center justify-center py-2 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <p
              className={`font-mono text-xl font-bold tracking-[0.12em] select-all ${
                isUsed ? "text-gray-300 line-through" : "text-gray-900"
              }`}
            >
              {formatSpacedCode(inviteCode)}
            </p>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          disabled={!inviteCode || isUsed || isLoadingCode}
          onClick={handleCopyCode}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 px-4 text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed ${
            isUsed
              ? "bg-gray-100 text-gray-400"
              : copied
                ? "bg-emerald-600 text-white"
                : "bg-black hover:bg-gray-800 text-white"
          }`}
        >
          {isUsed ? (
            <span>โค้ดถูกใช้งานแล้ว</span>
          ) : copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>คัดลอกโค้ดและลิงก์แล้ว</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>คัดลอกโค้ด</span>
            </>
          )}
        </button>

        {/* Subtle Redeem Action */}
        {!isReferralUnlocked && (
          <button
            type="button"
            onClick={() => setShowRedeemMode(true)}
            className="mt-4 inline-block text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
          >
            มีโค้ดจากเพื่อน? ใส่โค้ดที่นี่
          </button>
        )}
      </div>
    </div>
  );
}
