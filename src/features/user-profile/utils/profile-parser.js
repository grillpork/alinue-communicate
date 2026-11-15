import { slugify } from "@/lib/slug";

/**
 * แปลง Raw Username จาก Route params: decode URI และตัด @ นำหน้า
 */
export function parseUsername(rawUsername) {
  if (typeof rawUsername !== "string") return "";
  return decodeURIComponent(rawUsername).replace(/^@/, "");
}

/**
 * แปลง Raw Slug Array ให้เป็น Array เสมอ
 */
export function parseSlugArray(rawSlug) {
  if (!rawSlug) return [];
  return Array.isArray(rawSlug) ? rawSlug : [rawSlug];
}

/**
 * ตรวจสอบความตรงกันของ Slug กับ Content (Showcase, Service, Post)
 */
export function matchSlug(item, targetSlug) {
  if (!item || !targetSlug) return false;
  return (
    slugify(item.title || item.content?.slice(0, 50) || "") === targetSlug ||
    String(item.id) === targetSlug ||
    (item.title && item.title.toLowerCase() === targetSlug.toLowerCase())
  );
}

/**
 * ตรวจสอบความเป็นเจ้าของ Content (Showcase, Service, Post)
 * รองรับทั้ง ID แบบ Number, String และ UUID
 */
export function isContentOwner(currentUser, content) {
  if (!currentUser || !content) return false;

  const ownerId = content.userId ?? content.author?.id;

  if (
    ownerId != null &&
    currentUser.id != null &&
    String(currentUser.id) === String(ownerId)
  ) {
    return true;
  }

  return Boolean(
    currentUser.username &&
      content.author?.username &&
      currentUser.username.toLowerCase() ===
        content.author.username.toLowerCase(),
  );
}
