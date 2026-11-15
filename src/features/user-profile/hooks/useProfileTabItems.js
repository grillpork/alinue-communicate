"use client";

import { useMemo } from "react";
import { Briefcase, LayoutList, Grid, Heart, Bookmark } from "lucide-react";

/**
 * สร้างรายการ Tabs พร้อมตัวเลขนับ (Badge) ตามเงื่อนไขและสิทธิ์ของผู้ใช้
 */
export function useProfileTabItems({
  profile,
  counts = {},
  isSelf = false,
}) {
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

  return { tabs };
}
