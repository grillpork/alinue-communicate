"use client";

import React from "react";

/**
 * Template Component (Next.js App Router)
 * ทำงานคล้ายกับ Layout แต่จะถูก Mount และ Re-render ใหม่ทุกครั้งที่มีการสลับหน้า (Route Change)
 * เหมาะสำหรับทำ Page Transition Animations หรือ Reset state ตอนเปลี่ยนหน้า
 */
export default function Template({ children }) {
  return (
    <div className="w-full flex-1 flex flex-col transition-opacity duration-150 ease-out">
      {children}
    </div>
  );
}
