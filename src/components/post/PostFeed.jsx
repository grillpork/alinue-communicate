'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  User,
  Image as ImageIcon,
  Video,
  Smile,
  AlignLeft,
  MapPin,
  Music,
} from 'lucide-react';
import PostCard from './PostCard';
import PostFormModal from './PostFormModal';
import PostDetailModal from './PostDetailModal';
import EmptyState from '@/components/shared/EmptyState';
import { useMeQuery } from '@/services/auth';
import {
  usePostsQuery,
  usePostQuery,
  useCreatePostMutation,
  useDeletePostMutation,
} from '@/services/post';

export default function PostFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedPostId = searchParams?.get('post');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSharedPost, setActiveSharedPost] = useState(null);

  // ตรวจสอบและดึงข้อมูลโพสต์ที่ถูกแชร์ผ่าน URL query (?post=ID)
  const { data: sharedPostData } = usePostQuery(sharedPostId, {
    enabled: Boolean(sharedPostId),
  });

  useEffect(() => {
    if (sharedPostData?.post) {
      setActiveSharedPost(sharedPostData.post);
    }
  }, [sharedPostData?.post]);

  // 1. ดึงข้อมูล User จริงจาก Neon DB
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  // 2. ดึงโพสต์จริงจาก Neon DB ผ่าน TanStack Query
  const { data: postsData, isLoading } = usePostsQuery();

  const createPostMutation = useCreatePostMutation();
  const deletePostMutation = useDeletePostMutation();

  const posts = postsData?.posts || [];

  // คลิกแถบเปิดสร้างโพสต์
  const handleOpenPostModal = () => {
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }
    setIsModalOpen(true);
  };

  // สร้างโพสต์ใหม่ลง Neon DB ผ่าน TanStack Query Mutation
  const handleCreatePost = async (data) => {
    try {
      const imageList = (data.images || []).map((img) =>
        typeof img === 'string' ? img : img.url
      );

      await createPostMutation.mutateAsync({
        content: data.content,
        images: imageList,
        serviceId: data.serviceId || null,
        serviceTitle: data.serviceTitle || null,
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create post:', err);
      throw err;
    }
  };

  const handleDeletePost = (postId) => {
    deletePostMutation.mutate(postId);
  };

  return (
    <div className="w-full mx-auto max-w-2xl xl:max-w-3xl px-0 pt-2 sm:pt-4 pb-12">
      {/* 1. Top Post Input Trigger (แสดง User จริง หรือปุ่มชวนเข้าสู่ระบบ พร้อม Icon บาร์ Image, GIF, Video สไตล์ Threads) */}
      <div className="px-3 sm:px-4 mb-4">
        <div
          onClick={handleOpenPostModal}
          className="rounded-2xl border border-gray-100 bg-white py-3 px-3 sm:px-4 cursor-pointer hover:bg-gray-50/50 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full ring-2 ring-gray-100 bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName || currentUser.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <span className="text-xs sm:text-sm text-gray-400 font-normal truncate">
                {currentUser
                  ? `${currentUser.displayName || currentUser.username}, มีอะไรใหม่...`
                  : 'Sign in to share your design...'}
              </span>
            </div>

            {/* Posts Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="rounded-full bg-black hover:bg-gray-800 text-white text-xs sm:text-sm font-medium px-4 py-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
            >
              {currentUser ? 'Posts' : 'Sign in'}
            </button>
          </div>

          {/* Media Icons Bar: Image, Smile, Poll, Location, Music (สไตล์ Threads) */}
          <div className="mt-3 pt-2.5 border-t border-gray-100/70 flex items-center gap-1 sm:gap-2 text-gray-400">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="เพิ่มรูปภาพ (JPG, PNG, WebP)"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="อิโมจิ"
            >
              <Smile className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="รายการ / โพลล์"
            >
              <AlignLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="สถานที่"
            >
              <MapPin className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPostModal();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="เพลง / เสียง"
            >
              <Music className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Feed List (ดึงจาก Neon DB จริง) */}
      <div className="divide-y divide-gray-100">
        {/* Pending Post Skeleton (แสดงทันทีกำลังสร้างโพสต์) */}
        {createPostMutation.isPending && (
          <div className="py-4 px-3.5 sm:px-4 border-b border-gray-100 bg-gray-50/60 animate-pulse transition-all">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-28 rounded-full bg-gray-200" />
                  <span className="text-[11px] font-medium text-gray-400">กำลังเผยแพร่...</span>
                </div>
                <div className="h-3 w-3/4 rounded-full bg-gray-200/80" />
                <div className="h-44 w-full rounded-2xl bg-gray-200/60 mt-3" />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((n) => (
              <div key={n} className="py-4 px-3.5 sm:px-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-32 rounded-full bg-gray-200" />
                      <div className="h-3 w-16 rounded-full bg-gray-100" />
                    </div>
                    <div className="h-3.5 w-5/6 rounded-full bg-gray-200/80" />
                    <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                    <div className="h-44 w-full rounded-2xl bg-gray-100 mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          searchQuery.trim() ? (
            <div className="py-16 text-center text-xs text-gray-400">
              No posts found matching &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            <EmptyState imageSrc="/empty/no-content.png" />
          )
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Modal สร้างโพสต์ (PostFormModal) */}
      <PostFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      {/* Modal แสดงโพสต์ที่ถูกแชร์มาโดยตรงผ่าน URL (?post=ID) */}
      {activeSharedPost && (
        <PostDetailModal
          post={activeSharedPost}
          isOpen={Boolean(activeSharedPost)}
          onClose={() => {
            setActiveSharedPost(null);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('post');
              window.history.replaceState({}, '', url.pathname + (url.search || ''));
            }
          }}
        />
      )}
    </div>
  );
}
