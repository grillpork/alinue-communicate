import React from "react";

/**
 * Skeleton Component
 * คอมโพเนนต์แสดงผล placeholder ระหว่างรอโหลดข้อมูล (Shimmer / Pulse effect)
 *
 * @param {'rounded' | 'circle' | 'pill' | 'rectangular'} variant - รูปทรง
 * @param {string | number} width - ความกว้าง (inline style หรือคลาส)
 * @param {string | number} height - ความสูง
 * @param {number} count - จำนวนแถวที่ต้องการ render ซ้ำ
 * @param {string} className - คลาสเพิ่มเติม
 */
export default function Skeleton({
  variant = "rounded",
  width,
  height,
  count = 1,
  className = "",
  style = {},
  ...props
}) {
  const variantMap = {
    rounded: "rounded-xl",
    circle: "rounded-full",
    pill: "rounded-full",
    rectangular: "rounded-none",
  };

  const customStyle = {
    ...(width ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  const renderSingle = (key) => (
    <div
      key={key}
      style={customStyle}
      className={`animate-pulse bg-gray-200/80 ${
        variantMap[variant] || variantMap.rounded
      } ${className}`}
      {...props}
    />
  );

  if (count > 1) {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        {Array.from({ length: count }, (_, idx) => renderSingle(idx))}
      </div>
    );
  }

  return renderSingle(0);
}

/**
 * SkeletonAvatar - พรีเซ็ตสำหรับ Avatar รูปโปรไฟล์
 */
export function SkeletonAvatar({ size = 40, className = "" }) {
  return (
    <Skeleton
      variant="circle"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    />
  );
}

/**
 * SkeletonText - พรีเซ็ตสำหรับข้อความหลายบรรทัด
 */
export function SkeletonText({ lines = 3, className = "" }) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3"];

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - พรีเซ็ตสำหรับ Card เนื้อหาทั่วไป
 */
export function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar size={42} />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-44 w-full rounded-xl mb-3.5" />
      <SkeletonText lines={2} />
    </div>
  );
}
