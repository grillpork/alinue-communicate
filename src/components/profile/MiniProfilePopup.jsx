'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Check, Plus, BadgeCheck, Loader2, ExternalLink } from 'lucide-react';
import { useUserProfileQuery, useToggleFollowMutation } from '@/services/user';
import { useMeQuery } from '@/services/auth';

function formatStatNumber(num) {
  const n = typeof num === 'number' ? num : parseInt(num, 10) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 10000) return (n / 1000).toFixed(0) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

/**
 * MiniProfilePopup - Mini Popover Card แสดงเมื่อ Hover ที่รูปโปรไฟล์ของ Post
 */
export default function MiniProfilePopup({
  author,
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onOpenModal,
}) {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const username = author?.username || '';
  const { data: profileData } = useUserProfileQuery(username, {
    enabled: isOpen && Boolean(username),
  });

  const profile = profileData?.profile;
  const isSelf =
    Boolean(currentUser?.username && username) &&
    currentUser.username.toLowerCase() === username.toLowerCase();

  const toggleFollowMutation = useToggleFollowMutation();
  const isFollowing = Boolean(profile?.isFollowing);

  const handleToggleFollow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }
    const targetId = profile?.id || author?.id;
    if (targetId) {
      toggleFollowMutation.mutate(targetId);
    }
  };

  if (!isOpen) return null;

  const displayName = profile?.name || author?.name || author?.username || 'User';
  const displayAvatar = profile?.avatar || author?.avatar;
  const displayBio = profile?.bio || author?.bio || '';
  const followersCount = profile?.stats?.followers ?? 0;
  const followingCount = profile?.stats?.following ?? 0;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 mt-2 z-50 w-72 rounded-2xl bg-white p-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 select-none text-left"
      role="tooltip"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Row: Avatar + Follow / Profile Button */}
      <div className="flex items-start justify-between gap-3">
        {/* Avatar */}
        <Link
          href={`/${username}`}
          className="relative h-12 w-12 rounded-full ring-2 ring-gray-100 bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
        >
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </Link>

        {/* Action Button: Follow / Following / You */}
        {isSelf ? (
          <Link
            href={`/${username}`}
            className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3.5 py-1.5 transition-colors"
          >
            Your Profile
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleToggleFollow}
            disabled={toggleFollowMutation.isPending}
            className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200'
                : 'bg-black text-white hover:bg-gray-800 shadow-2xs'
            }`}
          >
            {toggleFollowMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFollowing ? (
              <>
                <Check className="h-3 w-3" />
                <span>Following</span>
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 stroke-[2.5]" />
                <span>Follow</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Name and @username */}
      <div className="mt-2.5">
        <Link
          href={`/${username}`}
          className="flex items-center gap-1 group font-bold text-gray-900 text-sm hover:underline"
        >
          <span className="truncate">{displayName}</span>
          {profile?.isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
          )}
        </Link>
        <p className="text-xs text-gray-400">@{username}</p>
      </div>

      {/* Bio */}
      {displayBio && (
        <p className="mt-2 text-xs text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-line">
          {displayBio}
        </p>
      )}

      {/* Stats Row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 pt-2.5 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-900">
            {formatStatNumber(followingCount)}
          </span>
          <span className="text-gray-400">Following</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-900">
            {formatStatNumber(followersCount)}
          </span>
          <span className="text-gray-400">Followers</span>
        </div>
      </div>

      {/* Bottom link: View Full Profile / Details */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
        {onOpenModal ? (
          <button
            type="button"
            onClick={onOpenModal}
            className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer text-[11px]"
          >
            Open Modal
          </button>
        ) : (
          <span />
        )}
        <Link
          href={`/${username}`}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View Profile</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
