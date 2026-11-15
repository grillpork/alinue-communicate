import { fetchApi } from "@/lib/api";

// -------------------------------------------------------------
// Raw API calls for Post feature
// -------------------------------------------------------------

// ดึงรายการโพสต์ทั้งหมด (รองรับ page, limit, tag, search, userId)
export async function getPosts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/api/posts${query ? `?${query}` : ""}`);
}

// ดึงโพสต์เดียวตาม ID
export async function getPost(id) {
  return fetchApi(`/api/posts/${id}`);
}

// สร้างโพสต์ใหม่
export async function createPost(payload) {
  return fetchApi("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// แก้ไขโพสต์
export async function updatePost({ id, ...payload }) {
  return fetchApi(`/api/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ลบโพสต์
export async function deletePost(id) {
  return fetchApi(`/api/posts/${id}`, {
    method: "DELETE",
  });
}

// สลับสถานะ Like / Unlike
export async function toggleLike(id) {
  return fetchApi(`/api/posts/${id}/like`, {
    method: "POST",
  });
}

// แชร์โพสต์ (บันทึกสถิติจำนวนแชร์ + ส่งจำนวนแชร์ล่าสุดกลับมา)
export async function sharePost(id, payload = {}) {
  return fetchApi(`/api/posts/${id}/share`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ดึงความคิดเห็นของโพสต์
export async function getComments(postId) {
  return fetchApi(`/api/posts/${postId}/comments`);
}

// เพิ่มความคิดเห็นใหม่ (รองรับการแนบ Portfolio / Profile & Showcase)
export async function addComment(postId, content, attachPortfolio = false) {
  return fetchApi(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, attachPortfolio }),
  });
}

// ลบความคิดเห็น
export async function deleteComment(postId, commentId) {
  return fetchApi(`/api/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export const postService = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  sharePost,
  getComments,
  addComment,
  deleteComment,
};
