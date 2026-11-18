"use client";

import React, { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "./PostCard";
import PostFormModal from "./PostFormModal";
import PostDetailModal from "./PostDetailModal";
import EmptyState from "@/components/ui/empty-state";
import { NotesBar } from "@/features/user";
import {
  usePostsQuery,
  usePostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} from "../hooks/use-posts";

export default function PostFeed({ initialPostsPromise }) {
  // แกะข้อมูลโพสต์ชุดแรกจาก Streaming Promise ด้วย React 19 use() ใต้ Suspense
  const initialData = initialPostsPromise ? use(initialPostsPromise) : undefined;

  const searchParams = useSearchParams();
  const sharedPostId = searchParams?.get("post");
  const [editingPost, setEditingPost] = useState(null);
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

  // ดึงโพสต์จริงจาก Neon DB ผ่าน TanStack Query (ใช้ initialData เพื่อไม่ต้องรอ Loading บน Client)
  const { data: postsData = initialData, isLoading } = usePostsQuery(
    undefined,
    initialData ? { initialData } : undefined,
  );

  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();

  const posts = postsData?.posts || [];

  // สร้างหรือแก้ไขโพสต์ลง Neon DB ผ่าน TanStack Query Mutation
  const handleCreatePost = async (data) => {
    try {
      const imageList = (data.images || []).map((img) =>
        typeof img === "string" ? img : img.url,
      );

      if (editingPost) {
        await updatePostMutation.mutateAsync({
          id: editingPost.id,
          content: data.content,
          images: imageList,
          serviceId: data.serviceId || null,
          serviceTitle: data.serviceTitle || null,
        });
        setEditingPost(null);
      } else {
        await createPostMutation.mutateAsync({
          content: data.content,
          images: imageList,
          serviceId: data.serviceId || null,
          serviceTitle: data.serviceTitle || null,
        });
      }
    } catch (err) {
      console.error("Failed to submit post:", err);
      throw err;
    }
  };

  const handleDeletePost = (postId) => {
    if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
  };

  return (
    <div className="w-full mx-auto max-w-2xl xl:max-w-3xl px-0 pt-1 sm:pt-2 pb-12">
      {/* 1. แถบโน้ตสไตล์ Profile (แสดงโน้ตของตัวเองและเพื่อน) */}
      <NotesBar />

      {/* 2. Feed List (ดึงจาก Neon DB จริง) */}
      <div className="divide-y divide-gray-100">
        {/* Pending Post Skeleton (แสดงทันทีกำลังสร้างโพสต์) */}
        {createPostMutation.isPending && (
          <div className="py-4 px-3.5 sm:px-4 border-b border-gray-100 bg-gray-50/60 animate-pulse transition-all">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-28 rounded-full bg-gray-200" />
                  <span className="text-[11px] font-medium text-gray-400">
                    กำลังเผยแพร่...
                  </span>
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
          <EmptyState imageSrc="/empty/no-content.png" />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {/* Modal แก้ไขโพสต์ (PostFormModal) */}
      <PostFormModal
        isOpen={Boolean(editingPost)}
        isEdit={Boolean(editingPost)}
        initialPost={editingPost}
        onClose={() => setEditingPost(null)}
        onSubmit={handleCreatePost}
      />

      {/* Modal แสดงโพสต์ที่ถูกแชร์มาโดยตรงผ่าน URL (?post=ID) */}
      {activeSharedPost && (
        <PostDetailModal
          post={activeSharedPost}
          isOpen={Boolean(activeSharedPost)}
          onClose={() => {
            setActiveSharedPost(null);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("post");
              window.history.replaceState(
                {},
                "",
                url.pathname + (url.search || ""),
              );
            }
          }}
        />
      )}
    </div>
  );
}
