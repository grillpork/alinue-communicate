import React from "react";
import { RotateCcw } from "lucide-react";
import Button from "./Button";

/**
 * RetryButton Component
 * @param {() => void} onRetry / onClick - ฟังก์ชันทำงานเมื่อกดปุ่ม
 * @param {boolean} isLoading - สถานะกำลังโหลด retry
 * @param {string} label - ข้อความบนปุ่ม (ค่าเริ่มต้น: 'ลองใหม่อีกครั้ง')
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} variant - สไตล์ปุ่ม
 * @param {'sm' | 'md' | 'lg'} size - ขนาดปุ่ม
 * @param {string} className - คลาสเพิ่มเติม
 */
export default function RetryButton({
  onClick,
  onRetry,
  isLoading = false,
  label = "ลองใหม่อีกครั้ง",
  variant = "outline",
  size = "sm",
  className = "",
  disabled,
  ...props
}) {
  const handleClick = onRetry || onClick;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      leftIcon={
        <RotateCcw
          className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : "transition-transform group-hover:-rotate-45"}`}
        />
      }
      className={`group cursor-pointer ${className}`}
      {...props}
    >
      {label}
    </Button>
  );
}
