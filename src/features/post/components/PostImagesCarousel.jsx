
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { motion } from "framer-motion";

export default function PostImagesCarousel({
  images = [],
  onImageClick,
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  // ใช้ตรวจสอบว่าผู้ใช้กำลังลากอยู่หรือไม่
  const isDragging = useRef(false);
  const dragTimer = useRef(null);

  // เก็บ Aspect Ratio ของแต่ละภาพ
  const [imageRatios, setImageRatios] = useState({});

  // ความกว้างของพื้นที่แสดงผล
  const [viewportWidth, setViewportWidth] = useState(0);

  // ระยะที่ Carousel สามารถลากไปทางซ้ายได้
  const [dragLimit, setDragLimit] = useState(0);

  // Normalize images รองรับทั้ง String และ Object
  const normalizedImages = useMemo(() => {
    if (!Array.isArray(images)) return [];

    return images
      .map((img, idx) => {
        if (typeof img === "string") {
          return {
            id: String(idx),
            url: img,
            name: `Post image ${idx + 1}`,
          };
        }

        return {
          id: img?.id ?? String(idx),
          url: img?.url ?? "",
          name: img?.name ?? `Post image ${idx + 1}`,
        };
      })
      .filter((img) => img.url);
  }, [images]);

  // ความสูงของ Card
  const cardHeight = viewportWidth >= 640 ? 420 : 380;

  // จำกัดความกว้างสูงสุดของ Card
  const maxCardWidth = viewportWidth
    ? viewportWidth * 0.82
    : 300;

  // คำนวณความกว้างจาก Aspect Ratio
  const getCardWidth = useCallback(
    (ratio) => {
      const width = cardHeight * ratio;

      return Math.min(width, maxCardWidth);
    },
    [cardHeight, maxCardWidth]
  );

  // บันทึก Aspect Ratio เมื่อโหลดภาพสำเร็จ
  const handleImageLoad = useCallback((event, id) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;

    setImageRatios((prev) => {
      if (prev[id] === ratio) return prev;

      return {
        ...prev,
        [id]: ratio,
      };
    });
  }, []);

  // วัดขนาด Viewport
  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    const updateSize = () => {
      setViewportWidth(viewport.clientWidth);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);

    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  // คำนวณขอบเขตการลาก
  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) return;

    const updateDragLimit = () => {
      // คำนวณระยะที่ Content ล้นออกจาก Viewport (Overflow)
      const overflow = track.scrollWidth - viewport.clientWidth;
      setDragLimit(Math.max(0, overflow));
    };

    updateDragLimit();

    const observer = new ResizeObserver(updateDragLimit);

    observer.observe(viewport);
    observer.observe(track);

    return () => {
      observer.disconnect();
    };
  }, [normalizedImages, imageRatios, viewportWidth]);

  // เริ่มต้นการลาก
  const handleDragStart = useCallback(() => {
    isDragging.current = true;

    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
    }
  }, []);

  // สิ้นสุดการลาก
  const handleDragEnd = useCallback(() => {
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
    }

    // ป้องกัน Click ที่เกิดตามหลัง Drag
    dragTimer.current = setTimeout(() => {
      isDragging.current = false;
    }, 150);
  }, []);

  // เปิดรูปภาพ
  const handleImageClick = useCallback(
    (url, idx) => {
      if (isDragging.current) return;

      onImageClick?.(url, idx);
    },
    [onImageClick]
  );

  // Cleanup Timer
  useEffect(() => {
    return () => {
      if (dragTimer.current) {
        clearTimeout(dragTimer.current);
      }
    };
  }, []);

  // ไม่มีรูปภาพ
  if (!normalizedImages.length) {
    return null;
  }

  // รูปภาพเดียว
  if (normalizedImages.length === 1) {
    const img = normalizedImages[0];

    return (
      <button
        type="button"
        onClick={() => handleImageClick(img.url, 0)}
        aria-label="ดูรูปภาพที่ 1"
        className="
          block
          max-w-full
          overflow-hidden
          rounded-xl
          cursor-pointer
        "
      >
        <img
          src={img.url}
          alt={img.name}
          onLoad={(event) => handleImageLoad(event, img.id)}
          className="
            block
            h-auto
            max-h-[400px]
            sm:max-h-[460px]
            max-w-full
            object-contain
          "
        />
      </button>
    );
  }

  return (
    <div
      ref={viewportRef}
      className="
        w-full
        overflow-hidden
        px-3.5
        sm:px-4
        touch-pan-y
        select-none
      "
    >
      <motion.div
        ref={trackRef}
        drag="x"
        dragConstraints={{
          left: -dragLimit,
          right: 0,
        }}
        dragElastic={0.12}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="
          flex
          w-max
          items-center
          gap-2.5
          sm:gap-3
          cursor-grab
          active:cursor-grabbing
        "
        style={{
          touchAction: "pan-y",
        }}
      >
        {normalizedImages.map((img, idx) => {
          const ratio = imageRatios[img.id] || 1;

          const cardWidth = getCardWidth(ratio);

          return (
            <motion.button
              key={img.id}
              type="button"
              onClick={() => handleImageClick(img.url, idx)}
              aria-label={`ดูรูปภาพที่ ${idx + 1}`}
              whileTap={{
                scale: 0.97,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                },
              }}
              className="
                relative
                flex-none
                overflow-hidden
                rounded-xl
                bg-neutral-100
                dark:bg-neutral-900
                cursor-pointer
                outline-none
              "
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
              }}
            >
              <img
                src={img.url}
                alt={img.name}
                draggable={false}
                onLoad={(event) =>
                  handleImageLoad(event, img.id)
                }
                className="
                  block
                  h-full
                  w-full
                  object-contain
                  pointer-events-none
                "
              />

              {/* Image Index */}
              <span
                className="
                  absolute
                  bottom-2
                  right-2
                  rounded-full
                  bg-black/50
                  px-2
                  py-1
                  text-xs
                  text-white
                  pointer-events-none
                "
              >
                {idx + 1}/{normalizedImages.length}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
