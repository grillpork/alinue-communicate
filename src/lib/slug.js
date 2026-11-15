/**
 * แปลงข้อความ (ไทย/อังกฤษ/ตัวเลข) ให้เป็น URL Slug สวยงาม
 * @param {string} text - ข้อความที่ต้องการแปลง
 * @returns {string} URL slug
 */
export function slugify(text) {
  if (!text) return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "-")
    .replace(/[^\p{L}\p{M}\p{N}\-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * สร้าง Path สำหรับ Showcase
 * รูปแบบ: /[username]/showcases/[ชื่อผลงาน]
 */
export function getShowcasePath(username, showcase) {
  const cleanUsername = String(username || "").replace(/^@/, "");
  const slug = slugify(showcase?.title) || showcase?.id;
  return `/${cleanUsername}/showcases/${encodeURIComponent(slug)}`;
}

/**
 * สร้าง Path สำหรับ Service
 * รูปแบบ: /[username]/services/[ชื่อบริการ]
 */
export function getServicePath(username, service) {
  const cleanUsername = String(username || "").replace(/^@/, "");
  const slug = slugify(service?.title) || service?.id;
  return `/${cleanUsername}/services/${encodeURIComponent(slug)}`;
}

/**
 * สร้าง Path สำหรับ Post
 * รูปแบบ: /[username]/[ชื่อโพสต์]
 */
export function getPostPath(username, post) {
  const cleanUsername = String(username || "").replace(/^@/, "");
  const rawTitle =
    post?.title ||
    (post?.content ? post.content.replace(/#[^\s]+/g, "").trim().slice(0, 50) : "") ||
    post?.id;
  const slug = slugify(rawTitle) || post?.id;
  return `/${cleanUsername}/${encodeURIComponent(slug)}`;
}
