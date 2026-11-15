"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, LayoutList, Grid, Heart, Bookmark } from "lucide-react";
import { getActiveTabFromUrl, buildProfileTabUrl } from "../utils/profile-url";

export function useProfileTabs({
  username,
  slugArray,
  profile,
  counts = {},
  isSelf = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    return getActiveTabFromUrl(slugArray, searchParams);
  }, [slugArray, searchParams]);

  const changeTab = (tabId) => {
    const url = buildProfileTabUrl(username, tabId);
    router.replace(url, { scroll: false });
  };

  const tabs = useMemo(() => {
    return [
      {
        id: "showcases",
        label: "Showcase",
        icon: Briefcase,
        count: counts.showcases > 0 ? counts.showcases : undefined,
      },
      {
        id: "services",
        label: "Services",
        icon: LayoutList,
        count: counts.services > 0 ? counts.services : undefined,
      },
      {
        id: "posts",
        label: "Posts",
        icon: Grid,
        count:
          profile?.stats?.posts ||
          (counts.posts > 0 ? counts.posts : undefined),
      },
      {
        id: "likes",
        label: "Likes",
        icon: Heart,
        count:
          profile?.stats?.likes ||
          (counts.likes > 0 ? counts.likes : undefined),
      },
      {
        id: "bookmarks",
        label: "Bookmark",
        icon: Bookmark,
        count: isSelf && counts.bookmarks > 0 ? counts.bookmarks : undefined,
      },
    ];
  }, [counts, profile?.stats, isSelf]);

  return {
    activeTab,
    changeTab,
    tabs,
  };
}
