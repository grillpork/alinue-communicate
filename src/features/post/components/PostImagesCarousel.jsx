"use client";

import React, { useMemo, useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function PostImagesCarousel({ images, onImageClick }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: true, // ปิดการ Snap ให้เลื่อนได้อย่างอิสระและนุ่มนวล (Free scroll without snapping)
    containScroll: "trimSnaps",
  });

  const [aspectType, setAspectType] = useState("landscape"); // "landscape" | "portrait" | "square"

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

  // คำนวณ Aspect Ratio ของรูปแรกเพื่อปรับสัดส่วนกล่องแสดงผลตามแบบ Threads
  useEffect(() => {
    if (!normalizedImages[0]?.url) return;
    const img = new Image();
    img.src = normalizedImages[0].url;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 1.2) {
          setAspectType("landscape");
        } else if (ratio < 0.85) {
          setAspectType("portrait");
        } else {
          setAspectType("square");
        }
      }
    };
  }, [normalizedImages]);

  // สั่ง Embla ให้คำนวณตำแหน่งใหม่เมื่อ Aspect Ratio เปลี่ยน
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaApi, aspectType]);

  if (normalizedImages.length === 0) return null;

  // กรณี 1 รูป: แสดงตามสัดส่วนจริงของภาพ (object-contain ไม่ตัดขอบ)
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
            draggable={false}
            className="block h-auto max-h-[400px] sm:max-h-[460px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    );
  }

  // ป้องกันการเปิด Image Modal เมื่อผู้ใช้ Drag สไลด์รูปใน Embla
  const handleImageClick = (url, idx) => {
    if (emblaApi && !emblaApi.clickAllowed()) return;
    onImageClick?.(url, idx);
  };

  // ขนาดของการ์ดตามสัดส่วนภาพจริง (สไตล์ Threads)
  const cardSizeClass =
    aspectType === "landscape"
      ? "flex-[0_0_82%] sm:flex-[0_0_78%] h-[240px] sm:h-[300px]" // แนวนอน (เช่น Screenshot)
      : aspectType === "portrait"
        ? "flex-[0_0_68%] sm:flex-[0_0_60%] h-[380px] sm:h-[460px]" // แนวตั้ง (เช่น Poster / Artwork)
        : "flex-[0_0_72%] sm:flex-[0_0_66%] h-[320px] sm:h-[380px]"; // สี่เหลี่ยมจัตุรัส

  // กรณี 2 รูปขึ้นไป: Card Peek Carousel ด้วย Embla Carousel และ object-contain
  return (
    <div className="relative mt-3 select-none">
      {/* Embla Viewport (ไม่มีปุ่มลูกศร เลื่อนด้วยเมาส์หรือทัช) */}
      <div
        ref={emblaRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="flex gap-2.5 px-3.5 sm:px-4">
          {normalizedImages.map((img, idx) => (
            <div
              key={img.id || idx}
              role="button"
              tabIndex={0}
              onClick={() => handleImageClick(img.url, idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onImageClick?.(img.url, idx);
                }
              }}
              aria-label={`ดูรูปภาพที่ ${idx + 1}`}
              className={`relative min-w-0 ${cardSizeClass} flex items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50/70 shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name || `Image ${idx + 1}`}
                draggable={false}
                className="h-full w-full object-contain pointer-events-auto transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
