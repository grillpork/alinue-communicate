import {
  fetchApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '@/lib/api';

export const authService = {
  // สมัครสมาชิกใหม่
  signUp: async (payload) => {
    return fetchApi('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // เข้าสู่ระบบ
  signIn: async (payload) => {
    return fetchApi('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ดึงข้อมูลผู้ใช้ปัจจุบัน
  getMe: async () => {
    return fetchApi('/api/auth/me');
  },

  // ออกจากระบบ
  signOut: async () => {
    return fetchApi('/api/auth/sign-out', {
      method: 'POST',
    });
  },

  // ยืนยัน Google Token (เช่น One-Tap หรือ Google Login)
  verifyGoogleToken: async (idToken) => {
    return fetchApi('/api/auth/google/token', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  },

  // URL สำหรับ Google OAuth Redirect (single slash guaranteed)
  getGoogleAuthUrl: () => {
    const cleanBase = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    ).replace(/\/+$/, '');
    return `${cleanBase}/api/auth/google`;
  },
};
