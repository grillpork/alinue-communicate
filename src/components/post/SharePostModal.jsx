'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useSharePostMutation } from '@/services/post';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

/**
 * SharePostModal - Modal สำหรับแชร์โพสต์ไปยังช่องทางต่างๆ พร้อมนับจำนวนแชร์ (sharesCount)
 */
export default function SharePostModal({
  isOpen,
  onClose,
  post,
  onShareSuccess,
}) {
  useBodyScrollLock(isOpen);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareMutation = useSharePostMutation();

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // สร้าง Share URL
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://catako.site';
  const authorUsername = post.author?.username;
  const shareUrl = `${origin}/?post=${post.id}`;

  const shareTitle = `${post.author?.name || post.author?.username || 'Alinue'}: "${(
    post.caption ||
    post.content ||
    'Creative Post'
  ).slice(0, 50)}"`;

  // บันทึกการแชร์ไปยัง Backend
  const recordShare = async (platform) => {
    try {
      const res = await shareMutation.mutateAsync({
        id: post.id,
        platform,
      });
      if (res?.sharesCount !== undefined && onShareSuccess) {
        onShareSuccess(res.sharesCount);
      }
    } catch (err) {
      console.warn('Record share note:', err);
    }
  };

  // 1. คัดลอกลิงก์
  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      recordShare('copy_link');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // 2. แชร์ไปยัง X (Twitter)
  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Check out this creative post by @${authorUsername || 'creator'} on Alinue!`
    );
    const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
    recordShare('x');
  };

  // 3. แชร์ไปยัง Facebook
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
    recordShare('facebook');
  };

  // 4. แชร์ไปยัง LINE
  const handleShareLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
    recordShare('line');
  };

  // 5. System Web Share API (มือถือ / เบราว์เซอร์ที่รองรับ)
  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: (post.caption || post.content || '').slice(0, 100),
        url: shareUrl,
      });
      recordShare('native');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
    }
  };

  // ดึงภาพแรกของโพสต์มาทำ Thumbnail พรีวิว
  const mediaList = post.images || post.media_urls || [];
  const firstImage =
    typeof mediaList[0] === 'string'
      ? mediaList[0]
      : mediaList[0]?.url || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden p-5 sm:p-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-800">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                แชร์โพสต์
              </h3>
              <p className="text-[11px] text-gray-500">
                แชร์ผลงานนี้ให้เพื่อนหรือบนโซเชียลมีเดีย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Post Preview Card */}
        <div className="mt-4 p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
          {firstImage ? (
            <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gray-200 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstImage}
                alt="Post preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-tr from-purple-200 to-pink-200 flex items-center justify-center text-purple-700 font-bold text-xs">
              Alinue
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-900 truncate">
                {post.author?.name || post.author?.username || 'Creator'}
              </span>
              {authorUsername && (
                <span className="text-[11px] text-gray-400 truncate">
                  @{authorUsername}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed break-words">
              {post.caption || post.content || 'โพสต์บน Alinue'}
            </p>
          </div>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="mt-5">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2.5">
            แชร์ไปยัง
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* 1. X (Twitter) */}
            <button
              type="button"
              onClick={handleShareTwitter}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="font-bold text-sm">𝕏</span>
              </div>
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-black">
                X
              </span>
            </button>

            {/* 2. Facebook */}
            <button
              type="button"
              onClick={handleShareFacebook}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="font-bold text-base leading-none">f</span>
              </div>
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-black">
                Facebook
              </span>
            </button>

            {/* 3. LINE */}
            <button
              type="button"
              onClick={handleShareLine}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-2xl bg-[#06C755] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="font-bold text-xs leading-none">LINE</span>
              </div>
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-black">
                LINE
              </span>
            </button>

            {/* 4. Native / More */}
            <button
              type="button"
              onClick={canNativeShare ? handleNativeShare : handleCopyLink}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {canNativeShare ? (
                  <ExternalLink className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </div>
              <span className="text-[11px] font-medium text-gray-600 group-hover:text-black">
                {canNativeShare ? 'เพิ่มเติม' : 'คัดลอก'}
              </span>
            </button>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            หรือคัดลอกลิงก์
          </label>
          <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-gray-50 border border-gray-200/80 focus-within:border-black focus-within:bg-white transition-all">
            <Globe className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="text-xs text-gray-700 bg-transparent flex-1 outline-hidden truncate select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Counter Footer */}
        <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>ยอดแชร์ทั้งหมด:</span>
          </div>
          <span className="font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
            {post.sharesCount ?? 0} ครั้ง
          </span>
        </div>
      </div>
    </div>
  );
}

