'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
} from 'lucide-react';
import { useMeQuery } from '@/services/auth';
import { useUnreadNotificationCountQuery } from '@/services/notification';

export default function MobileBottomBar() {
  const pathname = usePathname();

  const { data: meData } = useMeQuery();
  const user = meData?.user || null;
  const isLogin = Boolean(user);

  const { data: notifData } = useUnreadNotificationCountQuery({
    enabled: isLogin,
  });
  const unreadCount = notifData?.unreadCount || 0;

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname === '/search';
  const isNotifActive = pathname === '/notifications';
  const isMessagesActive = pathname === '/messages';
  const isProfileActive = Boolean(
    pathname.startsWith('/profile') ||
    (user?.username && pathname === `/${user.username}`)
  );

  const items = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: isHomeActive,
    },
    {
      id: 'search',
      label: 'Searching',
      href: '/search',
      icon: Search,
      isActive: isSearchActive,
    },
    {
      id: 'notifications',
      label: 'Notification',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null,
      isActive: isNotifActive,
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '#messages',
      icon: MessageCircle,
      isActive: isMessagesActive,
    },
    {
      id: 'profile',
      label: 'Profile',
      href: user?.username ? `/${user.username}` : (isLogin ? '/profile' : '/sign-in'),
      icon: User,
      isAvatar: Boolean(user?.avatarUrl || user?.avatar),
      avatarUrl: user?.avatarUrl || user?.avatar,
      isActive: isProfileActive,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-15 sm:h-16 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center h-full transition-colors group cursor-pointer ${
                item.isActive ? 'text-black' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {/* Top Active Indicator Bar (ตรงตามภาพอ้างอิง) */}
              {item.isActive && (
                <span className="absolute top-0 inset-x-3 sm:inset-x-5 h-0.5 bg-black rounded-full" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center">
                {item.isAvatar ? (
                  <div
                    className={`h-6 w-6 rounded-full overflow-hidden ring-1 transition-all ${
                      item.isActive ? 'ring-black' : 'ring-gray-200'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Icon
                    className={`h-5 w-5 transition-transform group-active:scale-90 ${
                      item.isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                )}

                {/* Unread Notification Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] mt-1 transition-colors leading-none tracking-tight ${
                  item.isActive ? 'font-bold text-black' : 'font-medium text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

