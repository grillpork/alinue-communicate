import { slugify } from "@/lib/slug";

export const VALID_PROFILE_TABS = [
  "showcases",
  "services",
  "posts",
  "likes",
  "bookmarks",
];

export function parseUsername(rawUsername) {
  if (typeof rawUsername !== "string") return "";
  return decodeURIComponent(rawUsername).replace(/^@/, "");
}

export function parseSlugArray(rawSlug) {
  if (!rawSlug) return [];
  return Array.isArray(rawSlug) ? rawSlug : [rawSlug];
}

export function getActiveTabFromUrl(slugArray, searchParams) {
  if (slugArray[0] === "showcases") return "showcases";
  if (slugArray[0] === "services") return "services";
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
  if (
    slugArray.length === 1 &&
    slugArray[0] !== "showcases" &&
    slugArray[0] !== "services"
  ) {
    return decodeURIComponent(slugArray[0]);
  }
  return null;
}

export function buildProfileTabUrl(username, tabId) {
  return `/${username}${tabId !== "showcases" ? `?tab=${tabId}` : ""}`;
}

export function matchSlug(item, targetSlug) {
  if (!item || !targetSlug) return false;
  return (
    slugify(item.title || item.content?.slice(0, 50) || "") === targetSlug ||
    String(item.id) === targetSlug ||
    (item.title && item.title.toLowerCase() === targetSlug.toLowerCase())
  );
}
