'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Rightbar from './Rightbar';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';

  // หน้า Auth (Sign-in / Sign-up) แสดงผลเต็มหน้าจอ
  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  // โครงสร้างเลย์เอาต์หลัก: เมนูทั้งหมดอยู่ที่ Sidebar ซ้าย (ตัด Navbar ออกแล้ว)
  return (
    <div className="w-full flex justify-between items-start gap-0 lg:gap-8 px-0 lg:px-6 py-0 flex-1">
      {/* 1. Left Sidebar (รวมเมนูทั้งหมดของเว็บ) */}
      <Sidebar />

      {/* 2. Middle Column: {children} (มี Search Bar และ Feed) */}
      <main className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl mx-auto w-full px-0">
        {children}
      </main>

      {/* 3. Rightbar */}
      <Rightbar />
    </div>
  );
}
