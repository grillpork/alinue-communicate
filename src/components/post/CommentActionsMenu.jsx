'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Copy, Check, Loader2 } from 'lucide-react';

/**
 * CommentActionsMenu - Dropdown menu (•••) สำหรับความคิดเห็น
 * แทนที่ไอคอนถังขยะเดิมตามดีไซน์โซเชียลมีเดียสมัยใหม่
 */
export default function CommentActionsMenu({
  comment,
  canDelete = false,
  onDelete,
  isDeleting = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopy = () => {
    if (comment?.content && typeof window !== 'undefined') {
      navigator.clipboard.writeText(comment.content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1000);
    }
  };

  const handleDelete = () => {
    setIsOpen(false);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer ${
          isOpen ? 'bg-gray-100 text-gray-700' : ''
        }`}
        aria-label="Comment options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-38 sm:w-40 rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 z-30 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600 font-semibold">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-gray-400" />
                <span>คัดลอกข้อความ</span>
              </>
            )}
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                  <span>กำลังลบ...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>ลบความคิดเห็น</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

