"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Check,
  Loader2,
  Ticket,
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
 * RedeemInviteModal - Modal ยืนยันโค้ดคำเชิญแบบมินิมอล กระชับ และทันสมัย
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
          res?.message || "ไม่สามารถใช้โค้ดนี้ได้ หรือโค้ดถูกใช้งานไปแล้ว",
        );
      }
    } catch (err) {
      setErrorMessage(
        err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
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
        className="fixed inset-0 bg-black/35 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-[380px] rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="h-4 w-4" />
        </button>

        {redeemSuccess ? (
          <div className="py-1 space-y-5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                ปลดล็อกเพิ่ม +1 โพสต์แล้ว
              </h3>
              <p className="text-xs text-gray-500">
                คุณและ @{inviterUsername || "เพื่อน"} สามารถโพสต์รับงานได้สูงสุด 2 โพสต์
              </p>
            </div>

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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black hover:bg-gray-800 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>ไปที่บริการของฉัน</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            {/* Top Avatar or Minimal Icon */}
            <div className="flex flex-col items-center">
              {inviteInfo?.inviter ? (
                <div className="mb-3 h-12 w-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100 flex items-center justify-center">
                  {inviteInfo.inviter.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={inviteInfo.inviter.avatarUrl}
                      alt={inviteInfo.inviter.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              ) : (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F6F8] text-gray-900">
                  <Ticket className="h-5 w-5 stroke-[1.8]" />
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                {inviteInfo?.inviter
                  ? `คำเชิญจาก @${inviteInfo.inviter.username}`
                  : "ใส่โค้ดคำเชิญ"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                ยืนยันโค้ดเพื่อรับพื้นที่เพิ่มเป็น 2 โพสต์ทันที
              </p>
            </div>

            {/* Minimal Code Display / Input */}
            <div className="rounded-2xl bg-[#F6F6F8] p-4">
              {initialCode ? (
                <p className="font-mono text-xl font-bold tracking-[0.12em] text-gray-900 select-all">
                  {formatSpacedCode(codeInput)}
                </p>
              ) : (
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setErrorMessage("");
                  }}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full bg-transparent text-center font-mono text-lg font-bold tracking-[0.12em] text-gray-900 uppercase placeholder:text-gray-300 focus:outline-none"
                />
              )}
            </div>

            {isInspecting && (
              <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>กำลังตรวจสอบโค้ด...</span>
              </p>
            )}

            {(errorMessage || isInvalidOrUsed) && (
              <div className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {errorMessage ||
                    inviteInfo?.message ||
                    "โค้ดไม่ถูกต้องหรือถูกใช้งานแล้ว"}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={
                !codeInput.trim() || isSubmitting || Boolean(isInvalidOrUsed)
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังยืนยัน...</span>
                </>
              ) : (
                <span>รับสิทธิ์ +1 โพสต์</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
