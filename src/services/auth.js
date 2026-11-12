'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from '@/lib/api';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
).replace(/\/+$/, '');

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const authKeys = {
  all: ['auth'],
  me: () => [...authKeys.all, 'me'],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึงข้อมูล Profile ของผู้ใช้ปัจจุบันที่กำลัง Login อยู่
 */
export function useMeQuery(options = {}) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      try {
        const res = await authService.getMe();
        return res;
      } catch (err) {
        console.warn('useMeQuery error:', err);
        return null;
      }
    },
    staleTime: 1000 * 30, // 30 วินาที
    retry: 1,
    ...options,
  });
}

/**
 * Hook สำหรับเข้าสู่ระบบ (Sign In)
 */
export function useSignInMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signIn,
    onSuccess: (data, variables, context) => {
      if (data?.token) {
        setAuthToken(data.token);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook สำหรับสมัครสมาชิก (Sign Up)
 */
export function useSignUpMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signUp,
    onSuccess: (data, variables, context) => {
      if (data?.token) {
        setAuthToken(data.token);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook สำหรับออกจากระบบ (Sign Out)
 */
export function useSignOutMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: (data, variables, context) => {
      clearAuthToken();
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook สำหรับยืนยัน Google Token Login
 */
export function useGoogleAuthMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.verifyGoogleToken,
    onSuccess: (data, variables, context) => {
      if (data?.token) {
        setAuthToken(data.token);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

