'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

// -------------------------------------------------------------
// 1. Raw API Services
// -------------------------------------------------------------
export const serviceService = {
  // ดึงรายการโพสต์รับงาน (รองรับ search, tag, username, userId, status, includeExpired, page, limit)
  getServices: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.tag) query.set('tag', params.tag);
    if (params.username) query.set('username', params.username);
    if (params.userId) query.set('user_id', String(params.userId));
    if (params.status) query.set('status', params.status);
    if (params.includeExpired) query.set('include_expired', 'true');
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/services${qs ? `?${qs}` : ''}`;
    return fetchApi(endpoint);
  },

  // ดึงรายการงานที่ฉันโพสต์รับงานไว้ทั้งหมด (รวมหมดอายุและเปิดรับ)
  getMyServices: async () => {
    return fetchApi('/api/services/my');
  },

  // ดึงรายละเอียดโพสต์รับงานชิ้นเดียว
  getService: async (id) => {
    return fetchApi(`/api/services/${id}`);
  },

  // สร้างโพสต์รับงานใหม่ (มีอายุ 1 เดือน)
  createService: async (payload) => {
    return fetchApi('/api/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // แก้ไขโพสต์รับงาน
  updateService: async ({ id, ...payload }) => {
    return fetchApi(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ลบโพสต์รับงาน
  deleteService: async (id) => {
    return fetchApi(`/api/services/${id}`, {
      method: 'DELETE',
    });
  },

  // ต่ออายุโพสต์รับงานอีก 30 วัน (1 เดือน)
  renewService: async (id) => {
    return fetchApi(`/api/services/${id}/renew`, {
      method: 'POST',
    });
  },

  // สลับสถานะ เปิดรับงาน / พักรับงานชั่วคราว
  toggleServiceStatus: async (id) => {
    return fetchApi(`/api/services/${id}/toggle-status`, {
      method: 'POST',
    });
  },

  // กด Like / Unlike โพสต์รับงาน
  toggleLike: async (id) => {
    return fetchApi(`/api/services/${id}/like`, {
      method: 'POST',
    });
  },
};

// -------------------------------------------------------------
// 2. Query Keys
// -------------------------------------------------------------
export const serviceKeys = {
  all: ['services'],
  lists: () => [...serviceKeys.all, 'list'],
  list: (filters) => [...serviceKeys.lists(), filters],
  my: () => [...serviceKeys.all, 'my'],
  details: () => [...serviceKeys.all, 'detail'],
  detail: (id) => [...serviceKeys.details(), id],
};

// -------------------------------------------------------------
// 3. TanStack Query Hooks
// -------------------------------------------------------------

/**
 * Hook ดึงรายการโพสต์รับงาน
 */
export function useServicesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => serviceService.getServices(filters),
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
    queryFn: () => serviceService.getMyServices(),
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
    queryFn: () => serviceService.getService(id),
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
    mutationFn: serviceService.createService,
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
    mutationFn: serviceService.updateService,
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
    mutationFn: serviceService.deleteService,
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
    mutationFn: serviceService.renewService,
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
    mutationFn: serviceService.toggleServiceStatus,
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
    mutationFn: serviceService.toggleLike,
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
