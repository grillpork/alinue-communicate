'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useMeQuery, useSignOutMutation } from '@/features/auth';
import UserDropdown from '@/components/common/UserDropdown';

export default function MobileNavbar() {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const signOutMutation = useSignOutMutation();
  const user = meData?.user || null;

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const prevScrollY = lastScrollYRef.current;
      const diff = currentScrollY - prevScrollY;

      // แสดงเสมอเมื่ออยู่ใกล้บนสุดของหน้า
      if (currentScrollY <= 20) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        return;
      }

      // เลื่อนลงเกินระยะ threshold -> ซ่อน Navbar
      if (diff > 8 && currentScrollY > 56) {
        setIsVisible(false);
        lastScrollYRef.current = currentScrollY;
      }
      // เลื่อนขึ้นเกินระยะ threshold -> แสดง Navbar
      else if (diff < -8) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push('/sign-in');
    } catch {
      router.push('/sign-in');
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md lg:hidden px-4 py-2.5 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
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

        {/* Right: Search Icon Button + UserDropdown */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Search"
            title="ค้นหา"
          >
            <Search className="h-5 w-5 text-gray-800" />
          </Link>

          {user && <UserDropdown user={user} onLogout={handleSignOut} />}
        </div>
      </div>
    </header>
  );
}
