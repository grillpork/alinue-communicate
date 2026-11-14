"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Check,
  Plus,
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Share2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useUserProfileQuery, useToggleFollowMutation } from "@/services/user";
import { useMeQuery } from "@/services/auth";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

function formatStatNumber(num) {
  const n = typeof num === "number" ? num : parseInt(num, 10) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 10000) return (n / 1000).toFixed(0) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function renderBioText(text) {
  if (!text) return null;
  const regex = /(#[^\s]+|@[^\s]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1);
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(tag)}`}
          className="text-blue-500 font-medium hover:underline transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("@")) {
      const targetUsername = part.slice(1);
      return (
        <Link
          key={index}
          href={`/${targetUsername}`}
          className="text-blue-500 font-medium hover:underline transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * ProfileModal - Dialog Modal แสดงข้อมูลโปรไฟล์เต็มเมื่อ Toggle/Click ที่รูปโปรไฟล์ของ Post
 */
export default function ProfileModal({ isOpen, onClose, author }) {
  useBodyScrollLock(isOpen);
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const username = author?.username || "";
  const { data: profileData } = useUserProfileQuery(username, {
    enabled: isOpen && Boolean(username),
  });

  const profile = profileData?.profile;
  const isSelf =
    Boolean(currentUser?.username && username) &&
    currentUser.username.toLowerCase() === username.toLowerCase();

  const toggleFollowMutation = useToggleFollowMutation();
  const isFollowing = Boolean(profile?.isFollowing);

  const handleToggleFollow = () => {
    if (!currentUser) {
      router.push("/sign-in");
      return;
    }
    const targetId = profile?.id || author?.id;
    if (targetId) {
      toggleFollowMutation.mutate(targetId);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/${username}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ปิด Modal เมื่อกดปุ่ม Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const displayName =
    profile?.name || author?.name || author?.username || "User";
  const displayAvatar = profile?.avatar || author?.avatar;
  const displayBanner =
    profile?.banner || author?.banner || "/empty/no-image.png";
  const displayBio = profile?.bio || author?.bio || "";
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const isLongBio = useMemo(() => {
    const lines = displayBio.split("\n");
    return lines.length > 2 || displayBio.length > 120;
  }, [displayBio]);

  const truncatedBio = useMemo(() => {
    if (!isLongBio || isBioExpanded) {
      return displayBio;
    }
    const lines = displayBio.split("\n");
    const maxLines = 2;
    const maxChars = 110;

    let resultLines = [];
    let chars = 0;
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      const line = lines[i];
      if (chars + line.length > maxChars) {
        const remaining = maxChars - chars;
        resultLines.push(line.slice(0, Math.max(0, remaining)) + "...");
        break;
      }
      resultLines.push(line);
      chars += line.length + 1;
      if (
        i === maxLines - 1 &&
        (lines.length > maxLines || chars < displayBio.length)
      ) {
        if (!resultLines[i].endsWith("...")) {
          resultLines[i] = resultLines[i] + "...";
        }
      }
    }
    return resultLines.join("\n");
  }, [displayBio, isLongBio, isBioExpanded]);
  const displayNote = profile?.note || "";
  const location = profile?.location;
  const website = profile?.website;
  const joinedDate = profile?.joinedDate;
  const stats = profile?.stats || {
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Close Button */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden">
          {displayBanner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayBanner}
              alt="Banner"
              className="h-full w-full object-cover rounded-2xl"
              onError={(e) => {
                e.currentTarget.src = "/empty/no-image.png";
              }}
            />
          )}

          {/* Close Button (X) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm z-10"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 pt-0 pb-5">
          {/* Avatar, User Info & Action Buttons Row */}
          <div className="flex items-center justify-between ">
            {/* Left: Avatar + Name / Username */}
            <div className="flex items-center gap-3 mt-2 min-w-0">
              {/* Avatar with Note Bubble */}
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-100 overflow-hidden shadow-md flex items-center justify-center shrink-0">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>

              {/* User Name & @username วางอยู่ข้างขวาของ Avatar */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">
                    {displayName}
                  </h2>
                  {profile?.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-400 truncate">
                  @{username}
                </p>

                {/* Metadata Row: Location, Website, Joined */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                  {website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
                      <a
                        href={
                          website.startsWith("http")
                            ? website
                            : `https://${website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate max-w-[150px]"
                      >
                        {website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {joinedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-300" />
                      <span>
                        Joined{" "}
                        {new Date(joinedDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Actions: Follow / Share */}
            <div className="flex items-center gap-2 mb-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs cursor-pointer"
                title={copied ? "Copied link!" : "Share profile"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Bio */}
          {displayBio && (
            <div className="mt-3 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
              {renderBioText(truncatedBio)}
              {isLongBio && (
                <button
                  type="button"
                  onClick={() => setIsBioExpanded((prev) => !prev)}
                  className="mt-1 block text-xs sm:text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  {isBioExpanded ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
                </button>
              )}
            </div>
          )}

          {/* Stats Grid: Posts, Followers, Following, Likes */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100 bg-gray-50/60 rounded-2xl py-2.5">
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                {formatStatNumber(stats.posts || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-normal mt-1">
                Posts
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                {formatStatNumber(stats.followers || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-normal mt-1">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                {formatStatNumber(stats.following || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-normal mt-1">
                Following
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                {formatStatNumber(stats.likes || 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-normal mt-1">
                Likes
              </span>
            </div>
          </div>

          {/* Bottom Actions: View Full Profile & Follow */}
          <div className="mt-4 flex items-center gap-2.5">
            {/* View Full Profile (Secondary Button: เด่นน้อยกว่า สไตล์ Clean Outline/Soft Gray) */}
            <Link
              href={`/${username}`}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 py-3 text-xs sm:text-[13px] font-semibold transition-all active:scale-[0.98] border border-gray-200/50 cursor-pointer shadow-2xs"
            >
              <span>View Full Profile</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
            </Link>

            {/* Follow / Edit Profile Button (Primary Button: สีดำเด่นชัด) */}
            {isSelf ? (
              <Link
                href={`/${username}`}
                onClick={onClose}
                className="flex-1 flex items-center justify-center rounded-2xl bg-black hover:bg-neutral-800 text-white py-3 text-xs sm:text-[13px] font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={toggleFollowMutation.isPending}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl py-3 text-xs sm:text-[13px] font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm ${
                  isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {toggleFollowMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
