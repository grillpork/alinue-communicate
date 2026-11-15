import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import RetryButton from "./retry-button";

/**
 * ErrorState Component
 * @param {string} title - หัวข้อข้อผิดพลาด
 * @param {string} message / description - รายละเอียดข้อผิดพลาด
 * @param {Error | string} error - Error object หรือข้อความ error
 * @param {() => void} onRetry - callback สำหรับปุ่มลองใหม่อีกครั้ง
 * @param {string} retryLabel - ข้อความบนปุ่มลองใหม่
 * @param {boolean} isRetrying - สถานะกำลัง retry
 * @param {React.ReactNode} icon - ไอคอนที่ต้องการแสดงแทนที่
 * @param {boolean} compact - โหมดกะทัดรัด
 * @param {boolean} fullScreen - แสดงเต็มหน้าจอ
 * @param {string} className - คลาสเพิ่มเติม
 */
export default function ErrorState({
  title = "เกิดข้อผิดพลาดในการโหลดข้อมูล",
  message,
  description,
  error,
  onRetry,
  retryLabel = "ลองใหม่อีกครั้ง",
  isRetrying = false,
  icon,
  compact = false,
  fullScreen = false,
  className = "",
  ...props
}) {
  const errorMessage =
    message ||
    description ||
    (typeof error === "string" ? error : error?.message);

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-6 px-4" : "py-12 px-6"
      } ${className}`}
      {...props}
    >
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 shadow-2xs ring-8 ring-red-50/50">
        {icon || <AlertCircle className="h-6 w-6" />}
      </div>

      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
        {title}
      </h3>

      {errorMessage && (
        <p className="mt-1 max-w-md text-xs sm:text-sm text-gray-500">
          {errorMessage}
        </p>
      )}

      {onRetry && (
        <div className="mt-4">
          <RetryButton
            onClick={onRetry}
            isLoading={isRetrying}
            label={retryLabel}
          />
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 p-4 backdrop-blur-xs">
        {content}
      </div>
    );
  }

  return content;
}
