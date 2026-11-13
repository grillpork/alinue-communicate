'use client';

import React, { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Plus } from 'lucide-react';
import { useStoriesQuery } from '@/services/story';
import { useMeQuery } from '@/services/auth';
import CreateStoryModal from './CreateStoryModal';
import StoryViewerModal from './StoryViewerModal';

export default function StoriesBar() {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

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
  const hasMyStory = Boolean(myStoryGroup && myStoryGroup.stories?.length > 0 && myStoryGroup.latestStory?.mediaUrl);

  const handleOpenViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setIsViewerOpen(true);
  };

  const handleYourStoryClick = () => {
    if (!currentUser) {
      setIsCreateOpen(true);
      return;
    }
    if (hasMyStory) {
      handleOpenViewer(myStoryGroupIndex);
    } else {
      setIsCreateOpen(true);
    }
  };

  return (
    <div className="relative w-full px-3 sm:px-4 mb-5 select-none">
      {/* Embla Carousel Viewport (ไม่มีลูกศร และเลื่อนได้อย่างลื่นไหลเป็นธรรมชาติ) */}
      <div
        ref={emblaRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-3 py-1">
          {/* 1. "Your Story" Card (ขยายขนาดการ์ดขึ้น + ตัดคำว่า your story ออก) */}
          <div
            onClick={handleYourStoryClick}
            className="relative shrink-0 w-[108px] sm:w-[124px] md:w-[136px] h-[155px] sm:h-[180px] md:h-[195px] rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-2 group hover:scale-[1.02]"
          >
            {hasMyStory ? (
              /* กรณีลง Story แล้ว: ซ่อนรูปโปรไฟล์และ plus icon แสดงแค่รูปที่ลงเต็มการ์ด */
              <img
                src={myStoryGroup.latestStory.mediaUrl}
                alt="My Story"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              /* กรณียังไม่มี Story: แสดงรูปโปรไฟล์และ plus icon เพื่อกดเพิ่มตรงกลางการ์ด */
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden ring-2 ring-gray-100 bg-gray-100 flex items-center justify-center shadow-xs">
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName || currentUser.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-bold text-gray-700">
                        {(currentUser?.displayName || currentUser?.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Black Plus Icon Button (Theme ขาว ดำ) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreateOpen(true);
                    }}
                    className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white ring-2 ring-white shadow-xs hover:bg-gray-800 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                    title="เพิ่ม Story"
                    aria-label="Add story"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Loading Skeletons */}
          {isLoading && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-[108px] sm:w-[124px] md:w-[136px] h-[155px] sm:h-[180px] md:h-[195px] rounded-2xl sm:rounded-3xl bg-gray-100 animate-pulse border border-gray-100"
                />
              ))}
            </>
          )}

          {/* 3. Other Users' Story Cards (ขยายขนาดการ์ดขึ้น) */}
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
                className="relative shrink-0 w-[108px] sm:w-[124px] md:w-[136px] h-[155px] sm:h-[180px] md:h-[195px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900 border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group hover:scale-[1.02] flex flex-col justify-between p-2.5 sm:p-3"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                {/* Floating User Avatar at Top */}
                <div className="relative z-10 self-start">
                  <div
                    className={`p-0.5 rounded-full ${
                      hasUnviewed
                        ? 'bg-white ring-1 ring-white/90 shadow-xs'
                        : 'bg-white/30'
                    }`}
                  >
                    <div className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full overflow-hidden bg-black ring-1 ring-black/40">
                      {group.user.avatar ? (
                        <img
                          src={group.user.avatar}
                          alt={group.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-bold text-gray-800">
                          {(group.user.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Creator Name Label at Bottom */}
                <p className="relative z-10 text-xs sm:text-[13px] font-bold text-white drop-shadow-md truncate max-w-full">
                  {group.user.name || group.user.username}
                </p>
              </div>
            );
          })}
        </div>
      </div>

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
