import { fetchApi } from "@/lib/api";

export const userProfileApi = {
  // ดึงข้อมูลโปรไฟล์สาธารณะตาม Username
  getUserProfile: async (username) => {
    return fetchApi(`/api/users/profile/${username}`);
  },

  // อัปเดตข้อมูลโปรไฟล์ของตัวเอง
  updateProfile: async (payload) => {
    return fetchApi("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // ดึงโพสต์ทั้งหมดของ User นั้น ๆ
  getUserPosts: async (userId) => {
    return fetchApi(`/api/users/${userId}/posts`);
  },

  // ดึงโพสต์ที่ User นั้นกด Like
  getUserLikedPosts: async (userId) => {
    return fetchApi(`/api/users/${userId}/likes`);
  },
};
