"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  User,
  Bell,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  HelpCircle,
  MessageSquare,
  Languages,
  LogOut,
  Sparkles,
  Camera,
  Loader2,
  Globe,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  GalleryHorizontalEnd,
  X,
} from "lucide-react";
import { useMeQuery, useSignOutMutation } from "@/features/auth";
import { useUpdateProfileMutation } from "@/features/user";
import { uploadToR2 } from "@/lib/upload";
import { usePostDisplayMode } from "@/hooks/usePostDisplayMode";

/**
 * Reusable Green iOS-style Toggle Switch (ตรงตามภาพตัวอย่าง)
 */
function GreenToggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-[#34C759]" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/**
 * Reusable Settings Row Item
 */
function SettingRow({
  icon: Icon,
  label,
  value,
  onClick,
  rightElement,
  danger = false,
}) {
  const isInteractive = Boolean(onClick);
  const Wrapper = isInteractive ? "button" : "div";

  return (
    <Wrapper
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
        isInteractive
          ? "hover:bg-gray-50/90 active:bg-gray-100/70 cursor-pointer"
          : ""
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <Icon
          className={`h-[19px] w-[19px] shrink-0 stroke-[1.7] ${
            danger ? "text-rose-500" : "text-gray-500"
          }`}
        />
        <span
          className={`text-[14px] font-medium truncate ${
            danger ? "text-rose-600" : "text-gray-800"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-xs font-medium text-gray-400">{value}</span>
        )}
        {rightElement !== undefined ? (
          rightElement
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400/90 stroke-[1.8]" />
        )}
      </div>
    </Wrapper>
  );
}

const VIEW_TITLES = {
  menu: "Settings",
  profile: "Profile & Account",
  notifications: "Notifications",
  appearance: "Preferences",
  security: "Security & Session",
  privacy: "Privacy Policy",
  help: "Help & Support",
};

export default function SettingsPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("menu"); // "menu" | "profile" | "notifications" | "appearance" | "security" | "privacy" | "help"
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Post Display Mode (ซิงค์ Real-time กับ Feed และ UserDropdown)
  const [postDisplayMode, setPostDisplayMode] = usePostDisplayMode();

  // Auth & User Data
  const { data: meData, isLoading: isAuthLoading } = useMeQuery();
  const currentUser = meData?.user;

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Status Alerts
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Notification Preferences (persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    showcases: true,
  });

  // Appearance Preferences
  const [language, setLanguage] = useState("th");

  // Mutations
  const updateProfileMutation = useUpdateProfileMutation();
  const signOutMutation = useSignOutMutation({
    onSuccess: () => {
      router.push("/sign-in");
    },
  });

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setWebsite(currentUser.website || "");
      setLocation(currentUser.location || "");
      setAvatarUrl(currentUser.avatarUrl || currentUser.avatar || "");
      setBannerUrl(currentUser.banner || "");
    }
  }, [currentUser]);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem("alinue_notif_prefs");
      if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs));

      const savedApp = localStorage.getItem("alinue_appearance_prefs");
      if (savedApp) {
        const parsed = JSON.parse(savedApp);
        if (parsed.language) setLanguage(parsed.language);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const showToast = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Handle Avatar Upload to Cloudflare R2
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setErrorMessage("");
      const res = await uploadToR2(file, { folder: "avatars" });
      setAvatarUrl(res.publicUrl);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setErrorMessage("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: " + (err.message || ""));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Banner Upload to Cloudflare R2
  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      setErrorMessage("");
      const res = await uploadToR2(file, { folder: "banners" });
      setBannerUrl(res.publicUrl);
    } catch (err) {
      console.error("Banner upload error:", err);
      setErrorMessage("อัปโหลดรูปหน้าปกไม่สำเร็จ: " + (err.message || ""));
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/^@/, ""),
        bio: bio.trim(),
        website: website.trim(),
        location: location.trim(),
        avatarUrl,
        banner: bannerUrl,
      });

      showToast("บันทึกการตั้งค่าโปรไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      console.error("Update profile error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // Toggle Notification Preference
  const handleToggleNotif = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("alinue_notif_prefs", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Change Language
  const handleLanguageChange = (nextLang) => {
    setLanguage(nextLang);
    try {
      const savedApp = localStorage.getItem("alinue_appearance_prefs");
      const parsed = savedApp ? JSON.parse(savedApp) : {};
      localStorage.setItem(
        "alinue_appearance_prefs",
        JSON.stringify({ ...parsed, language: nextLang }),
      );
    } catch {}
    showToast(
      nextLang === "th"
        ? "เปลี่ยนภาษาเป็น ภาษาไทย แล้ว"
        : "Language changed to English",
    );
  };

  const handleBack = () => {
    setSuccessMessage("");
    setErrorMessage("");
    if (activeView !== "menu") {
      setActiveView("menu");
    } else {
      router.back();
    }
  };

  // Loading auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-7 w-7 animate-spin text-gray-500 mb-2" />
        <p className="text-xs">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-[28px] bg-white p-8 text-center shadow-xs border border-gray-200/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-400 mb-4">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Sign in to access settings
          </h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลบัญชี โปรไฟล์ และการตั้งค่าระบบของคุณ
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-black px-6 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-gray-800 transition-all active:scale-95"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const query = searchTerm.trim().toLowerCase();
  const matchesSearch = (...keywords) =>
    !query || keywords.some((k) => k.toLowerCase().includes(query));

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="w-full max-w-xl mx-auto px-4 pt-5">
        {/* ================= TOP BAR (← | Title | Search) ================= */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-800 transition-all active:scale-95 cursor-pointer"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>

          <h1 className="text-[16px] font-semibold text-gray-900 tracking-tight">
            {VIEW_TITLES[activeView] || "Settings"}
          </h1>

          {activeView === "menu" ? (
            <button
              type="button"
              onClick={() => {
                setShowSearch((prev) => !prev);
                if (showSearch) setSearchTerm("");
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer ${
                showSearch
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200/80 text-gray-800"
              }`}
              aria-label="ค้นหาการตั้งค่า"
            >
              {showSearch ? (
                <X className="h-[18px] w-[18px]" />
              ) : (
                <Search className="h-[18px] w-[18px]" />
              )}
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Inline Quick Search Input */}
        {activeView === "menu" && showSearch && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาการตั้งค่า เช่น โปรไฟล์, ตาราง, แจ้งเตือน, ภาษา..."
                className="w-full rounded-2xl bg-white border border-gray-200/80 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none shadow-2xs"
              />
            </div>
          </div>
        )}

        {/* Status Toast Alerts */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 text-xs text-emerald-800 animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 px-4 py-3 text-xs text-rose-800 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ================================================================
            VIEW 0: MAIN SETTINGS HUB (สไตล์ Card Group ตามภาพตัวอย่าง)
        ================================================================ */}
        {activeView === "menu" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1. Profile Summary Card */}
            {matchesSearch("profile", "โปรไฟล์", "บัญชี", displayName) && (
              <button
                type="button"
                onClick={() => setActiveView("profile")}
                className="flex w-full items-center justify-between gap-3 rounded-[22px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 hover:bg-gray-50/60 active:scale-[0.995] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100 overflow-hidden ring-2 ring-gray-100 flex items-center justify-center">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName || "Avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">
                      {displayName || currentUser.username || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {currentUser.email || `@${currentUser.username}`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              </button>
            )}

            {/* 2. Dark Accent Card (Alinue Creator Portfolio Banner) */}
            {!query && currentUser.username && (
              <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1C1C1F] via-[#26262B] to-[#17171A] px-4 py-4 text-white shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
                      <Sparkles className="h-5 w-5 text-blue-400 fill-blue-400/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-white tracking-tight">
                        Alinue Creator Space
                      </p>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                        จัดการพอร์ตโฟลิโอ โชว์เคสผลงาน และเปิดรับคอมมิชชันบนโปรไฟล์สาธารณะของคุณ
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/${currentUser.username}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-[11px] font-medium text-white transition-all active:scale-95"
                  >
                    <span>โปรไฟล์</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* 3. Group Card 1: Account, Notifications, Security & Grid Mode Quick Toggle */}
            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 divide-y divide-gray-100 overflow-hidden">
              {matchesSearch("settings", "profile", "โปรไฟล์", "บัญชี") && (
                <SettingRow
                  icon={User}
                  label="Profile & Account"
                  onClick={() => setActiveView("profile")}
                />
              )}
              {matchesSearch("notifications", "แจ้งเตือน") && (
                <SettingRow
                  icon={Bell}
                  label="Notifications"
                  onClick={() => setActiveView("notifications")}
                />
              )}
              {matchesSearch("security", "session", "ความปลอดภัย", "รหัส") && (
                <SettingRow
                  icon={Shield}
                  label="Security & Session"
                  onClick={() => setActiveView("security")}
                />
              )}
              {matchesSearch("grid", "carousel", "ตาราง", "สไลด์", "โพสต์", "display") && (
                <SettingRow
                  icon={LayoutGrid}
                  label="แสดงรูปโพสต์แบบตาราง (Grid)"
                  rightElement={
                    <GreenToggle
                      checked={postDisplayMode === "grid"}
                      onChange={() =>
                        setPostDisplayMode(
                          postDisplayMode === "grid" ? "carousel" : "grid",
                        )
                      }
                      ariaLabel="สลับการแสดงผลโพสต์แบบตาราง"
                    />
                  }
                />
              )}
            </div>

            {/* 4. Group Card 2: Preferences, Privacy, Help */}
            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 divide-y divide-gray-100 overflow-hidden">
              {matchesSearch("preferences", "appearance", "ปรับแต่ง", "แสดงผล") && (
                <SettingRow
                  icon={SlidersHorizontal}
                  label="Preferences"
                  value={postDisplayMode === "grid" ? "ตาราง" : "สไลด์"}
                  onClick={() => setActiveView("appearance")}
                />
              )}
              {matchesSearch("privacy", "policy", "ความเป็นส่วนตัว") && (
                <SettingRow
                  icon={ShieldCheck}
                  label="Privacy Policy"
                  onClick={() => setActiveView("privacy")}
                />
              )}
              {matchesSearch("help", "support", "ช่วยเหลือ") && (
                <SettingRow
                  icon={HelpCircle}
                  label="Help & Support"
                  onClick={() => setActiveView("help")}
                />
              )}
            </div>

            {/* 5. Group Card 3: Feedback, Language, Sign Out */}
            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 divide-y divide-gray-100 overflow-hidden">
              {matchesSearch("feedback", "ข้อเสนอแนะ") && (
                <SettingRow
                  icon={MessageSquare}
                  label="Feedback"
                  onClick={() =>
                    showToast("ขอบคุณสำหรับความสนใจ สามารถส่งข้อเสนอแนะได้ที่ support@alinue.com")
                  }
                />
              )}
              {matchesSearch("language", "ภาษา", "thai", "english") && (
                <SettingRow
                  icon={Languages}
                  label="Language"
                  value={language === "th" ? "ภาษาไทย" : "English"}
                  onClick={() => setActiveView("appearance")}
                />
              )}
              {matchesSearch("sign out", "logout", "ออกจากระบบ") && (
                <SettingRow
                  icon={LogOut}
                  label={signOutMutation.isPending ? "กำลังออกจากระบบ..." : "Sign Out"}
                  danger
                  rightElement={
                    signOutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-rose-300" />
                    )
                  }
                  onClick={() => {
                    if (!signOutMutation.isPending) signOutMutation.mutate();
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 1: PROFILE & ACCOUNT FORM
        ================================================================ */}
        {activeView === "profile" && (
          <form
            onSubmit={handleSaveProfile}
            className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-150"
          >
            <div className="rounded-[24px] bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80">
              {/* Banner Area */}
              <div className="relative h-32 sm:h-36 w-full bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl || "/empty/no-image.png"}
                  alt="Banner preview"
                  onError={(e) => {
                    e.currentTarget.src = "/empty/no-image.png";
                  }}
                  className="h-full w-full object-cover"
                />

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <button
                  type="button"
                  disabled={isUploadingBanner}
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-white transition-all cursor-pointer"
                >
                  {isUploadingBanner ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                  <span>{bannerUrl ? "เปลี่ยนหน้าปก" : "เพิ่มหน้าปก"}</span>
                </button>
              </div>

              {/* Avatar + Fields */}
              <div className="px-5 pb-5">
                <div className="flex items-end justify-between -mt-11 mb-5">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full ring-4 ring-white bg-gray-100 overflow-hidden shadow-sm flex items-center justify-center">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName || "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-9 w-9 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="เปลี่ยนรูปโปรไฟล์"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <span className="text-[11px] text-gray-400">
                    JPG, PNG หรือ WebP
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      ชื่อที่แสดง (Display Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="เช่น Katsumoto Hana"
                      className="w-full rounded-2xl bg-[#F6F6F8] border border-transparent focus:bg-white focus:border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      ชื่อผู้ใช้ (Username) *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 text-sm font-medium">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-2xl bg-[#F6F6F8] border border-transparent focus:bg-white focus:border-gray-300 pl-8 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        ประวัติโดยย่อ (Bio)
                      </label>
                      <span className="text-[11px] text-gray-400">
                        {bio.length}/160
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={160}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="แนะนำตัวเองสั้นๆ เกี่ยวกับผลงาน สไตล์ หรือคอมมิชชันของคุณ..."
                      className="w-full rounded-2xl bg-[#F6F6F8] border border-transparent focus:bg-white focus:border-gray-300 p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Website & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        เว็บไซต์ / Portfolio
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-2xl bg-[#F6F6F8] border border-transparent focus:bg-white focus:border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        สถานที่ (Location)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="เช่น Bangkok, Thailand"
                          className="w-full rounded-2xl bg-[#F6F6F8] border border-transparent focus:bg-white focus:border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      อีเมลที่ผูกกับบัญชี
                    </label>
                    <div className="flex items-center justify-between rounded-2xl bg-[#F6F6F8] px-3.5 py-2.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {currentUser.email || "ไม่มีข้อมูลอีเมล"}
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[10px] font-semibold shrink-0">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-[0.99] cursor-pointer shadow-xs"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกการเปลี่ยนแปลง</span>
              )}
            </button>
          </form>
        )}

        {/* ================================================================
            VIEW 2: NOTIFICATIONS
        ================================================================ */}
        {activeView === "notifications" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 divide-y divide-gray-100 overflow-hidden">
              {[
                {
                  key: "likes",
                  title: "การกดถูกใจ (Likes)",
                  desc: "แจ้งเตือนเมื่อมีคนมากดถูกใจโพสต์หรือผลงานของคุณ",
                },
                {
                  key: "comments",
                  title: "ความคิดเห็น (Comments)",
                  desc: "แจ้งเตือนเมื่อมีคนแสดงความคิดเห็นในโพสต์ของคุณ",
                },
                {
                  key: "follows",
                  title: "ผู้ติดตามใหม่ (New Followers)",
                  desc: "แจ้งเตือนเมื่อมีครีเอเตอร์เริ่มติดตามโปรไฟล์ของคุณ",
                },
                {
                  key: "mentions",
                  title: "การแท็กและพูดถึง (Mentions)",
                  desc: `แจ้งเตือนเมื่อมีคนพูดถึง @${currentUser.username || "คุณ"}`,
                },
                {
                  key: "showcases",
                  title: "Showcase & Portfolio",
                  desc: "แจ้งเตือนเมื่อมีคนสนใจผลงานที่คุณแนบในคอมเมนต์",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  <GreenToggle
                    checked={Boolean(notifPrefs[item.key])}
                    onChange={() => handleToggleNotif(item.key)}
                    ariaLabel={item.title}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 3: PREFERENCES (POST DISPLAY + LANGUAGE)
        ================================================================ */}
        {activeView === "appearance" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-150">
            {/* Post Display Mode Card */}
            <div className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80">
              <p className="text-xs font-semibold text-gray-500 mb-3 px-0.5">
                รูปแบบการแสดงผลรูปภาพในโพสต์ (Post Display)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPostDisplayMode("carousel")}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    postDisplayMode === "carousel"
                      ? "border-black bg-gray-50/90 shadow-2xs"
                      : "border-gray-100 hover:border-gray-200 bg-[#FAFAFB]"
                  }`}
                >
                  <GalleryHorizontalEnd className="h-5 w-5 text-gray-800" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      สไลด์ (Threads)
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ลากเลื่อนแนวนอนอิสระ
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPostDisplayMode("grid")}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    postDisplayMode === "grid"
                      ? "border-black bg-gray-50/90 shadow-2xs"
                      : "border-gray-100 hover:border-gray-200 bg-[#FAFAFB]"
                  }`}
                >
                  <LayoutGrid className="h-5 w-5 text-gray-800" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      ตาราง (Auto Grid)
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      จัดตารางอัตโนมัติตามสัดส่วนภาพ
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Language Card */}
            <div className="rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80">
              <p className="text-xs font-semibold text-gray-500 mb-3 px-0.5">
                ภาษาที่แสดงผล (Language)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("th")}
                  className={`rounded-2xl py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    language === "th"
                      ? "bg-black text-white shadow-2xs"
                      : "bg-[#F6F6F8] text-gray-700 hover:bg-gray-200/70"
                  }`}
                >
                  ภาษาไทย (TH)
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`rounded-2xl py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-black text-white shadow-2xs"
                      : "bg-[#F6F6F8] text-gray-700 hover:bg-gray-200/70"
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 4: SECURITY & SESSION
        ================================================================ */}
        {activeView === "security" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-150">
            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 divide-y divide-gray-100 overflow-hidden text-sm">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-gray-500 text-xs">รหัสผู้ใช้งาน (User ID)</span>
                <span className="font-mono text-xs font-semibold text-gray-900">
                  #{currentUser.id}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-gray-500 text-xs">อีเมลลงทะเบียน</span>
                <span className="text-xs font-medium text-gray-900">
                  {currentUser.email || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-gray-500 text-xs">สถานะเซสชัน</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Now
                </span>
              </div>
            </div>

            <div className="rounded-[22px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 overflow-hidden">
              <SettingRow
                icon={LogOut}
                label={signOutMutation.isPending ? "กำลังออกจากระบบ..." : "ออกจากระบบ (Sign Out)"}
                danger
                rightElement={
                  signOutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-rose-300" />
                  )
                }
                onClick={() => {
                  if (!signOutMutation.isPending) signOutMutation.mutate();
                }}
              />
            </div>
          </div>
        )}

        {/* ================================================================
            VIEW 5: PRIVACY POLICY & HELP
        ================================================================ */}
        {activeView === "privacy" && (
          <div className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed animate-in fade-in slide-in-from-right-2 duration-150">
            <h3 className="text-sm font-bold text-gray-900">
              นโยบายความเป็นส่วนตัวของ Alinue
            </h3>
            <p>
              ข้อมูลโปรไฟล์ อีเมล และผลงานที่คุณอัปโหลดจะถูกเก็บรักษาอย่างปลอดภัยและใช้เพื่อการแสดงผลบนแพลตฟอร์ม Alinue เท่านั้น
            </p>
            <p>
              คุณสามารถแก้ไขข้อมูลส่วนตัว ลบโพสต์ หรือจัดการการแจ้งเตือนได้ตลอดเวลาผ่านหน้า Settings
            </p>
          </div>
        )}

        {activeView === "help" && (
          <div className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-gray-200/80 space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed animate-in fade-in slide-in-from-right-2 duration-150">
            <h3 className="text-sm font-bold text-gray-900">
              ศูนย์ช่วยเหลือ (Help & Support)
            </h3>
            <p>
              พบปัญหาการใช้งาน การอัปโหลดผลงาน หรือคำถามเกี่ยวกับบัญชีของคุณ สามารถติดต่อทีมงานได้ตลอดเวลา
            </p>
            <div className="rounded-2xl bg-[#F6F6F8] p-3.5 text-xs text-gray-700 font-medium">
              Email: support@alinue.com
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
