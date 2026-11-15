"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, UserX, ArrowLeft } from "lucide-react";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileTabContent,
  useProfileData,
  useProfileTabs,
  parseUsername,
  parseSlugArray,
  buildProfileTabUrl,
} from "@/features/user-profile";
import { useUpdateProfileMutation } from "@/features/user";
import {
  PostFormModal,
  PostDetailModal,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} from "@/features/post";
import {
  ShowcaseModal,
  CreateShowcaseModal,
} from "@/features/showcase";
import {
  ServiceDetailModal,
  CreateServiceModal,
} from "@/features/service";

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

  // 2. Tabs logic
  const { activeTab, changeTab } = useProfileTabs({
    username,
    slugArray,
  });

  // 3. Data queries & derived detail states (Optimized with guarded fetching)
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
    isError,
    showcases,
    services,
    posts,
    likedPosts,
    bookmarkedPosts,
    selectedShowcase,
    selectedService,
    selectedPost,
  } = profileData;

  // Tabs with counts badge
  const { tabs: computedTabs } = useProfileTabs({
    username,
    slugArray,
    profile,
    counts: {
      showcases: showcases.length,
      services: services.length,
      posts: posts.length,
      likes: likedPosts.length,
      bookmarks: bookmarkedPosts.length,
    },
    isSelf,
  });

  // 4. Creation Modals & Post Editing
  const [isShowcaseCreateOpen, setIsShowcaseCreateOpen] = useState(false);
  const [isServiceCreateOpen, setIsServiceCreateOpen] = useState(false);
  const [isPostCreateOpen, setIsPostCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const createPostMutation = useCreatePostMutation();
  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();
  const updateProfileMutation = useUpdateProfileMutation();

  const handleCreatePost = async (data) => {
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
      setIsPostCreateOpen(false);
    }
  };

  const handleDeletePost = (postId) => {
    if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleCloseDetailModal = () => {
    const url = buildProfileTabUrl(username, activeTab);
    router.replace(url, { scroll: false });
  };

  // Loading state
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

  // Not found state
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
    bio: profile.bio || "",
    website: profile.website || "",
    socialLinks: profile.socialLinks || {},
    location: profile.location || "",
    note: profile.note || "Tell there what you think.",
    isVerified: Boolean(profile.isVerified ?? true),
    joinedDate: profile.joinedDate,
    avatar: profile.avatar || profile.avatarUrl || null,
    banner: profile.banner || "/empty/no-image.png",
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
        tabs={computedTabs}
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
          onOpenCreateShowcase: () => setIsShowcaseCreateOpen(true),
          onOpenCreateService: () => setIsServiceCreateOpen(true),
          onOpenCreatePost: () => setIsPostCreateOpen(true),
          onEditPost: (p) => setEditingPost(p),
          onDeletePost: handleDeletePost,
        }}
      />

      {/* 4. Creation Modals */}
      <CreateShowcaseModal
        isOpen={isShowcaseCreateOpen}
        onClose={() => setIsShowcaseCreateOpen(false)}
      />

      <CreateServiceModal
        isOpen={isServiceCreateOpen}
        onClose={() => setIsServiceCreateOpen(false)}
      />

      <PostFormModal
        isOpen={isPostCreateOpen || Boolean(editingPost)}
        isEdit={Boolean(editingPost)}
        initialPost={editingPost}
        onClose={() => {
          setIsPostCreateOpen(false);
          setEditingPost(null);
        }}
        onSubmit={handleCreatePost}
      />

      {/* 5. URL-driven Detail Modals (URL is Single Source of Truth) */}
      {selectedShowcase && (
        <ShowcaseModal
          showcase={selectedShowcase}
          isOpen={Boolean(selectedShowcase)}
          onClose={handleCloseDetailModal}
          currentUserId={currentUser?.id}
          isOwner={
            isSelf ||
            (currentUser &&
              (Number(currentUser.id) ===
                Number(selectedShowcase.userId || selectedShowcase.author?.id) ||
                currentUser.username?.toLowerCase() ===
                  selectedShowcase.author?.username?.toLowerCase()))
          }
        />
      )}

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={Boolean(selectedService)}
          onClose={handleCloseDetailModal}
          currentUserId={currentUser?.id}
          isOwner={
            isSelf ||
            (currentUser &&
              (Number(currentUser.id) ===
                Number(selectedService.userId || selectedService.author?.id) ||
                currentUser.username?.toLowerCase() ===
                  selectedService.author?.username?.toLowerCase()))
          }
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={Boolean(selectedPost)}
          onClose={handleCloseDetailModal}
          onDelete={handleCloseDetailModal}
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
