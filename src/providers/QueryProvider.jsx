'use client';

import React, { useState, useEffect } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { setAuthToken } from '@/lib/api';
import { authKeys } from '@/services/auth';

function OAuthTokenSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || urlParams.get('auth_token');

    if (token) {
      setAuthToken(token);
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('auth_token');
      url.searchParams.delete('auth_success');
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));

      // สั่งดึงข้อมูล Profile ของผู้ใช้ใหม่ทันที
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      queryClient.refetchQueries({ queryKey: authKeys.me() });

      // หากอยู่ที่หน้า sign-in หรือ sign-up ให้ redirect ไปหน้าแรกทันที
      if (
        window.location.pathname === '/sign-in' ||
        window.location.pathname === '/sign-up'
      ) {
        window.location.href = '/';
      }
    }
  }, [queryClient]);

  return null;
}

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 นาที
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <OAuthTokenSync />
      {children}
    </QueryClientProvider>
  );
}

