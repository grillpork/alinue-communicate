'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ChevronRight, ExternalLink } from 'lucide-react';

export default function LinkedServiceCard({ service, authorUsername, compact = false }) {
  if (!service || !service.id) return null;

  const title = service.title || 'บริการรับงาน';
  const price = service.price ? `฿${Number(service.price).toLocaleString()}` : service.priceText || null;
  const cover =
    service.coverUrl ||
    (Array.isArray(service.images) && service.images[0]) ||
    '/empty/no-image.png';

  const targetHref = authorUsername
    ? `/${authorUsername}?tab=services&service=${service.id}`
    : `/search?q=${encodeURIComponent(title)}`;

  if (compact) {
    return (
      <Link
        href={targetHref}
        onClick={(e) => e.stopPropagation()}
        className="group mt-2.5 flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100/80 p-2 sm:p-2.5 transition-all text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/empty/no-image.png';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <Layers className="h-3 w-3 text-gray-600" />
              <span>Linked Service</span>
            </div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 truncate">
              {title}
            </h4>
            {price && (
              <p className="text-[11px] font-semibold text-gray-600">
                {price}
              </p>
            )}
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 group-hover:text-gray-900 shadow-2xs shrink-0 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={targetHref}
      onClick={(e) => e.stopPropagation()}
      className="group mt-3 block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs hover:shadow-md hover:border-gray-200 transition-all text-left"
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-14 w-18 sm:h-16 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.src = '/empty/no-image.png';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
            <Layers className="h-3 w-3 text-gray-600" />
            <span>บริการที่เชื่อมโยง</span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-950 truncate group-hover:underline">
            {title}
          </h4>
          {price && (
            <p className="text-xs font-semibold text-gray-700 mt-0.5">
              {price}
            </p>
          )}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}
