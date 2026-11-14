"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  BadgeCheck,
  MoreHorizontal,
  Calendar,
  Link as LinkIcon,
  MapPin,
  Share2,
  Settings,
  X,
  Check,
  Camera,
  Plus,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import NoteFormModal from "./NoteFormModal";
import SocialLinksModal, { getPlatformInfo, formatPlatformUrl } from "./SocialLinksModal";
import Image from "next/image";
import UserAvatar from "@/components/common/UserAvatar";
import { useUpdateProfileMutation } from "@/services/user";

/**
 * ฟอร์แมตตัวเลขสถิติ (เช่น 30k, 4.2 k, 1.1m, 200k) ตาม UI ตัวอย่าง
 */
function formatStatNumber(num) {
  const n = typeof num === "number" ? num : parseInt(num, 10) || 0;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }
  if (n >= 10000) {
    return (n / 1000).toFixed(0) + "k";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + " k";
  }
  return String(n);
}

/**
 * ฟังก์ชันแปลงข้อความใน Bio ให้ #tags และ @mentions กลายเป็นลิงก์คลิกได้
 */
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
      const username = part.slice(1);
      return (
        <Link
          key={index}
          href={`/${username}`}
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

export default function ProfileHeader({ user, isSelf = true, onUpdateNote }) {
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [noteText, setNoteText] = useState(user?.note || "");
  const [copied, setCopied] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [bannerSrc, setBannerSrc] = useState(user?.banner || "/empty/no-image.png");

  const updateProfileMutation = useUpdateProfileMutation();

  const effectiveSocialLinks = useMemo(() => {
    const links = { ...(user?.socialLinks || {}) };
    if (!links.facebook && user?.facebook) links.facebook = user.facebook;
    if (!links.instagram && user?.instagram) links.instagram = user.instagram;
    if (!links.website && user?.website) links.website = user.website;
    return links;
  }, [user?.socialLinks, user?.facebook, user?.instagram, user?.website]);

  const [socialLinks, setSocialLinks] = useState(effectiveSocialLinks);

  useEffect(() => {
    setSocialLinks(effectiveSocialLinks);
  }, [effectiveSocialLinks]);

  const handleSaveSocialLinks = async (newLinks) => {
    setSocialLinks(newLinks);
    await updateProfileMutation.mutateAsync({ socialLinks: newLinks });
    setIsLinksModalOpen(false);
  };

  useEffect(() => {
    setBannerSrc(user?.banner || "/empty/no-image.png");
  }, [user?.banner]);

  const bioText = user?.bio || "";
  const isLongBio = useMemo(() => {
    const lines = bioText.split("\n");
    return lines.length > 2 || bioText.length > 120;
  }, [bioText]);

  const displayBio = useMemo(() => {
    if (!isLongBio || isBioExpanded) {
      return bioText;
    }
    const lines = bioText.split("\n");
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
      if (i === maxLines - 1 && (lines.length > maxLines || chars < bioText.length)) {
        if (!resultLines[i].endsWith("...")) {
          resultLines[i] = resultLines[i] + "...";
        }
      }
    }
    return resultLines.join("\n");
  }, [bioText, isLongBio, isBioExpanded]);

  useEffect(() => {
    if (user?.note !== undefined) {
      setNoteText(user.note || "");
    }
  }, [user?.note]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMoreMenu(false);
    }
  };

  const handleSaveNote = async (newNote) => {
    setNoteText(newNote);
    if (onUpdateNote) {
      await onUpdateNote(newNote);
    }
  };

  return (
    <div className="w-full">
      {/* 1. Profile Banner / Cover Artwork (ชิดขอบเว็บบนและข้างเต็มหน้าจอ) */}
      <div className="relative h-52 sm:h-64 md:h-72 w-full overflow-hidden bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-500 shadow-inner group">
        {/* Top-Left: Chevron Left (Back Button) + Username */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
            aria-label="Go Back"
            title="Back"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
          </button>
          <span className="text-sm sm:text-base font-bold text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.7)] tracking-tight select-none truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
            {user?.username ? `@${user.username}` : ""}
          </span>
        </div>

        <Image
          width={1200}
          height={500}
          src={bannerSrc}
          alt="Profile cover banner"
          className="h-full w-full object-cover object-center"
          unoptimized={bannerSrc?.endsWith('.gif') || bannerSrc?.includes('.gif')}
          priority
          onError={() => setBannerSrc("/empty/no-image.png")}
        />

        {/* Change Banner Button (แสดงตลอดเวลาใน mobile และแสดงเมื่อ hover ใน desktop) */}
        {isSelf && (
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/50 hover:bg-black/70 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-95 cursor-pointer shadow-sm"
            aria-label="Edit cover banner"
            title="Edit Cover"
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Edit Cover</span>
          </button>
        )}
      </div>

      {/* 2. Glassmorphism Profile Header Card (ซ้อนทับ Banner ตามตัวอย่าง) */}
      <div className="relative -mt-12 sm:-mt-16 z-10 mx-auto w-full rounded-[2.5rem] sm:rounded-[3rem] bg-white/80 backdrop-blur-xl border-t border-white p-4 sm:p-6">
        {/* Top Row: Avatar + Info + Action Button */}
        <div className="flex items-start justify-between gap-4">
          {/* Left Side: Avatar + User Details */}
          <div className="flex items-start gap-4 sm:gap-6 min-w-0 flex-1">
            {/* Avatar Container with Thought Bubble & Edit Button */}
            <div className="relative shrink-0">
              {/* Thought Bubble / Status Note (วาง absolute กับรูปโปรไฟล์) */}
              <div className="absolute -top-3.5 sm:-top-4 left-10 sm:left-14 z-20">
                <button
                  type="button"
                  onClick={() => isSelf && setIsNoteModalOpen(true)}
                  disabled={!isSelf}
                  className={`group relative flex items-center bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md border border-gray-100/90 hover:shadow-lg hover:scale-102 active:scale-98 transition-all text-left whitespace-nowrap ${
                    isSelf ? "cursor-pointer" : "cursor-default"
                  }`}
                  title={isSelf ? "คลิกเพื่อแก้ไขโน้ต" : ""}
                >
                  <span className="text-[11px] sm:text-xs font-normal text-gray-700 max-w-[150px] sm:max-w-[200px] truncate">
                    {noteText || user?.note || (isSelf ? "+ แชร์โน้ต" : "Tell there what you think.")}
                  </span>

                  {/* Speech bubble tail dots pointing down to the avatar */}
                  <span className="absolute -bottom-1.5 left-2 h-2.5 w-2.5 rounded-full bg-white shadow-xs border border-gray-100" />
                  <span className="absolute -bottom-3 left-0.5 h-1.5 w-1.5 rounded-full bg-white shadow-xs border border-gray-100" />
                </button>
              </div>

              {/* Avatar Circle */}
              <UserAvatar
                src={user?.avatar}
                alt={user?.name || user?.username}
                size="3xl"
                className="ring-2 ring-white shadow-lg"
              />

              {/* Edit Avatar Button (ไอคอนดินสอด้านขวาล่างของรูป) */}
              {isSelf && (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="absolute bottom-0 right-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white shadow-md border border-gray-200/90 flex items-center justify-center text-gray-700 hover:scale-110 hover:bg-gray-50 transition-all cursor-pointer"
                  title="Edit Profile"
                >
                  <Pencil className="h-3.5 w-3.5 text-gray-700" />
                </button>
              )}
            </div>

            {/* User Title, Username & Socials */}
            <div className="pt-2 sm:pt-4 min-w-0 flex-1">
              {/* Display Name + Verified Badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                  {user?.name || user?.username}
                </h1>

                {/* Blue Verified Badge */}
                {user?.isVerified && (
                  <BadgeCheck
                    className="h-5 w-5 text-white fill-[#1D9BF0] shrink-0 drop-shadow-xs"
                    aria-label="Verified Designer"
                  />
                )}
              </div>

              {/* Username Handle */}
              <p className="text-xs sm:text-sm text-gray-400 font-normal mt-0.5">
                @{user?.username}
              </p>

              {/* Social Media Links Row: Overlapping Dashed Circles */}
              <div className="mt-3 flex items-center -space-x-2.5">
                {/* Dynamic Social Links */}
                {Object.entries(socialLinks || {})
                  .filter(([_, val]) => Boolean(val))
                  .map(([platform, val], idx) => {
                    const info = getPlatformInfo(platform);
                    const href = formatPlatformUrl(platform, val);
                    return (
                      <a
                        key={platform}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        style={{ zIndex: idx }}
                        className="relative flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white text-gray-700 shadow-2xs transition-all hover:z-30 hover:scale-110 hover:border-gray-500"
                        aria-label={info.name}
                        title={info.name}
                      >
                        <div className="flex items-center justify-center h-4 w-4">
                          {info.icon}
                        </div>
                      </a>
                    );
                  })}

                {/* Add Link Button (+) */}
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsLinksModalOpen(true)}
                    style={{ zIndex: Object.keys(socialLinks || {}).length }}
                    className="relative flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white text-black shadow-2xs transition-all hover:z-30 hover:scale-110 hover:border-gray-500 cursor-pointer"
                    title="Add or edit links"
                    aria-label="Add links"
                  >
                    <Plus className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.8]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Three Dots Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Three Dots Action Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="h-10 w-10 rounded-full bg-white/90 border border-gray-200/80 shadow-xs flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </button>

              {/* Popup Menu */}
              {showMoreMenu && (
                <div className="absolute right-0 top-12 w-48 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {isSelf && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span>Edit Profile</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4 text-gray-400" />
                    <span>{copied ? "Copied Link!" : "Share Profile"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Description (ถ้ามี พร้อมปุ่มดูเพิ่มเติมเมื่อข้อความยาว) */}
        {user?.bio && (
          <div className="mt-4 text-xs sm:text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-wrap break-words">
            {renderBioText(displayBio)}
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

        {/* Meta Details: Location, Website, Joined Date */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          {user?.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span>{user.location}</span>
            </div>
          )}

          {user?.website && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
              <a
                href={
                  user.website.startsWith("http")
                    ? user.website
                    : `https://${user.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}

          {user?.joinedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>
                Joined{" "}
                {new Date(user.joinedDate).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Stats Row: 4 Columns with Vertical Divider (Follower / Following / Viewing / Likes) */}
        {user?.stats && (
          <div className="mt-5 pt-4 border-t border-gray-100/90 grid grid-cols-4 divide-x divide-gray-100">
            {/* 1. Follower */}
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-base sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                {formatStatNumber(user.stats.followers || 0)}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-400 font-normal mt-1.5">
                Follower
              </span>
            </div>

            {/* 2. Following */}
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-base sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                {formatStatNumber(user.stats.following || 0)}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-400 font-normal mt-1.5">
                Following
              </span>
            </div>

            {/* 3. Viewing */}
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-base sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                {formatStatNumber(user.stats.viewing || 0)}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-400 font-normal mt-1.5">
                Viewing
              </span>
            </div>

            {/* 4. Likes */}
            <div className="flex flex-col items-center justify-center px-1 text-center">
              <span className="text-base sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                {formatStatNumber(user.stats.likes || 0)}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-400 font-normal mt-1.5">
                Likes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
      />

      {/* Note Form Modal (Instagram / Threads Note style) */}
      <NoteFormModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        initialNote={user?.note || ""}
        user={user}
        onSave={handleSaveNote}
      />

      {/* Social Links Modal */}
      <SocialLinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        initialLinks={socialLinks}
        onSave={handleSaveSocialLinks}
        isSaving={updateProfileMutation.isPending}
      />
    </div>
  );
}
