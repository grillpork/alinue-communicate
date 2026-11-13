'use client';

import React, { useState, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStoriesQuery } from '@/services/story';
import { useMeQuery } from '@/services/auth';
import CreateStoryModal from './CreateStoryModal';
import StoryViewerModal from './StoryViewerModal';

export default function StoriesBar() {
  const scrollRef = useRef(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // 1. ดึงข้อมูล User ปัจจุบัน
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user || null;

  // 2. ดึง Stories ทั้งหมดในระบบจาก TanStack Query
  const { data: storiesData, isLoading } = useStoriesQuery();
  const storyGroups = storiesData?.storyGroups || [];

  // เช็คว่า User ปัจจุบันมี Story ของตัวเองอยู่แล้วหรือไม่
  const myStoryGroupIndex = storyGroups.findIndex(
    (g) => currentUser?.id && Number(g.user.id) === Number(currentUser.id)
  );
  const myStoryGroup = myStoryGroupIndex !== -1 ? storyGroups[myStoryGroupIndex] : null;

  // เลื่อนบาร์ซ้าย-ขวาบนจอคอมพิวเตอร์
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setIsViewerOpen(true);
  };

  const handleYourStoryClick = () => {
    if (!currentUser) {
      setIsCreateOpen(true);
      return;
    }
    // ถ้ามี Story อยู่แล้ว ให้เปิดดู แต่ถ้าไม่มีให้เปิดหน้าสร้าง
    if (myStoryGroup && myStoryGroup.stories.length > 0) {
      handleOpenViewer(myStoryGroupIndex);
    } else {
      setIsCreateOpen(true);
    }
  };

  return (
    <div className="relative w-full px-3 sm:px-4 mb-4 select-none group/bar">
      {/* Scroll Left Button (Desktop) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="hidden md:flex absolute -left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md border border-gray-100 hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/bar:opacity-100 cursor-pointer"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Stories Rail */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {/* 1. "Your Story" Card (ตรงตาม Reference ในรูป) */}
        <div
          onClick={handleYourStoryClick}
          className="relative flex-none w-[78px] sm:w-[84px] h-[106px] sm:h-[114px] rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col items-center justify-between p-2 group hover:scale-[1.02]"
        >
          {/* Background Preview (ถ้ามี story ตัวเอง) */}
          {myStoryGroup?.latestStory?.mediaUrl ? (
            <img
              src={myStoryGroup.latestStory.mediaUrl}
              alt="My latest story"
              className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-100" />
          )}

          {/* Avatar Container with Plus Button */}
          <div className="relative mt-1 z-10">
            <div className={`relative h-11 w-11 rounded-full overflow-hidden ring-2 ${
              myStoryGroup
                ? 'ring-gradient ring-pink-500'
                : 'ring-white shadow-xs'
            } bg-gray-100 flex items-center justify-center`}>
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName || currentUser.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-bold text-gray-700">
                  {(currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Blue Plus Icon Button (คลิกเปิด Modal เพิ่ม Story โดยตรง) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white shadow-xs hover:bg-blue-600 hover:scale-110 active:scale-90 transition-all cursor-pointer"
              title="เพิ่ม Story"
            >
              <Plus className="h-3 w-3 stroke-[3]" />
            </button>
          </div>

          {/* Label: Your Story */}
          <span className="relative z-10 text-[10px] sm:text-[11px] font-bold text-gray-800 truncate max-w-full px-0.5 group-hover:text-black">
            Your Story
          </span>
        </div>

        {/* 2. Loading Skeletons */}
        {isLoading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-none w-[78px] sm:w-[84px] h-[106px] sm:h-[114px] rounded-2xl sm:rounded-3xl bg-gray-100 animate-pulse border border-gray-100"
              />
            ))}
          </>
        )}

        {/* 3. Other Users' Story Cards (ตรงตาม Reference ในรูป) */}
        {storyGroups.map((group, idx) => {
          // ข้าม user ตัวเองถ้าอยู่ในกลุ่ม เพื่อไม่ให้ซ้ำกับ Your Story Card
          if (currentUser?.id && Number(group.user.id) === Number(currentUser.id)) {
            return null;
          }

          const hasUnviewed = group.hasUnviewed;
          const previewImg = group.latestStory?.mediaUrl || group.user.avatar;

          return (
            <div
              key={group.user.id}
              onClick={() => handleOpenViewer(idx)}
              className="relative flex-none w-[78px] sm:w-[84px] h-[106px] sm:h-[114px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-[1.02] flex flex-col justify-between p-2"
            >
              {/* Background Story Preview Image */}
              {previewImg ? (
                <img
                  src={previewImg}
                  alt={group.user.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
              )}

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35" />

              {/* Floating User Avatar at Top with Instagram-style Ring */}
              <div className="relative z-10 self-start mt-0.5">
                <div
                  className={`p-0.5 rounded-full ${
                    hasUnviewed
                      ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500'
                      : 'bg-white/40'
                  }`}
                >
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-white ring-1 ring-white/80">
                    {group.user.avatar ? (
                      <img
                        src={group.user.avatar}
                        alt={group.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-[10px] font-bold text-gray-800">
                        {(group.user.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Creator Name Label at Bottom */}
              <p className="relative z-10 text-[10px] sm:text-[11px] font-bold text-white drop-shadow-md truncate max-w-full">
                {group.user.name || group.user.username}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button (Desktop) */}
      <button
        type="button"
        onClick={() => scroll('right')}
        className="hidden md:flex absolute -right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md border border-gray-100 hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover/bar:opacity-100 cursor-pointer"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* 4. Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* 5. Story Viewer Modal */}
      <StoryViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        storyGroups={storyGroups}
        initialGroupIndex={activeGroupIndex}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
