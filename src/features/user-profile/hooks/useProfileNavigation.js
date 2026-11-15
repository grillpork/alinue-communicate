"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getActiveTabFromUrl, buildProfileTabUrl } from "../utils/profile-url";

/**
 * จัดการเฉพาะ Active Tab และการเปลี่ยน URL ของโปรไฟล์
 */
export function useProfileNavigation({ username, slugArray }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    return getActiveTabFromUrl(slugArray, searchParams);
  }, [slugArray, searchParams]);

  const changeTab = useCallback(
    (tabId) => {
      const url = buildProfileTabUrl(username, tabId, searchParams);
      router.replace(url, { scroll: false });
    },
    [username, searchParams, router],
  );

  return {
    activeTab,
    changeTab,
  };
}
