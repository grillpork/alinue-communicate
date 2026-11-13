'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Sparkles,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  User,
  ArrowRight,
} from 'lucide-react';
import { useMeQuery } from '@/services/auth';
import {
  useNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} from '@/services/notification';
import { useToggleFollowMutation } from '@/services/user';
import { formatRelativeTime } from '@/lib/date';
import PostAuthorProfileTrigger from '@/components/post/PostAuthorProfileTrigger';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'follows', label: 'Follows' },
  { id: 'replies', label: 'Replies' },
  { id: 'likes', label: 'Likes' },
  { id: 'showcase', label: 'Showcase' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const { data: meData, isLoading: isAuthLoading } = useMeQuery();
  const currentUser = meData?.user;

  // Query ดึงรายการแจ้งเตือนตาม Filter
  const {
    data: notifData,
    isLoading: isNotifsLoading,
    isFetching,
    refetch,
  } = useNotificationsQuery(activeTab, {
    enabled: Boolean(currentUser),
  });

  const markAllMutation = useMarkAllAsReadMutation();
  const markAsReadMutation = useMarkAsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const toggleFollowMutation = useToggleFollowMutation();

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  // จัดการการคลิกที่รายการแจ้งเตือน
  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }

    if (notif.type === 'follow') {
      router.push(`/${notif.actor.username}`);
    } else if (notif.entityType === 'post' && notif.entityId) {
      router.push(`/?post=${notif.entityId}`);
    } else if (notif.entityType === 'showcase') {
      router.push(`/${currentUser?.username || ''}?tab=showcases`);
    }
  };

  // จัดการ Follow Back
  const handleFollowBack = (e, actorId) => {
    e.stopPropagation();
    toggleFollowMutation.mutate(actorId);
  };

  // จัดการลบการแจ้งเตือน
  const handleDelete = (e, notifId) => {
    e.stopPropagation();
    deleteMutation.mutate(notifId);
  };

  // ถ้ายังไม่เข้าสู่ระบบ
  if (!isAuthLoading && !currentUser) {
    return (
      <div className="w-full max-w-2xl xl:max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-400 mb-4 ring-1 ring-gray-100 shadow-2xs">
          <Bell className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Sign in to view notifications
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          เข้าสู่ระบบเพื่อรับการแจ้งเตือนเมื่อมีคนมากดถูกใจ แสดงความคิดเห็น หรือติดตามผลงานของคุณ
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all active:scale-95"
        >
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl xl:max-w-3xl mx-auto px-0 pt-2 sm:pt-4 pb-16 min-h-screen">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors px-2.5 py-1 rounded-xl hover:bg-gray-100 cursor-pointer disabled:opacity-50"
            title="Mark all as read"
          >
            {markAllMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 text-blue-600" />
            )}
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* 2. Filter Tabs (สไตล์ Threads) */}
      <div className="flex items-center gap-1 px-4 sm:px-5 py-2.5 border-b border-gray-100 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Notifications List */}
      <div className="divide-y divide-gray-100">
        {isNotifsLoading ? (
          // Skeleton Loading
          [1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 p-4 sm:p-5 animate-pulse"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-48 rounded bg-gray-200" />
                <div className="h-3 w-32 rounded bg-gray-100" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-gray-100 shrink-0" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          // Empty State
          <div className="py-20 text-center px-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mb-3.5 ring-1 ring-gray-100 shadow-2xs">
              <Bell className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-800">
              No notifications yet
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {activeTab === 'follows'
                ? 'ยังไม่มีผู้ติดตามใหม่ในขณะนี้'
                : activeTab === 'replies'
                ? 'ยังไม่มีการตอบกลับหรือความคิดเห็นใหม่'
                : activeTab === 'likes'
                ? 'ยังไม่มีคนกดถูกใจโพสต์ในขณะนี้'
                : activeTab === 'showcase'
                ? 'ยังไม่มีความเคลื่อนไหวเกี่ยวกับ Showcase'
                : 'เมื่อมีคนมากดถูกใจ ตอบกลับ หรือติดตามคุณ จะปรากฏขึ้นที่นี่'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = !notif.isRead;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`group flex items-start gap-3.5 p-4 sm:p-5 transition-colors cursor-pointer relative ${
                  isUnread
                    ? 'bg-blue-50/30 hover:bg-blue-50/50'
                    : 'bg-white hover:bg-gray-50/70'
                }`}
              >
                {/* Unread Blue Indicator Dot */}
                {isUnread && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}

                {/* Left: Avatar with Type Icon Badge */}
                <div className="relative shrink-0">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative"
                  >
                    <PostAuthorProfileTrigger author={notif.actor} />
                  </div>

                  {/* Icon Badge Overlapping bottom right of avatar */}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white shadow-2xs">
                    {notif.type === 'like' && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-red-500 text-white">
                        <Heart className="h-3 w-3 fill-white" />
                      </div>
                    )}
                    {notif.type === 'comment' && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-500 text-white">
                        <MessageCircle className="h-3 w-3 fill-white" />
                      </div>
                    )}
                    {notif.type === 'follow' && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-white">
                        <UserPlus className="h-2.5 w-2.5" />
                      </div>
                    )}
                    {notif.type === 'showcase_like' && (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-purple-600 text-white">
                        <Sparkles className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Content Description & Snippets */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="text-xs sm:text-sm text-gray-800 leading-snug">
                    <span className="font-bold text-gray-900 hover:underline mr-1.5">
                      {notif.actor.name}
                    </span>

                    {notif.type === 'like' && (
                      <span className="text-gray-600">liked your post</span>
                    )}
                    {notif.type === 'comment' && (
                      <span className="text-gray-600">commented:</span>
                    )}
                    {notif.type === 'follow' && (
                      <span className="text-gray-600">started following you</span>
                    )}
                    {notif.type === 'showcase_like' && (
                      <span className="text-gray-600">appreciated your showcase</span>
                    )}

                    <span className="text-gray-400 text-xs ml-2">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Comment Message Snippet */}
                  {notif.message && notif.type === 'comment' && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2 bg-gray-50/80 rounded-xl p-2 border border-gray-100">
                      &ldquo;{notif.message}&rdquo;
                    </p>
                  )}

                  {/* Post Caption Snippet (ถ้าไม่มีรูป) */}
                  {notif.post?.caption && !notif.post?.thumbnail && notif.type === 'like' && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1 italic">
                      &ldquo;{notif.post.caption}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right: Action Button or Thumbnail */}
                <div className="shrink-0 flex items-center gap-2">
                  {/* Follow Back Button (กรณี Follow) */}
                  {notif.type === 'follow' && (
                    <button
                      type="button"
                      onClick={(e) => handleFollowBack(e, notif.actor.id)}
                      disabled={toggleFollowMutation.isPending}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-2xs ${
                        notif.actor.isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {notif.actor.isFollowing ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <span>Follow Back</span>
                      )}
                    </button>
                  )}

                  {/* Post Image Thumbnail */}
                  {notif.post?.thumbnail && (
                    <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={notif.post.thumbnail}
                        alt="Post media"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Showcase Image Thumbnail */}
                  {notif.showcase?.coverUrl && (
                    <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={notif.showcase.coverUrl}
                        alt="Showcase media"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Delete Button (ปรากฏเมื่อ Hover บนจอ Desktop) */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                    title="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

