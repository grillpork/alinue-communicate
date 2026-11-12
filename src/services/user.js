'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
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

  // ค้นหาดีไซเนอร์ / ผู้ใช้งานตามชื่อหรือ username
  searchUsers: async (q) => {
    return fetchApi(`/api/users/search?q=${encodeURIComponent(q)}`);
  },
};

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const userKeys = {
  all: ['users'],
  suggested: () => [...userKeys.all, 'suggested'],
  profile: (username) => [...userKeys.all, 'profile', username],
  posts: (userId) => [...userKeys.all, 'posts', userId],
  search: (q) => [...userKeys.all, 'search', q],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึงรายชื่อครีเอเตอร์แนะนำสำหรับ Widget 'Suggested Creators' ใน Rightbar
 */
export function useSuggestedUsersQuery(options = {}) {
  return useQuery({
    queryKey: userKeys.suggested(),
    queryFn: userService.getSuggestedUsers,
    staleTime: 1000 * 60 * 3, // 3 นาที
    ...options,
  });
}

/**
 * Hook ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม Username
 */
export function useUserProfileQuery(username, options = {}) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => userService.getUserProfile(username),
    enabled: Boolean(username),
    staleTime: 1000 * 60 * 2, // 2 นาที
    ...options,
  });
}

/**
 * Hook ดึงโพสต์ทั้งหมดของ User นั้น ๆ
 */
export function useUserPostsQuery(userId, options = {}) {
  return useQuery({
    queryKey: userKeys.posts(userId),
    queryFn: () => userService.getUserPosts(userId),
    enabled: Boolean(userId),
    ...options,
  });
}

/**
 * Hook สำหรับอัปเดตข้อมูลโปรไฟล์
 */
export function useUpdateProfileMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook สำหรับกด Follow / Unfollow
 */
export function useToggleFollowMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.toggleFollow,
    onSuccess: (data, variables, context) => {
      // Invalidate เพื่อให้สถานะ Follow และจำนวน Followers ในทุกที่อัปเดตทันที
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook สำหรับค้นหาดีไซเนอร์ / ผู้ใช้
 */
export function useSearchUsersQuery(query, options = {}) {
  const cleanQ = (query || '').trim();
  return useQuery({
    queryKey: userKeys.search(cleanQ),
    queryFn: () => userService.searchUsers(cleanQ),
    enabled: Boolean(cleanQ),
    staleTime: 1000 * 30, // 30 วินาที
    ...options,
  });
}

