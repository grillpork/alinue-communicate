"use client";

import React from "react";
import { MoreHorizontal, Copy, Share2, Flag, Pencil, Trash2 } from "lucide-react";

/**
 * Dropdown Menu (•••) บนส่วนหัวของโพสต์
 */
export default function PostMenu({
  showMenu,
  setShowMenu,
  menuRef,
  isOwner,
  onCopyLink,
  onShare,
  onEdit,
  onDelete,
}) {
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((prev) => !prev)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
        aria-label="ตัวเลือกเพิ่มเติม"
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
          <button
            type="button"
            onClick={onCopyLink}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5 text-gray-500" />
            <span>คัดลอกลิงก์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onShare?.();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-gray-500" />
            <span>แชร์โพสต์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              alert("ส่งรายงานโพสต์นี้ให้ผู้ดูแลระบบตรวจสอบแล้ว");
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Flag className="h-3.5 w-3.5 text-gray-400" />
            <span>รายงาน</span>
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onEdit?.();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-500" />
                <span>แก้ไขโพสต์</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onDelete?.();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                <span>ลบโพสต์</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
