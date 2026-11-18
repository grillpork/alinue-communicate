"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Loader2,
  SlidersHorizontal,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { useMeQuery } from "@/features/auth";
import {
  useSearchUsersQuery,
  useToggleFollowMutation,
} from "@/features/user";
import {
  usePostsQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  PostCard,
  PostFormModal,
} from "@/features/post";
import { useServicesQuery, ServiceCard } from "@/features/service";
import UserAvatar from "@/components/common/UserAvatar";

/**
 * การ์ดโปรไฟล์ที่เกี่ยวข้อง พร้อมปุ่ม ติดตาม / กำลังติดตาม (โทนสว่าง ไม่ใช้ bg-black)
 */
function RelatedUserCard({ user, currentUser, onFollowClick }) {
  const [optimisticFollowing, setOptimisticFollowing] = useState(
    Boolean(user.isFollowing),
  );
  const toggleFollowMutation = useToggleFollowMutation();

  useEffect(() => {
    setOptimisticFollowing(Boolean(user.isFollowing));
  }, [user.isFollowing]);

  const isSelf =
    currentUser?.id && String(currentUser.id) === String(user.id);

  const handleFollow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      onFollowClick?.();
      return;
    }
    const nextState = !optimisticFollowing;
    setOptimisticFollowing(nextState);
    toggleFollowMutation.mutate(user.id, {
      onError: () => {
        setOptimisticFollowing(!nextState);
      },
    });
  };

  return (
    <Link
      href={`/${user.username}`}
      className="flex items-center justify-between rounded-2xl border border-gray-200/90 bg-white px-4 py-3.5 shadow-2xs hover:border-gray-300 hover:bg-gray-50/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        <UserAvatar
          src={user.avatar}
          alt={user.name || user.username}
          size="lg"
          className="h-11 w-11 ring-1 ring-gray-200 shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate leading-snug">
            {user.name || user.username}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {user.username}
          </p>
        </div>
      </div>

      {!isSelf ? (
        <button
          type="button"
          onClick={handleFollow}
          disabled={toggleFollowMutation.isPending}
          className={`shrink-0 rounded-xl px-5 py-1.5 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ${
            optimisticFollowing
              ? "border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
              : "border border-gray-200 bg-white text-gray-900 shadow-2xs hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          {optimisticFollowing ? "กำลังติดตาม" : "ติดตาม"}
        </button>
      ) : (
        <span className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-600">
          โปรไฟล์ของคุณ
        </span>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [sortBy, setSortBy] = useState("popular"); // 'popular' ('ยอดนิยม') | 'latest' ('ล่าสุด')
  const [exploreTab, setExploreTab] = useState("all"); // 'all' | 'services' | 'posts'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAllProfiles, setShowAllProfiles] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const inputRef = useRef(null);
  const sortMenuRef = useRef(null);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  const updatePostMutation = useUpdatePostMutation();
  const deletePostMutation = useDeletePostMutation();

  // Sync URL query param (?q=...) when navigating via hashtag links
  useEffect(() => {
    setQuery(urlQuery);
    setDebouncedQuery(urlQuery);
    setShowAllProfiles(false);
  }, [urlQuery]);

  // Debounce live typing so typing immediately searches both users & posts
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close sort dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Active search query
  const cleanQ = debouncedQuery.trim();
  const hasSearched = Boolean(cleanQ);

  // 1. ค้นหาผู้ใช้ / โปรไฟล์ที่เกี่ยวข้อง
  const { data: searchUsersData, isLoading: isLoadingUsers } =
    useSearchUsersQuery(cleanQ, {
      enabled: hasSearched,
    });
  const matchedUsers = searchUsersData?.users || [];

  // 2. ค้นหาบริการที่เกี่ยวข้อง
  const { data: searchServicesData, isLoading: isLoadingSearchServices } =
    useServicesQuery(
      { search: cleanQ, status: "active", limit: 6 },
      { enabled: hasSearched },
    );
  const matchedServices = searchServicesData?.services || [];

  // 3. ค้นหาโพสต์ที่เกี่ยวข้อง
  const { data: postsData, isLoading: isLoadingPosts } = usePostsQuery(
    { search: cleanQ },
    { enabled: hasSearched },
  );
  const rawPosts = postsData?.posts || [];

  // 4. บริการแนะนำ (เมื่อยังไม่ได้ค้นหา)
  const { data: recServicesData, isLoading: isLoadingRecServices } =
    useServicesQuery(
      { status: "active", limit: 8 },
      { enabled: !hasSearched },
    );
  const recommendedServices = useMemo(() => {
    const list = recServicesData?.services || [];
    return [...list].sort((a, b) => {
      const scoreA =
        (Number(a.likesCount) || 0) * 3 +
        (Number(a.viewsCount ?? a.views_count) || 0);
      const scoreB =
        (Number(b.likesCount) || 0) * 3 +
        (Number(b.viewsCount ?? b.views_count) || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
  }, [recServicesData]);

  // 5. โพสต์แนะนำ (เมื่อยังไม่ได้ค้นหา)
  const { data: recPostsData, isLoading: isLoadingRecPosts } = usePostsQuery(
    { limit: 12 },
    { enabled: !hasSearched },
  );
  const recommendedPosts = useMemo(() => {
    const list = recPostsData?.posts || [];
    return [...list].sort((a, b) => {
      const scoreA =
        (Number(a.likesCount) || 0) * 2 + (Number(a.commentsCount) || 0);
      const scoreB =
        (Number(b.likesCount) || 0) * 2 + (Number(b.commentsCount) || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    });
  }, [recPostsData]);

  // เรียงลำดับโพสต์ตามตัวเลือก ยอดนิยม / ล่าสุด
  const sortedPosts = useMemo(() => {
    if (sortBy === "popular") {
      return [...rawPosts].sort((a, b) => {
        const scoreA =
          (Number(a.likesCount) || 0) * 2 + (Number(a.commentsCount) || 0);
        const scoreB =
          (Number(b.likesCount) || 0) * 2 + (Number(b.commentsCount) || 0);
        return scoreB - scoreA;
      });
    }
    return [...rawPosts].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  }, [rawPosts, sortBy]);

  // Submit search
  const handleSearchSubmit = (term) => {
    const target = (term !== undefined ? term : query).trim();
    setQuery(target);
    setDebouncedQuery(target);
    setShowAllProfiles(false);
    if (target) {
      router.replace(`/search?q=${encodeURIComponent(target)}`, {
        scroll: false,
      });
    } else {
      router.replace("/search", { scroll: false });
    }
  };

  // แก้ไข/ลบโพสต์ของตัวเองจากหน้าค้นหา
  const handleUpdatePost = async (data) => {
    if (!editingPost) return;
    const imageList = (data.images || []).map((img) =>
      typeof img === "string" ? img : img.url,
    );
    await updatePostMutation.mutateAsync({
      id: editingPost.id,
      content: data.content,
      images: imageList,
      serviceId: data.serviceId || null,
      serviceTitle: data.serviceTitle || null,
    });
    setEditingPost(null);
  };

  const handleDeletePost = (postId) => {
    if (confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const visibleProfiles = showAllProfiles
    ? matchedUsers
    : matchedUsers.slice(0, 1);

  return (
    <div className="w-full max-w-2xl xl:max-w-3xl mx-auto bg-white min-h-screen pt-3 sm:pt-4 pb-24">
      {/* 1. TOP SEARCH BAR (สไตล์ตัวอย่าง พื้นหลังขาว/สว่าง) */}
      <div className="flex items-center gap-2 px-3.5 sm:px-4 mb-3">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            if (showAllProfiles) {
              setShowAllProfiles(false);
            } else if (hasSearched || query) {
              setQuery("");
              setDebouncedQuery("");
              router.replace("/search", { scroll: false });
            } else {
              router.back();
            }
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Search Input Pill */}
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
            onChange={(e) => {
              setQuery(e.target.value);
              if (showAllProfiles) setShowAllProfiles(false);
            }}
            placeholder="ค้นหาโพสต์, บริการ, ผู้ใช้ หรือ #แฮชแท็ก..."
            className="w-full rounded-2xl border border-gray-200/80 bg-gray-100/80 py-2.5 pl-4 pr-9 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                setShowAllProfiles(false);
                router.replace("/search", { scroll: false });
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Clear text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Filter / Sort Icon Button */}
        <button
          type="button"
          onClick={() => setShowSortMenu((prev) => !prev)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          title="ตัวกรองและการเรียงลำดับ"
          aria-label="Filter and sort"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* More Options Circle Button */}
        <button
          type="button"
          onClick={() => handleSearchSubmit()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          title="ค้นหา"
          aria-label="Search options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      {!hasSearched ? (
        /* ------------------ A. RECOMMENDED EXPLORE STATE (Services & Posts) ------------------ */
        <div className="animate-in fade-in duration-150">
          {/* Minimal Filter Pills */}
          <div className="flex items-center gap-1.5 px-3.5 sm:px-4 pt-1 pb-3">
            {[
              { id: "all", label: "ทั้งหมด" },
              { id: "services", label: "บริการแนะนำ" },
              { id: "posts", label: "โพสต์แนะนำ" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setExploreTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  exploreTab === tab.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. บริการแนะนำ (Recommended Services) */}
          {(exploreTab === "all" || exploreTab === "services") && (
            <section className="pb-4">
              <div className="flex items-center justify-between px-3.5 sm:px-4 mb-2">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                  บริการแนะนำ
                </h2>
                {exploreTab === "all" && recommendedServices.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setExploreTab("services")}
                    className="flex items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <span>ดูทั้งหมด</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {isLoadingRecServices ? (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {[0, 1].map((idx) => (
                    <div
                      key={idx}
                      className="px-4 py-5 space-y-3 animate-pulse bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-28 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-16 rounded-full bg-gray-100" />
                        </div>
                      </div>
                      <div className="h-3.5 w-2/3 rounded-full bg-gray-100" />
                      <div className="h-44 w-full rounded-2xl bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : recommendedServices.length > 0 ? (
                <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                  {(exploreTab === "all"
                    ? recommendedServices.slice(0, 3)
                    : recommendedServices
                  ).map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      currentUserId={currentUser?.id}
                      variant="feed"
                    />
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-gray-400">
                  ยังไม่มีบริการแนะนำในขณะนี้
                </p>
              )}
            </section>
          )}

          {/* 2. โพสต์แนะนำ (Recommended Posts) */}
          {(exploreTab === "all" || exploreTab === "posts") && (
            <section>
              <div className="flex items-center justify-between px-3.5 sm:px-4 mb-2">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                  โพสต์แนะนำ
                </h2>
              </div>

              {isLoadingRecPosts ? (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="px-4 py-5 space-y-3 animate-pulse bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-100" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-28 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-16 rounded-full bg-gray-100" />
                        </div>
                      </div>
                      <div className="h-3.5 w-5/6 rounded-full bg-gray-100" />
                      <div className="h-44 w-full rounded-2xl bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : recommendedPosts.length > 0 ? (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {recommendedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={(p) => setEditingPost(p)}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-10 text-center text-xs text-gray-400">
                  ยังไม่มีโพสต์แนะนำในขณะนี้
                </p>
              )}
            </section>
          )}
        </div>
      ) : (
        /* ------------------ B. SEARCH RESULTS STATE ------------------ */
        <div className="animate-in fade-in duration-150">
          {/* Header Row: ยอดนิยม v  |  โปรไฟล์ที่เกี่ยวข้อง > */}
          <div className="flex items-center justify-between px-3.5 sm:px-4 py-2">
            {/* Sort Dropdown (ยอดนิยม / ล่าสุด) */}
            <div ref={sortMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu((prev) => !prev)}
                className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <span>{sortBy === "popular" ? "ยอดนิยม" : "ล่าสุด"}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showSortMenu && (
                <div className="absolute left-0 mt-1.5 w-36 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("popular");
                      setShowSortMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer"
                  >
                    <span>ยอดนิยม</span>
                    {sortBy === "popular" && (
                      <Check className="h-3.5 w-3.5 text-gray-900" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("latest");
                      setShowSortMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer"
                  >
                    <span>ล่าสุด</span>
                    {sortBy === "latest" && (
                      <Check className="h-3.5 w-3.5 text-gray-900" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* โปรไฟล์ที่เกี่ยวข้อง > */}
            {matchedUsers.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllProfiles((prev) => !prev)}
                className="flex items-center gap-0.5 text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <span>
                  {showAllProfiles
                    ? "แสดงโพสต์ทั้งหมด"
                    : `โปรไฟล์ที่เกี่ยวข้อง${matchedUsers.length > 1 ? ` (${matchedUsers.length})` : ""}`}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoadingUsers && isLoadingPosts && isLoadingSearchServices && (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <p className="text-xs">กำลังค้นหา...</p>
            </div>
          )}

          {/* Results Content */}
          {(!isLoadingUsers || !isLoadingPosts || !isLoadingSearchServices) && (
            <>
              {/* 1. Related Profile Card(s) */}
              {matchedUsers.length > 0 && (
                <div className="px-3.5 sm:px-4 pt-1 pb-3 space-y-2.5">
                  {visibleProfiles.map((user) => (
                    <RelatedUserCard
                      key={user.id}
                      user={user}
                      currentUser={currentUser}
                      onFollowClick={() => router.push("/sign-in")}
                    />
                  ))}
                </div>
              )}

              {/* 2. Matching Services */}
              {!showAllProfiles && matchedServices.length > 0 && (
                <div className="pt-1 pb-2">
                  <p className="px-3.5 sm:px-4 text-xs font-semibold text-gray-400 mb-2">
                    บริการที่เกี่ยวข้อง
                  </p>
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {matchedServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        currentUserId={currentUser?.id}
                        variant="feed"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Full Posts Feed */}
              {!showAllProfiles && sortedPosts.length > 0 && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {sortedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={(p) => setEditingPost(p)}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </div>
              )}

              {/* 4. Empty State */}
              {!isLoadingUsers &&
                !isLoadingPosts &&
                !isLoadingSearchServices &&
                matchedUsers.length === 0 &&
                matchedServices.length === 0 &&
                sortedPosts.length === 0 && (
                  <div className="py-20 px-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-50 text-gray-300 mb-3 ring-1 ring-gray-100">
                      <Search className="h-7 w-7" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">
                      ไม่พบผู้ใช้ บริการ หรือโพสต์ที่ตรงกับ &ldquo;{cleanQ}&rdquo;
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      ลองค้นหาด้วยชื่อผู้ใช้, บริการ, แฮชแท็ก หรือคำสำคัญอื่น
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* Modal แก้ไขโพสต์ (กรณีเป็นเจ้าของโพสต์) */}
      <PostFormModal
        isOpen={Boolean(editingPost)}
        isEdit={Boolean(editingPost)}
        initialPost={editingPost}
        onClose={() => setEditingPost(null)}
        onSubmit={handleUpdatePost}
      />
    </div>
  );
}
