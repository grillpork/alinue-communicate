"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  User,
  ArrowRight,
} from "lucide-react";
import { authService } from "../api/auth.client";
import { authKeys } from "../hooks/auth.keys";
import { userKeys } from "@/features/user/hooks/user.keys";
import { useMeQuery } from "../hooks/use-auth";

export const PENDING_INVITE_STORAGE_KEY = "alinue_pending_invite_code";

function formatSpacedCode(raw) {
  const clean = String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  return clean.split("-").join(" - ");
}

/**
 * RedeemInviteModal - Modal ยืนยันโค้ดคำเชิญ (One-Time Invite Code) ที่มาจากลิงก์ /join/[code] หรือกรอกเอง
 */
export default function RedeemInviteModal({
  isOpen,
  onClose,
  initialCode = "",
  onSuccess,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  const [codeInput, setCodeInput] = useState(
    String(initialCode || "")
      .trim()
      .toUpperCase(),
  );
  const [inviteInfo, setInviteInfo] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [inviterUsername, setInviterUsername] = useState("");

  useEffect(() => {
    if (isOpen) {
      const normalized = String(initialCode || "")
        .trim()
        .toUpperCase();
      setCodeInput(normalized);
      setErrorMessage("");
      setRedeemSuccess(false);
      setInviteInfo(null);
    }
  }, [isOpen, initialCode]);

  // ตรวจสอบความถูกต้องของโค้ดคำเชิญเมื่อมีโค้ดครบ 14 ตัวอักษร (XXXX-XXXX-XXXX)
  useEffect(() => {
    if (!isOpen) return;
    const clean = codeInput.trim().toUpperCase();
    if (clean.length < 4) {
      setInviteInfo(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsInspecting(true);
        const res = await authService.inspectInviteCode(clean);
        if (isMounted) {
          setInviteInfo(res);
          if (res?.inviter?.username) {
            setInviterUsername(res.inviter.username);
          }
        }
      } catch {
        if (isMounted) setInviteInfo(null);
      } finally {
        if (isMounted) setIsInspecting(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [codeInput, isOpen]);

  if (!isOpen) return null;

  const clearPendingCode = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
      } catch {}
    }
  };

  const handleClose = () => {
    clearPendingCode();
    onClose?.();
  };

  const handleRedeem = async (e) => {
    e?.preventDefault();
    const clean = codeInput.trim().toUpperCase();
    if (!clean || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await authService.claimReferral(clean);
      if (res?.applied) {
        clearPendingCode();
        setRedeemSuccess(true);
        if (res.inviterUsername) {
          setInviterUsername(res.inviterUsername);
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: authKeys.me() }),
          queryClient.invalidateQueries({ queryKey: userKeys.all }),
        ]);
        onSuccess?.(res);
      } else {
        setErrorMessage(
          res?.message || "ไม่สามารถใช้โค้ดคำเชิญนี้ได้ หรือโค้ดถูกใช้งานไปแล้ว",
        );
      }
    } catch (err) {
      setErrorMessage(
        err?.message || "เกิดข้อผิดพลาดในการตรวจสอบโค้ดคำเชิญ กรุณาลองใหม่",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInvalidOrUsed =
    inviteInfo && (inviteInfo.isUsed || inviteInfo.valid === false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-[430px] rounded-[28px] bg-white p-7 sm:p-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {redeemSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <div className="py-2 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <Check className="h-8 w-8 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                ปลดล็อกพื้นที่เพิ่ม Service สำเร็จ!
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                คุณและ{" "}
                <span className="font-semibold text-gray-900">
                  @{inviterUsername || "เพื่อนของคุณ"}
                </span>{" "}
                ได้รับสิทธิ์โพสต์รับงานเพิ่มเป็นสูงสุด{" "}
                <strong className="text-gray-900">2 โพสต์</strong> เรียบร้อยแล้ว
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (currentUser?.username) {
                    router.push(`/${currentUser.username}?tab=services`);
                  } else {
                    router.push("/");
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1C1C1E] hover:bg-black py-3 text-sm font-semibold text-white transition-all active:scale-[0.99] cursor-pointer"
              >
                <span>ไปที่หน้าบริการของฉัน</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                กลับสู่หน้าฟีด
              </button>
            </div>
          </div>
        ) : (
          /* ================= REDEEM FORM STATE ================= */
          <form onSubmit={handleRedeem} className="space-y-5">
            {/* Inviter Header or Minimalist Icon */}
            <div className="flex flex-col items-center">
              {inviteInfo?.inviter ? (
                <div className="mb-3 flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100 flex items-center justify-center shadow-2xs">
                    {inviteInfo.inviter.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={inviteInfo.inviter.avatarUrl}
                        alt={inviteInfo.inviter.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>
                      คำเชิญจาก @{inviteInfo.inviter.username}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-gray-800">
                  <Sparkles className="h-6 w-6" />
                </div>
              )}

              <h3 className="text-[19px] font-bold text-gray-900 tracking-tight leading-snug">
                You&apos;re in with this invite code!
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                ยืนยันโค้ดใช้ครั้งเดียวเพื่อรับโควตาโพสต์รับงานเพิ่มเป็น{" "}
                <strong className="text-gray-800">2 โพสต์</strong> ทั้งคุณและผู้ชวน
              </p>
            </div>

            {/* Code Box (Notion/Linear Style) */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Invite code
                </label>

                {initialCode ? (
                  <div className="font-mono text-xl sm:text-2xl font-bold tracking-[0.14em] text-gray-900 py-1 select-all">
                    {formatSpacedCode(codeInput)}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase());
                      setErrorMessage("");
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-[0.14em] text-gray-900 uppercase placeholder:text-gray-300 focus:bg-white focus:border-black focus:outline-none transition-all"
                  />
                )}
              </div>

              {/* Validation Feedback */}
              {isInspecting && (
                <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>กำลังตรวจสอบโค้ดคำเชิญ...</span>
                </p>
              )}

              {errorMessage && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200/70 px-3 py-2 text-xs text-rose-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!errorMessage && isInvalidOrUsed && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-2 text-xs text-amber-700 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {inviteInfo.message || "โค้ดนี้ถูกใช้งานไปแล้วหรือไม่ถูกต้อง"}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  !codeInput.trim() ||
                  isSubmitting ||
                  Boolean(isInvalidOrUsed)
                }
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1C1C1E] hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 py-3 text-sm font-semibold text-white transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>กำลังยืนยันโค้ด...</span>
                  </>
                ) : (
                  <span>รับสิทธิ์พื้นที่เพิ่ม (+1 Service)</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              โค้ดคำเชิญนี้ใช้ได้เพียง 1 ครั้งเท่านั้น ไม่สามารถแชร์ซ้ำได้
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
