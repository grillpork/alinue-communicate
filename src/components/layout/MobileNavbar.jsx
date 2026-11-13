'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Briefcase,
  Search,
  Bell,
  Bookmark,
  User,
  Settings,
  LogOut,
  LogIn,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useMeQuery, useSignOutMutation } from '@/services/auth';
import { useUnreadNotificationCountQuery } from '@/services/notification';

export default function MobileNavbar() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: meData } = useMeQuery();
  const user = meData?.user || null;
  const isLogin = Boolean(user);

  const { data: notifData } = useUnreadNotificationCountQuery({
    enabled: isLogin,
  });
  const unreadCount = notifData?.unreadCount || 0;

  const signOutMutation = useSignOutMutation({
    onSuccess: () => {
      setIsDrawerOpen(false);
    },
  });

  const navItems = [
    {
      label: 'Portfolio / Feed',
      href: '/',
      icon: Briefcase,
      active: pathname === '/',
    },
    {
      label: 'Search / Explore',
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
      label: 'Bookmarks',
      href: '#bookmarks',
      icon: Bookmark,
      active: pathname === '/bookmarks',
    },
    {
      label: 'My Profile',
      href: user?.username ? `/${user.username}` : '/sign-in',
      icon: User,
      active: Boolean(user?.username && pathname === `/${user.username}`),
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <>
      {/* Mobile Top Navbar (Visible only on mobile/tablet: lg:hidden) */}
      <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md lg:hidden px-4 py-2.5 transition-all">
        <div className="flex items-center justify-between">
          {/* Left: Brand Logo + Site Subtitle */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 transition-transform active:scale-95"
          >
            <div className="relative size-8 shrink-0 flex items-center justify-center">
              <Image
                src="/logos/LogoAlinue.png"
                alt="Alinue Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-gray-900 leading-tight">
                Alinue
              </span>
              <span className="text-[10px] text-gray-400 font-normal leading-tight">
                Alinue.com | Art Marketplace Online
              </span>
            </div>
          </Link>

          {/* Right: Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Box */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col justify-between p-5 animate-in slide-in-from-right duration-200">
            {/* Top: Header with Close Button */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logos/LogoAlinue.png"
                    alt="Alinue Logo"
                    width={26}
                    height={26}
                    className="object-contain"
                  />
                  <span className="text-sm font-bold text-gray-900">Alinue Menu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* User Profile Card (if logged in) */}
              {isLogin ? (
                <Link
                  href={user?.username ? `/${user.username}` : '/profile'}
                  onClick={() => setIsDrawerOpen(false)}
                  className="mt-4 flex items-center gap-3 p-2.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 transition-all cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden ring-1 ring-gray-200 shrink-0 flex items-center justify-center">
                    {user.avatarUrl || user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl || user.avatar}
                        alt={user.displayName || user.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </Link>
              ) : (
                <div className="mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs font-semibold text-gray-800">
                    เข้าสู่ระบบเพื่อใช้งานครบทุกฟีเจอร์
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Link
                      href="/sign-in"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex-1 rounded-xl bg-black py-2 text-xs font-semibold text-white text-center hover:bg-gray-800 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex-1 rounded-xl bg-white border border-gray-200 py-2 text-xs font-semibold text-gray-700 text-center hover:bg-gray-50 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                        item.active
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Logout Button */}
            {isLogin && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => signOutMutation.mutate()}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

