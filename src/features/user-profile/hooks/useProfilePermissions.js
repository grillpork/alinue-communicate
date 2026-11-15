"use client";

import { useMemo } from "react";
import { useMeQuery } from "@/features/auth";

export function useProfilePermissions(username) {
  const { data: meData, isLoading: isMeLoading } = useMeQuery();
  const currentUser = meData?.user;

  const isSelf = useMemo(() => {
    return Boolean(
      currentUser?.username &&
        username &&
        currentUser.username.toLowerCase() === username.toLowerCase(),
    );
  }, [currentUser?.username, username]);

  return {
    currentUser,
    isSelf,
    isMeLoading,
    canEdit: isSelf,
    canPost: isSelf,
    canBookmark: isSelf,
  };
}
