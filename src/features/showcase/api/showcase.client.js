import { fetchApi } from "@/lib/api";

// -------------------------------------------------------------
// Raw API calls for Showcase feature
// -------------------------------------------------------------

// ดึงรายการ Showcase (รองรับ search, username, user_id, page, limit)
export async function getShowcases(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.username) query.set("username", params.username);
  if (params.userId) query.set("user_id", String(params.userId));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const endpoint = `/api/showcases${qs ? `?${qs}` : ""}`;
  return fetchApi(endpoint);
}

// ดึงรายละเอียด Showcase ชิ้นเดียว
export async function getShowcase(id) {
  return fetchApi(`/api/showcases/${id}`);
}

// สร้าง Showcase ผลงานใหม่
export async function createShowcase(payload) {
  return fetchApi("/api/showcases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// แก้ไขผลงาน Showcase
export async function updateShowcase({ id, ...payload }) {
  return fetchApi(`/api/showcases/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// กด Like / Unlike Showcase
export async function toggleLike(id) {
  return fetchApi(`/api/showcases/${id}/like`, {
    method: "POST",
  });
}

// ลบ Showcase
export async function deleteShowcase(id) {
  return fetchApi(`/api/showcases/${id}`, {
    method: "DELETE",
  });
}

export const showcaseService = {
  getShowcases,
  getShowcase,
  createShowcase,
  updateShowcase,
  toggleLike,
  deleteShowcase,
};
