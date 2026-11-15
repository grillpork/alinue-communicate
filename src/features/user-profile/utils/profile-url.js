export const VALID_PROFILE_TABS = [
  "showcases",
  "services",
  "posts",
  "likes",
  "bookmarks",
];

/**
 * ดึง Active Tab จาก URL อย่างแม่นยำ
 * รองรับทั้ง:
 * - /[username]/showcases/... -> "showcases"
 * - /[username]/services/...  -> "services"
 * - /[username]/posts/...     -> "posts"
 * - /[username]/[post-slug]   -> "posts"
 * - /[username]?tab=likes     -> "likes"
 */
export function getActiveTabFromUrl(slugArray, searchParams) {
  if (slugArray[0] === "showcases") return "showcases";
  if (slugArray[0] === "services") return "services";
  if (slugArray[0] === "posts") return "posts";

  // กรณีเป็น Single slug เช่น /[username]/[ชื่อโพสต์]
  if (
    slugArray.length === 1 &&
    !VALID_PROFILE_TABS.includes(slugArray[0])
  ) {
    return "posts";
  }

  const tab = searchParams?.get("tab");
  if (tab && VALID_PROFILE_TABS.includes(tab)) return tab;
  return "showcases";
}

export function getShowcaseSlug(slugArray, searchParams) {
  if (slugArray[0] === "showcases" && slugArray[1]) {
    return decodeURIComponent(slugArray[1]);
  }
  return searchParams?.get("showcase") || null;
}

export function getServiceSlug(slugArray, searchParams) {
  if (slugArray[0] === "services" && slugArray[1]) {
    return decodeURIComponent(slugArray[1]);
  }
  return searchParams?.get("service") || null;
}

export function getPostSlug(slugArray) {
  // รองรับทั้ง /[username]/posts/[post-slug] และ /[username]/[post-slug]
  if (slugArray[0] === "posts" && slugArray[1]) {
    return decodeURIComponent(slugArray[1]);
  }
  if (
    slugArray.length === 1 &&
    !VALID_PROFILE_TABS.includes(slugArray[0])
  ) {
    return decodeURIComponent(slugArray[0]);
  }
  return null;
}

/**
 * สร้าง Profile Tab URL โดยสามารถเก็บ Query Params อื่นๆ ที่มีอยู่ไว้ได้
 */
export function buildProfileTabUrl(username, tabId, existingSearchParams) {
  const params = new URLSearchParams(
    existingSearchParams ? existingSearchParams.toString() : "",
  );

  // ลบ detail params เมื่อสลับแท็บ
  params.delete("showcase");
  params.delete("service");

  if (tabId && tabId !== "showcases") {
    params.set("tab", tabId);
  } else {
    params.delete("tab");
  }

  const queryStr = params.toString();
  return `/${username}${queryStr ? `?${queryStr}` : ""}`;
}
