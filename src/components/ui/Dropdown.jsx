'use client';

import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Dropdown Component
 * @param {React.ReactNode} trigger - ปุ่มหรือ element สำหรับกดเปิดเมนู
 * @param {'left' | 'right'} align - จัดตำแหน่งเมนูดรอปดาวน์
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ปิดเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* Menu Box */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute mt-1.5 min-w-[160px] rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
      } ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

export function DropdownSeparator({ className = '' }) {
  return <div className={`my-1 border-t border-gray-100 ${className}`} />;
}

