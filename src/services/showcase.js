'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
export const showcaseService = {
  // ดึงรายการ Showcase (รองรับ search, username, user_id, page, limit)
  getShowcases: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.username) query.set('username', params.username);
    if (params.userId) query.set('user_id', String(params.userId));
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/showcases${qs ? `?${qs}` : ''}`;
    return fetchApi(endpoint);
  },

  // ดึงรายละเอียด Showcase ชิ้นเดียว
  getShowcase: async (id) => {
    return fetchApi(`/api/showcases/${id}`);
  },

  // สร้าง Showcase ผลงานใหม่
  createShowcase: async (payload) => {
    return fetchApi('/api/showcases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // แก้ไขผลงาน Showcase
  updateShowcase: async ({ id, ...payload }) => {
    return fetchApi(`/api/showcases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // กด Like / Unlike Showcase
  toggleLike: async (id) => {
    return fetchApi(`/api/showcases/${id}/like`, {
      method: 'POST',
    });
  },

  // ลบ Showcase
  deleteShowcase: async (id) => {
    return fetchApi(`/api/showcases/${id}`, {
      method: 'DELETE',
    });
  },
};

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const showcaseKeys = {
  all: ['showcases'],
  lists: () => [...showcaseKeys.all, 'list'],
  list: (filters) => [...showcaseKeys.lists(), filters],
  details: () => [...showcaseKeys.all, 'detail'],
  detail: (id) => [...showcaseKeys.details(), id],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึงรายการ Showcase
 */
export function useShowcasesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: showcaseKeys.list(filters),
    queryFn: () => showcaseService.getShowcases(filters),
    staleTime: 1000 * 60, // 1 นาที
    ...options,
  });
}

/**
 * Hook ดึงรายละเอียด Showcase ชิ้นเดียว
 */
export function useShowcaseDetailQuery(id, options = {}) {
  return useQuery({
    queryKey: showcaseKeys.detail(id),
    queryFn: () => showcaseService.getShowcase(id),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook สร้าง Showcase ผลงานใหม่
 */
export function useCreateShowcaseMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: showcaseService.createShowcase,
    onSuccess: (data, variables, context) => {
      // Invalidate รายการ Showcase ให้รีเฟรชทันที
      queryClient.invalidateQueries({ queryKey: showcaseKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook กด Like / Unlike Showcase พร้อม Optimistic Update
 */
export function useToggleShowcaseLikeMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: showcaseService.toggleLike,
    onMutate: async (showcaseId) => {
      // Cancel queries ที่กำลัง fetch อยู่
      await queryClient.cancelQueries({ queryKey: showcaseKeys.lists() });

      // บันทึก snapshot เก่าเพื่อ rollback ถ้า error
      const previousLists = queryClient.getQueriesData({
        queryKey: showcaseKeys.lists(),
      });

      // Optimistic update ทุกรายการ query ที่มี showcaseId นี้
      queryClient.setQueriesData(
        { queryKey: showcaseKeys.lists() },
        (old) => {
          if (!old?.showcases) return old;
          return {
            ...old,
            showcases: old.showcases.map((sc) => {
              if (sc.id === showcaseId) {
                const wasLiked = Boolean(sc.is_liked);
                return {
                  ...sc,
                  is_liked: !wasLiked,
                  likes_count: wasLiked
                    ? Math.max(0, (sc.likes_count || 1) - 1)
                    : (sc.likes_count || 0) + 1,
                };
              }
              return sc;
            }),
          };
        }
      );

      return { previousLists };
    },
    onError: (err, showcaseId, context) => {
      // Rollback
      if (context?.previousLists) {
        context.previousLists.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      options.onError?.(err, showcaseId, context);
    },
    onSettled: (data, err, showcaseId, context) => {
      // Sync ข้อมูลจริงจาก server
      queryClient.invalidateQueries({ queryKey: showcaseKeys.lists() });
      options.onSettled?.(data, err, showcaseId, context);
    },
    ...options,
  });
}

/**
 * Hook แก้ไข Showcase ผลงาน
 */
export function useUpdateShowcaseMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: showcaseService.updateShowcase,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: showcaseKeys.lists() });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: showcaseKeys.detail(variables.id) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook ลบ Showcase
 */
export function useDeleteShowcaseMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: showcaseService.deleteShowcase,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: showcaseKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

