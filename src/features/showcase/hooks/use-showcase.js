"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/showcase.client";
import { showcaseKeys } from "./showcase.keys";

/**
 * Hook ดึงรายการ Showcase
 */
export function useShowcasesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: showcaseKeys.list(filters),
    queryFn: () => api.getShowcases(filters),
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
    queryFn: () => api.getShowcase(id),
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
    mutationFn: api.createShowcase,
    onSuccess: (data, variables, context) => {
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
    mutationFn: api.toggleLike,
    onMutate: async (showcaseId) => {
      await queryClient.cancelQueries({ queryKey: showcaseKeys.lists() });

      const previousLists = queryClient.getQueriesData({
        queryKey: showcaseKeys.lists(),
      });

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
      if (context?.previousLists) {
        context.previousLists.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      options.onError?.(err, showcaseId, context);
    },
    onSettled: (data, err, showcaseId, context) => {
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
    mutationFn: api.updateShowcase,
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
    mutationFn: api.deleteShowcase,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: showcaseKeys.lists() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
