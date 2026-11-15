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

      // อัปเดตแคชโพสต์เดี่ยวทันที
      if (variables?.id) {
        queryClient.setQueryData(postKeys.detail(variables.id), (old) => {
          if (!old) return data?.post || data;
          return { ...old, ...(data?.post || data) };
        });
      }

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

      // นำแคชของโพสต์ที่ถูกลบออกจากหน่วยความจำ
      if (variables) {
        queryClient.removeQueries({ queryKey: postKeys.detail(variables) });
      }

      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    ...restOptions,
  });
}

/**
 * Hook สำหรับกด Like / Unlike พร้อม Optimistic Update และ Rollback อัตโนมัติ
 */
export function useToggleLikeMutation(options = {}) {
  const queryClient = useQueryClient();
  const {
    onMutate: customOnMutate,
    onError: customOnError,
    onSuccess: customOnSuccess,
    onSettled: customOnSettled,
    ...restOptions
  } = options;

  return useMutation({
    mutationFn: api.toggleLike,
    onMutate: async (postId) => {
      // 1. ยกเลิก Queries ที่กำลังดึงอยู่เพื่อไม่ให้ทับข้อมูล Optimistic
      await queryClient.cancelQueries({ queryKey: postKeys.all });

      // 2. Snapshot แคชเก่าไว้สำหรับ Rollback เมื่อ Error
      const previousLists = queryClient.getQueriesData({
        queryKey: postKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData(postKeys.detail(postId));

      // 3. Optimistic Update ทุก Lists ที่มี Post นี้
      queryClient.setQueriesData({ queryKey: postKeys.lists() }, (old) => {
        if (!old || !Array.isArray(old.posts)) return old;
        return {
          ...old,
          posts: old.posts.map((p) => {
            if (String(p.id) === String(postId)) {
              const nextIsLiked = !p.isLiked;
              const currentLikes =
                typeof p.likesCount === "number"
                  ? p.likesCount
                  : parseInt(p.likesCount, 10) || 0;
              return {
                ...p,
                isLiked: nextIsLiked,
                likesCount: nextIsLiked
                  ? currentLikes + 1
                  : Math.max(0, currentLikes - 1),
              };
            }
            return p;
          }),
        };
      });

      // 4. Optimistic Update ใน Post Detail (ถ้ามี)
      if (previousDetail?.post) {
        queryClient.setQueryData(postKeys.detail(postId), (old) => {
          if (!old?.post) return old;
          const nextIsLiked = !old.post.isLiked;
          const currentLikes =
            typeof old.post.likesCount === "number"
              ? old.post.likesCount
              : parseInt(old.post.likesCount, 10) || 0;
          return {
            ...old,
            post: {
              ...old.post,
              isLiked: nextIsLiked,
              likesCount: nextIsLiked
                ? currentLikes + 1
                : Math.max(0, currentLikes - 1),
            },
          };
        });
      }

      let customContext = {};
      if (customOnMutate) {
        customContext = (await customOnMutate(postId)) || {};
      }

      return { previousLists, previousDetail, ...customContext };
    },
    onError: (err, postId, context) => {
      // Rollback แคชเดิมกลับมาเมื่อ API ล้มเหลว
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(postKeys.detail(postId), context.previousDetail);
      }
      if (customOnError) {
        customOnError(err, postId, context);
      }
    },
    onSuccess: (data, variables, context) => {
      if (customOnSuccess) {
        customOnSuccess(data, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (customOnSettled) {
        customOnSettled(data, error, variables, context);
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

      // Sync commentsCount ใน cache ของ post lists โดยตรง
      queryClient.setQueriesData({ queryKey: postKeys.lists() }, (old) => {
        if (!old || !Array.isArray(old.posts)) return old;
        return {
          ...old,
          posts: old.posts.map((p) =>
            String(p.id) === String(variables.postId)
              ? { ...p, commentsCount: (p.commentsCount ?? 0) + 1 }
              : p,
          ),
        };
      });

      // Sync commentsCount ใน cache ของ post detail (ถ้ามี)
      queryClient.setQueryData(postKeys.detail(variables.postId), (old) => {
        if (!old?.post) return old;
        return {
          ...old,
          post: {
            ...old.post,
            commentsCount: (old.post.commentsCount ?? 0) + 1,
          },
        };
      });

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

      // Sync commentsCount ใน cache ของ post lists โดยตรง
      queryClient.setQueriesData({ queryKey: postKeys.lists() }, (old) => {
        if (!old || !Array.isArray(old.posts)) return old;
        return {
          ...old,
          posts: old.posts.map((p) =>
            String(p.id) === String(variables.postId)
              ? {
                  ...p,
                  commentsCount: Math.max(0, (p.commentsCount ?? 0) - 1),
                }
              : p,
          ),
        };
      });

      // Sync commentsCount ใน cache ของ post detail (ถ้ามี)
      queryClient.setQueryData(postKeys.detail(variables.postId), (old) => {
        if (!old?.post) return old;
        return {
          ...old,
          post: {
            ...old.post,
            commentsCount: Math.max(0, (old.post.commentsCount ?? 0) - 1),
          },
        };
      });

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
