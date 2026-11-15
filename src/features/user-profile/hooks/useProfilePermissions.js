"use client";

import { useMemo, useCallback } from "react";
import { useMeQuery } from "@/features/auth";
import { isContentOwner } from "../utils/profile-permissions";

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

  const checkIsOwner = useCallback(
    (content) => {
      if (isSelf) return true;
      return isContentOwner(currentUser, content);
    },
    [isSelf, currentUser],
  );

  return {
    currentUser,
    isSelf,
    isMeLoading,
    canEdit: isSelf,
    canPost: isSelf,
    canBookmark: isSelf,
    checkIsOwner,
  };
}
