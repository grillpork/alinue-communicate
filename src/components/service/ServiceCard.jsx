'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  Clock,
  Images,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCw,
  Power,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import {
  useToggleServiceLikeMutation,
  useDeleteServiceMutation,
  useRenewServiceMutation,
  useToggleServiceStatusMutation,
} from '@/services/service';
import { useMeQuery } from '@/services/auth';
import ServiceDetailModal from './ServiceDetailModal';
import EditServiceModal from './EditServiceModal';

export default function ServiceCard({
  service,
  currentUserId,
  onDeleted,
  isOwner: isOwnerProp,
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const toggleLikeMutation = useToggleServiceLikeMutation();
  const deleteMutation = useDeleteServiceMutation();
  const renewMutation = useRenewServiceMutation();
  const toggleStatusMutation = useToggleServiceStatusMutation();

  const author = service.author || {
    id: service.userId,
    name: 'Creator',
    username: 'user',
    avatar: null,
  };

  const isOwner =
    isOwnerProp !== undefined
      ? Boolean(isOwnerProp)
      : Boolean(
          (currentUser?.id && Number(currentUser.id) === Number(service.userId)) ||
          (currentUser?.username &&
            author.username &&
            currentUser.username.toLowerCase() === author.username.toLowerCase())
        );

  const images = Array.isArray(service.images) && service.images.length > 0
    ? service.images
    : service.coverUrl
    ? [service.coverUrl]
    : [];

  const coverUrl = service.coverUrl || images[0] || '/empty/no-image.png';
  const status = service.status || 'active';
  const isExpired = Boolean(service.isExpired);
  const daysLeft = service.daysLeft ?? 0;
  const isLiked = Boolean(service.isLiked);
  const likesCount = service.likesCount || 0;

  // ปิดเมนูเมื่อคลิกด้านนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    setIsDetailOpen(true);
  };

  const handleToggleLike = (e) => {
    e.stopPropagation();
    toggleLikeMutation.mutate(service.id);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${author.username}?tab=services&service=${service.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1200);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${author.username}?tab=services&service=${service.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: service.title,
            text: `ดูบริการ/ประกาศรับงาน "${service.title}" โดย @${author.username} บน Alinue`,
            url,
          });
        } catch {
          // ignore cancel
        }
      } else {
        handleCopyLink(e);
      }
    }
  };

  const handleRenew = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm('ต้องการต่ออายุโพสต์นี้อีก 30 วัน (1 เดือน) หรือไม่?')) {
      renewMutation.mutate(service.id);
    }
  };

  const handleToggleStatus = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    toggleStatusMutation.mutate(service.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์รับงานนี้?')) {
      deleteMutation.mutate(service.id, {
        onSuccess: () => {
          if (onDeleted) onDeleted(service.id);
        },
      });
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      >
        {/* Cover Image & Badges */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={service.title}
            onError={(e) => {
              e.currentTarget.src = '/empty/no-image.png';
            }}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Gradient Overlay on top & bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

          {/* Top Left: Status Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            {isExpired ? (
              <span className="rounded-full bg-gray-900/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-gray-200">
                หมดอายุแล้ว
              </span>
            ) : status === 'paused' ? (
              <span className="rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-white">
                พักรับงาน
              </span>
            ) : null}
          </div>

          {/* Top Right: Countdown / Image Count Pill */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
            {images.length > 1 && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white">
                <Images className="h-3 w-3" />
                <span>{images.length}</span>
              </span>
            )}

            {!isExpired && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-white">
                <Clock className="h-3 w-3 text-amber-300" />
                <span>{daysLeft}d</span>
              </span>
            )}
          </div>

          {/* Bottom Overlay: Price */}
          {(service.priceText || service.price) && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
              <span className="rounded-xl bg-black/70 backdrop-blur-xs px-2.5 py-1 text-xs font-bold shadow-2xs">
                {service.priceText || `฿${Number(service.price).toLocaleString()}`}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            {/* Title */}
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-black transition-colors">
              {service.title}
            </h3>

            {/* Description Snippet */}
            {service.description && (
              <p className="mt-1 text-[11px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            )}

            {/* Tags (up to 2 tags) */}
            {Array.isArray(service.tags) && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {service.tags.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-gray-50 border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                  >
                    #{tag}
                  </span>
                ))}
                {service.tags.length > 2 && (
                  <span className="text-[10px] text-gray-400 self-center">
                    +{service.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card Footer: Author + Like + Menu */}
          <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            {/* Author */}
            <Link
              href={`/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 group/author min-w-0"
            >
              <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-100">
                {author.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate group-hover/author:underline">
                {author.name}
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className="flex items-center gap-1 rounded-full p-1.5 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="ถูกใจ"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'
                  }`}
                />
                {likesCount > 0 && (
                  <span className={`text-[11px] ${isLiked ? 'text-rose-600 font-semibold' : ''}`}>
                    {likesCount}
                  </span>
                )}
              </button>

              {/* 3-Dots Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu((prev) => !prev);
                  }}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="ตัวเลือกเพิ่มเติม"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-44 rounded-2xl bg-white shadow-xl border border-gray-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>แชร์บริการนี้</span>
                    </button>

                    {isOwner && (
                      <>
                        <div className="my-1 border-t border-gray-100" />

                        <button
                          type="button"
                          onClick={handleRenew}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          <span>ต่ออายุอีก 30 วัน</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleStatus}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{status === 'paused' ? 'เปิดรับงาน' : 'พักรับงาน'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            setIsEditOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>แก้ไขประกาศ</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDelete}
                          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>ลบโพสต์</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {isDetailOpen && (
        <ServiceDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          service={service}
          isOwner={isOwner}
          onDeleted={onDeleted}
        />
      )}

      {/* Edit Service Modal */}
      {isEditOpen && (
        <EditServiceModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          service={service}
        />
      )}
    </>
  );
}
