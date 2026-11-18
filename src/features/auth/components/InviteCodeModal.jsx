"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { authService } from "../api/auth.client";
import RedeemInviteModal from "./RedeemInviteModal";

/**
 * Minimalist Hand-Drawn Whisper/Invite Line-Art Illustration (สไตล์เดียวกับภาพตัวอย่าง)
 */
function InviteDoodleIllustration() {
  return (
    <svg
      width="108"
      height="108"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-3 select-none"
      aria-hidden="true"
    >
      {/* Speech Bubble */}
      <path
        d="M27 26C24 14 38 7 54 11C67 14 72 25 65 34C60 40 48 41 41 39L32 45L34 36C30 33 28 30 27 26Z"
        stroke="#B8B8BE"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="24" r="2.2" fill="#222225" />
      <circle cx="48" cy="23" r="2.2" fill="#222225" />
      <circle cx="58" cy="25" r="2.2" fill="#222225" />

      {/* Subtle Face Silhouette Behind Hand */}
      <path
        d="M55 47C57 44 62 43 66 44"
        stroke="#B8B8BE"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M73 45C77 44 81 46 83 49"
        stroke="#B8B8BE"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="62" cy="54" r="2.4" fill="#222225" />
      <circle cx="77" cy="55" r="2.4" fill="#222225" />
      <ellipse
        cx="72"
        cy="71"
        rx="7.5"
        ry="4.2"
        stroke="#B8B8BE"
        strokeWidth="2.4"
      />
      {/* Ear hint */}
      <path
        d="M36 62C31 62 30 70 35 73C38 75 40 72 39 69"
        stroke="#222225"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M39 78C36 86 35 92 37 97"
        stroke="#B8B8BE"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Raised Whispering Hand */}
      <path
        d="M47 94V63C47 59 52 59 52 63V76"
        stroke="#1C1C1E"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 74V50C52 46 57.5 46 57.5 50V74"
        stroke="#1C1C1E"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M57.5 74V48C57.5 44 63 44 63 48V75"
        stroke="#1C1C1E"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M63 75V55C63 51 68.5 51 68.5 55V77C68.5 85 65 92 59 99"
        stroke="#1C1C1E"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Thumb */}
      <path
        d="M66 78C72 72 77 73 76 79C75 84 68 90 62 95"
        stroke="#1C1C1E"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatSpacedCode(code) {
  if (!code) return "---- - ---- - ----";
  return String(code).trim().toUpperCase().split("-").join(" - ");
}

/**
 * InviteCodeModal - Modal แสดง One-Time Invite Code สำหรับชวนเพื่อนปลดล็อกพื้นที่ Service เพิ่ม (สไตล์ตามภาพตัวอย่าง)
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

  // โหลด One-Time Invite Code จาก Backend เมื่อเปิด Modal
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
  }, [isOpen, currentUser?.inviteCode, currentUser?.inviteCodeUsed, currentUser?.inviteCodeUsedBy]);

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
  const remainingUses = isUsed ? 0 : 1;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://catako.site";
  const joinUrl = `${origin}/join/${encodeURIComponent(inviteCode)}`;

  // ข้อความที่จะถูกคัดลอกเมื่อกด Copy code (ตามรูปแบบที่ผู้ใช้กำหนด)
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
        className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-[28px] bg-white px-6 py-7 sm:px-8 sm:py-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Minimalist Line-Art Doodle Illustration */}
        <InviteDoodleIllustration />

        {/* Headline (ตรงตามสไตล์ตัวอย่าง) */}
        {isUsed || isReferralUnlocked ? (
          <div className="space-y-1.5">
            <h3 className="text-[20px] sm:text-[22px] font-semibold text-gray-600 leading-snug tracking-tight">
              You unlocked{" "}
              <strong className="font-bold text-gray-900">
                {maxQuota} service slots
              </strong>
              .
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {isUsed
                ? `โค้ดของคุณถูกใช้งานโดย @${inviteData?.usedBy || "เพื่อน"} แล้ว (โควตา ${usedCount}/${maxQuota})`
                : `คุณได้รับโควตาโพสต์รับงานสูงสุด ${usedCount}/${maxQuota} โพสต์แล้ว`}
            </p>
          </div>
        ) : (
          <h3 className="text-[20px] sm:text-[22px] font-semibold text-gray-500 leading-snug tracking-tight">
            Only{" "}
            <strong className="font-bold text-gray-900">
              {remainingUses} person
            </strong>{" "}
            can use this
            <br />
            invite code. Share it wisely.
          </h3>
        )}

        {/* Inner Bordered Invite Code Box */}
        <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <p className="text-xs sm:text-[13px] font-medium text-gray-500">
            Your invite code
          </p>

          {isLoadingCode ? (
            <div className="flex items-center justify-center py-4 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div
              className={`my-3.5 font-mono text-xl sm:text-[25px] font-bold tracking-[0.12em] select-all ${
                isUsed ? "text-gray-300 line-through" : "text-gray-900"
              }`}
            >
              {formatSpacedCode(inviteCode)}
            </div>
          )}

          <button
            type="button"
            disabled={!inviteCode || isUsed || isLoadingCode}
            onClick={handleCopyCode}
            className={`mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3 px-4 text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] disabled:cursor-not-allowed ${
              isUsed
                ? "bg-gray-100 text-gray-400"
                : copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1C1C1E] hover:bg-black text-white"
            }`}
          >
            {isUsed ? (
              <span>Code already used (1/1)</span>
            ) : copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied invite &amp; link!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Description + Redeem Friend's Code Link */}
        <div className="mt-5 space-y-2 text-xs sm:text-[13px] text-gray-500 leading-relaxed">
          <p>
            When a friend joins with your code,
            <br />
            you both unlock{" "}
            <span className="text-gray-900 font-medium underline underline-offset-4">
              +1 service slot
            </span>
            .
          </p>

          {!isReferralUnlocked && (
            <button
              type="button"
              onClick={() => setShowRedeemMode(true)}
              className="mt-1 inline-block text-xs font-medium text-gray-400 hover:text-gray-800 underline underline-offset-4 transition-colors cursor-pointer"
            >
              มีโค้ดคำเชิญจากเพื่อน? ใส่โค้ดที่นี่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
