'use client';

import React from 'react';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-sm text-gray-500 mb-4">{error?.message || "ไม่สามารถโหลดข้อมูลได้"}</p>
      {reset && (
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}
