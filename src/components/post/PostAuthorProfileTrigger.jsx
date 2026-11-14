'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import MiniProfilePopup from '@/components/profile/MiniProfilePopup';
import ProfileModal from '@/components/profile/ProfileModal';
import UserAvatar from '@/components/common/UserAvatar';
import { useMeQuery } from '@/services/auth';
import { useToggleFollowMutation } from '@/services/user';

/**
 * PostAuthorProfileTrigger
 * จัดการปฏิสัมพันธ์ของรูปโปรไฟล์และชื่อผู้เขียนโพสต์:
 * - Hover ที่รูปโปรไฟล์ -> แสดง Mini Popup Profile
 * - Toggle (Click/Tap) ที่รูปโปรไฟล์ -> แสดง Modal Profile
 * - คลิกที่ชื่อผู้ใช้ -> ลิงก์ตรงไปยังหน้า /[username]
 * - ปุ่ม (+) Follow ที่มุมล่างขวาของ Avatar สไตล์ Threads
 */
export default function PostAuthorProfileTrigger({
  author,
  showName = true,
  avatarSize = 'md',
  showFollowButton = true,
}) {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const isSelf = Boolean(
    currentUser &&
      author &&
      (currentUser.id === author.id ||
        (currentUser.username &&
          author.username &&
          currentUser.username.toLowerCase() === author.username.toLowerCase()))
  );

  const [isFollowing, setIsFollowing] = useState(Boolean(author?.isFollowing));
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    if (author?.isFollowing !== undefined) {
      setIsFollowing(Boolean(author.isFollowing));
    }
  }, [author?.isFollowing]);

  const toggleFollowMutation = useToggleFollowMutation({
    onSuccess: (data) => {
      if (data?.isFollowing !== undefined) {
        setIsFollowing(Boolean(data.isFollowing));
      }
    },
  });

  const handleFollowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    const targetId = author?.id || author?.username;
    if (targetId) {
      setIsFollowing(true);
      toggleFollowMutation.mutate(targetId);
    }
  };

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
    <div className={`relative inline-flex items-center ${showName ? 'gap-2.5' : ''}`}>
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
            size={avatarSize}
          />
        </button>

        {/* Threads-style Follow (+) Button Badge */}
        {showFollowButton && !isSelf && !isFollowing && (
          <button
            type="button"
            onClick={handleFollowClick}
            disabled={toggleFollowMutation.isPending}
            aria-label={`Follow ${author?.name || author?.username || 'user'}`}
            title={`Follow ${author?.name || author?.username || 'user'}`}
            className="absolute -bottom-0.5 -right-0.5 z-10 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white text-black ring-2 ring-white shadow-2xs hover:scale-115 active:scale-90 transition-transform cursor-pointer focus:outline-none"
          >
            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
          </button>
        )}

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
      {showName && (
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
      )}

      {/* 3. Modal Profile (เมื่อ Toggle / Click ที่รูปโปรไฟล์) */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        author={author}
      />
    </div>
  );
}

