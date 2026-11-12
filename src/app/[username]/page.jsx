'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Grid,
  Heart,
  Loader2,
  UserX,
  ArrowLeft,
  Briefcase,
  Plus,
} from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/post/PostCard';
import ShowcaseCard from '@/components/showcase/ShowcaseCard';
import CreateShowcaseModal from '@/components/showcase/CreateShowcaseModal';
import { useMeQuery } from '@/services/auth';
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useUpdateProfileMutation,
} from '@/services/user';
import { useShowcasesQuery } from '@/services/showcase';

function UserProfileContent() {
  const params = useParams();
  const rawUsername = params?.username;
  const username =
    typeof rawUsername === 'string'
      ? decodeURIComponent(rawUsername).replace(/^@/, '')
      : '';

  const [activeTab, setActiveTab] = useState('showcases');
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);

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

  // 4. ดึงผลงาน Showcase ของผู้ใช้นี้
  const { data: showcasesData, isLoading: isShowcasesLoading } = useShowcasesQuery(
    { username },
    { enabled: Boolean(username) }
  );
  const showcases = showcasesData?.showcases || [];

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
    location: profile.location || '',
    note: profile.note || 'Tell there what you think.',
    isVerified: Boolean(profile.isVerified ?? true),
    joinedDate: profile.joinedDate,
    avatar: profile.avatar || profile.avatarUrl || null,
    banner:
      profile.banner ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
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

      {/* 2. Navigation Tabs */}
      <div className="mt-6 flex border-b border-gray-100 px-2 sm:px-0">
        {[
          { id: 'showcases', label: 'Showcase', icon: Briefcase, count: showcases.length },
          { id: 'posts', label: 'Posts', icon: Grid, count: posts.length },
          { id: 'likes', label: 'Likes', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[11px] text-gray-400">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content */}
      <div className="mt-4 px-2 sm:px-0">
        {/* Tab: Showcase */}
        {activeTab === 'showcases' && (
          <div>
            {/* Action Bar (หากเป็นโปรไฟล์ตัวเอง ให้มีปุ่มโพสต์ผลงาน) */}
            {isSelf && (
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-gray-50/70 p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-700" />
                  <span className="text-xs font-semibold text-gray-800">
                    พื้นที่โชว์รูปและคลิปผลงานของคุณโดยเฉพาะ
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มผลงาน</span>
                </button>
              </div>
            )}

            {isShowcasesLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-xs">กำลังโหลดผลงาน Showcase...</p>
              </div>
            ) : showcases.length > 0 ? (
              <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-3.5 [column-fill:_balance]">
                {showcases.map((sc) => (
                  <div key={sc.id} className="break-inside-avoid mb-4">
                    <ShowcaseCard
                      showcase={sc}
                      currentUserId={currentUser?.id}
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
          <div className="py-16 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-3xl mt-4">
            No liked posts yet.
          </div>
        )}
      </div>

      {/* 4. Create Showcase Modal */}
      <CreateShowcaseModal
        isOpen={isShowcaseModalOpen}
        onClose={() => setIsShowcaseModalOpen(false)}
      />
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
