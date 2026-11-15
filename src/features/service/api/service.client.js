import { fetchApi } from "@/lib/api";

// -------------------------------------------------------------
// Raw API calls for Service feature
// -------------------------------------------------------------

// ดึงรายการโพสต์รับงาน (รองรับ search, tag, username, userId, status, includeExpired, page, limit)
export async function getServices(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.tag) query.set("tag", params.tag);
  if (params.username) query.set("username", params.username);
  if (params.userId) query.set("user_id", String(params.userId));
  if (params.status) query.set("status", params.status);
  if (params.includeExpired) query.set("include_expired", "true");
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  const endpoint = `/api/services${qs ? `?${qs}` : ""}`;
  return fetchApi(endpoint);
}

// ดึงรายการงานที่ฉันโพสต์รับงานไว้ทั้งหมด
export async function getMyServices() {
  return fetchApi("/api/services/my");
}

// ดึงรายละเอียดโพสต์รับงานชิ้นเดียว
export async function getService(id) {
  return fetchApi(`/api/services/${id}`);
}

// สร้างโพสต์รับงานใหม่
export async function createService(payload) {
  return fetchApi("/api/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// แก้ไขโพสต์รับงาน
export async function updateService({ id, ...payload }) {
  return fetchApi(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ลบโพสต์รับงาน
export async function deleteService(id) {
  return fetchApi(`/api/services/${id}`, {
    method: "DELETE",
  });
}

// ต่ออายุโพสต์รับงานอีก 30 วัน
export async function renewService(id) {
  return fetchApi(`/api/services/${id}/renew`, {
    method: "POST",
  });
}

// สลับสถานะ เปิดรับงาน / พักรับงานชั่วคราว
export async function toggleServiceStatus(id) {
  return fetchApi(`/api/services/${id}/toggle-status`, {
    method: "POST",
  });
}

// กด Like / Unlike โพสต์รับงาน
export async function toggleLike(id) {
  return fetchApi(`/api/services/${id}/like`, {
    method: "POST",
  });
}

// บันทึกยอดวิวโพสต์รับงาน
export async function recordView(id) {
  return fetchApi(`/api/services/${id}/view`, {
    method: "POST",
  });
}

export const serviceService = {
  getServices,
  getMyServices,
  getService,
  createService,
  updateService,
  deleteService,
  renewService,
  toggleServiceStatus,
  toggleLike,
  recordView,
};
