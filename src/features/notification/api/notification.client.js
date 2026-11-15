import { fetchApi } from '@/lib/api';

export const notificationService = {
  // ดึงรายการแจ้งเตือนทั้งหมดตาม Filter
  getNotifications: async ({ filter = 'all', page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams({
      filter,
      page: String(page),
      limit: String(limit),
    });
    return fetchApi(`/api/notifications?${params.toString()}`);
  },

  // ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
  getUnreadCount: async () => {
    return fetchApi('/api/notifications/unread-count');
  },

  // ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
  markAllAsRead: async () => {
    return fetchApi('/api/notifications/read-all', {
      method: 'PATCH',
    });
  },

  // ทำเครื่องหมายว่าอ่านแล้วเฉพาะรายการนี้
  markAsRead: async (notificationId) => {
    return fetchApi(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  // ลบการแจ้งเตือน
  deleteNotification: async (notificationId) => {
    return fetchApi(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
