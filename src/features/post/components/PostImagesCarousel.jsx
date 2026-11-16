"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { usePostDisplayMode } from "@/hooks/usePostDisplayMode";

/**
 * แสดงรูปภาพใน PostCard รองรับ 2 โหมดการแสดงผล:
 * 1. "carousel" (สไลด์): Flex + Scroll-X + Drag to Scroll (พร้อม Inertia Momentum & Scale Motion)
 * 2. "grid" (ตาราง): Collage Grid Layout (1 รูปใหญ่ด้านบน + รูปล่างเรียงเป็นตาราง)
 */
export default function PostImagesCarousel({ images, onImageClick }) {
  const [displayMode] = usePostDisplayMode();
  const scrollRef = useRef(null);
  const dragState = useRef({
    isDown: false,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    rafId: null,
  });
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [pressedIdx, setPressedIdx] = useState(null);

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

  // ล้าง animation frame เมื่อ unmount
  useEffect(() => {
    const state = dragState.current;
    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
    };
  }, []);

  const stopMomentum = useCallback(() => {
    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
      dragState.current.rafId = null;
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // เฉพาะคลิกซ้าย
    const container = scrollRef.current;
    if (!container) return;

    stopMomentum();

    const s = dragState.current;
    s.isDown = true;
    s.isDragging = false;
    s.startX = e.pageX - container.offsetLeft;
    s.scrollLeft = container.scrollLeft;
    s.lastX = e.pageX;
    s.lastTime = performance.now();
    s.velocity = 0;
  };

  const handleMouseMove = (e) => {
    const s = dragState.current;
    if (!s.isDown) return;
    const container = scrollRef.current;
    if (!container) return;

    const now = performance.now();
    const dt = now - s.lastTime;
    const x = e.pageX - container.offsetLeft;
    const walk = x - s.startX;

    // หากลากเกิน 5px ให้เริ่มเข้าโหมด Drag
    if (Math.abs(walk) > 5) {
      if (!s.isDragging) {
        s.isDragging = true;
        setIsGrabbing(true);
      }
      e.preventDefault();
      container.scrollLeft = s.scrollLeft - walk;

      if (dt > 0) {
        const instantVel = (e.pageX - s.lastX) / dt;
        s.velocity = s.velocity * 0.6 + instantVel * 0.4;
        s.lastX = e.pageX;
        s.lastTime = now;
      }
    }
  };

  const handleMouseUpOrLeave = () => {
    const s = dragState.current;
    if (!s.isDown) return;
    s.isDown = false;
    setIsGrabbing(false);
    setPressedIdx(null);

    if (s.isDragging) {
      const container = scrollRef.current;
      const timeSinceMove = performance.now() - s.lastTime;
      let currentVel = timeSinceMove < 60 ? s.velocity * 16 : 0;

      const stepMomentum = () => {
        if (!container || Math.abs(currentVel) < 0.4) {
          s.rafId = null;
          return;
        }
        container.scrollLeft -= currentVel;
        currentVel *= 0.94;
        s.rafId = requestAnimationFrame(stepMomentum);
      };

      if (Math.abs(currentVel) >= 0.4) {
        s.rafId = requestAnimationFrame(stepMomentum);
      }

      setTimeout(() => {
        s.isDragging = false;
      }, 50);
    }
  };

  const handleImageClick = (url, idx) => {
    if (dragState.current.isDragging) return;
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
          className="relative inline-block max-w-full overflow-hidden rounded-xl border border-neutral-100 bg-gray-50/50 shadow-2xs cursor-pointer group transition-transform duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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

  // โหมด "grid" (ตาราง Collage แบบ 1 รูปใหญ่ด้านบน + แถวล่างเรียงกัน)
  if (displayMode === "grid") {
    const count = normalizedImages.length;

    // กรณี 2 รูป: แบ่ง 2 คอลัมน์ซ้าย-ขวา
    if (count === 2) {
      return (
        <div className="mt-3 px-3.5 sm:px-4">
          <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-neutral-100 bg-gray-50 shadow-2xs">
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
                className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name || `Image ${idx + 1}`}
                  draggable={false}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // กรณี 3 รูปขึ้นไป: รูปแรกอยู่ด้านบนเต็มความกว้าง + รูปที่เหลือเรียงด้านล่าง (2 หรือ 3 คอลัมน์ตามภาพตัวอย่าง)
    const heroImage = normalizedImages[0];
    const bottomImages = normalizedImages.slice(1, 4);
    const extraCount = count - 4;

    return (
      <div className="mt-3 px-3.5 sm:px-4">
        <div className="flex flex-col gap-1 overflow-hidden rounded-xl border border-neutral-100 bg-gray-50 shadow-2xs">
          {/* รูปหลักด้านบน (Hero Image) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onImageClick?.(heroImage.url, 0)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onImageClick?.(heroImage.url, 0);
              }
            }}
            aria-label="ดูรูปภาพที่ 1"
            className="relative w-full max-h-[380px] sm:max-h-[440px] overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage.url}
              alt={heroImage.name || "Image 1"}
              draggable={false}
              className="block w-full h-full max-h-[380px] sm:max-h-[440px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>

          {/* แถวรูปด้านล่าง (2 คอลัมน์เมื่อมี 3 รูป, 3 คอลัมน์เมื่อมี 4 รูปขึ้นไป) */}
          <div
            className={`grid gap-1 ${
              bottomImages.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {bottomImages.map((img, i) => {
              const actualIdx = i + 1;
              const isLastWithExtra = i === 2 && extraCount > 0;

              return (
                <div
                  key={img.id || actualIdx}
                  role="button"
                  tabIndex={0}
                  onClick={() => onImageClick?.(img.url, actualIdx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onImageClick?.(img.url, actualIdx);
                    }
                  }}
                  aria-label={`ดูรูปภาพที่ ${actualIdx + 1}`}
                  className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || `Image ${actualIdx + 1}`}
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  {isLastWithExtra && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center transition-colors group-hover:bg-black/65">
                      <span className="text-white text-base sm:text-lg font-bold tracking-tight">
                        +{extraCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // โหมด "carousel" (สไลด์): ความสูงเท่ากัน + สัดส่วนเดิม + Motion ย่อขนาดขณะ Drag
  return (
    <div className="relative mt-3 select-none">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={stopMomentum}
        onTouchStart={stopMomentum}
        className={`flex items-center gap-0.5 px-3.5 sm:px-4 py-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isGrabbing ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {normalizedImages.map((img, idx) => {
          const isTargetCard = pressedIdx === idx;
          let scaleClass = "scale-100";
          if (isGrabbing) {
            scaleClass = isTargetCard ? "scale-[0.96]" : "scale-[0.985]";
          } else if (isTargetCard) {
            scaleClass = "scale-[0.98]";
          }

          return (
            <div
              key={img.id || idx}
              role="button"
              tabIndex={0}
              onMouseDown={() => setPressedIdx(idx)}
              onTouchStart={() => setPressedIdx(idx)}
              onTouchEnd={() => setPressedIdx(null)}
              onClick={() => handleImageClick(img.url, idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onImageClick?.(img.url, idx);
                }
              }}
              aria-label={`ดูรูปภาพที่ ${idx + 1}`}
              className={`relative h-[280px] sm:h-[360px] w-auto shrink-0 overflow-hidden rounded-xl border border-neutral-100 bg-gray-50 shadow-2xs group transition-transform duration-300 ease-out will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${scaleClass}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name || `Image ${idx + 1}`}
                draggable={false}
                className={`block h-full w-auto max-w-none pointer-events-none select-none transition-transform duration-300 ease-out ${
                  isGrabbing ? "scale-100" : ""
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
