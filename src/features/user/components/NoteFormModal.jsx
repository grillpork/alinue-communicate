'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

/**
 * NoteFormModal - Modal สำหรับสร้างและแก้ไขสถานะ / โน้ต (Instagram / Threads Note style)
 * แสดงพรีวิวรูปโปรไฟล์พร้อม Thought Bubble เหนือศีรษะขณะพิมพ์
 */
export default function NoteFormModal({
  isOpen,
  onClose,
  initialNote = '',
  user,
  onSave,
}) {
  useBodyScrollLock(isOpen);
  const [noteText, setNoteText] = useState(initialNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  const MAX_LENGTH = 60;

  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNote || '');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (onSave) {
        await onSave(noteText.trim());
      }
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (onSave) {
        await onSave('');
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm rounded-[2rem] bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header: Title + Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">
            {initialNote ? 'แก้ไขโน้ตของคุณ' : 'แชร์โน้ตใหม่'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Preview Area (Avatar with Thought Bubble on top) */}
        <div className="py-7 flex flex-col items-center justify-center">
          {/* Thought Bubble Preview */}
          <div className="relative mb-2">
            <div className="relative z-10 max-w-[220px] rounded-2xl bg-gray-50 border border-gray-200/90 px-3.5 py-2 shadow-xs text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-900 break-words line-clamp-2">
                {noteText.trim() || (
                  <span className="text-gray-400 italic">แชร์ความคิดเห็น...</span>
                )}
              </p>
            </div>
            {/* Thought Bubble Little Circles (Pointing down to head) */}
            <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 flex flex-col items-center gap-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-200 border border-gray-300" />
              <div className="h-1 w-1 rounded-full bg-gray-300" />
            </div>
          </div>

          {/* User Avatar */}
          <div className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-full ring-3 ring-white bg-gray-100 overflow-hidden shadow-md mt-1">
            {user?.avatar ? (
              <Image
                width={80}
                height={80}
                src={user.avatar}
                alt={user.name || user.username || 'User'}
                className="h-full w-full object-cover"
                unoptimized={user.avatar?.endsWith('.gif') || user.avatar?.includes('.gif')}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                {(user?.name || user?.username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2">
            {user?.username ? `@${user.username}` : user?.name || ''}
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={noteText}
              maxLength={MAX_LENGTH}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="แชร์สิ่งที่อยู่ในใจ..."
              className="w-full rounded-2xl bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200/90 focus:border-gray-900 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-2xs"
            />
            <span
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-medium ${
                noteText.length >= MAX_LENGTH ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {noteText.length}/{MAX_LENGTH}
            </span>
          </div>

          <p className="text-[11px] text-gray-400 text-center px-2">
            โน้ตของคุณจะแสดงอยู่เหนือรูปโปรไฟล์เพื่อให้ผู้คนมองเห็นความคิดของคุณ
          </p>

          {/* Action Buttons */}
          <div className="mt-2 flex items-center gap-2">
            {initialNote && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 text-gray-600 hover:text-red-600 px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                title="ลบโน้ตปัจจุบัน"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>ลบโน้ต</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!noteText.trim() && !initialNote)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-black hover:bg-gray-800 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>{initialNote ? 'บันทึก' : 'แชร์โน้ต'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

