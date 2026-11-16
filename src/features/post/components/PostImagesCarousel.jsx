"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";

/**
 * แสดงรูปภาพใน PostCard ด้วย Flex + Scroll-X + Drag to Scroll (พร้อม Inertia Momentum แบบ Threads.com)
 */
export default function PostImagesCarousel({ images, onImageClick }) {
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
        // Smooth velocity ด้วย exponential moving average
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

    if (s.isDragging) {
      const container = scrollRef.current;
      // หากปล่อยเมาส์ไม่เกิน 60ms หลังขยับครั้งสุดท้าย ให้ส่งแรงเฉื่อย (Momentum) ต่อแบบ Threads
      const timeSinceMove = performance.now() - s.lastTime;
      let currentVel = timeSinceMove < 60 ? s.velocity * 16 : 0;

      const stepMomentum = () => {
        if (!container || Math.abs(currentVel) < 0.4) {
          s.rafId = null;
          return;
        }
        container.scrollLeft -= currentVel;
        currentVel *= 0.94; // แรงเสียดทานค่อย ๆ ชะลอหยุดอย่างนุ่มนวล
        s.rafId = requestAnimationFrame(stepMomentum);
      };

      if (Math.abs(currentVel) >= 0.4) {
        s.rafId = requestAnimationFrame(stepMomentum);
      }

      // หน่วงเวลาสั้น ๆ เพื่อไม่ให้ event onClick ทำงานหลังปล่อยเมาส์จากการลาก
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

  // กรณี 2 รูปขึ้นไป: Flex + Scroll-X + Drag to Scroll สไตล์ Threads.com
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
        className={`flex gap-2.5 px-3.5 sm:px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isGrabbing ? "cursor-grabbing select-none" : "cursor-grab"
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
