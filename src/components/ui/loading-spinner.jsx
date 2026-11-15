import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingSpinner Component
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} size - ขนาดของ Spinner
 * @param {'default' | 'primary' | 'white' | 'muted' | 'accent'} color - โทนสี
 * @param {string} text - ข้อความใต้หรือข้าง Spinner (ถ้ามี)
 * @param {boolean} fullScreen - แสดงเต็มหน้าจอ
 * @param {boolean} fullArea - แสดงเต็ม container (flex 100% w/h)
 * @param {string} className - คลาสตกแต่งเพิ่มเติม
 */
export default function LoadingSpinner({
  size = "md",
  color = "default",
  text,
  fullScreen = false,
  fullArea = false,
  className = "",
  ...props
}) {
  const sizeMap = {
    xs: "w-3.5 h-3.5",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const colorMap = {
    default: "text-[#1e2330]",
    primary: "text-blue-600",
    white: "text-white",
    muted: "text-gray-400",
    accent: "text-violet-600",
  };

  const spinner = (
    <div
      className={`inline-flex flex-col items-center justify-center gap-2.5 ${className}`}
      {...props}
    >
      <Loader2
        className={`animate-spin ${sizeMap[size] || sizeMap.md} ${
          colorMap[color] || colorMap.default
        }`}
      />
      {text && (
        <p className="text-xs sm:text-sm font-medium text-gray-500 select-none">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xs">
        {spinner}
      </div>
    );
  }

  if (fullArea) {
    return (
      <div className="flex w-full flex-1 items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}
