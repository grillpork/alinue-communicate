'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, User } from 'lucide-react';

/**
 * CommentPortfolioCard - การ์ดแนบ Profile & Showcase (Portfolio) ใต้ความคิดเห็น
 * ตามแบบ UI ตัวอย่าง (Threads style)
 */
export default function CommentPortfolioCard({ data }) {
  if (!data) return null;

  const showcases = (data.showcases || []).filter((sc) => Boolean(sc?.coverUrl));

  return (
    <div className="mt-2 overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-2.5 sm:p-3 shadow-xs hover:border-gray-300 hover:shadow-sm transition-all group/card">
      {/* Top Header: Avatar, Name, Portfolio count, Arrow Button */}
      <div className="flex items-center justify-between gap-2.5">
        <Link
          href={`/${data.username || ''}`}
          className="flex items-center gap-2.5 min-w-0 flex-1 group/author"
        >
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-gray-100 bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
            {data.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatar}
                alt={data.name || data.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-4.5 w-4.5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] sm:text-[15px] font-bold text-gray-900 group-hover/author:underline truncate leading-snug">
              {data.name || data.username}
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-500 font-normal truncate">
              Portfolio • {data.totalShowcases ?? showcases.length} ผลงาน
            </p>
          </div>
        </Link>

        {/* ↗ Arrow Button */}
        <Link
          href={`/${data.username || ''}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-black hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
          aria-label={`View ${data.name || data.username}'s portfolio`}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Middle: Bio / Description */}
      {data.bio && (
        <p className="mt-1.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-2">
          {data.bio}
        </p>
      )}

      {/* Bottom: 4 Squircle Showcase Previews */}
      {showcases.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1 sm:gap-1.5">
          {showcases.slice(0, 4).map((item, idx) => (
            <Link
              key={item.id || idx}
              href={`/${data.username || ''}`}
              className="group/img relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 border border-gray-100/80 shadow-2xs cursor-pointer"
              title={item.title || 'Showcase'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.coverUrl}
                alt={item.title || 'Showcase'}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

