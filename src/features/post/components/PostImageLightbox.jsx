"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/**
 * PostImageLightbox - ขยายรูปภาพเต็มจอทันทีเมื่อคลิกที่รูป (สไตล์ Threads Lightbox พื้นหลังสีขาวสะอาดตา)
 */
export default function PostImageLightbox({
  images = [],
  initialIndex = 0,
  isOpen,
  onClose,
}) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
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

  if (!isOpen || normalizedImages.length === 0) return null;

  const canScrollPrev = activeIndex > 0;
  const canScrollNext = activeIndex < normalizedImages.length - 1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 w-screen h-screen bg-white/98 backdrop-blur-md flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* ปุ่ม X มุมซ้ายบน (เหมือนตัวอย่าง Threads แต่โทนสีขาวสะอาดตา) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black shadow-2xs transition-all active:scale-95 cursor-pointer"
        aria-label="ปิดรูปภาพ"
        title="ปิดรูปภาพ"
      >
        <X className="h-5 w-5" />
      </button>

      {/* กรณีรูปเดียว */}
      {normalizedImages.length === 1 ? (
        <div className="w-full h-full flex items-center justify-center p-0 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={normalizedImages[0].url}
            alt="Expanded post image"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="max-h-screen max-w-full w-auto h-auto object-contain select-none animate-in zoom-in-95 duration-200 ease-out"
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
                  className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center p-0 sm:px-14 sm:py-6"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Expanded post image ${idx + 1}`}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    className="max-h-screen max-w-full w-auto h-auto object-contain select-none animate-in zoom-in-95 duration-200 ease-out"
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
              className="hidden sm:flex absolute left-5 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black shadow-2xs transition-all active:scale-95 cursor-pointer"
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
              className="hidden sm:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 h-11 w-11 items-center justify-center rounded-full bg-gray-100/90 text-gray-800 hover:bg-gray-200 hover:text-black shadow-2xs transition-all active:scale-95 cursor-pointer"
              aria-label="รูปถัดไป"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}

          {/* Dots บอกตำแหน่งรูปด้านล่าง */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full bg-gray-100/90 px-3 py-1.5 backdrop-blur-xs"
          >
            {normalizedImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => emblaApi?.scrollTo(idx)}
                aria-label={`ไปยังรูปที่ ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeIndex
                    ? "w-4 bg-gray-900"
                    : "w-1.5 bg-gray-300 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
