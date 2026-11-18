'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { useMeQuery, useSignOutMutation } from '@/features/auth';
import UserDropdown from '@/components/common/UserDropdown';

export default function MobileNavbar() {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const signOutMutation = useSignOutMutation();
  const user = meData?.user || null;

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/sign-in');
    } catch {
      router.push('/sign-in');
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md lg:hidden px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: User Profile Avatar / Sign In */}
        <div className="flex w-9 items-center justify-start">
          {user ? (
            <UserDropdown user={user} onLogout={handleSignOut} align="left" />
          ) : (
            <Link
              href="/sign-in"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Sign in"
              title="เข้าสู่ระบบ"
            >
              <User className="h-5 w-5 text-gray-700" />
            </Link>
          )}
        </div>

        {/* Center: Brand Logo Only */}
        <Link
          href="/"
          className="flex items-center justify-center shrink-0 transition-transform active:scale-95"
          aria-label="Alinue Home"
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
        </Link>

        {/* Right: Search Icon Button */}
        <div className="flex w-9 items-center justify-end">
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Search"
            title="ค้นหา"
          >
            <Search className="h-5 w-5 text-gray-800" />
          </Link>
        </div>
      </div>
    </header>
  );
}
