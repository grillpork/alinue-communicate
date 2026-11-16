"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { usePostDisplayMode } from "@/hooks/usePostDisplayMode";

/**
 * แสดงรูปภาพใน PostCard รองรับ 2 โหมดการแสดงผล:
 * 1. "carousel" (สไลด์): Flex + Scroll-X + Drag to Scroll (พร้อม Inertia Momentum & Scale Motion)
 * 2. "grid" (ตาราง Facebook Auto-Aspect Grid):
 *    - คำนวณสัดส่วนภาพแรกอัตโนมัติ (Portrait / Landscape / Square)
 *    - 4 รูป (Portrait): ซ้าย 1 รูปใหญ่ (2/3) + ขวาเรียงตั้ง 3 รูปจัตุรัส (1/3)
 *    - 4 รูป (Landscape): บน 1 รูปใหญ่ (2/3) + ล่างเรียงนอน 3 รูปจัตุรัส (1/3)
 *    - 4 รูป (Square): ตาราง 2x2 จัตุรัสเท่ากัน
 *    - 5+ รูป: แถวบน 2 รูปจัตุรัส + แถวล่าง 3 รูปจัตุรัส พร้อม Overlay +N
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
  const [firstAspect, setFirstAspect] = useState("square"); // "portrait" | "landscape" | "square"

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

  const classifyAspect = useCallback((width, height) => {
    if (!width || !height) return;
    const ratio = width / height;
    if (ratio < 0.88) {
      setFirstAspect("portrait");
    } else if (ratio > 1.15) {
      setFirstAspect("landscape");
    } else {
      setFirstAspect("square");
    }
  }, []);

  // ตรวจสอบสัดส่วนของรูปภาพแรกอัตโนมัติเพื่อจัด Layout ตารางแบบ Facebook
  useEffect(() => {
    const firstUrl = normalizedImages[0]?.url;
    if (!firstUrl || typeof window === "undefined") return;

    let isActive = true;
    const img = new window.Image();
    img.src = firstUrl;

    if (img.complete && img.naturalWidth && img.naturalHeight) {
      classifyAspect(img.naturalWidth, img.naturalHeight);
    } else {
      img.onload = () => {
        if (isActive) {
          classifyAspect(img.naturalWidth, img.naturalHeight);
        }
      };
    }

    return () => {
      isActive = false;
    };
  }, [normalizedImages, classifyAspect]);

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

  // Helper เรนเดอร์แต่ละช่องรูปภาพในโหมด Grid
  const renderGridCell = (img, idx, className = "", extraOverlayCount = 0) => (
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
      className={`relative overflow-hidden bg-gray-100 cursor-pointer group focus:outline-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.url}
        alt={img.name || `Image ${idx + 1}`}
        draggable={false}
        onLoad={
          idx === 0
            ? (e) =>
                classifyAspect(
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight,
                )
            : undefined
        }
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      {extraOverlayCount > 0 && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center transition-colors group-hover:bg-black/60">
          <span className="text-white text-lg sm:text-xl font-bold tracking-tight">
            +{extraOverlayCount}
          </span>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // โหมด "grid": Facebook Auto-Aspect Grid
  // ============================================================================
  if (displayMode === "grid") {
    const count = normalizedImages.length;

    // 1) กรณี 2 รูป: แบ่ง 2 คอลัมน์ซ้าย-ขวา (หรือบน-ล่างหากรูปแรกเป็นแนวนอนยาว)
    if (count === 2) {
      return (
        <div className="mt-3 px-3.5 sm:px-4">
          <div
            className={`grid gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900 ${
              firstAspect === "landscape" ? "grid-rows-2" : "grid-cols-2"
            }`}
          >
            {renderGridCell(normalizedImages[0], 0, "h-full w-full")}
            {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
          </div>
        </div>
      );
    }

    // 2) กรณี 3 รูป: ปรับตามสัดส่วนรูปแรก (Portrait = ซ้าย 1 ใหญ่ + ขวา 2 ย่อย, Landscape/Square = บน 1 ใหญ่ + ล่าง 2 ย่อย)
    if (count === 3) {
      if (firstAspect === "portrait") {
        return (
          <div className="mt-3 px-3.5 sm:px-4">
            <div className="grid grid-cols-3 gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
              {renderGridCell(normalizedImages[0], 0, "col-span-2 h-full w-full")}
              <div className="col-span-1 grid grid-rows-2 gap-0.5 h-full w-full">
                {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
                {renderGridCell(normalizedImages[2], 2, "h-full w-full")}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="mt-3 px-3.5 sm:px-4">
          <div className="grid grid-rows-3 gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
            {renderGridCell(normalizedImages[0], 0, "row-span-2 h-full w-full")}
            <div className="row-span-1 grid grid-cols-2 gap-0.5 h-full w-full">
              {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
              {renderGridCell(normalizedImages[2], 2, "h-full w-full")}
            </div>
          </div>
        </div>
      );
    }

    // 3) กรณี 4 รูป: แยก 3 รูปแบบอัตโนมัติตามสัดส่วนรูปแรกเหมือน Facebook
    if (count === 4) {
      // 3.1 รูปแรกเป็นแนวตั้ง (Portrait): ซ้าย 1 รูปใหญ่ (2/3) + ขวาเรียงตั้ง 3 รูปจัตุรัส (1/3)
      if (firstAspect === "portrait") {
        return (
          <div className="mt-3 px-3.5 sm:px-4">
            <div className="grid grid-cols-3 gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
              {renderGridCell(normalizedImages[0], 0, "col-span-2 h-full w-full")}
              <div className="col-span-1 grid grid-rows-3 gap-0.5 h-full w-full">
                {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
                {renderGridCell(normalizedImages[2], 2, "h-full w-full")}
                {renderGridCell(normalizedImages[3], 3, "h-full w-full")}
              </div>
            </div>
          </div>
        );
      }

      // 3.2 รูปแรกเป็นแนวนอน (Landscape): บน 1 รูปใหญ่ (2/3) + ล่างเรียงนอน 3 รูปจัตุรัส (1/3)
      if (firstAspect === "landscape") {
        return (
          <div className="mt-3 px-3.5 sm:px-4">
            <div className="grid grid-rows-3 gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
              {renderGridCell(normalizedImages[0], 0, "row-span-2 h-full w-full")}
              <div className="row-span-1 grid grid-cols-3 gap-0.5 h-full w-full">
                {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
                {renderGridCell(normalizedImages[2], 2, "h-full w-full")}
                {renderGridCell(normalizedImages[3], 3, "h-full w-full")}
              </div>
            </div>
          </div>
        );
      }

      // 3.3 รูปแรกเป็นสี่เหลี่ยมจัตุรัส (Square): ตาราง 2x2 จัตุรัสเท่ากันทั้ง 4 ช่อง
      return (
        <div className="mt-3 px-3.5 sm:px-4">
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
            {renderGridCell(normalizedImages[0], 0, "h-full w-full")}
            {renderGridCell(normalizedImages[1], 1, "h-full w-full")}
            {renderGridCell(normalizedImages[2], 2, "h-full w-full")}
            {renderGridCell(normalizedImages[3], 3, "h-full w-full")}
          </div>
        </div>
      );
    }

    // 4) กรณี 5 รูปขึ้นไป: แถวบน 2 รูปจัตุรัส + แถวล่าง 3 รูปจัตุรัส พร้อม +N ในช่องที่ 5
    const extraCount = count - 5;
    return (
      <div className="mt-3 px-3.5 sm:px-4">
        <div className="flex flex-col gap-0.5 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-900">
          {/* แถวบน 2 รูป */}
          <div className="grid grid-cols-2 gap-0.5 w-full">
            {renderGridCell(normalizedImages[0], 0, "aspect-square w-full")}
            {renderGridCell(normalizedImages[1], 1, "aspect-square w-full")}
          </div>

          {/* แถวล่าง 3 รูป */}
          <div className="grid grid-cols-3 gap-0.5 w-full">
            {renderGridCell(normalizedImages[2], 2, "aspect-square w-full")}
            {renderGridCell(normalizedImages[3], 3, "aspect-square w-full")}
            {renderGridCell(
              normalizedImages[4],
              4,
              "aspect-square w-full",
              extraCount > 0 ? extraCount : 0,
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // โหมด "carousel" (สไลด์): ความสูงเท่ากัน + สัดส่วนเดิม + Motion ย่อขนาดขณะ Drag
  // ============================================================================
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
