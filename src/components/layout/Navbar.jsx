'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Mail, Bell, Bookmark } from 'lucide-react';
import UserDropdown from '../common/UserDropdown';
import { useMeQuery, useSignOutMutation } from '@/services/auth';

const Navbar = () => {
  const { data: meData } = useMeQuery();
  const signOutMutation = useSignOutMutation();

  const user = meData?.user;
  const isLogin = Boolean(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo + Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 transition-transform active:scale-95"
        >
          <div className="relative flex size-8 items-center justify-center">
            <Image
              src="/logos/LogoAlinue.png"
              alt="Alinue Logo"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="hidden sm:inline-block text-base font-bold tracking-tight text-gray-900">
            Alinue
          </span>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-3 sm:mx-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search Designers"
              className="w-full rounded-full border border-gray-200/80 bg-gray-50/70 py-1.5 sm:py-2 pl-9 pr-4 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Actions (Message, Bell, Bookmark, Avatar) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isLogin ? (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Messages Icon */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Messages"
              >
                <Mail className="h-4 w-4" />
              </button>

              {/* Notify (Bell) Icon */}
              <button
                type="button"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white" />
              </button>

              {/* Bookmark Icon */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                aria-label="Bookmarks"
              >
                <Bookmark className="h-4 w-4" />
              </button>

              {/* User Dropdown (Avatar only) */}
              <div className="ml-1">
                <UserDropdown
                  user={{
                    name: user?.displayName || user?.username,
                    email: user?.email,
                    avatar: user?.avatarUrl,
                  }}
                  onLogout={() => signOutMutation.mutate()}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[#1e2330] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2d3446] active:scale-95 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
