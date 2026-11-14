'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'alinue_bookmarks';

/**
 * ดึงรายการบุ๊กมาร์กทั้งหมดจาก localStorage
 */
export function getStoredBookmarks() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load bookmarks from storage:', err);
    return [];
  }
}

/**
 * บันทึกรายการบุ๊กมาร์กลง localStorage พร้อมแจ้งเตือน components อื่นๆ
 */
export function setStoredBookmarks(bookmarks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('alinue_bookmarks_updated', { detail: bookmarks }));
  } catch (err) {
    console.error('Failed to save bookmarks to storage:', err);
  }
}

/**
 * ตรวจสอบว่าโพสต์นี้ถูกบันทึกไว้หรือไม่
 */
export function isPostBookmarked(postId) {
  if (!postId) return false;
  const bookmarks = getStoredBookmarks();
  return bookmarks.some((item) => String(item.id) === String(postId));
}

/**
 * สลับสถานะบุ๊กมาร์ก (Add / Remove)
 */
export function toggleStoredBookmark(post) {
  if (!post || !post.id) return false;
  const bookmarks = getStoredBookmarks();
  const existsIndex = bookmarks.findIndex((item) => String(item.id) === String(post.id));

  let updated;
  let bookmarked;
  if (existsIndex >= 0) {
    // ลบออก
    updated = bookmarks.filter((item) => String(item.id) !== String(post.id));
    bookmarked = false;
  } else {
    // เพิ่มเข้าไปที่หัวแถว
    const cleanPost = {
      ...post,
      bookmarkedAt: new Date().toISOString(),
    };
    updated = [cleanPost, ...bookmarks];
    bookmarked = true;
  }

  setStoredBookmarks(updated);
  return bookmarked;
}

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

export const bookmarkService = {
  getBookmarks: getStoredBookmarks,
  isBookmarked: isPostBookmarked,
  toggleBookmark: toggleStoredBookmark,
};

export default bookmarkService;
