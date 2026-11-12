'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Sparkles,
  TrendingUp,
  User,
  Hash,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { useSuggestedUsersQuery, useSearchUsersQuery } from '@/services/user';

const TRENDING_TAGS = [
  'UIUX',
  'WebDesign',
  'Illustrator',
  '3DArt',
  'Motion',
  'Branding',
  'DesignSystem',
  'Typography',
];

export default function SearchPopup({
  isOpen,
  onClose,
  searchQuery,
  onSelectTag,
  onSelectPost,
  matchingPosts = [],
  isLoadingPosts = false,
}) {
  const cleanQ = (searchQuery || '').trim();

  // 1. ดึงครีเอเตอร์แนะนำ (สำหรับกรณีที่ยังไม่ได้พิมพ์คำค้น)
  const { data: suggestedData, isLoading: isLoadingSuggested } =
    useSuggestedUsersQuery({
      enabled: isOpen && !cleanQ,
    });
  const suggestedCreators = suggestedData?.creators || [];

  // 2. ดึงผลการค้นหา Users / Creators เมื่อพิมพ์คำค้นหา
  const { data: searchUsersData, isLoading: isLoadingUsers } =
    useSearchUsersQuery(cleanQ, {
      enabled: isOpen && Boolean(cleanQ),
    });
  const matchedUsers = searchUsersData?.users || [];

  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white shadow-2xl border border-gray-100/90 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl max-h-[460px] overflow-y-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ---------------- Case 1: ยังไม่ได้พิมพ์คำค้นหา (Trending & Suggested) ---------------- */}
      {!cleanQ ? (
        <div className="p-4 space-y-5">
          {/* Trending Tags Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-2.5">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
              <span>แท็กยอดนิยม</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-black border border-gray-200/60 transition-all cursor-pointer active:scale-95"
                >
                  <Hash className="h-3 w-3 text-gray-400" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Creators Section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>ครีเอเตอร์แนะนำ</span>
              </div>
              <span className="text-[11px] font-normal text-gray-400">
                แนะนำสำหรับคุณ
              </span>
            </div>

            {isLoadingSuggested ? (
              <div className="py-6 flex justify-center text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : suggestedCreators.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">ไม่มีข้อมูลแนะนำ</p>
            ) : (
              <div className="space-y-1">
                {suggestedCreators.slice(0, 4).map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/${creator.username}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200 shrink-0 flex items-center justify-center">
                        {creator.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-black">
                          {creator.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          @{creator.username}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---------------- Case 2: กำลังพิมพ์ค้นหา (Live Results) ---------------- */
        <div className="p-3 divide-y divide-gray-100">
          {/* Quick Tag Search */}
          <div className="pb-2.5">
            <button
              type="button"
              onClick={() => onSelectTag(cleanQ)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left group cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                <Search className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  ค้นหา &ldquo;{cleanQ}&rdquo; ในฟีดทั้งหมด
                </p>
                <p className="text-[11px] text-gray-400">
                  พบ {matchingPosts.length} โพสต์ที่ตรงกัน
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-black shrink-0" />
            </button>
          </div>

          {/* 1. Creators Results */}
          <div className="py-2.5">
            <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <User className="h-3 w-3" />
              <span>ดีไซเนอร์ / ครีเอเตอร์ ({matchedUsers.length})</span>
            </div>

            {isLoadingUsers ? (
              <div className="py-3 flex justify-center text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : matchedUsers.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-2 py-1">
                ไม่พบผู้ใช้ที่ตรงกับ &ldquo;{cleanQ}&rdquo;
              </p>
            ) : (
              <div className="space-y-0.5">
                {matchedUsers.slice(0, 4).map((user) => (
                  <Link
                    key={user.id}
                    href={`/${user.username}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200 shrink-0 flex items-center justify-center">
                        {user.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 group-hover:text-black font-medium shrink-0">
                      ดูโปรไฟล์ &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 2. Posts Results Preview */}
          <div className="pt-2.5">
            <div className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <FileText className="h-3 w-3" />
              <span>โพสต์ที่เกี่ยวข้อง ({matchingPosts.length})</span>
            </div>

            {isLoadingPosts ? (
              <div className="py-3 flex justify-center text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : matchingPosts.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-2 py-1">
                ไม่พบโพสต์ที่ตรงกับ &ldquo;{cleanQ}&rdquo;
              </p>
            ) : (
              <div className="space-y-1">
                {matchingPosts.slice(0, 3).map((post) => {
                  const media = post.images || post.media_urls || [];
                  const thumb =
                    typeof media[0] === 'string'
                      ? media[0]
                      : media[0]?.url || null;

                  return (
                    <div
                      key={post.id}
                      onClick={() => {
                        if (onSelectPost) onSelectPost(post);
                        onClose();
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {thumb ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-800 line-clamp-1 font-medium group-hover:text-black">
                            {post.caption || post.content || 'โพสต์'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            โดย @{post.author?.username || 'user'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-black shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
