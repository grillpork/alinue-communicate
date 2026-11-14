'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Search,
  Bell,
  Bookmark,
  User,
  Settings,
  LogOut,
  MoreHorizontal,
  Loader2,
  LayoutList,
} from 'lucide-react';
import { useMeQuery, useSignOutMutation } from '@/services/auth';
import { useUnreadNotificationCountQuery } from '@/services/notification';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // ดึงข้อมูลผู้ใช้จริงจาก Neon DB ผ่าน TanStack Query
  const { data: meData, isLoading } = useMeQuery();
  const signOutMutation = useSignOutMutation();

  const user = meData?.user || null;
  const isLogin = Boolean(user);

  // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
  const { data: notifData } = useUnreadNotificationCountQuery({
    enabled: isLogin,
  });
  const unreadCount = notifData?.unreadCount || 0;

  // ปิดเมนูผู้ใช้เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      label: 'Portfolio / Feed',
      href: '/',
      icon: Briefcase,
      active: pathname === '/',
    },
    {
      label: 'Search',
      href: '/search',
      icon: Search,
      active: pathname === '/search',
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null,
      active: pathname === '/notifications',
    },
    {
      label: 'Services',
      href: user?.username ? `/${user.username}?tab=services` : '/search',
      icon: LayoutList,
      badge: null,
      active: Boolean(user?.username && pathname === `/${user.username}` && currentTab === 'services'),
    },
    {
      label: 'Bookmarks',
      href: user?.username ? `/${user.username}?tab=bookmarks` : '/sign-in',
      icon: Bookmark,
      badge: null,
      active: Boolean(user?.username && pathname === `/${user.username}` && currentTab === 'bookmarks'),
    },
    {
      label: 'Profile',
      href: user?.username ? `/${user.username}` : '/sign-in',
      icon: User,
      active: Boolean(
        user?.username &&
          pathname === `/${user.username}` &&
          currentTab !== 'bookmarks' &&
          currentTab !== 'services'
      ),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  const handleSignOut = () => {
    setShowUserMenu(false);
    signOutMutation.mutate();
  };

  return (
    <aside className="w-64 xl:w-72 shrink-0 hidden lg:flex flex-col justify-between sticky top-0 pt-6 h-screen border-r border-gray-100 pr-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top: Logo + Navigation Links */}
      <div className="flex flex-col">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 transition-transform active:scale-95"
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center">
            <Image
              src="/logos/LogoAlinue.png"
              alt="Alinue Logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Alinue
          </span>
        </Link>

        {/* Menu Navigation */}
        <nav className="mt-8 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  item.active
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                      item.active ? 'text-white' : 'text-gray-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.active
                        ? 'bg-white text-black'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Real User Account Profile / Sign In */}
      <div ref={userMenuRef} className="relative pt-4 border-t border-gray-100">
        {isLoading ? (
          <div className="flex items-center gap-3 p-2 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 rounded-md bg-gray-100" />
              <div className="h-2.5 w-16 rounded-md bg-gray-100" />
            </div>
          </div>
        ) : isLogin && user ? (
          <>
            {/* User Row Trigger */}
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex w-full items-center justify-between gap-2.5 rounded-2xl p-2 text-left hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100 bg-gray-100 flex items-center justify-center">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-gray-900">
                    {user.displayName || user.username}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    @{user.username}
                  </p>
                </div>
              </div>

              <MoreHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
            </button>

            {/* Popup Menu */}
            {showUserMenu && (
              <div className="absolute bottom-16 left-0 w-full rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="border-b border-gray-100 px-3 py-2.5">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href={user?.username ? `/${user.username}` : '/profile'}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    <span>View Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signOutMutation.isPending}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/sign-in"
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="flex w-full items-center justify-center rounded-xl bg-black py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
