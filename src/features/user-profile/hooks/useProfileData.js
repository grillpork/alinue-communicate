"use client";

import { useMemo } from "react";
import {
  useUserProfileQuery,
  useUserPostsQuery,
  useUserLikedPostsQuery,
} from "@/features/user";
import { useShowcasesQuery } from "@/features/showcase";
import { useServicesQuery } from "@/features/service";
import { useBookmarks } from "@/features/bookmark";
import {
  getShowcaseSlug,
  getServiceSlug,
  getPostSlug,
  matchSlug,
} from "../utils/profile-url";
import { useProfilePermissions } from "./useProfilePermissions";

export function useProfileData({
  username,
  slugArray,
  searchParams,
  activeTab,
}) {
  const { currentUser, isSelf, isMeLoading, checkIsOwner } =
    useProfilePermissions(username);

  // 1. User Profile Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError,
  } = useUserProfileQuery(username, {
    enabled: Boolean(username),
  });
  const profile = profileData?.profile || null;

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

  // 2. Showcases Query (Lazy loaded when showcases tab or detail active)
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

  // 3. Services Query (รอจนกว่าจะยืนยัน isMeLoading ก่อนกำหนด status: all / active)
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

  // 4. Posts Query (ต้องรอให้ได้ profile.id ที่แน่นอนก่อนเสมอ เพื่อไม่ให้สลับ Query Key)
  const { data: postsData, isLoading: isPostsLoading } = useUserPostsQuery(
    profile?.id,
    {
      enabled:
        Boolean(profile?.id) && (activeTab === "posts" || Boolean(postSlug)),
    },
  );
  const posts = postsData?.posts || [];

  // 5. Liked Posts Query (ต้องรอให้ได้ profile.id และอยู่บน tab likes เท่านั้น)
  const { data: likedPostsData, isLoading: isLikedPostsLoading } =
    useUserLikedPostsQuery(profile?.id, {
      enabled: Boolean(profile?.id) && activeTab === "likes",
    });
  const likedPosts = likedPostsData?.posts || [];

  // 6. Bookmarked Posts: เฉพาะโปรไฟล์ของตัวเอง (isSelf) เท่านั้นที่จะเข้าถึงได้
  const { bookmarks: allUserBookmarks } = useBookmarks();
  const bookmarkedPosts = useMemo(() => {
    if (!isSelf) return [];
    return allUserBookmarks || [];
  }, [isSelf, allUserBookmarks]);

  // 7. Derived Details (ค้นหาจาก slug โดยไม่ต้องใช้ useEffect หรือ useState)
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
    isError,
    showcases,
    isShowcasesLoading,
    services,
    isServicesLoading,
    posts,
    isPostsLoading,
    likedPosts,
    isLikedPostsLoading,
    bookmarkedPosts,
    selectedShowcase,
    selectedService,
    selectedPost,
  };
}
