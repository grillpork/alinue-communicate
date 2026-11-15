"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/service.client";
import { serviceKeys } from "./service.keys";

/**
 * Hook ดึงรายการโพสต์รับงาน
 */
export function useServicesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => api.getServices(filters),
    staleTime: 1000 * 60, // 1 นาที
    ...options,
  });
}

/**
 * Hook ดึงรายการงานที่ฉันโพสต์รับงานไว้ทั้งหมด
 */
export function useMyServicesQuery(options = {}) {
  return useQuery({
    queryKey: serviceKeys.my(),
    queryFn: () => api.getMyServices(),
    staleTime: 1000 * 30,
    ...options,
  });
}

/**
 * Hook ดึงรายละเอียดโพสต์รับงานชิ้นเดียว
 */
export function useServiceDetailQuery(id, options = {}) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => api.getService(id),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook สร้างโพสต์รับงานใหม่
 */
export function useCreateServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createService,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.my() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook แก้ไขโพสต์รับงาน
 */
export function useUpdateServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateService,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.my() });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.id) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook ลบโพสต์รับงาน
 */
export function useDeleteServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteService,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.my() });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook ต่ออายุโพสต์รับงานอีก 30 วัน
 */
export function useRenewServiceMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.renewService,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.my() });
      if (variables) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook สลับสถานะเปิดรับงาน / พักรับงานชั่วคราว
 */
export function useToggleServiceStatusMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.toggleServiceStatus,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.my() });
      if (variables) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook กด Like / Unlike โพสต์รับงาน
 */
export function useToggleServiceLikeMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.toggleLike,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      if (variables) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook บันทึกยอดวิวโพสต์รับงาน
 */
export function useRecordServiceViewMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.recordView,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      if (variables) {
        queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables) });
      }
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
