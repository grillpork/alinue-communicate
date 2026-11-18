"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowUpRight } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import NoteFormModal from "./NoteFormModal";
import { useMeQuery } from "@/features/auth";
import { useNotesQuery, useUpdateProfileMutation } from "../hooks/use-user";
import { formatRelativeTime } from "@/lib/date";

/**
 * NotesBar - แถบโน้ตสไตล์ Profile / Instagram Notes ด้านบนหน้าฟีด
 * แสดงโน้ตของตัวเอง (กดสร้าง/แก้ไขได้ทันที) และโน้ตของเพื่อน (คนที่ติดตามหรือติดตามเรา)
 */
export default function NotesBar() {
  const router = useRouter();
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  const { data: notesData, isLoading } = useNotesQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedFriendNote, setSelectedFriendNote] = useState(null);

  const myNoteData = notesData?.myNote || null;
  const myNoteText = (myNoteData?.note || "").trim();
  const friendNotes = notesData?.notes || [];

  const selfUserForModal = currentUser
    ? {
        id: currentUser.id,
        name: currentUser.displayName || currentUser.username,
        username: currentUser.username,
        avatar: myNoteData?.avatar || currentUser.avatarUrl || null,
      }
    : null;

  const handleOpenMyNote = () => {
    if (!currentUser) {
      router.push("/sign-in");
      return;
    }
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (newNote) => {
    await updateProfileMutation.mutateAsync({ note: newNote });
  };

  return (
    <>
      <section className="bg-white border-b border-gray-100">
        <div className="flex items-end gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar px-3.5 sm:px-4 pt-3 pb-3.5">
          {/* 1. โน้ตของคุณ (Your Note) */}
          <button
            type="button"
            onClick={handleOpenMyNote}
            className="group flex flex-col items-center shrink-0 w-[86px] cursor-pointer focus:outline-none"
            title={
              currentUser
                ? myNoteText
                  ? "คลิกเพื่อแก้ไขโน้ตของคุณ"
                  : "แชร์โน้ตของคุณ"
                : "เข้าสู่ระบบเพื่อแชร์โน้ต"
            }
          >
            {/* Thought Bubble */}
            <div className="relative z-10 -mb-2.5 min-h-[36px] flex items-end justify-center w-full">
              <div className="relative rounded-2xl bg-white px-2.5 py-1.5 shadow-sm border border-gray-200/80 group-hover:border-gray-300 group-hover:shadow transition-all max-w-[92px] text-center">
                <p
                  className={`text-[11px] leading-tight line-clamp-2 break-words ${
                    myNoteText
                      ? "font-medium text-gray-800"
                      : "font-normal text-gray-400"
                  }`}
                >
                  {myNoteText || "โน้ต..."}
                </p>
                {/* Bubble tail dots */}
                <span className="absolute -bottom-1.5 left-4 h-2 w-2 rounded-full bg-white border border-gray-200/80" />
                <span className="absolute -bottom-2.5 left-3 h-1.5 w-1.5 rounded-full bg-white border border-gray-200/80" />
              </div>
            </div>

            {/* Avatar + Plus badge */}
            <div className="relative">
              <UserAvatar
                src={myNoteData?.avatar || currentUser?.avatarUrl}
                alt={currentUser?.displayName || currentUser?.username || "You"}
                size="xl"
                className="ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all"
              />
              {!myNoteText && (
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white ring-2 ring-white shadow-xs">
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </span>
              )}
            </div>

            <span className="mt-1.5 text-[11px] font-medium text-gray-500 truncate max-w-[82px]">
              โน้ตของคุณ
            </span>
          </button>

          {/* Loading Skeletons for Friends' Notes */}
          {isLoading &&
            [0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="flex flex-col items-center shrink-0 w-[86px] animate-pulse"
              >
                <div className="h-7 w-16 rounded-2xl bg-gray-100 mb-1" />
                <div className="h-16 w-16 rounded-full bg-gray-100" />
                <div className="h-2.5 w-12 rounded-full bg-gray-100 mt-2" />
              </div>
            ))}

          {/* 2. โน้ตของเพื่อน (Friends' Notes) */}
          {!isLoading &&
            friendNotes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedFriendNote(item)}
                className="group flex flex-col items-center shrink-0 w-[86px] cursor-pointer focus:outline-none"
              >
                {/* Thought Bubble */}
                <div className="relative z-10 -mb-2.5 min-h-[36px] flex items-end justify-center w-full">
                  <div className="relative rounded-2xl bg-white px-2.5 py-1.5 shadow-sm border border-gray-200/80 group-hover:border-gray-300 group-hover:shadow transition-all max-w-[92px] text-center">
                    <p className="text-[11px] font-medium leading-tight text-gray-800 line-clamp-2 break-words">
                      {item.note}
                    </p>
                    {/* Bubble tail dots */}
                    <span className="absolute -bottom-1.5 left-4 h-2 w-2 rounded-full bg-white border border-gray-200/80" />
                    <span className="absolute -bottom-2.5 left-3 h-1.5 w-1.5 rounded-full bg-white border border-gray-200/80" />
                  </div>
                </div>

                {/* Friend Avatar */}
                <UserAvatar
                  src={item.avatar}
                  alt={item.name || item.username}
                  size="xl"
                  className="ring-2 ring-gray-100 group-hover:ring-gray-300 transition-all"
                />

                {/* Friend Name */}
                <span className="mt-1.5 text-[11px] font-medium text-gray-700 truncate max-w-[82px]">
                  {item.name || item.username}
                </span>
              </button>
            ))}
        </div>
      </section>

      {/* Modal สร้าง/แก้ไขโน้ตของตัวเอง (ใช้ NoteFormModal เดียวกับหน้า Profile) */}
      {selfUserForModal && (
        <NoteFormModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          initialNote={myNoteText}
          user={selfUserForModal}
          onSave={handleSaveNote}
        />
      )}

      {/* Modal ดูโน้ตของเพื่อนแบบเต็ม */}
      {selectedFriendNote && (
        <div
          onClick={() => setSelectedFriendNote(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-[2rem] bg-white p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setSelectedFriendNote(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="ปิด"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pt-2 pb-4 flex flex-col items-center">
              {/* Full Thought Bubble */}
              <div className="relative mb-3">
                <div className="rounded-2xl bg-[#F6F6F8] border border-gray-100 px-4 py-2.5 max-w-[230px]">
                  <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                    {selectedFriendNote.note}
                  </p>
                </div>
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                  <div className="h-2 w-2 rounded-full bg-[#F6F6F8] border border-gray-200/80" />
                  <div className="h-1 w-1 rounded-full bg-gray-200" />
                </div>
              </div>

              {/* Friend Avatar */}
              <UserAvatar
                src={selectedFriendNote.avatar}
                alt={selectedFriendNote.name || selectedFriendNote.username}
                size="2xl"
                className="ring-2 ring-white shadow-md mt-1"
              />

              <h3 className="mt-3 text-sm font-bold text-gray-900">
                {selectedFriendNote.name || selectedFriendNote.username}
              </h3>
              <p className="text-xs text-gray-400">
                @{selectedFriendNote.username}
                {selectedFriendNote.noteUpdatedAt
                  ? ` • ${formatRelativeTime(selectedFriendNote.noteUpdatedAt)}`
                  : ""}
              </p>
            </div>

            <Link
              href={`/${selectedFriendNote.username}`}
              onClick={() => setSelectedFriendNote(null)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gray-900 hover:bg-black text-white py-2.5 px-4 text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <span>ดูโปรไฟล์</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
