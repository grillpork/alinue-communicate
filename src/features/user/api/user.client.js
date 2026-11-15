import { fetchApi } from '@/lib/api';

export const userService = {
  // ดึงรายชื่อครีเอเตอร์แนะนำสำหรับ Widget 'Suggested Creators'
  getSuggestedUsers: async () => {
    return fetchApi('/api/users/suggested');
  },

  // ดึงข้อมูลโปรไฟล์สาธารณะตาม Username
  getUserProfile: async (username) => {
    return fetchApi(`/api/users/profile/${username}`);
  },

  // อัปเดตข้อมูลโปรไฟล์ของตัวเอง
  updateProfile: async (payload) => {
    return fetchApi('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // สลับสถานะ Follow / Unfollow
  toggleFollow: async (userId) => {
    return fetchApi(`/api/users/${userId}/follow`, {
      method: 'POST',
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

  // ค้นหาดีไซเนอร์ / ผู้ใช้งานตามชื่อหรือ username
  searchUsers: async (q) => {
    return fetchApi(`/api/users/search?q=${encodeURIComponent(q)}`);
  },
};
