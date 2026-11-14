'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  Grid,
  Heart,
  Loader2,
  UserX,
  ArrowLeft,
  Briefcase,
  Plus,
  Bookmark,
  LayoutList,
} from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/post/PostCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import ShowcaseModal from '@/components/showcase/ShowcaseModal';
import CreateShowcaseModal from '@/components/showcase/CreateShowcaseModal';
import ServiceCard from '@/components/service/ServiceCard';
import ServiceDetailModal from '@/components/service/ServiceDetailModal';
import CreateServiceModal from '@/components/service/CreateServiceModal';
import { useMeQuery } from '@/services/auth';
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useUserLikedPostsQuery,
  useUpdateProfileMutation,
} from '@/services/user';
import { useShowcasesQuery } from '@/services/showcase';
import { useServicesQuery } from '@/services/service';
import { useBookmarks } from '@/services/bookmark';

function UserProfileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const showcaseParamId = searchParams?.get('showcase');
  const serviceParamId = searchParams?.get('service');
  const tabParam = searchParams?.get('tab');
  const [urlSelectedShowcase, setUrlSelectedShowcase] = useState(null);
  const [urlSelectedService, setUrlSelectedService] = useState(null);

  const rawUsername = params?.username;
  const username =
    typeof rawUsername === 'string'
      ? decodeURIComponent(rawUsername).replace(/^@/, '')
      : '';

  const [activeTab, setActiveTab] = useState(tabParam || 'showcases');
  const { bookmarks: bookmarkedPosts } = useBookmarks();

  useEffect(() => {
    if (tabParam && ['showcases', 'services', 'posts', 'likes', 'bookmarks'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // 1. ดึงข้อมูลผู้ใช้ปัจจุบันที่ Login อยู่
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  // 2. ดึงข้อมูลโปรไฟล์ของ [username] จาก Neon DB
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError,
  } = useUserProfileQuery(username, {
    enabled: Boolean(username),
  });

  const profile = profileData?.profile || null;
  const isSelf =
    Boolean(currentUser?.username) &&
    currentUser?.username?.toLowerCase() === username?.toLowerCase();

  // 3. ดึงโพสต์ของผู้ใช้นี้
  const { data: postsData, isLoading: isPostsLoading } = useUserPostsQuery(
    profile?.id || username,
    {
      enabled: Boolean(profile?.id || username),
    }
  );

  const posts = postsData?.posts || [];

  // 4. ดึงโพสต์ที่ผู้ใช้นี้กด Like
  const { data: likedPostsData, isLoading: isLikedPostsLoading } = useUserLikedPostsQuery(
    profile?.id || username,
    {
      enabled: Boolean(profile?.id || username),
    }
  );
  const likedPosts = likedPostsData?.posts || [];

  // 5. ดึงผลงาน Showcase ของผู้ใช้นี้
  const { data: showcasesData, isLoading: isShowcasesLoading } = useShowcasesQuery(
    { username },
    { enabled: Boolean(username) }
  );
  const showcases = showcasesData?.showcases || [];

  // ตรวจสอบว่ามี ?showcase=:id ใน URL หรือไม่ เพื่อเปิด Modal ทันที
  useEffect(() => {
    if (showcaseParamId && showcases.length > 0) {
      const found = showcases.find((s) => String(s.id) === String(showcaseParamId));
      if (found) {
        setUrlSelectedShowcase(found);
      }
    }
  }, [showcaseParamId, showcases]);

  // 6. ดึงบริการ/โพสต์รับงาน Service ของผู้ใช้นี้
  const { data: servicesData, isLoading: isServicesLoading } = useServicesQuery(
    { username, status: isSelf ? 'all' : 'active' },
    { enabled: Boolean(username) }
  );
  const services = servicesData?.services || [];

  // ตรวจสอบว่ามี ?service=:id ใน URL หรือไม่ เพื่อเปิด Modal ทันที
  useEffect(() => {
    if (serviceParamId && services.length > 0) {
      const found = services.find((s) => String(s.id) === String(serviceParamId));
      if (found) {
        setUrlSelectedService(found);
      }
    }
  }, [serviceParamId, services]);

  const filteredShowcases = showcases || [];

  const updateProfileMutation = useUpdateProfileMutation();

  const handleUpdateNote = (newNote) => {
    updateProfileMutation.mutate({ note: newNote });
  };

  // กำลังโหลดข้อมูล
  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 mb-3" />
        <p className="text-xs font-medium">Loading @{username}&apos;s profile...</p>
      </div>
    );
  }

  // ไม่พบผู้ใช้นี้ในระบบ
  if (isError || !profile) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xs my-8 max-w-md mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-4">
          <UserX className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-gray-900">User not found</h2>
        <p className="text-xs text-gray-400 mt-1">
          The user @{username} does not exist or may have been deleted.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </Link>
      </div>
    );
  }

  const user = {
    id: profile.id,
    name: profile.name || profile.displayName || profile.username,
    username: profile.username,
    bio: profile.bio || '',
    website: profile.website || '',
    socialLinks: profile.socialLinks || {},
    location: profile.location || '',
    note: profile.note || 'Tell there what you think.',
    isVerified: Boolean(profile.isVerified ?? true),
    joinedDate: profile.joinedDate,
    avatar: profile.avatar || profile.avatarUrl || null,
    banner:
      profile.banner ||
      '/empty/no-image.png',
    stats: profile.stats || {
      posts: posts.length,
      followers: 0,
      following: 0,
      viewing: 0,
      likes: 0,
    },
    isFollowing: profile.isFollowing,
  };

  return (
    <div className="w-full pb-16">
      {/* 1. Custom Glassmorphism Profile Header */}
      <ProfileHeader
        user={user}
        isSelf={isSelf}
        onUpdateNote={isSelf ? handleUpdateNote : undefined}
      />

      {/* 2. Navigation Tabs (Sticky Top) */}
      <div className="sticky top-[53px] lg:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-2 sm:px-0 transition-all">
        <div className="flex">
          {[
            { id: 'showcases', label: 'Showcase', icon: Briefcase, count: showcases.length },
            {
              id: 'services',
              label: 'Services',
              icon: LayoutList,
              count: services.length > 0 ? services.length : (isSelf ? 0 : undefined),
            },
            { id: 'posts', label: 'Posts', icon: Grid, count: posts.length },
            { id: 'likes', label: 'Likes', icon: Heart, count: likedPosts.length > 0 ? likedPosts.length : undefined },
            {
              id: 'bookmarks',
              label: 'Bookmark',
              icon: Bookmark,
              count: isSelf && bookmarkedPosts.length > 0 ? bookmarkedPosts.length : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className="hidden sm:inline text-[11px] text-gray-400">
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Content */}
      <div className="mt-4 px-2 sm:px-0">
        {/* Tab: Showcase */}
        {activeTab === 'showcases' && (
          <div>
            {isShowcasesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs">กำลังโหลดผลงาน Showcase...</p>
              </div>
            ) : filteredShowcases.length > 0 ? (
              <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 [column-fill:_balance]">
                {filteredShowcases.map((sc) => (
                  <div key={sc.id} className="break-inside-avoid mb-4">
                    <ShowcaseCard
                      showcase={sc}
                      currentUserId={currentUser?.id}
                      isOwner={
                        isSelf ||
                        (currentUser &&
                          (Number(currentUser.id) === Number(sc.userId || sc.author?.id) ||
                            currentUser.username?.toLowerCase() === sc.author?.username?.toLowerCase()))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-2 p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
                  <Briefcase className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  ยังไม่มีผลงาน Showcase
                </p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? 'เริ่มอัปโหลดรูปภาพหรือคลิปผลงานของคุณเพื่อให้คอมมูนิตี้เข้ามากด Like และชื่นชมได้เลย!'
                    : `@${username} ยังไม่ได้โพสต์ผลงาน Showcase`}
                </p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsShowcaseModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>เพิ่มผลงานชิ้นแรก</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Services */}
        {activeTab === 'services' && (
          <div>
            {isSelf && (
              <div className="flex items-center justify-between mb-4 bg-gray-50/70 p-3.5 sm:p-4 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    บริการและประกาศรับงาน (Services)
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    โพสต์รับงานมีอายุ 30 วัน (1 เดือน) และสามารถต่ออายุได้ตลอดเวลา
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>โพสต์รับงาน</span>
                </button>
              </div>
            )}

            {isServicesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs">กำลังโหลดรายการบริการรับงาน...</p>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {services.map((srv) => (
                  <ServiceCard
                    key={srv.id}
                    service={srv}
                    currentUserId={currentUser?.id}
                    isOwner={isSelf}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-2 p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
                  <LayoutList className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  ยังไม่มีบริการหรือประกาศรับงาน
                </p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? 'เปิดรับงาน คอมมิชชัน หรือบริการสร้างสรรค์ผลงานของคุณ พร้อมตัวอย่างงานและราคาเริ่มต้น'
                    : `@${username} ยังไม่ได้เปิดรับงานในขณะนี้`}
                </p>
                {isSelf && (
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>สร้างโพสต์รับงานชิ้นแรก</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Posts */}
        {activeTab === 'posts' && (
          <div>
            {isPostsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs">Loading posts...</p>
              </div>
            ) : posts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl mt-4">
                No posts shared by @{username} yet.
              </div>
            )}
          </div>
        )}

        {/* Tab: Likes */}
        {activeTab === 'likes' && (
          <div>
            {isLikedPostsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs">กำลังโหลดโพสต์ที่ถูกใจ...</p>
              </div>
            ) : likedPosts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {likedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
                  <Heart className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  ยังไม่มีโพสต์ที่ถูกใจ
                </p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? 'เมื่อคุณกดถูกใจโพสต์ โพสต์เหล่านั้นจะมาแสดงอยู่ที่นี่'
                    : `@${username} ยังไม่ได้กดถูกใจโพสต์ใดๆ`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Bookmark */}
        {activeTab === 'bookmarks' && (
          <div>
            {isSelf ? (
              bookmarkedPosts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {bookmarkedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
                    <Bookmark className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    ยังไม่มีโพสต์ที่บันทึกไว้ในบุ๊กมาร์ก
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                    กดไอคอน Bookmark บนโพสต์ที่คุณสนใจ เพื่อเก็บไว้ดูย้อนหลังได้ทุกเมื่อ
                  </p>
                </div>
              )
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-3xl mt-4 p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3">
                  <Bookmark className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  รายการบุ๊กมาร์กเป็นข้อมูลส่วนตัว
                </p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  เฉพาะเจ้าของบัญชี @{username} เท่านั้นที่สามารถดูโพสต์ที่บันทึกไว้ได้
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Create Showcase Modal */}
      <CreateShowcaseModal
        isOpen={isShowcaseModalOpen}
        onClose={() => setIsShowcaseModalOpen(false)}
      />

      {/* 5. URL Showcase Modal (เมื่อมี ?showcase=:id) */}
      {urlSelectedShowcase && (
        <ShowcaseModal
          showcase={urlSelectedShowcase}
          isOpen={Boolean(urlSelectedShowcase)}
          onClose={() => setUrlSelectedShowcase(null)}
          currentUserId={currentUser?.id}
          isOwner={
            isSelf ||
            (currentUser &&
              (Number(currentUser.id) === Number(urlSelectedShowcase?.userId || urlSelectedShowcase?.author?.id) ||
                currentUser.username?.toLowerCase() === urlSelectedShowcase?.author?.username?.toLowerCase()))
          }
        />
      )}

      {/* 6. Create Service Modal */}
      <CreateServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
      />

      {/* 7. URL Service Modal (เมื่อมี ?service=:id) */}
      {urlSelectedService && (
        <ServiceDetailModal
          service={urlSelectedService}
          isOpen={Boolean(urlSelectedService)}
          onClose={() => setUrlSelectedService(null)}
          currentUserId={currentUser?.id}
          isOwner={
            isSelf ||
            (currentUser &&
              (Number(currentUser.id) === Number(urlSelectedService?.userId || urlSelectedService?.author?.id) ||
                currentUser.username?.toLowerCase() === urlSelectedService?.author?.username?.toLowerCase()))
          }
        />
      )}
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-28 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mb-3" />
        </div>
      }
    >
      <UserProfileContent />
    </React.Suspense>
  );
}
