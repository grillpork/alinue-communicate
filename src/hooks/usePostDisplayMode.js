"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "alinue_post_display_mode";
const APPEARANCE_KEY = "alinue_appearance_prefs";
const DEFAULT_MODE = "carousel"; // "carousel" (Slide) | "grid" (Collage Grid)

const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);

  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === APPEARANCE_KEY) {
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const direct = localStorage.getItem(STORAGE_KEY);
    if (direct === "carousel" || direct === "grid") {
      return direct;
    }

    const savedApp = localStorage.getItem(APPEARANCE_KEY);
    if (savedApp) {
      const parsed = JSON.parse(savedApp);
      if (parsed.feedMediaPreview === "grid" || parsed.feedMediaPreview === "compact") {
        return "grid";
      }
      if (parsed.feedMediaPreview === "carousel" || parsed.feedMediaPreview === "large") {
        return "carousel";
      }
    }
  } catch {
    // Ignore localStorage read errors
  }
  return DEFAULT_MODE;
}

function getServerSnapshot() {
  return DEFAULT_MODE;
}

export function setPostDisplayMode(nextMode) {
  const validMode = nextMode === "grid" ? "grid" : "carousel";
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, validMode);

      // ซิงค์กับ alinue_appearance_prefs ในหน้า Settings ด้วย
      const savedApp = localStorage.getItem(APPEARANCE_KEY);
      const parsed = savedApp ? JSON.parse(savedApp) : {};
      localStorage.setItem(
        APPEARANCE_KEY,
        JSON.stringify({
          ...parsed,
          feedMediaPreview: validMode === "grid" ? "compact" : "large",
        }),
      );
    } catch {
      // Ignore localStorage write errors
    }
  }
  emitChange();
}

/**
 * Hook สำหรับอ่านและเปลี่ยนรูปแบบการแสดงผลรูปภาพในโพสต์ ("carousel" | "grid")
 * อัปเดตทุก Component แบบ Real-time ทันทีเมื่อเปลี่ยนค่า
 */
export function usePostDisplayMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((nextMode) => {
    setPostDisplayMode(nextMode);
  }, []);

  return [mode, setMode];
}

export default usePostDisplayMode;
