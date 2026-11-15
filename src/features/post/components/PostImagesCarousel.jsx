"use client";

import React, { useMemo } from "react";

/**
 * แสดงรูปภาพใน PostCard แบบ Scroll แนวนอนอิสระ (overflow-x-auto โดยไม่มี snap และไม่มีปุ่มลูกศร)
 */
export default function PostImagesCarousel({ images, onImageClick }) {
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

  // กรณี 2 รูปขึ้นไป: เลื่อนแนวนอนอิสระ (Free horizontal scroll without snap or arrows)
  return (
    <div className="relative mt-3 select-none">
      <div className="flex gap-2.5 px-3.5 sm:px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
            className="relative min-w-0 flex-[0_0_72%] sm:flex-[0_0_66%] h-[360px] sm:h-[440px] overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50 shadow-2xs shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
    </div>
  );
}
