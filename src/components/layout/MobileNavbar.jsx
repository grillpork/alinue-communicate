'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';

export default function MobileNavbar() {
  return (
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

        {/* Right: Search Icon Button (กดไปหน้า Search) */}
        <Link
          href="/search"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Search"
          title="ค้นหา"
        >
          <Search className="h-5 w-5 text-gray-800" />
        </Link>
      </div>
    </header>
  );
}
