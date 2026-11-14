'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';

export default function UserDropdown({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button: Avatar only */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-gray-200 transition-all focus:outline-none cursor-pointer"
        aria-label="User menu"
      >
        <UserAvatar
          src={user.avatar}
          alt={user.name || 'User'}
          size="sm"
          className="ring-2 ring-gray-100"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            {user.email && (
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 text-gray-400" />
              <span>Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
