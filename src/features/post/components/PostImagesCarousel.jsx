"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionValue } from "motion/react";

/**
 * แสดงรูปภาพใน PostCard ด้วย Motion Physics (Spring Elasticity, Momentum, Drag to Scroll แบบ Threads)
 */
export default function PostImagesCarousel({ images, onImageClick }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [dragConstraint, setDragConstraint] = useState(0);
  const x = useMotionValue(0);

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

  // คำนวณระยะที่สามารถ Drag ได้จากขนาดจริงของ Container และ Content
  const updateConstraints = () => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      const maxDrag = Math.max(0, contentWidth - containerWidth);
      setDragConstraint(maxDrag);

      // รีเซ็ตตำแหน่งหากขนาดหน้าจอขยายจนเกินขอบเขต
      if (x.get() < -maxDrag) {
        x.set(-maxDrag);
      }
    }
  };

  useEffect(() => {
    updateConstraints();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => updateConstraints());
    ro.observe(container);
    if (contentRef.current) ro.observe(contentRef.current);

    return () => ro.disconnect();
  }, [normalizedImages]);

  // ป้องกันการเปิด Image Modal เมื่อผู้ใช้ตั้งใจ Drag เลื่อนดูรูป
  const handleImageClick = (url, idx) => {
    if (isDraggingRef.current) return;
    onImageClick?.(url, idx);
  };

  // รองรับการปาดด้วย 2 นิ้วบน Trackpad ของ Mac หรือล้อหมุนเมาส์แนวนอน
  const handleWheel = (e) => {
    if (dragConstraint <= 0) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
      const currentX = x.get();
      const nextX = Math.min(0, Math.max(-dragConstraint, currentX - e.deltaX));
      x.set(nextX);
    }
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

  // กรณี 2 รูปขึ้นไป: Motion Drag Physics (Spring Elasticity + Inertia Momentum แบบ Threads)
  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative mt-3 select-none overflow-hidden px-3.5 sm:px-4 cursor-grab active:cursor-grabbing"
    >
      <motion.div
        ref={contentRef}
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -dragConstraint, right: 0 }}
        dragElastic={0.16} // แรงสปริงหน่วงยืดหยุ่นเวลาลากชนขอบ
        dragTransition={{
          power: 0.22, // แรงเหวี่ยงส่งต่อหลังปล่อยเมาส์ (Inertia)
          timeConstant: 250, // ความนุ่มนวลของการชะลอความเร็ว
          bounceStiffness: 350, // ความเด้งของสปริงเมื่อคืนกลับ
          bounceDamping: 30,
        }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 50);
        }}
        className="flex gap-2.5 w-max will-change-transform"
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
            className="relative flex-[0_0_260px] sm:flex-[0_0_320px] h-[360px] sm:h-[440px] overflow-hidden rounded-2xl border border-neutral-100 bg-gray-50 shadow-2xs shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
      </motion.div>
    </div>
  );
}
