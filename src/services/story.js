'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
export const storyService = {
  // ดึงรายการ Stories ทั้งหมดใน 24 ชั่วโมงที่ผ่านมา
  getStories: async () => {
    return fetchApi('/api/stories');
  },

  // สร้าง Story ใหม่
  createStory: async (payload) => {
    return fetchApi('/api/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // บันทึกการรับชม Story
  viewStory: async (storyId) => {
    return fetchApi(`/api/stories/${storyId}/view`, {
      method: 'POST',
    });
  },

  // กด Like / Unlike บน Story
  toggleLike: async (storyId) => {
    return fetchApi(`/api/stories/${storyId}/like`, {
      method: 'POST',
    });
  },

  // ลบ Story
  deleteStory: async (storyId) => {
    return fetchApi(`/api/stories/${storyId}`, {
      method: 'DELETE',
    });
  },
};

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const storyKeys = {
  all: ['stories'],
  lists: () => [...storyKeys.all, 'list'],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึง Stories
 */
export function useStoriesQuery(options = {}) {
  return useQuery({
    queryKey: storyKeys.lists(),
    queryFn: storyService.getStories,
    staleTime: 1000 * 30, // 30 วินาที
    refetchInterval: 1000 * 60, // รีเฟรชทุก 1 นาที
    ...options,
  });
}

/**
 * Hook สร้าง Story ใหม่
 */
export function useCreateStoryMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyService.createStory,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook บันทึก view
 */
export function useViewStoryMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyService.viewStory,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook กด Like Story
 */
export function useToggleStoryLikeMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyService.toggleLike,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook ลบ Story
 */
export function useDeleteStoryMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storyService.deleteStory,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
