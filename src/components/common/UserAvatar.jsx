'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';

export default function UserAvatar({
  src,
  alt = 'User avatar',
  size = 'md',
  className = '',
  iconClassName = '',
}) {
  const [hasError, setHasError] = useState(false);

  // ตรวจสอบว่ามีรูปภาพที่ถูกต้องหรือไม่ (ถ้าไม่มีรูป, โหลดไม่ผ่าน, หรือเป็น Unsplash ตัวอย่างเดิม ให้ถือว่าไม่มีรูป)
  const hasValidSrc = Boolean(
    src &&
      !hasError &&
      !src.includes('1534528741775-53994a69daeb')
  );

  const sizeClasses =
    {
      xs: 'h-5 w-5',
      sm: 'h-7 w-7',
      md: 'h-9 w-9',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
      '2xl': 'h-20 w-20',
      '3xl': 'h-24 w-24 sm:h-28 sm:w-28',
    }[size] ||
    size ||
    'h-9 w-9';

  const iconSizes =
    {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-7 w-7',
      '2xl': 'h-9 w-9',
      '3xl': 'h-12 w-12',
    }[size] ||
    'h-4 w-4';

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center text-gray-400 select-none ${sizeClasses} ${className}`}
    >
      {hasValidSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={`${iconSizes} text-gray-400 ${iconClassName}`} />
      )}
    </div>
  );
}
