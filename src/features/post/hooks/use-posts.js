"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/post.client";
import { postKeys } from "./post.keys";
import { userKeys } from "@/features/user/hooks/user.keys";

/**
 * Hook ดึงรายการโพสต์ทั้งหมดใน Feed
 */
export function usePostsQuery(params = {}, options = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => api.getPosts(params),
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
    queryFn: () => api.getPost(id),
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
    mutationFn: api.createPost,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับแก้ไขโพสต์
 */
export function useUpdatePostMutation(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess: customOnSuccess, ...restOptions } = options;

  return useMutation({
    mutationFn: api.updatePost,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
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
    mutationFn: api.deletePost,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
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
    mutationFn: api.toggleLike,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
    queryFn: () => api.getComments(postId),
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
      api.addComment(postId, content, attachPortfolio),
    onSuccess: (data, variables, context) => {
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
    mutationFn: ({ postId, commentId }) => api.deleteComment(postId, commentId),
    onSuccess: (data, variables, context) => {
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
    mutationFn: ({ id, platform }) => api.sharePost(id, { platform }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}
