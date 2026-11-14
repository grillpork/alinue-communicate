'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  TrendingUp,
  User,
  Hash,
  ChevronRight,
  Loader2,
  FileText,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { useSuggestedUsersQuery, useSearchUsersQuery } from '@/services/user';
import { formatRelativeTime } from '@/lib/date';
import UserAvatar from '@/components/common/UserAvatar';

const TRENDING_TAGS = [
  'UIUX',
  'WebDesign',
  'Illustrator',
  '3DArt',
  'Motion',
  'Commission',
  'Vtuber',
  'CharacterDesign',
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
      className="absolute top-full left-0 right-0 mt-2 z-40 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl max-h-[460px] overflow-y-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ---------------- Case 1: ยังไม่ได้พิมพ์คำค้นหา (Trending & Suggested) ---------------- */}
      {!cleanQ ? (
        <div className="p-4 space-y-4">
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
                      <UserAvatar
                        src={creator.avatar}
                        alt={creator.name}
                        size="md"
                        className="ring-1 ring-gray-200"
                      />
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
        <div className="p-3">
          {isLoadingUsers && isLoadingPosts ? (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500">กำลังค้นหา...</span>
            </div>
          ) : matchedUsers.length > 0 ? (
            /* 1. กรณีเจอ User: แสดงรายชื่อ User นำหน้า */
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span>ผู้ใช้ / ดีไซเนอร์ ({matchedUsers.length})</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  คลิกเพื่อดูโปรไฟล์
                </span>
              </div>

              <div className="space-y-0.5">
                {matchedUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/${user.username}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={user.avatar}
                        alt={user.name}
                        size="md"
                        className="ring-1 ring-gray-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-black">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          @{user.username}
                        </p>
                        {user.bio && (
                          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-black font-medium shrink-0 flex items-center gap-0.5">
                      ดูโปรไฟล์
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>

              {/* ตัวเลือกดูโพสต์ที่เกี่ยวข้อง (หากมีโพสต์ที่ตรงกันด้วย) */}
              {matchingPosts.length > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTag(cleanQ);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-gray-50 text-gray-600 hover:text-black transition-colors text-xs font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        ดูโพสต์ที่เกี่ยวข้องกับ &ldquo;{cleanQ}&rdquo; ({matchingPosts.length} โพสต์)
                      </span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          ) : matchingPosts.length > 0 ? (
            /* 2. กรณีไม่พบ User แต่พบโพสต์: แสดงโพสต์ที่เกี่ยวข้องแทน */
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  <span>
                    ไม่พบผู้ใช้ &mdash; แสดงโพสต์ที่เกี่ยวข้อง ({matchingPosts.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTag(cleanQ);
                    onClose();
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  ดูทั้งหมดในฟีด &rarr;
                </button>
              </div>

              <div className="pt-1 space-y-1">
                {matchingPosts.slice(0, 5).map((post) => {
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
                      className="flex items-start justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer gap-3 border border-transparent hover:border-gray-100"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {thumb ? (
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 mt-0.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5">
                            <span className="font-semibold text-gray-800 truncate">
                              {post.author?.name || post.author?.username || 'User'}
                            </span>
                            <span>•</span>
                            <span className="text-gray-400">
                              @{post.author?.username || 'user'}
                            </span>
                            <span>•</span>
                            <span>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed font-medium group-hover:text-black">
                            {post.caption || post.content || 'ดูรายละเอียดโพสต์นี้'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likesCount ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.commentsCount ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-black shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 3. ไม่พบทั้ง User และ Post */
            <div className="py-8 text-center">
              <Search className="h-7 w-7 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-800">
                ไม่พบผู้ใช้หรือโพสต์ที่ตรงกับ &ldquo;{cleanQ}&rdquo;
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                ลองค้นหาด้วยชื่อผู้ใช้, แฮชแท็ก หรือคำสำคัญอื่น
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
