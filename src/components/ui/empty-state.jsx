import React from "react";
import Image from "next/image";

/**
 * EmptyState Component
 * คอมโพเนนต์แสดงสถานะว่างเปล่า (Empty State)
 * รองรับทั้งแบบรูปภาพอย่างเดียว และแบบมีข้อความหัวข้อ/คำอธิบาย/ปุ่ม Action
 *
 * @param {string} imageSrc - Path รูปภาพ (ค่าเริ่มต้น: '/empty/no-content.png')
 * @param {React.ReactNode} icon - ไอคอนที่ต้องการแสดงแทนรูปภาพ (กรณีไม่ใช้รูป)
 * @param {string} title - หัวข้อ (ถ้ามี)
 * @param {string} description - รายละเอียดเพิ่มเติม (ถ้ามี)
 * @param {React.ReactNode} action - ปุ่มหรือ Element ดำเนินการ (ถ้ามี)
 * @param {React.ReactNode} children - เนื้อหาเพิ่มเติมภายใน
 * @param {string} className - คลาสเพิ่มเติม
 */
export default function EmptyState({
  imageSrc = "/empty/no-content.png",
  icon,
  title,
  description,
  action,
  children,
  className = "",
  ...props
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 sm:py-16 text-center select-none ${className}`}
      {...props}
    >
      {/* 1. Image หรือ Icon */}
      {imageSrc ? (
        <div className="relative opacity-90 transition-opacity hover:opacity-100 max-w-xs sm:max-w-sm">
          <Image
            src={imageSrc}
            alt={title || "No content"}
            width={1000}
            height={1000}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      ) : icon ? (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          {icon}
        </div>
      ) : null}

      {/* 2. Text Content (ถ้าส่งมา) */}
      {(title || description) && (
        <div className="mt-4 max-w-sm px-4">
          {title && (
            <h4 className="text-sm sm:text-base font-semibold text-gray-800">
              {title}
            </h4>
          )}
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}

      {/* 3. Action / Children (ถ้ามี) */}
      {(action || children) && (
        <div className="mt-5">
          {action}
          {children}
        </div>
      )}
    </div>
  );
}
