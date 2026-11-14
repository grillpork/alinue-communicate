'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Camera,
  Pencil,
  Loader2,
  Check,
  Plus,
} from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useUpdateProfileMutation } from '@/services/user';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function EditProfileModal({ isOpen, onClose, user }) {
  useBodyScrollLock(isOpen);
  const router = useRouter();
  const updateProfileMutation = useUpdateProfileMutation();

  // Form States
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.name || user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || user?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(user?.banner || '');
  const [languages, setLanguages] = useState(['Thai', 'English']);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [newLanguageInput, setNewLanguageInput] = useState('');

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Sync state เมื่อ user prop เปลี่ยน
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.name || user.displayName || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setAvatarUrl(user.avatar || user.avatarUrl || '');
      setBannerUrl(user.banner || '');
    }
  }, [user]);

  if (!isOpen) return null;

  // จัดการอัปโหลด Avatar ไปยัง R2
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
      setErrorMessage('Failed to upload avatar: ' + (err.message || ''));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // จัดการอัปโหลด Banner ไปยัง R2
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
      setErrorMessage('Failed to upload banner: ' + (err.message || ''));
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // เพิ่มภาษา
  const handleAddLanguage = (e) => {
    e.preventDefault();
    if (!newLanguageInput.trim()) return;
    if (!languages.includes(newLanguageInput.trim())) {
      setLanguages([...languages, newLanguageInput.trim()]);
    }
    setNewLanguageInput('');
    setIsAddingLanguage(false);
  };

  const handleRemoveLanguage = (langToRemove) => {
    setLanguages(languages.filter((l) => l !== langToRemove));
  };

  // บันทึกการแก้ไขโปรไฟล์
  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) {
      setErrorMessage('Username cannot be empty');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        username: cleanUsername,
        displayName: displayName.trim() || cleanUsername,
        bio: bio.trim(),
        website: website.trim(),
        avatarUrl,
        banner: bannerUrl,
      });

      onClose();

      // หากมีการเปลี่ยน Username ให้ redirect ไปยัง Path ใหม่
      if (cleanUsername !== user?.username?.toLowerCase()) {
        router.push(`/${cleanUsername}`);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Hidden File Inputs (เฉพาะไฟล์รูปภาพนิ่ง JPG, PNG, WebP) */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
          onChange={handleBannerChange}
        />

        {/* 1. Modal Header (X / Edit Profile / Done) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-base font-bold text-gray-900">Edit Profile</h2>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateProfileMutation.isPending || isUploadingAvatar || isUploadingBanner}
            className="text-sm font-bold text-gray-900 hover:text-black disabled:opacity-40 transition-opacity cursor-pointer"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-900" />
            ) : (
              'Done'
            )}
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-medium text-rose-600">
              {errorMessage}
            </div>
          )}

          {/* Banner Cover Artwork Area */}
          <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-gray-100 shadow-inner group">
            <img
              src={bannerUrl || '/empty/no-image.png'}
              alt="Banner preview"
              onError={(e) => {
                e.currentTarget.src = '/empty/no-image.png';
              }}
              className="h-full w-full object-cover"
            />

            {/* Change Banner Button Overlay */}
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-[1px]"
            >
              <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                {isUploadingBanner ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span>Change Banner</span>
              </div>
            </div>
          </div>

          {/* Avatar & Username Row */}
          <div className="flex items-start gap-4">
            {/* Avatar Circle with Pencil Badge */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-full ring-3 ring-white shadow-md bg-gray-100 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-amber-200 to-orange-300 flex items-center justify-center text-gray-700 text-xl font-bold">
                    {(displayName || username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Upload Avatar Badge */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Change Avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Pencil className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Username Input Field */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Username
              </label>
              <div className="flex items-center rounded-2xl bg-gray-100/90 px-3.5 py-2.5">
                <span className="text-xs sm:text-sm font-medium text-gray-400 select-none">
                  Alinue.com/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="username"
                  className="w-full bg-transparent pl-1.5 text-xs sm:text-sm font-bold text-gray-900 outline-none"
                  maxLength={30}
                />
              </div>
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-gray-400">
                Updating your username will also update your profile URL, which means you&apos;ll need to change it anywhere that you&apos;ve already shared it.
              </p>
            </div>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full rounded-2xl bg-gray-100/90 px-4 py-3 text-xs sm:text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              maxLength={50}
            />
          </div>

          {/* Bio Section */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write some things"
              rows={3}
              className="w-full rounded-2xl bg-gray-100/90 p-4 text-xs sm:text-sm text-gray-800 outline-none placeholder:text-gray-400 resize-none leading-relaxed"
              maxLength={300}
            />
          </div>

          {/* Local time Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900">Local time</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
              Publicly displaying &quot;Local time&quot; helps others&apos; manage expectations about your reply times. Will NOT display location or timezone name.
            </p>
          </div>

          {/* Languages Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900">Languages</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">
              You can professionally communicate in
            </p>

            {/* Language Chips */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800"
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Language Form / Button */}
            {isAddingLanguage ? (
              <form onSubmit={handleAddLanguage} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newLanguageInput}
                  onChange={(e) => setNewLanguageInput(e.target.value)}
                  placeholder="e.g. Japanese, Mandarin, French"
                  className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-800 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-full bg-black px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingLanguage(false)}
                  className="rounded-full px-2.5 py-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingLanguage(true)}
                className="mt-3 w-full rounded-full bg-gray-100/90 hover:bg-gray-200/80 py-2.5 text-center text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Add language
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

