"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Grid,
  Heart,
  Loader2,
  UserX,
  ArrowLeft,
  Briefcase,
  Bookmark,
  LayoutList,
} from "lucide-react";
import {
  ProfileHeader,
  useUserProfileQuery,
  useUserPostsQuery,
  useUserLikedPostsQuery,
  useUpdateProfileMutation,
  ShowcasesTab,
  ServicesTab,
  PostsTab,
  LikedPostsTab,
  BookmarksTab,
} from "@/features/user";
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
  useShowcasesQuery,
} from "@/features/showcase";
import {
  ServiceDetailModal,
  CreateServiceModal,
  useServicesQuery,
} from "@/features/service";
import { useMeQuery } from "@/features/auth";
import { useBookmarks } from "@/features/bookmark";
import { slugify } from "@/lib/slug";

const VALID_TABS = ["showcases", "services", "posts", "likes", "bookmarks"];

function UserProfileContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // 1. URL parsing (Source of Truth)
  const rawUsername = params?.username;
  const username = useMemo(() => {
    return typeof rawUsername === "string"
      ? decodeURIComponent(rawUsername).replace(/^@/, "")
      : "";
  }, [rawUsername]);

  const slugArray = useMemo(() => {
    if (!params?.slug) return [];
    return Array.isArray(params.slug) ? params.slug : [params.slug];
  }, [params?.slug]);

  // Derived Active Tab จาก URL
  const activeTab = useMemo(() => {
    if (slugArray[0] === "showcases") return "showcases";
    if (slugArray[0] === "services") return "services";
    const tab = searchParams?.get("tab");
    if (tab && VALID_TABS.includes(tab)) return tab;
    return "showcases";
  }, [slugArray, searchParams]);

  // Derived Slugs จาก URL
  const showcaseSlug = useMemo(() => {
    if (slugArray[0] === "showcases" && slugArray[1]) {
      return decodeURIComponent(slugArray[1]);
    }
    return searchParams?.get("showcase") || null;
  }, [slugArray, searchParams]);

  const serviceSlug = useMemo(() => {
    if (slugArray[0] === "services" && slugArray[1]) {
      return decodeURIComponent(slugArray[1]);
    }
    return searchParams?.get("service") || null;
  }, [slugArray, searchParams]);

  const postSlug = useMemo(() => {
    if (
      slugArray.length === 1 &&
      slugArray[0] !== "showcases" &&
      slugArray[0] !== "services"
    ) {
      return decodeURIComponent(slugArray[0]);
    }
    return null;
  }, [slugArray]);

  // 2. Auth & Current User
  const { data: meData, isLoading: isMeLoading } = useMeQuery();
  const currentUser = meData?.user;
  const isSelf = Boolean(
    currentUser?.username &&
      username &&
      currentUser.username.toLowerCase() === username.toLowerCase(),
  );

  // 3. User Profile Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError,
  } = useUserProfileQuery(username, {
    enabled: Boolean(username),
  });
  const profile = profileData?.profile || null;

  // 4. React Query Data (Guarded & Lazy-loaded per Active Tab to prevent duplicate requests)
  const { data: showcasesData, isLoading: isShowcasesLoading } =
    useShowcasesQuery(
      { username },
      {
        enabled:
          Boolean(username) &&
          (activeTab === "showcases" || Boolean(showcaseSlug)),
      },
    );
  const showcases = showcasesData?.showcases || [];

  const { data: servicesData, isLoading: isServicesLoading } = useServicesQuery(
    { username, status: isSelf ? "all" : "active" },
    {
      enabled:
        Boolean(username) &&
        !isMeLoading &&
        (activeTab === "services" || Boolean(serviceSlug)),
    },
  );
  const services = servicesData?.services || [];

  const { data: postsData, isLoading: isPostsLoading } = useUserPostsQuery(
    profile?.id,
    {
      enabled:
        Boolean(profile?.id) && (activeTab === "posts" || Boolean(postSlug)),
    },
  );
  const posts = postsData?.posts || [];

  const { data: likedPostsData, isLoading: isLikedPostsLoading } =
    useUserLikedPostsQuery(profile?.id, {
      enabled: Boolean(profile?.id) && activeTab === "likes",
    });
  const likedPosts = likedPostsData?.posts || [];

  const { bookmarks: bookmarkedPosts } = useBookmarks();

  // 5. Derived Selected Items for Detail Modals (No useState/useEffect needed!)
  const selectedShowcase = useMemo(() => {
    if (!showcaseSlug || showcases.length === 0) return null;
    return (
      showcases.find(
        (s) =>
          slugify(s.title) === showcaseSlug ||
          String(s.id) === showcaseSlug ||
          s.title?.toLowerCase() === showcaseSlug.toLowerCase(),
      ) || null
    );
  }, [showcaseSlug, showcases]);

  const selectedService = useMemo(() => {
    if (!serviceSlug || services.length === 0) return null;
    return (
      services.find(
        (s) =>
          slugify(s.title) === serviceSlug ||
          String(s.id) === serviceSlug ||
          s.title?.toLowerCase() === serviceSlug.toLowerCase(),
      ) || null
    );
  }, [serviceSlug, services]);

  const selectedPost = useMemo(() => {
    if (!postSlug || posts.length === 0) return null;
    return (
      posts.find(
        (p) =>
          slugify(p.title || p.content?.slice(0, 50)) === postSlug ||
          String(p.id) === postSlug,
      ) || null
    );
  }, [postSlug, posts]);

  // 6. Navigation & URL Updates (Source of Truth)
  const handleTabChange = (tabId) => {
    const url = `/${username}${tabId !== "showcases" ? `?tab=${tabId}` : ""}`;
    router.replace(url, { scroll: false });
  };

  const handleCloseDetailModal = () => {
    const url = `/${username}${activeTab !== "showcases" ? `?tab=${activeTab}` : ""}`;
    router.replace(url, { scroll: false });
  };

  // 7. Creation Modals State
  const [isShowcaseCreateOpen, setIsShowcaseCreateOpen] = useState(false);
  const [isServiceCreateOpen, setIsServiceCreateOpen] = useState(false);
  const [isPostCreateOpen, setIsPostCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Mutations
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
      {/* 1. Custom Glassmorphism Profile Header */}
      <ProfileHeader
        user={user}
        isSelf={isSelf}
        onUpdateNote={
          isSelf ? (note) => updateProfileMutation.mutate({ note }) : undefined
        }
      />

      {/* 2. Navigation Tabs (Sticky Top) */}
      <div className="sticky top-[53px] lg:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-2 sm:px-0 transition-all">
        <div className="flex">
          {[
            {
              id: "showcases",
              label: "Showcase",
              icon: Briefcase,
              count: showcases.length > 0 ? showcases.length : undefined,
            },
            {
              id: "services",
              label: "Services",
              icon: LayoutList,
              count: services.length > 0 ? services.length : undefined,
            },
            {
              id: "posts",
              label: "Posts",
              icon: Grid,
              count: profile?.stats?.posts || (posts.length > 0 ? posts.length : undefined),
            },
            {
              id: "likes",
              label: "Likes",
              icon: Heart,
              count: profile?.stats?.likes || (likedPosts.length > 0 ? likedPosts.length : undefined),
            },
            {
              id: "bookmarks",
              label: "Bookmark",
              icon: Bookmark,
              count:
                isSelf && bookmarkedPosts.length > 0
                  ? bookmarkedPosts.length
                  : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                title={tab.label}
                aria-label={tab.label}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span className="hidden sm:inline text-[11px] text-gray-400">
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Content (Extracted Tab Components) */}
      <div className="mt-4 px-2 sm:px-0">
        {activeTab === "showcases" && (
          <ShowcasesTab
            showcases={showcases}
            isLoading={isShowcasesLoading}
            isSelf={isSelf}
            username={username}
            currentUser={currentUser}
            onOpenCreate={() => setIsShowcaseCreateOpen(true)}
          />
        )}

        {activeTab === "services" && (
          <ServicesTab
            services={services}
            isLoading={isServicesLoading}
            isSelf={isSelf}
            username={username}
            currentUser={currentUser}
            onOpenCreate={() => setIsServiceCreateOpen(true)}
          />
        )}

        {activeTab === "posts" && (
          <PostsTab
            posts={posts}
            isLoading={isPostsLoading}
            isSelf={isSelf}
            username={username}
            onOpenCreate={() => setIsPostCreateOpen(true)}
            onEditPost={(p) => setEditingPost(p)}
            onDeletePost={handleDeletePost}
          />
        )}

        {activeTab === "likes" && (
          <LikedPostsTab
            likedPosts={likedPosts}
            isLoading={isLikedPostsLoading}
            isSelf={isSelf}
            username={username}
          />
        )}

        {activeTab === "bookmarks" && (
          <BookmarksTab
            bookmarkedPosts={bookmarkedPosts}
            isSelf={isSelf}
            username={username}
          />
        )}
      </div>

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
                Number(
                  selectedShowcase.userId || selectedShowcase.author?.id,
                ) ||
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
