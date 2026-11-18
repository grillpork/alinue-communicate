import { fetchApi } from '@/lib/api';

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

  // ดึง One-Time Invite Code ของผู้ใช้ปัจจุบัน
  getInviteCode: async () => {
    return fetchApi('/api/auth/invite-code');
  },

  // ตรวจสอบความถูกต้องของ One-Time Invite Code (Public)
  inspectInviteCode: async (code) => {
    return fetchApi(`/api/auth/invite/${encodeURIComponent(String(code || '').trim().toUpperCase())}`);
  },

  // รับสิทธิ์จากการชวนเพื่อนด้วย One-Time Invite Code (ปลดล็อกโควตา Service เป็น 2 โพสต์ทั้งคนชวนและคนถูกชวน)
  claimReferral: async (code) => {
    return fetchApi('/api/auth/claim-referral', {
      method: 'POST',
      body: JSON.stringify({ code, ref: code }),
    });
  },

  // URL สำหรับ Google OAuth Redirect (single slash guaranteed)
  getGoogleAuthUrl: (ref) => {
    const cleanBase = (
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    ).replace(/\/+$/, '');
    const qs = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    return `${cleanBase}/api/auth/google${qs}`;
  },
};
