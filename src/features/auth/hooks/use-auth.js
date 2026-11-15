'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken, setAuthToken, clearAuthToken } from '@/lib/api';
import { authService } from '../api/auth.client';
import { authKeys } from './auth.keys';

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
