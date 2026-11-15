"use client";

import { useMemo, useCallback } from "react";
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useUserLikedPostsQuery,
} from "@/features/user";
import { useShowcasesQuery } from "@/features/showcase";
import { useServicesQuery } from "@/features/service";
import { useBookmarks } from "@/features/bookmark";
import { useMeQuery } from "@/features/auth";
import {
  getShowcaseSlug,
  getServiceSlug,
  getPostSlug,
} from "../utils/profile-url";
import { matchSlug, isContentOwner } from "../utils/profile-parser";

export function useProfileData({
  username,
  slugArray,
  searchParams,
  activeTab,
}) {
  // 1. Auth & Permissions
  const { data: meData, isLoading: isMeLoading } = useMeQuery();
  const currentUser = meData?.user;

  const isSelf = useMemo(() => {
    return Boolean(
      currentUser?.username &&
        username &&
        currentUser.username.toLowerCase() === username.toLowerCase(),
    );
  }, [currentUser?.username, username]);

  const checkIsOwner = useCallback(
    (content) => {
      if (isSelf) return true;
      return isContentOwner(currentUser, content);
    },
    [isSelf, currentUser],
  );

  // 2. User Profile Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    isSuccess: isProfileSuccess,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfileQuery(username, {
    enabled: Boolean(username),
  });
  const profile = profileData?.profile || null;

  // แยกสถานะ Not Found (404) กับ Network Error ชัดเจน ไม่เดาจากความว่างเปล่า
  const isProfileNotFound =
    profileError?.status === 404 ||
    profileError?.statusCode === 404 ||
    (isProfileSuccess && !profile);

  const isNetworkError = isProfileError && !isProfileNotFound;

  // Slugs parsed from URL
  const showcaseSlug = useMemo(
    () => getShowcaseSlug(slugArray, searchParams),
    [slugArray, searchParams],
  );
  const serviceSlug = useMemo(
    () => getServiceSlug(slugArray, searchParams),
    [slugArray, searchParams],
  );
  const postSlug = useMemo(() => getPostSlug(slugArray), [slugArray]);

  // 3. Showcases Query (Lazy loaded when showcases tab or detail active)
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

  // 4. Services Query (รอจนกว่าจะยืนยัน isMeLoading ก่อนกำหนด status: all / active)
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

  // 5. Posts Query (ต้องรอให้ได้ profile.id ที่แน่นอนก่อนเสมอ เพื่อไม่ให้สลับ Query Key)
  const { data: postsData, isLoading: isPostsLoading } = useUserPostsQuery(
    profile?.id,
    {
      enabled:
        Boolean(profile?.id) && (activeTab === "posts" || Boolean(postSlug)),
    },
  );
  const posts = postsData?.posts || [];

  // 6. Liked Posts Query (ต้องรอให้ได้ profile.id และอยู่บน tab likes เท่านั้น)
  const { data: likedPostsData, isLoading: isLikedPostsLoading } =
    useUserLikedPostsQuery(profile?.id, {
      enabled: Boolean(profile?.id) && activeTab === "likes",
    });
  const likedPosts = likedPostsData?.posts || [];

  // 7. Bookmarked Posts: เฉพาะโปรไฟล์ของตัวเอง (isSelf) เท่านั้นที่จะเข้าถึงได้
  const { bookmarks: allUserBookmarks } = useBookmarks();
  const bookmarkedPosts = useMemo(() => {
    if (!isSelf) return [];
    return allUserBookmarks || [];
  }, [isSelf, allUserBookmarks]);

  // 8. Accurate Total Counts (อ่านจาก API stats / total เพื่อรองรับ Pagination อย่างถูกต้อง)
  const counts = useMemo(
    () => ({
      showcases: showcasesData?.total ?? showcases.length,
      services: servicesData?.total ?? services.length,
      posts: profile?.stats?.posts ?? postsData?.total ?? posts.length,
      likes: profile?.stats?.likes ?? likedPostsData?.total ?? likedPosts.length,
      bookmarks: bookmarkedPosts.length,
    }),
    [
      showcasesData?.total,
      showcases.length,
      servicesData?.total,
      services.length,
      profile?.stats,
      postsData?.total,
      posts.length,
      likedPostsData?.total,
      likedPosts.length,
      bookmarkedPosts.length,
    ],
  );

  // 9. Derived Details (ค้นหาจาก slug โดยไม่ต้องใช้ useEffect หรือ useState)
  const selectedShowcase = useMemo(() => {
    if (!showcaseSlug || showcases.length === 0) return null;
    return showcases.find((s) => matchSlug(s, showcaseSlug)) || null;
  }, [showcaseSlug, showcases]);

  const selectedService = useMemo(() => {
    if (!serviceSlug || services.length === 0) return null;
    return services.find((s) => matchSlug(s, serviceSlug)) || null;
  }, [serviceSlug, services]);

  const selectedPost = useMemo(() => {
    if (!postSlug || posts.length === 0) return null;
    return posts.find((p) => matchSlug(p, postSlug)) || null;
  }, [postSlug, posts]);

  return {
    currentUser,
    isSelf,
    isMeLoading,
    checkIsOwner,
    profile,
    isProfileLoading,
    isProfileError,
    isProfileNotFound,
    isNetworkError,
    profileError,
    refetchProfile,
    showcases,
    isShowcasesLoading,
    services,
    isServicesLoading,
    posts,
    isPostsLoading,
    likedPosts,
    isLikedPostsLoading,
    bookmarkedPosts,
    counts,
    selectedShowcase,
    selectedService,
    selectedPost,
  };
}
