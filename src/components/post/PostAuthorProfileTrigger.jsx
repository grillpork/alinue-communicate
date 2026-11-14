'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import MiniProfilePopup from '@/components/profile/MiniProfilePopup';
import ProfileModal from '@/components/profile/ProfileModal';
import UserAvatar from '@/components/common/UserAvatar';

/**
 * PostAuthorProfileTrigger
 * จัดการปฏิสัมพันธ์ของรูปโปรไฟล์และชื่อผู้เขียนโพสต์:
 * - Hover ที่รูปโปรไฟล์ -> แสดง Mini Popup Profile
 * - Toggle (Click/Tap) ที่รูปโปรไฟล์ -> แสดง Modal Profile
 * - คลิกที่ชื่อผู้ใช้ -> ลิงก์ตรงไปยังหน้า /[username]
 */
export default function PostAuthorProfileTrigger({ author }) {
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverTimerRef = useRef(null);

  // เคลียร์ Timer เมื่อ unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isModalOpen) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHoverOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHoverOpen(false);
    }, 220);
  };

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHoverOpen(false);
    setIsModalOpen((prev) => !prev);
  };

  const username = author?.username ? `/${author.username}` : '#';

  return (
    <div className="relative inline-flex items-center gap-2.5">
      {/* 1. Avatar Button (Click = Toggle Modal Profile, Hover = Mini Popup Profile) */}
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={handleAvatarClick}
          aria-label={`View ${author?.name || 'user'}'s profile`}
          className="rounded-full ring-1 ring-gray-100 hover:ring-gray-300 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none"
        >
          <UserAvatar
            src={author?.avatar}
            alt={author?.name || 'User'}
            size="md"
          />
        </button>

        {/* Mini Hover Profile Popup (เมื่อ Hover บนรูปโปรไฟล์) */}
        <MiniProfilePopup
          author={author}
          isOpen={isHoverOpen && !isModalOpen}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onOpenModal={() => {
            setIsHoverOpen(false);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* 2. Author Name Linked to /[username] (Hovering also triggers mini popup) */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={username}
          className="font-semibold text-gray-900 text-sm hover:underline"
        >
          {author?.name || 'User'}
        </Link>
      </div>

      {/* 3. Modal Profile (เมื่อ Toggle / Click ที่รูปโปรไฟล์) */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        author={author}
      />
    </div>
  );
}

