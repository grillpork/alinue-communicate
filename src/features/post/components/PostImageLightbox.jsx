"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Copy,
  Share2,
  ExternalLink,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/**
 * PostImageLightbox - ขยายรูปภาพเต็มจอทันทีเมื่อคลิกที่รูป (สไตล์ Threads Lightbox พื้นหลังสีขาว พร้อมแถบปุ่ม Action ด้านล่าง)
 */
export default function PostImageLightbox({
  images = [],
  initialIndex = 0,
  isOpen,
  onClose,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  bookmarked = false,
  onLike,
  onComment,
  onShare,
  onToggleBookmark,
  onCopyLink,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
    duration: 20,
  });

  useBodyScrollLock(isOpen);

  const normalizedImages = (images || [])
    .map((img, idx) => {
      if (!img) return null;
      if (typeof img === "string") return { id: String(idx), url: img };
      return { id: img.id || String(idx), url: img.url || "" };
    })
    .filter((img) => Boolean(img?.url));

  useEffect(() => {
    if (isOpen) {
      const startIdx = initialIndex || 0;
      setActiveIndex(startIdx);
      setShowMenu(false);
      if (emblaApi) {
        emblaApi.scrollTo(startIdx, true);
      }
    }
  }, [isOpen, initialIndex, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "ArrowLeft") {
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        emblaApi?.scrollNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, emblaApi]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen || normalizedImages.length === 0) return null;

  const canScrollPrev = activeIndex > 0;
  const canScrollNext = activeIndex < normalizedImages.length - 1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 w-screen h-screen bg-white flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* ปุ่ม X มุมซ้ายบน */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
        aria-label="ปิดรูปภาพ"
        title="ปิดรูปภาพ"
      >
        <X className="h-5 w-5" />
      </button>

      {/* ปุ่ม ••• มุมขวาบน (ตรงตามภาพตัวอย่าง) */}
      <div
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-5 right-5 z-30"
      >
        <button
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
          aria-label="ตัวเลือกเพิ่มเติม"
          title="ตัวเลือกเพิ่มเติม"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-40 animate-in fade-in zoom-in-95 duration-100">
            {onCopyLink && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onCopyLink();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5 text-gray-500" />
                <span>คัดลอกลิงก์</span>
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onShare();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-gray-500" />
                <span>แชร์โพสต์</span>
              </button>
            )}
            {onComment && (
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onComment(activeIndex);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                <span>ดูรายละเอียดโพสต์</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* กรณีรูปเดียว */}
      {normalizedImages.length === 1 ? (
        <div className="w-full h-full flex items-center justify-center pt-16 pb-24 px-0 sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedImages[0].url}
            alt="Expanded post image"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full w-auto h-auto object-contain select-none animate-in zoom-in-95 duration-200 ease-out"
          />
        </div>
      ) : (
        /* กรณีหลายรูป: เลื่อนซ้าย-ขวาได้ */
        <>
          <div
            ref={emblaRef}
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
          >
            <div className="flex h-full w-full">
              {normalizedImages.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={onClose}
                  className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center pt-16 pb-24 px-0 sm:px-16"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Expanded post image ${idx + 1}`}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-full max-w-full w-auto h-auto object-contain select-none animate-in zoom-in-95 duration-200 ease-out"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ปุ่มลูกศรซ้าย */}
          {canScrollPrev && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollPrev();
              }}
              className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
              aria-label="รูปก่อนหน้า"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* ปุ่มลูกศรขวา */}
          {canScrollNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollNext();
              }}
              className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black transition-all active:scale-95 cursor-pointer"
              aria-label="รูปถัดไป"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </>
      )}

      {/* แถบปุ่ม Action ด้านล่างตรงกลาง (Like, Comment, Bookmark, Share แบบในภาพตัวอย่าง) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2.5"
      >
        {/* Dots Indicator เมื่อมีหลายรูป */}
        {normalizedImages.length > 1 && (
          <div className="flex items-center gap-1.5">
            {normalizedImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => emblaApi?.scrollTo(idx)}
                aria-label={`ไปยังรูปที่ ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIndex
                    ? "w-4 bg-gray-900"
                    : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Action Icons Bar */}
        <div className="flex items-center gap-7 px-5 py-2 rounded-full bg-white/90 backdrop-blur-md">
          {/* Like */}
          <button
            type="button"
            onClick={() => onLike?.()}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              isLiked ? "text-red-500" : "text-gray-700 hover:text-black"
            }`}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`h-5 w-5 transition-transform active:scale-125 ${
                isLiked ? "fill-red-500 text-red-500" : ""
              }`}
            />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {/* Comment (เปิดหน้า Detail / ความคิดเห็น) */}
          <button
            type="button"
            onClick={() => onComment?.(activeIndex)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            aria-label="ความคิดเห็น"
          >
            <MessageCircle className="h-5 w-5 transition-transform active:scale-110" />
            {commentsCount > 0 && <span>{commentsCount}</span>}
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => onToggleBookmark?.()}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer ${
              bookmarked ? "text-black" : "text-gray-700 hover:text-black"
            }`}
            aria-label={bookmarked ? "ลบออกจากบุ๊กมาร์ก" : "บันทึกในบุ๊กมาร์ก"}
          >
            <Bookmark
              className={`h-5 w-5 transition-transform active:scale-125 ${
                bookmarked ? "fill-gray-900 text-gray-900" : ""
              }`}
            />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => onShare?.()}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer"
            aria-label="แชร์โพสต์"
          >
            <Send className="h-5 w-5 transition-transform active:scale-110" />
            {sharesCount > 0 && <span>{sharesCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
