"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Plus, Bell, User } from "lucide-react";
import { useMeQuery } from "@/features/auth";
import { useUnreadNotificationCountQuery } from "@/features/notification";
import { PostFormModal, useCreatePostMutation } from "@/features/post";

export default function MobileBottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const { data: meData } = useMeQuery();
  const user = meData?.user || null;
  const isLogin = Boolean(user);

  const { data: notifData } = useUnreadNotificationCountQuery({
    enabled: isLogin,
  });
  const unreadCount = notifData?.unreadCount || 0;

  const createPostMutation = useCreatePostMutation();

  const isHomeActive = pathname === "/";
  const isSearchActive = pathname === "/search";
  const isNotifActive = pathname === "/notifications";
  const isProfileActive = Boolean(
    pathname.startsWith("/profile") ||
      (user?.username && pathname === `/${user.username}`),
  );

  const handleOpenCreatePost = () => {
    if (!isLogin) {
      router.push("/sign-in");
      return;
    }
    setIsPostModalOpen(true);
  };

  const handleCreatePost = async (data) => {
    const imageList = (data.images || [])
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean);

    await createPostMutation.mutateAsync({
      content: data.content,
      images: imageList,
      serviceId: data.serviceId || null,
      serviceTitle: data.serviceTitle || null,
    });
    setIsPostModalOpen(false);
  };

  const items = [
    {
      id: "home",
      label: "Home",
      href: "/",
      icon: Home,
      isActive: isHomeActive,
    },
    {
      id: "search",
      label: "Searching",
      href: "/search",
      icon: Search,
      isActive: isSearchActive,
    },
    {
      id: "create",
      isCreateButton: true,
    },
    {
      id: "notifications",
      label: "Notification",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : null,
      isActive: isNotifActive,
    },
    {
      id: "profile",
      label: "Profile",
      href: user?.username
        ? `/${user.username}`
        : isLogin
          ? "/profile"
          : "/sign-in",
      icon: User,
      isAvatar: Boolean(user?.avatarUrl || user?.avatar),
      avatarUrl: user?.avatarUrl || user?.avatar,
      isActive: isProfileActive,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-15 sm:h-16 px-1">
          {items.map((item) => {
            if (item.isCreateButton) {
              return (
                <div
                  key={item.id}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <button
                    type="button"
                    onClick={handleOpenCreatePost}
                    aria-label="สร้างโพสต์ใหม่"
                    title="สร้างโพสต์ใหม่"
                    className="flex h-10 w-12 items-center justify-center rounded-2xl bg-gray-100/90 text-gray-900 hover:bg-gray-200/80 active:scale-90 transition-all cursor-pointer"
                  >
                    <Plus className="h-5 w-5 stroke-[2.3]" />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center h-full transition-colors group cursor-pointer ${
                  item.isActive
                    ? "text-black"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {/* Icon Container with Badge */}
                <div className="relative flex items-center justify-center">
                  {item.isAvatar ? (
                    <div
                      className={`h-6 w-6 rounded-full overflow-hidden ring-1 transition-all ${
                        item.isActive ? "ring-black" : "ring-gray-200"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.avatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <Icon
                      className={`h-5 w-5 transition-transform group-active:scale-90 ${
                        item.isActive ? "stroke-[2.2]" : "stroke-[1.8]"
                      }`}
                    />
                  )}

                  {/* Unread Notification Badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 transition-colors leading-none tracking-tight ${
                    item.isActive
                      ? "font-bold text-black"
                      : "font-medium text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Create Post Modal */}
      {isPostModalOpen && (
        <PostFormModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}
    </>
  );
}
