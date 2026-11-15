"use client";

import React, { useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carousel รูปภาพใน PostCard ใช้ Native CSS Scroll Snap
 */
export default function PostImagesCarousel({ images, onImageClick }) {
  const containerRef = useRef(null);

  // ปรับรูปภาพให้อยู่ใน Format { id, url, name } เสมอ
  const normalizedImages = useMemo(() => {
    return (images || [])
      .map((img, idx) => {
        if (!img) return null;
        if (typeof img === "string") {
          return { id: String(idx), url: img, name: "Post image" };
        }
        return {
          id: img.id || String(idx),
          url: img.url || "",
          name: img.name || "Post image",
        };
      })
      .filter((img) => Boolean(img?.url));
  }, [images]);

  if (normalizedImages.length === 0) return null;

  // กรณี 1 รูป: แสดงตามสัดส่วนจริงของภาพ
  if (normalizedImages.length === 1) {
    const singleImage = normalizedImages[0];
    return (
      <div className="mt-3 px-3.5 sm:px-4 flex">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onImageClick?.(singleImage.url, 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onImageClick?.(singleImage.url, 0);
            }
          }}
          className="relative inline-block max-w-full overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50/50 shadow-2xs cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          aria-label="ดูรูปภาพขนาดเต็ม"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={singleImage.url}
            alt={singleImage.name || "Post image"}
            className="block h-auto max-h-[400px] sm:max-h-[460px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    );
  }

  // กรณี 2 รูปขึ้นไป: Card Peek Carousel ด้วย Native CSS Scroll Snap
  return (
    <div className="relative mt-3 group select-none">
      <div
        ref={containerRef}
        className="flex gap-2.5 px-3.5 sm:px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory scroll-smooth"
      >
        {normalizedImages.map((img, idx) => (
          <div
            key={img.id || idx}
            role="button"
            tabIndex={0}
            onClick={() => onImageClick?.(img.url, idx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onImageClick?.(img.url, idx);
              }
            }}
            aria-label={`ดูรูปภาพที่ ${idx + 1}`}
            className="relative min-w-0 flex-[0_0_72%] sm:flex-[0_0_66%] h-[360px] sm:h-[440px] snap-start overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50 shadow-2xs shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.name || `Image ${idx + 1}`}
              draggable={false}
              className="h-full w-full object-cover pointer-events-auto transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>

      {/* Prev Navigation Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          containerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
        }}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 hover:bg-white transition-all active:scale-95 border border-gray-100 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Next Navigation Arrow */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          containerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
        }}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 hover:bg-white transition-all active:scale-95 border border-gray-100 cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
