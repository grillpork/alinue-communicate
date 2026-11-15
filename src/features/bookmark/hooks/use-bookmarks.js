'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getStoredBookmarks,
  setStoredBookmarks,
  toggleStoredBookmark,
} from '../api/bookmark.client';

/**
 * Hook สำหรับจัดการ Bookmark ภายใน React Components
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setBookmarks(getStoredBookmarks());
  }, []);

  useEffect(() => {
    refresh();
    setIsLoaded(true);

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener('alinue_bookmarks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('alinue_bookmarks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const checkIsBookmarked = useCallback(
    (postId) => {
      return bookmarks.some((item) => String(item.id) === String(postId));
    },
    [bookmarks]
  );

  const toggle = useCallback((post) => {
    return toggleStoredBookmark(post);
  }, []);

  const remove = useCallback((postId) => {
    const list = getStoredBookmarks().filter((item) => String(item.id) !== String(postId));
    setStoredBookmarks(list);
  }, []);

  const clear = useCallback(() => {
    setStoredBookmarks([]);
  }, []);

  return {
    bookmarks,
    isLoaded,
    isBookmarked: checkIsBookmarked,
    toggleBookmark: toggle,
    removeBookmark: remove,
    clearBookmarks: clear,
  };
}
