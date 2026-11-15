"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, UserX, ArrowLeft, AlertTriangle, RotateCcw } from "lucide-react";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileTabContent,
  ProfileModals,
  useProfileData,
  useProfileNavigation,
  useProfileTabItems,
  parseUsername,
  parseSlugArray,
  buildProfileTabUrl,
} from "@/features/user-profile";
import { useUpdateProfileMutation } from "@/features/user";
import {
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} from "@/features/post";

function UserProfileContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // 1. URL Parsing (Source of Truth)
  const username = useMemo(
    () => parseUsername(params?.username),
    [params?.username],
  );
  const slugArray = useMemo(
    () => parseSlugArray(params?.slug),
    [params?.slug],
  );

  // 2. Navigation Hook (Active Tab & URL synchronization)
  const { activeTab, changeTab } = useProfileNavigation({
    username,
    slugArray,
  });

  // 3. Data Query Hook (Protected & Lazy-loaded Queries)
  const profileData = useProfileData({
    username,
    slugArray,
    searchParams,
    activeTab,
  });

  const {
    currentUser,
    isSelf,
    profile,
    isProfileLoading,
    isProfileError,
    profileError,
    refetchProfile,
    counts,
    selectedShowcase,
    selectedService,
    selectedPost,
  } = profileData;

  // 4. Tab Items Hook (Using API stats/total counts)
  const { tabs } = useProfileTabItems({
    profile,
    counts,
    isSelf,
  });

  // 5. Discriminated Modal State Management
  const [modal, setModal] = useState({
    type: null, // "create-showcase" | "create-service" | "create-post" | "edit-post"
    data: null,
  });

  const closeModal = useCallback(() => {
    setModal({ type: null, data: null });
  }, []);

  // Mutations
  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  // Post Submission Handler (Sanitized images, unified payload, error safety)
  const handleCreatePost = async (data) => {
    const imageList = (data.images || [])
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean);

    const payload = {
      content: data.content,
      images: imageList,
      serviceId: data.serviceId || null,
      serviceTitle: data.serviceTitle || null,
    };

    try {
      if (modal.type === "edit-post" && modal.data?.id) {
        await updatePostMutation.mutateAsync({
          id: modal.data.id,
          ...payload,
        });
      } else {
        await createPostMutation.mutateAsync(payload);
      }
      closeModal();
    } catch (error) {
      console.error("Post submission failed:", error);
      throw error;
    }
  };

  const handleCloseDetailModal = useCallback(() => {
    const url = buildProfileTabUrl(username, activeTab, searchParams);
    router.replace(url, { scroll: false });
  }, [username, activeTab, searchParams, router]);

  // Delete Post Handler (Async confirm + mutation + close modal only on success)
  const handleDeletePost = useCallback(
    async (postId) => {
      if (!confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
        return;
      }

      try {
        await deletePostMutation.mutateAsync(postId);

        // ปิด modal เฉพาะเมื่อโพสต์ที่กำลังเปิดดูอยู่คือโพสต์ที่เพิ่งลบสำเร็จ
        if (String(selectedPost?.id) === String(postId)) {
          handleCloseDetailModal();
        }
      } catch (error) {
        console.error("Failed to delete post:", error);
      }
    },
    [deletePostMutation, selectedPost?.id, handleCloseDetailModal],
  );

  // Memoized User Object with correct isVerified default
  const user = useMemo(() => {
    if (!profile) return null;
    return {
      id: profile.id,
      name: profile.name || profile.displayName || profile.username,
      username: profile.username,
      bio: profile.bio || "",
      website: profile.website || "",
      socialLinks: profile.socialLinks || {},
      location: profile.location || "",
      note: profile.note || "Tell there what you think.",
      isVerified: Boolean(profile.isVerified ?? false), // Fixed bug: defaults to false
      joinedDate: profile.joinedDate,
      avatar: profile.avatar || profile.avatarUrl || null,
      banner: profile.banner || "/empty/no-image.png",
      stats: profile.stats || {
        posts: counts.posts,
        followers: 0,
        following: 0,
        viewing: 0,
        likes: counts.likes,
      },
      isFollowing: profile.isFollowing,
    };
  }, [profile, counts.posts, counts.likes]);

  // 1. Loading state
  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 mb-3" />
        <p className="text-xs font-medium">
          Loading @{username}&apos;s profile...
        </p>
      </div>
    );
  }

  // 2. Network Error State (แยกจาก 404 Not Found)
  const isNotFound =
    profileError?.status === 404 ||
    profileError?.statusCode === 404 ||
    (!profile && !isProfileError);

  if (isProfileError && !isNotFound) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xs my-8 max-w-md mx-auto">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-base font-bold text-gray-900">
          เกิดข้อผิดพลาดในการโหลดข้อมูล
        </h2>
        <p className="text-xs text-gray-400 mt-1 mb-5">
          ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง
        </p>
        <button
          type="button"
          onClick={() => refetchProfile()}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>ลองใหม่อีกครั้ง</span>
        </button>
      </div>
    );
  }

  // 3. User Not Found (404)
  if (isNotFound || !profile || !user) {
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

  return (
    <div className="w-full pb-16">
      {/* 1. Profile Header */}
      <ProfileHeader
        user={user}
        isSelf={isSelf}
        onUpdateNote={
          isSelf ? (note) => updateProfileMutation.mutate({ note }) : undefined
        }
      />

      {/* 2. Navigation Tabs (Sticky Top) */}
      <ProfileTabs
        tabs={tabs}
        activeTab={activeTab}
        onChangeTab={changeTab}
      />

      {/* 3. Tab Content */}
      <ProfileTabContent
        activeTab={activeTab}
        username={username}
        isSelf={isSelf}
        currentUser={currentUser}
        data={profileData}
        callbacks={{
          onOpenCreateShowcase: () =>
            setModal({ type: "create-showcase", data: null }),
          onOpenCreateService: () =>
            setModal({ type: "create-service", data: null }),
          onOpenCreatePost: () =>
            setModal({ type: "create-post", data: null }),
          onEditPost: (post) => setModal({ type: "edit-post", data: post }),
          onDeletePost: handleDeletePost,
        }}
      />

      {/* 4. Unified Modal Manager (Create, Edit & URL Detail Modals) */}
      <ProfileModals
        modal={modal}
        onCloseModal={closeModal}
        onSubmitPost={handleCreatePost}
        detailModals={{
          selectedShowcase,
          selectedService,
          selectedPost,
          onCloseDetail: handleCloseDetailModal,
          onDeletePost: handleDeletePost,
        }}
        currentUser={currentUser}
        isSelf={isSelf}
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
