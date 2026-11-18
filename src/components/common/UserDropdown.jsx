"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  LogOut,
  GalleryHorizontalEnd,
  LayoutGrid,
} from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import { usePostDisplayMode } from "@/hooks/usePostDisplayMode";

export default function UserDropdown({ user, onLogout, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [displayMode, setDisplayMode] = usePostDisplayMode();

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.displayName || user.name || user.username || "User";
  const avatarSrc = user.avatarUrl || user.avatar;
  const profileHref = user.username ? `/${user.username}` : "/profile";

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button: Avatar only */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-gray-200 transition-all focus:outline-none cursor-pointer"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <UserAvatar
          src={avatarSrc}
          alt={displayName}
          size="sm"
          className="ring-2 ring-gray-100"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-2 w-60 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            align === "left"
              ? "left-0 origin-top-left"
              : "right-0 origin-top-right"
          }`}
        >
          {/* User Info Header */}
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {displayName}
            </p>
            {user.email && (
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            )}
          </div>

          {/* Post Display Mode Tabs */}
          <div className="border-b border-gray-100 px-2.5 py-2.5">
            <p className="px-0.5 mb-1.5 text-[11px] font-medium text-gray-500">
              การแสดงผลโพสต์ (Post Display)
            </p>
            <div
              role="tablist"
              aria-label="รูปแบบการแสดงผลโพสต์"
              className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100/90 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={displayMode === "carousel"}
                onClick={() => setDisplayMode("carousel")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all cursor-pointer ${
                  displayMode === "carousel"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <GalleryHorizontalEnd className="h-3.5 w-3.5 shrink-0" />
                <span>สไลด์</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={displayMode === "grid"}
                onClick={() => setDisplayMode("grid")}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-[11px] font-semibold transition-all cursor-pointer ${
                  displayMode === "grid"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>ตาราง</span>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href={profileHref}
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
