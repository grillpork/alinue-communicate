'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Globe, Loader2 } from 'lucide-react';

export const PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    placeholder: 'Username or channel URL',
    icon: (
      <svg className="h-4.5 w-4.5 fill-current text-red-600" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'Username or profile URL',
    icon: (
      <svg className="h-4.5 w-4.5 fill-current text-blue-600" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    placeholder: 'Username or profile URL',
    icon: (
      <svg className="h-4.5 w-4.5 fill-none stroke-current stroke-2 text-pink-600" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    placeholder: 'TikTok username (@username)',
    icon: (
      <svg className="h-4.5 w-4.5 fill-current text-black" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.32a6.34 6.34 0 0 0-1.02-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.76a8.28 8.28 0 0 0 5.03 1.69V7a4.83 4.83 0 0 1-1.1-.31z" />
      </svg>
    ),
  },
  {
    id: 'website',
    name: 'Website',
    placeholder: 'https://yourwebsite.com',
    icon: <Globe className="h-4.5 w-4.5 text-gray-700" />,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    placeholder: 'X username (@username)',
    icon: (
      <svg className="h-4 w-4 fill-current text-black" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'discord',
    name: 'Discord',
    placeholder: 'Discord server invite or tag',
    icon: (
      <svg className="h-4.5 w-4.5 fill-current text-[#5865F2]" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    id: 'artstation',
    name: 'ArtStation',
    placeholder: 'ArtStation username',
    icon: (
      <svg className="h-4.5 w-4.5 fill-current text-[#13AFF0]" viewBox="0 0 24 24">
        <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.334h13.445l-2.65-4.593H0zm24 .023c0-.41-.1-.82-.303-1.173L15.394 2.115A2.434 2.434 0 0 0 13.279.78h-.024c-.87 0-1.68.468-2.118 1.223L8.683 6.257l9.406 16.304 4.093-1.642a2.433 2.433 0 0 0 1.818-3.173zM7.228 8.784L2.83 16.402h8.796L7.228 8.784z" />
      </svg>
    ),
  },
];

export function getPlatformInfo(platformId) {
  return PLATFORMS.find((p) => p.id === platformId) || {
    id: platformId,
    name: platformId,
    placeholder: 'URL or handle',
    icon: <Globe className="h-4.5 w-4.5 text-gray-600" />,
  };
}

export function formatPlatformUrl(platform, rawValue) {
  if (!rawValue) return '#';
  const val = String(rawValue).trim();
  if (val.startsWith('http://') || val.startsWith('https://')) {
    return val;
  }
  switch (platform) {
    case 'youtube':
      return `https://youtube.com/@${val.replace(/^@/, '')}`;
    case 'facebook':
      return `https://facebook.com/${val}`;
    case 'instagram':
      return `https://instagram.com/${val.replace(/^@/, '')}`;
    case 'tiktok':
      return `https://tiktok.com/@${val.replace(/^@/, '')}`;
    case 'twitter':
      return `https://x.com/${val.replace(/^@/, '')}`;
    case 'discord':
      return val.includes('/') ? `https://discord.gg/${val.split('/').pop()}` : `https://discord.gg/${val}`;
    case 'artstation':
      return `https://artstation.com/${val}`;
    case 'website':
    default:
      return `https://${val}`;
  }
}

/**
 * SocialLinksModal
 * Modal จัดการ Social Media Links ตาม UI ตัวอย่าง
 */
export default function SocialLinksModal({
  isOpen,
  onClose,
  initialLinks = {},
  onSave,
  isSaving = false,
}) {
  const [linksList, setLinksList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // แปลง initialLinks เป็น array [{ platform, value }]
      const parsed = [];
      if (initialLinks && typeof initialLinks === 'object') {
        Object.entries(initialLinks).forEach(([key, val]) => {
          if (val) {
            parsed.push({ platform: key, value: String(val) });
          }
        });
      }
      setLinksList(parsed);
    }
  }, [isOpen, initialLinks]);

  if (!isOpen) return null;

  // รายการ platforms ที่ยังไม่ได้ถูกเพิ่ม
  const addedPlatformIds = new Set(linksList.map((item) => item.platform));
  const availablePlatforms = PLATFORMS.filter((p) => !addedPlatformIds.has(p.id));

  const handleAddPlatform = (platformId) => {
    setLinksList((prev) => [...prev, { platform: platformId, value: '' }]);
  };

  const handleUpdateValue = (index, newValue) => {
    setLinksList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });
  };

  const handleRemove = (index) => {
    setLinksList((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // แปลงกลับเป็น object { [platform]: value } เฉพาะรายการที่มีค่า
    const linksObj = {};
    linksList.forEach((item) => {
      const trimmed = item.value.trim();
      if (trimmed) {
        linksObj[item.platform] = trimmed;
      }
    });

    if (onSave) {
      await onSave(linksObj);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">
            Links
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="px-6 py-3 space-y-5">
          {/* Active Links Inputs List */}
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {linksList.map((item, idx) => {
              const info = getPlatformInfo(item.platform);
              return (
                <div
                  key={`${item.platform}-${idx}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white px-3.5 py-2.5 shadow-2xs hover:border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all"
                >
                  <div className="shrink-0 flex items-center justify-center h-5 w-5">
                    {info.icon}
                  </div>
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleUpdateValue(idx, e.target.value)}
                    placeholder={info.placeholder || 'Enter link or handle'}
                    autoFocus={idx === linksList.length - 1 && item.value === ''}
                    className="flex-1 min-w-0 bg-transparent text-sm font-normal text-gray-900 focus:outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="shrink-0 text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                    title="Remove link"
                    aria-label={`Remove ${info.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {linksList.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-2">
                No links added yet. Select a platform below to add.
              </p>
            )}
          </div>

          {/* Add more Section */}
          {availablePlatforms.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-400">
                Add more
              </span>

              <div className="space-y-1 max-h-[190px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {availablePlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleAddPlatform(platform.id)}
                    className="group flex w-full items-center justify-between py-2 px-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center shrink-0">
                        {platform.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {platform.name}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-3 pb-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50 min-w-[80px]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
