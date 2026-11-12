import React from 'react';

/**
 * Reusable Button Component
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} variant - สไตล์ของปุ่ม
 * @param {'sm' | 'md' | 'lg' | 'icon'} size - ขนาดของปุ่ม
 * @param {boolean} isLoading - สถานะกำลังโหลด
 * @param {React.ReactNode} leftIcon - ไอคอนด้านซ้าย
 * @param {React.ReactNode} rightIcon - ไอคอนด้านขวา
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[#1e2330] hover:bg-[#2d3446] text-white shadow-2xs',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-800',
    outline:
      'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs',
    ghost:
      'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-2xs',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-full gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 rounded-full gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 rounded-full gap-2.5',
    icon: 'h-8 w-8 rounded-full p-0',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

