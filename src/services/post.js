'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
export const postService = {
  // ดึงรายการโพสต์ทั้งหมด (รองรับ page, limit, tag, search, userId)
  getPosts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/api/posts${query ? `?${query}` : ''}`);
  },

  // ดึงโพสต์เดียวตาม ID
  getPost: async (id) => {
    return fetchApi(`/api/posts/${id}`);
  },

  // สร้างโพสต์ใหม่
  createPost: async (payload) => {
    return fetchApi('/api/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ลบโพสต์
  deletePost: async (id) => {
    return fetchApi(`/api/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // สลับสถานะ Like / Unlike
  toggleLike: async (id) => {
    return fetchApi(`/api/posts/${id}/like`, {
      method: 'POST',
    });
  },

  // แชร์โพสต์ (บันทึกสถิติจำนวนแชร์ + ส่งจำนวนแชร์ล่าสุดกลับมา)
  sharePost: async (id, payload = {}) => {
    return fetchApi(`/api/posts/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ดึงความคิดเห็นของโพสต์
  getComments: async (postId) => {
    return fetchApi(`/api/posts/${postId}/comments`);
  },

  // เพิ่มความคิดเห็นใหม่ (รองรับการแนบ Portfolio / Profile & Showcase)
  addComment: async (postId, content, attachPortfolio = false) => {
    return fetchApi(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, attachPortfolio }),
    });
  },

  // ลบความคิดเห็น
  deleteComment: async (postId, commentId) => {
    return fetchApi(`/api/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const postKeys = {
  all: ['posts'],
  list: (params = {}) => [...postKeys.all, 'list', params],
  detail: (id) => [...postKeys.all, 'detail', id],
  comments: (postId) => [...postKeys.all, 'comments', postId],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึงรายการโพสต์ทั้งหมดใน Feed
 */
export function usePostsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postService.getPosts(params),
    staleTime: 1000 * 60 * 1, // 1 นาที
    ...options,
  });
}

/**
 * Hook ดึงโพสต์เดียวตาม ID
 */
export function usePostQuery(id, options = {}) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postService.getPost(id),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook สำหรับสร้างโพสต์ใหม่
 */
export function useCreatePostMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: postService.createPost,
    onSuccess: (data, variables, context) => {
      // Invalidate รายการโพสต์ทั้งหมดเพื่อให้ Feed อัปเดตทันที
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับลบโพสต์
 */
export function useDeletePostMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: postService.deletePost,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับกด Like / Unlike
 */
export function useToggleLikeMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: postService.toggleLike,
    onSuccess: (data, variables, context) => {
      // Invalidate เพื่อให้สถานะ Like และตัวเลข Count ตรงกัน
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook ดึงความคิดเห็นของโพสต์
 */
export function useCommentsQuery(postId, options = {}) {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => postService.getComments(postId),
    enabled: Boolean(postId),
    ...options,
  });
}

/**
 * Hook สำหรับเพิ่มความคิดเห็น
 */
export function useAddCommentMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: ({ postId, content, attachPortfolio }) =>
      postService.addComment(postId, content, attachPortfolio),
    onSuccess: (data, variables, context) => {
      // 1. เพิ่มความคิดเห็นใหม่ลงใน Cache ทันที (Instant UI update ไม่ต้อง Refresh หน้าเว็บ)
      if (data?.comment) {
        queryClient.setQueryData(postKeys.comments(variables.postId), (oldData) => {
          if (!oldData || !Array.isArray(oldData.comments)) {
            return { success: true, comments: [data.comment] };
          }
          const exists = oldData.comments.some((c) => c.id === data.comment.id);
          if (exists) return oldData;
          return {
            ...oldData,
            comments: [...oldData.comments, data.comment],
          };
        });
      }

      // 2. Invalidate comments และ posts เพื่อ sync ข้อมูลกับ server
      queryClient.invalidateQueries({
        queryKey: postKeys.comments(variables.postId),
      });
      queryClient.invalidateQueries({ queryKey: postKeys.all });

      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับลบความคิดเห็น
 */
export function useDeleteCommentMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: ({ postId, commentId }) => postService.deleteComment(postId, commentId),
    onSuccess: (data, variables, context) => {
      // ลบคอมเมนต์ออกจาก Cache ทันที
      if (variables.commentId) {
        queryClient.setQueryData(postKeys.comments(variables.postId), (oldData) => {
          if (!oldData || !Array.isArray(oldData.comments)) return oldData;
          return {
            ...oldData,
            comments: oldData.comments.filter((c) => c.id !== variables.commentId),
          };
        });
      }

      queryClient.invalidateQueries({
        queryKey: postKeys.comments(variables.postId),
      });
      queryClient.invalidateQueries({ queryKey: postKeys.all });

      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับแชร์โพสต์ (เพิ่มจำนวน sharesCount)
 */
export function useSharePostMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: ({ id, platform }) => postService.sharePost(id, { platform }),
    onSuccess: (data, variables, context) => {
      // อัปเดต cache รายการโพสต์และหน้ารายละเอียด
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

