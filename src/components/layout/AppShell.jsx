'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Rightbar from './Rightbar';
import MobileNavbar from './MobileNavbar';
import MobileBottomBar from './MobileBottomBar';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';

  // หน้า Auth (Sign-in / Sign-up) แสดงผลเต็มหน้าจอ
  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Mobile Top Navbar (แสดงเฉพาะบน Mobile / Tablet: lg:hidden) */}
      <MobileNavbar />

      {/* 2. Main Columns Layout */}
      <div className="w-full flex justify-between items-start gap-0 lg:gap-8 px-0 lg:px-6 py-0 flex-1">
        {/* Left Sidebar (Desktop: hidden lg:flex) */}
        <Sidebar />

        {/* Middle Column: {children} (มี padding-bottom บน mobile เพื่อไม่ให้โดน BottomBar บัง) */}
        <main className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl mx-auto w-full px-0 pb-20 lg:pb-0">
          {children}
        </main>

        {/* Rightbar (Desktop) */}
        <Rightbar />
      </div>

      {/* 3. Mobile Bottom Navigation Bar (แสดงเฉพาะบน Mobile / Tablet: lg:hidden) */}
      <MobileBottomBar />
    </div>
  );
}
