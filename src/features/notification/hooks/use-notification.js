'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../api/notification.client';
import { notificationKeys } from './notification.keys';

/**
 * Hook ดึงรายการแจ้งเตือนตาม Filter (all, follows, replies, likes, showcase)
 */
export function useNotificationsQuery(filter = 'all', options = {}) {
  return useQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: () => notificationService.getNotifications({ filter }),
    staleTime: 1000 * 30, // 30 วินาที
    refetchInterval: 1000 * 30, // Polling อัตโนมัติทุก 30 วินาที
    ...options,
  });
}

/**
 * Hook ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (สำหรับ Badge ไอคอน Bell ใน Sidebar)
 */
export function useUnreadNotificationCountQuery(options = {}) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationService.getUnreadCount,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // เช็คอัปเดต Badge ทุก 30 วินาที
    ...options,
  });
}

/**
 * Hook ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
 */
export function useMarkAllAsReadMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook ทำเครื่องหมายว่าอ่านแล้วรายการเดียว
 */
export function useMarkAsReadMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook ลบการแจ้งเตือน
 */
export function useDeleteNotificationMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
