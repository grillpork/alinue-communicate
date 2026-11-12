import React from "react";
import Image from "next/image";

/**
 * EmptyState Component
 * แสดงรูปภาพสถานะว่างเปล่า (Empty State) แบบรูปภาพอย่างเดียว ไม่มีข้อความ
 */
const EmptyState = ({ imageSrc = "/empty/no-content.png", className = "" }) => {
  return (
    <div
      className={`flex items-center justify-center py-12 sm:py-16 ${className}`}
    >
      <div className="relative select-none opacity-90 transition-opacity hover:opacity-100">
        <Image
          src={imageSrc}
          alt="No content"
          width={1000}
          height={1000}
          className="h-full w-full object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default EmptyState;
