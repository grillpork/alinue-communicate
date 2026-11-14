'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Bell,
  Palette,
  Shield,
  Camera,
  Check,
  Loader2,
  ExternalLink,
  LogOut,
  Sparkles,
  Globe,
  MapPin,
  AtSign,
  Mail,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { useMeQuery, useSignOutMutation } from '@/services/auth';
import { useUpdateProfileMutation } from '@/services/user';
import { uploadToR2 } from '@/lib/upload';

const TABS = [
  { id: 'profile', label: 'Profile & Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security & Session', icon: Shield },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  // Auth & User Data
  const { data: meData, isLoading: isAuthLoading } = useMeQuery();
  const currentUser = meData?.user;

  // Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Status Alerts
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Notification Preferences (persisted in localStorage)
  const [notifPrefs, setNotifPrefs] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    showcases: true,
    emailDigest: false,
  });

  // Appearance Preferences
  const [appearancePrefs, setAppearancePrefs] = useState({
    feedMediaPreview: 'large', // 'large' | 'compact'
    fontSize: 'normal', // 'normal' | 'large'
    contentFilter: true,
    language: 'th',
  });

  // Mutations
  const updateProfileMutation = useUpdateProfileMutation();
  const signOutMutation = useSignOutMutation({
    onSuccess: () => {
      router.push('/sign-in');
    },
  });

  // Load user data into form
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.name || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setWebsite(currentUser.website || '');
      setLocation(currentUser.location || '');
      setAvatarUrl(currentUser.avatarUrl || currentUser.avatar || '');
      setBannerUrl(currentUser.banner || '');
    }
  }, [currentUser]);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedNotifs = localStorage.getItem('alinue_notif_prefs');
      if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs));

      const savedApp = localStorage.getItem('alinue_appearance_prefs');
      if (savedApp) setAppearancePrefs(JSON.parse(savedApp));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Handle Avatar Upload to Cloudflare R2
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      setErrorMessage('');
      const res = await uploadToR2(file, { folder: 'avatars' });
      setAvatarUrl(res.publicUrl);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage('อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ' + (err.message || ''));
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
      setErrorMessage('');
      const res = await uploadToR2(file, { folder: 'banners' });
      setBannerUrl(res.publicUrl);
    } catch (err) {
      console.error('Banner upload error:', err);
      setErrorMessage('อัปโหลดรูปหน้าปกไม่สำเร็จ: ' + (err.message || ''));
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/^@/, ''),
        bio: bio.trim(),
        website: website.trim(),
        location: location.trim(),
        avatarUrl,
        banner: bannerUrl,
      });

      setSuccessMessage('บันทึกการตั้งค่าโปรไฟล์เรียบร้อยแล้ว');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Toggle Notification Preference
  const handleToggleNotif = (key) => {
    setNotifPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('alinue_notif_prefs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSuccessMessage('อัปเดตการตั้งค่าการแจ้งเตือนแล้ว');
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  // Toggle Appearance Preference
  const handleAppearanceChange = (key, value) => {
    setAppearancePrefs((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('alinue_appearance_prefs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // If loading auth state
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-7 w-7 animate-spin text-gray-500 mb-2" />
        <p className="text-xs">กำลังโหลดการตั้งค่า...</p>
      </div>
    );
  }

  // If not logged in
  if (!currentUser) {
    return (
      <div className="w-full max-w-2xl xl:max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-400 mb-4 ring-1 ring-gray-100 shadow-2xs">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Sign in to access settings
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลบัญชี โปรไฟล์ และการตั้งค่าระบบของคุณ
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all active:scale-95 cursor-pointer"
        >
          <span>เข้าสู่ระบบ</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl xl:max-w-3xl mx-auto px-3.5 sm:px-4 pt-4 pb-20">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            จัดการข้อมูลโปรไฟล์ การแจ้งเตือน และการตั้งค่าบัญชีของคุณ
          </p>
        </div>

        {currentUser.username && (
          <Link
            href={`/${currentUser.username}`}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
          >
            <span>ดูโปรไฟล์สาธารณะ</span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 [scrollbar-width:none]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-50/80 hover:bg-gray-100 text-gray-600 hover:text-black border border-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Notifications */}
      {successMessage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-800 shadow-2xs animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* ---------------- Tab 1: Profile & Account ---------------- */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Banner & Avatar Customization Card */}
          <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-2xs">
            {/* Banner Area */}
            <div className="relative h-32 sm:h-40 w-full bg-gray-100 overflow-hidden">
              <img
                src={bannerUrl || '/empty/no-image.png'}
                alt="Banner preview"
                onError={(e) => {
                  e.currentTarget.src = '/empty/no-image.png';
                }}
                className="h-full w-full object-cover"
              />

              {/* Change Banner Button */}
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
                className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all cursor-pointer"
              >
                {isUploadingBanner ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <span>{bannerUrl ? 'เปลี่ยนหน้าปก' : 'เพิ่มหน้าปก'}</span>
              </button>
            </div>

            {/* Avatar Row */}
            <div className="px-5 sm:px-6 pb-6 pt-0">
              <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-4">
                <div className="relative group">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white bg-gray-100 overflow-hidden shadow-md flex items-center justify-center">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName || 'Avatar'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>

                  {/* Change Avatar Button Overlay */}
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
                    className="absolute inset-0 rounded-full bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-gray-400">
                    JPG, PNG หรือ WebP
                  </span>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    ชื่อที่แสดง (Display Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น Katsumoto Hana"
                    className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    ชื่อผู้ใช้ (Username) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 text-xs sm:text-sm font-medium">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full rounded-2xl border border-gray-200 pl-8 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    โปรไฟล์ของคุณจะเข้าถึงได้ผ่าน: catako.site/{username || 'username'}
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">
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
                    className="w-full rounded-2xl border border-gray-200 p-3.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                {/* Website & Location Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Website */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      เว็บไซต์ / Portfolio URL
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <Globe className="h-4 w-4" />
                      </span>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-2xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      สถานที่ (Location)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="เช่น Bangkok, Thailand"
                        className="w-full rounded-2xl border border-gray-200 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Email (Read-only) */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    อีเมลที่ผูกกับบัญชี
                  </label>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-200/80 px-3.5 py-2.5 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{currentUser.email || 'ไม่มีข้อมูลอีเมล'}</span>
                    </div>
                    <span className="rounded-md bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 sm:px-6 py-4 bg-gray-50/50">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
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
            </div>
          </div>
        </form>
      )}

      {/* ---------------- Tab 2: Notifications ---------------- */}
      {activeTab === 'notifications' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs divide-y divide-gray-100">
          <div className="pb-4">
            <h3 className="text-sm font-bold text-gray-900">
              การแจ้งเตือนภายในแอป (In-App Notifications)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              เลือกการแจ้งเตือนกิจกรรมที่คุณต้องการรับในหน้า Notifications
            </p>
          </div>

          <div className="py-4 space-y-4">
            {/* Likes */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  ถูกใจและแสดงความรู้สึก (Likes)
                </p>
                <p className="text-[11px] text-gray-400">
                  แจ้งเตือนเมื่อมีคนมากดถูกใจโพสต์หรือ Showcase ของคุณ
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('likes')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifPrefs.likes ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifPrefs.likes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Comments */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  ความคิดเห็นและตอบกลับ (Comments & Replies)
                </p>
                <p className="text-[11px] text-gray-400">
                  แจ้งเตือนเมื่อมีคนแสดงความคิดเห็นในโพสต์ของคุณ
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('comments')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifPrefs.comments ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifPrefs.comments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Follows */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  ผู้ติดตามใหม่ (New Followers)
                </p>
                <p className="text-[11px] text-gray-400">
                  แจ้งเตือนเมื่อมีครีเอเตอร์เริ่มติดตามโปรไฟล์ของคุณ
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('follows')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifPrefs.follows ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifPrefs.follows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Mentions */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  การแท็กและพูดถึง (Mentions & Tags)
                </p>
                <p className="text-[11px] text-gray-400">
                  แจ้งเตือนเมื่อมีคนพูดถึงคุณด้วย @{currentUser.username || 'username'} ในโพสต์
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('mentions')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifPrefs.mentions ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifPrefs.mentions ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Showcase */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  กิจกรรม Showcase & Portfolio
                </p>
                <p className="text-[11px] text-gray-400">
                  แจ้งเตือนเมื่อมีคนสนใจผลงานที่คุณแนบในคอมเมนต์
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('showcases')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifPrefs.showcases ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    notifPrefs.showcases ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Tab 3: Appearance ---------------- */}
      {activeTab === 'appearance' && (
        <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs divide-y divide-gray-100">
          <div className="pb-4">
            <h3 className="text-sm font-bold text-gray-900">
              การแสดงผลและประสบการณ์ใช้งาน (Display & Experience)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ปรับแต่งขนาดตัวอักษรและพรีวิวมีเดียในหน้าฟีด
            </p>
          </div>

          <div className="py-4 space-y-5">
            {/* Media Carousel Preview Style */}
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                รูปแบบพรีวิวรูปภาพในฟีด (Feed Image Display)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('feedMediaPreview', 'large')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    appearancePrefs.feedMediaPreview === 'large'
                      ? 'border-black bg-gray-50/80 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Threads Peek Carousel</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    สไลด์แบบเห็นภาพถัดไปยื่นออกมา (แนะนำ)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAppearanceChange('feedMediaPreview', 'compact')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    appearancePrefs.feedMediaPreview === 'compact'
                      ? 'border-black bg-gray-50/80 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Compact Fit</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    แสดงขนาดกะทัดรัด พอดีความกว้าง
                  </p>
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="pt-2">
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                ภาษาที่แสดงผล (Language)
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('language', 'th')}
                  className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    appearancePrefs.language === 'th'
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ภาษาไทย (TH)
                </button>
                <button
                  type="button"
                  onClick={() => handleAppearanceChange('language', 'en')}
                  className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    appearancePrefs.language === 'en'
                      ? 'border-black bg-black text-white shadow-xs'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Tab 4: Security & Session ---------------- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Account Details Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              ข้อมูลบัญชีและความปลอดภัย (Account Security)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">รหัสผู้ใช้งาน (User ID)</span>
                <span className="font-mono text-gray-800 font-semibold">
                  #{currentUser.id}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">อีเมลลงทะเบียน</span>
                <span className="text-gray-800 font-medium">
                  {currentUser.email || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">สถานะเซสชัน</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Now
                </span>
              </div>
            </div>
          </div>

          {/* Session & Logout Action Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  ออกจากระบบ (Sign Out)
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  ออกจากระบบเซสชันปัจจุบันบนอุปกรณ์เครื่องนี้
                </p>
              </div>

              <button
                type="button"
                disabled={signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                {signOutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

