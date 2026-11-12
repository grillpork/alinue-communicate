"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  UserPlus,
  Check,
  ExternalLink,
  MoreHorizontal,
  Compass,
  User,
} from "lucide-react";
import {
  useSuggestedUsersQuery,
  useToggleFollowMutation,
} from "@/services/user";

const TRENDING_TAGS = [
  { tag: "DesignSystems", category: "UI/UX Design", posts: "2.4k" },
  { tag: "MicroInteractions", category: "Motion & Prototyping", posts: "1.8k" },
  { tag: "ShaderGradient", category: "Creative Coding", posts: "920" },
  { tag: "TailwindCSS", category: "Frontend", posts: "1.2k" },
  { tag: "FigmaConfig", category: "Product Design", posts: "850" },
];

export default function Rightbar() {
  // ดึงรายชื่อครีเอเตอร์จริงจาก Neon DB ผ่าน TanStack Query (ไม่มี Mock Data)
  const { data: suggestedData, isLoading } = useSuggestedUsersQuery();
  const toggleFollowMutation = useToggleFollowMutation();

  const creators = suggestedData?.creators || [];

  const handleToggleFollow = (creatorId) => {
    toggleFollowMutation.mutate(creatorId);
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden lg:block sticky top-0 pt-6 max-h-screen overflow-y-auto space-y-5 pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Trending Topics Widget */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-700">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Trending for you
            </h3>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 divide-y divide-gray-50">
          {TRENDING_TAGS.map((item) => (
            <Link
              key={item.tag}
              href={`/?tag=${item.tag}`}
              className="group flex flex-col py-2.5 transition-colors hover:bg-gray-50/70 rounded-xl px-2 -mx-2"
            >
              <span className="text-[11px] font-medium text-gray-400">
                {item.category}
              </span>
              <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                #{item.tag}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                {item.posts} posts
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/explore"
          className="mt-2 block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors pt-1"
        >
          Show more
        </Link>
      </div>

      {/* 2. Suggested Creators Widget (ดึงจาก Neon DB จริง) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-gray-700">
              <Compass className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Suggested Creators
            </h3>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {isLoading ? (
            // Skeleton Loader
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-20 rounded bg-gray-100" />
                    <div className="h-2.5 w-14 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="h-7 w-16 rounded-full bg-gray-100" />
              </div>
            ))
          ) : creators.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">
              No suggestions found
            </p>
          ) : (
            creators.map((creator) => {
              const isFollowing = Boolean(creator.isFollowing);
              return (
                <div
                  key={creator.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Link
                      href={`/${creator.username}`}
                      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100 bg-gray-100 flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      {creator.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-400" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${creator.username}`}
                        className="block truncate text-xs font-bold text-gray-900 hover:underline cursor-pointer"
                      >
                        {creator.name}
                      </Link>
                      <p className="truncate text-[11px] text-gray-400">
                        @{creator.username}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(creator.id)}
                    disabled={toggleFollowMutation.isPending}
                    className={`inline-flex items-center gap-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-black text-white hover:bg-gray-800 shadow-2xs"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3 w-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Footer Links */}
      <div className="px-1 text-[11px] text-gray-400 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/about" className="hover:underline">
            About
          </Link>
          <span>·</span>
          <Link href="/help" className="hover:underline">
            Help Center
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/cookies" className="hover:underline">
            Cookie Policy
          </Link>
        </div>
        <p className="text-[10px] text-gray-400 pt-1">
          © 2026 Alinue, Inc. All rights reserved.
        </p>
      </div>
    </aside>
  );
}
