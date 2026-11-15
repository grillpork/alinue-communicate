"use client";

import React, { useRef, useState, useMemo } from "react";

/**
 * แสดงรูปภาพใน PostCard พร้อมรองรับ Drag to Scroll (ลากเมาส์เลื่อนแนวนอน) บน Desktop
 */
export default function PostImagesCarousel({ images, onImageClick }) {
  const scrollRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

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

  // เริ่มต้นกดเมาส์ (Drag to Scroll)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // คลิกซ้ายเท่านั้น
    const container = scrollRef.current;
    if (!container) return;

    isMouseDownRef.current = true;
    isDraggingRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  // เลื่อนเมาส์ขณะกด (Drag to Scroll)
  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const walk = x - startXRef.current;

    // ขยับเกิน 5px ให้ถือว่าเป็นการ Drag
    if (Math.abs(walk) > 5) {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDraggingState(true);
      }
      e.preventDefault();
      container.scrollLeft = scrollLeftRef.current - walk;
    }
  };

  // ปล่อยเมาส์หรือเมาส์หลุดออกจากพื้นที่
  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false;
    if (isDraggingRef.current) {
      setTimeout(() => {
        isDraggingRef.current = false;
        setIsDraggingState(false);
      }, 50);
    } else {
      setIsDraggingState(false);
    }
  };

  // จัดการการคลิกที่รูปภาพ (ถ้าผู้ใช้กำลัง Drag จะไม่เปิด Detail Modal)
  const handleImageClick = (url, idx) => {
    if (isDraggingRef.current) return;
    onImageClick?.(url, idx);
  };

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
            draggable={false}
            className="block h-auto max-h-[400px] sm:max-h-[460px] w-auto max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </div>
      </div>
    );
  }

  // กรณี 2 รูปขึ้นไป: รองรับ Drag to Scroll ด้วยเมาส์ และ Touch Scroll บนมือถือ
  return (
    <div className="relative mt-3 select-none">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex gap-2.5 px-3.5 sm:px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isDraggingState ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
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
            className="relative min-w-0 flex-[0_0_72%] sm:flex-[0_0_66%] h-[360px] sm:h-[440px] overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50 shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.name || `Image ${idx + 1}`}
              draggable={false}
              className="h-full w-full object-cover pointer-events-none select-none transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
