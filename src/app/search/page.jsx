'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Search,
  X,
  Clock,
  Flame,
  RotateCw,
  User,
  FileText,
  Heart,
  MessageCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  LayoutList,
} from 'lucide-react';
import { useSearchUsersQuery } from '@/services/user';
import { usePostsQuery } from '@/services/post';
import { useServicesQuery } from '@/services/service';
import ServiceCard from '@/components/service/ServiceCard';
import { formatRelativeTime } from '@/lib/date';
import PostDetailModal from '@/components/post/PostDetailModal';
import UserAvatar from '@/components/common/UserAvatar';

const DEFAULT_HISTORY = [
  'Anime chibi',
  'history',
  'gaming',
  'space exploration',
  'sustainable energy',
  'artificial intelligence',
  'urban gardening',
  'quantum computing',
  'fantasy novels',
];

const INITIAL_RECOMMENDATIONS = [
  { tag: 'history', count: '12,000' },
  { tag: 'Anime chibi', count: '12,000' },
  { tag: 'Game design', count: '15,000' },
  { tag: 'Digital painting', count: '18,500' },
  { tag: 'Photography basics', count: '10,500' },
  { tag: '3D modeling', count: '20,000' },
  { tag: 'UX/UI principles', count: '14,750' },
  { tag: 'Motion graphics', count: '16,200' },
  { tag: 'Web development', count: '22,000' },
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'users' | 'posts'
  const [searchHistory, setSearchHistory] = useState(DEFAULT_HISTORY);
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const inputRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alinue_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSearchHistory(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (items) => {
    setSearchHistory(items);
    try {
      localStorage.setItem('alinue_search_history', JSON.stringify(items));
    } catch {}
  };

  const handleAddHistory = (term) => {
    const clean = term.trim();
    if (!clean) return;
    const filtered = searchHistory.filter(
      (h) => h.toLowerCase() !== clean.toLowerCase()
    );
    saveHistory([clean, ...filtered].slice(0, 15));
  };

  const handleRemoveHistory = (e, termToRemove) => {
    e.stopPropagation();
    const updated = searchHistory.filter((h) => h !== termToRemove);
    saveHistory(updated);
  };

  const handleClearAllHistory = () => {
    saveHistory([]);
  };

  // Queries for live searching
  const cleanQ = submittedQuery.trim();

  const { data: searchUsersData, isLoading: isLoadingUsers } =
    useSearchUsersQuery(cleanQ, {
      enabled: Boolean(cleanQ),
    });
  const matchedUsers = searchUsersData?.users || [];

  const { data: postsData, isLoading: isLoadingPosts } = usePostsQuery(
    { search: cleanQ },
    { enabled: Boolean(cleanQ) }
  );
  const matchedPosts = postsData?.posts || [];

  const { data: servicesData, isLoading: isLoadingServices } = useServicesQuery(
    { search: cleanQ },
    { enabled: Boolean(cleanQ) }
  );
  const matchedServices = servicesData?.services || [];

  // Submit search
  const handleSearchSubmit = (term) => {
    const target = (term !== undefined ? term : query).trim();
    setSubmittedQuery(target);
    setQuery(target);
    if (target) {
      handleAddHistory(target);
      router.replace(`/search?q=${encodeURIComponent(target)}`, { scroll: false });
    } else {
      router.replace('/search', { scroll: false });
    }
  };

  // Refresh recommendation topics
  const handleRefreshRecommendations = () => {
    setIsRefreshingRecs(true);
    setTimeout(() => {
      setRecommendations((prev) => [...prev].sort(() => Math.random() - 0.5));
      setIsRefreshingRecs(false);
    }, 300);
  };

  const hasSearched = Boolean(cleanQ);

  return (
    <div className="w-full max-w-2xl xl:max-w-3xl mx-auto px-3.5 sm:px-4 pt-3 sm:pt-4 pb-24">
      {/* 1. TOP SEARCH BAR (ตรงตามรูปภาพอ้างอิง) */}
      <div className="flex items-center gap-2 mb-5">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            if (hasSearched) {
              setSubmittedQuery('');
              setQuery('');
              router.replace('/search', { scroll: false });
            } else {
              router.back();
            }
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200/90 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Input Pill */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit();
          }}
          className="relative flex-1"
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Searching witch you want..."
            className="w-full rounded-full border border-gray-200/90 bg-white py-2.5 pl-4 pr-10 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:border-black focus:outline-none transition-all shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Clear text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Search Circle Button */}
        <button
          type="button"
          onClick={() => handleSearchSubmit()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200/90 text-gray-600 hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all cursor-pointer shadow-2xs"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      {!hasSearched ? (
        /* ------------------ A. DEFAULT EXPLORE STATE (Search History & Recommendations) ------------------ */
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Recent Searches (Search History) */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  ประวัติการค้นหาล่าสุด
                </span>
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-[11px] font-medium text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  ล้างทั้งหมด
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {searchHistory.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleSearchSubmit(item)}
                    className="flex items-center justify-between py-2.5 px-2 rounded-xl text-xs sm:text-sm text-gray-500 hover:text-black hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistory(e, item)}
                      className="p-1 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                      aria-label={`Remove ${item}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommend for you Section (ตรงตามรูปภาพอ้างอิง) */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Recommend for you
              </h2>
              <button
                type="button"
                onClick={handleRefreshRecommendations}
                className="p-1.5 rounded-full text-gray-500 hover:text-black hover:bg-gray-100 transition-all cursor-pointer"
                title="สุ่มหัวข้อใหม่"
              >
                <RotateCw
                  className={`h-4 w-4 ${isRefreshingRecs ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            <div className="space-y-1">
              {recommendations.map((rec) => (
                <div
                  key={rec.tag}
                  onClick={() => handleSearchSubmit(rec.tag)}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Flame className="h-4 w-4 text-gray-900 fill-black shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-black truncate">
                      {rec.tag}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono shrink-0">
                    {rec.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ------------------ B. SEARCH RESULTS STATE (Users & Posts) ------------------ */
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Results Summary & Filter Tabs */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-500 hover:text-black bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'services'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-500 hover:text-black bg-gray-50'
                }`}
              >
                Services ({matchedServices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-500 hover:text-black bg-gray-50'
                }`}
              >
                Designers ({matchedUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-500 hover:text-black bg-gray-50'
                }`}
              >
                Posts ({matchedPosts.length})
              </button>
            </div>

            <span className="text-xs text-gray-400 hidden sm:inline-block">
              ผลการค้นหาสำหรับ &ldquo;{cleanQ}&rdquo;
            </span>
          </div>

          {/* Loading Indicator */}
          {(isLoadingUsers || isLoadingPosts || isLoadingServices) && (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-xs">กำลังค้นหา...</p>
            </div>
          )}

          {/* Results List */}
          {!isLoadingUsers && !isLoadingPosts && !isLoadingServices && (
            <>
              {/* Case 1: Services Section */}
              {(activeTab === 'all' || activeTab === 'services') && matchedServices.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-gray-900">
                    <LayoutList className="h-3.5 w-3.5 text-gray-900" />
                    <span>บริการรับงาน / Commissions ({matchedServices.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {matchedServices.map((srv) => (
                      <ServiceCard key={srv.id} service={srv} />
                    ))}
                  </div>
                </div>
              )}

              {/* Case 2: Designers / Users Section */}
              {(activeTab === 'all' || activeTab === 'users') && matchedUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-gray-900">
                    <User className="h-3.5 w-3.5 text-blue-500" />
                    <span>ดีไซเนอร์ / ครีเอเตอร์ ({matchedUsers.length})</span>
                  </div>

                  <div className="space-y-1 bg-white rounded-2xl border border-gray-100 p-2 shadow-2xs">
                    {matchedUsers.map((user) => (
                      <Link
                        key={user.id}
                        href={`/${user.username}`}
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
                </div>
              )}

              {/* Case 2: Related Posts Section */}
              {(activeTab === 'all' || activeTab === 'posts') && matchedPosts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-gray-900">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span>
                      {matchedUsers.length === 0
                        ? `ไม่พบผู้ใช้ — แสดงโพสต์ที่เกี่ยวข้อง (${matchedPosts.length})`
                        : `โพสต์ที่เกี่ยวข้อง (${matchedPosts.length})`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {matchedPosts.map((post) => {
                      const media = post.images || post.media_urls || [];
                      const thumb =
                        typeof media[0] === 'string'
                          ? media[0]
                          : media[0]?.url || null;

                      return (
                        <div
                          key={post.id}
                          onClick={() => setActivePost(post)}
                          className="flex items-start justify-between p-3.5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {thumb ? (
                              <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={thumb}
                                  alt="Post media"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-14 w-14 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border border-gray-100">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                                <span className="font-semibold text-gray-800 truncate">
                                  {post.author?.name || post.author?.username || 'User'}
                                </span>
                                <span>•</span>
                                <span>@{post.author?.username || 'user'}</span>
                                <span>•</span>
                                <span>{formatRelativeTime(post.createdAt)}</span>
                              </div>

                              <p className="text-xs sm:text-sm text-gray-800 line-clamp-2 leading-relaxed font-medium">
                                {post.caption || post.content || 'ดูรายละเอียดโพสต์นี้'}
                              </p>

                              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
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

                          <ChevronRight className="h-4 w-4 text-gray-300 self-center shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Case 4: Empty State */}
              {matchedUsers.length === 0 && matchedPosts.length === 0 && matchedServices.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-50 text-gray-300 mb-3 ring-1 ring-gray-100">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">
                    ไม่พบผลลัพธ์ที่ตรงกับ &ldquo;{cleanQ}&rdquo;
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    ลองค้นหาด้วยชื่อผู้ใช้, แฮชแท็ก หรือลองเลือกดูหัวข้อแนะนำด้านบน
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedQuery('');
                      setQuery('');
                      router.replace('/search', { scroll: false });
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <span>กลับไปหน้าค้นหาหลัก</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Post Detail Modal (เมื่อคลิกโพสต์ในผลการค้นหา) */}
      {activePost && (
        <PostDetailModal
          post={activePost}
          isOpen={Boolean(activePost)}
          onClose={() => setActivePost(null)}
        />
      )}
    </div>
  );
}

