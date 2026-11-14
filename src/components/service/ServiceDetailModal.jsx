'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
  Eye,
  Share2,
  Clock,
  Coins,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  RotateCw,
  Power,
  User,
  Copy,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import {
  useToggleServiceLikeMutation,
  useDeleteServiceMutation,
  useRenewServiceMutation,
  useToggleServiceStatusMutation,
} from '@/services/service';
import { useMeQuery } from '@/services/auth';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import useEmblaCarousel from 'embla-carousel-react';
import EditServiceModal from './EditServiceModal';

export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
  onDeleted,
  isOwner: isOwnerProp,
}) {
  useBodyScrollLock(isOpen);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    duration: 25,
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const toggleLikeMutation = useToggleServiceLikeMutation();
  const deleteMutation = useDeleteServiceMutation();
  const renewMutation = useRenewServiceMutation();
  const toggleStatusMutation = useToggleServiceStatusMutation();

  useEffect(() => {
    setActiveImageIdx(0);
    setShowMenu(false);
    if (emblaApi) {
      emblaApi.scrollTo(0, true);
    }
  }, [service?.id, emblaApi]);

  // Sync Embla Carousel กับ activeImageIdx
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveImageIdx(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || !service) return null;

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

  const status = service.status || 'active';
  const isExpired = Boolean(service.isExpired);
  const daysLeft = service.daysLeft ?? 0;
  const isLiked = Boolean(service.isLiked);
  const likesCount = service.likesCount || 0;
  const viewsCount = service.viewsCount ?? service.views_count ?? 0;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${author.username}?tab=services&service=${service.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleShare = async () => {
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
        handleCopyLink();
      }
    }
  };

  const handleToggleLike = () => {
    toggleLikeMutation.mutate(service.id);
  };

  const handleRenew = () => {
    if (confirm('ต้องการต่ออายุโพสต์นี้อีก 30 วัน (1 เดือน) หรือไม่?')) {
      renewMutation.mutate(service.id);
    }
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate(service.id);
  };

  const handleDelete = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์รับงานนี้?')) {
      deleteMutation.mutate(service.id, {
        onSuccess: () => {
          if (onDeleted) onDeleted(service.id);
          onClose();
        },
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col [scrollbar-width:thin]">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
            {/* Status & Expiry Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {isExpired ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-semibold">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span>หมดอายุแล้ว</span>
                </span>
              ) : status === 'paused' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>พักรับงานชั่วคราว</span>
                </span>
              ) : null}

              {!isExpired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200/60 px-2.5 py-1 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                  <span>เหลืออีก {daysLeft} วัน</span>
                </span>
              )}
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-1.5">
              {isOwner && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    title="ตัวเลือกเพิ่มเติม"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-white shadow-xl border border-gray-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          handleRenew();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span>ต่ออายุอีก 30 วัน</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          handleToggleStatus();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>แก้ไขประกาศ</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          handleDelete();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>ลบโพสต์</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Image Gallery with Embla Carousel */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="relative aspect-video sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-white border border-gray-200/80 shadow-2xs group select-none">
                  {/* Embla Viewport */}
                  <div
                    ref={emblaRef}
                    className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex h-full w-full">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center p-2"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Sample ${idx + 1}`}
                            draggable={false}
                            className="max-h-full max-w-full object-contain pointer-events-auto"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slider Arrows if multiple images */}
                  {images.length > 1 && (
                    <>
                      {activeImageIdx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            emblaApi?.scrollPrev();
                          }}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 text-gray-800 shadow-md border border-gray-200/80 backdrop-blur-xs p-2 hover:bg-white transition-all cursor-pointer"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                      )}
                      {activeImageIdx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            emblaApi?.scrollNext();
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 text-gray-800 shadow-md border border-gray-200/80 backdrop-blur-xs p-2 hover:bg-white transition-all cursor-pointer"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                      <span className="absolute bottom-2.5 right-2.5 z-20 rounded-lg bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
                        {activeImageIdx + 1} / {images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnails strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => emblaApi?.scrollTo(idx)}
                        className={`relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === activeImageIdx
                            ? 'border-black ring-2 ring-black/10'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Title & Price Header */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 leading-snug">
                  {service.title}
                </h1>
                {(service.priceText || service.price) && (
                  <div className="shrink-0 rounded-2xl bg-gray-50 border border-gray-200/80 px-3 py-1.5 text-right">
                    <span className="block text-xs font-medium text-gray-500">ราคา</span>
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      {service.priceText || `฿${Number(service.price).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {Array.isArray(service.tags) && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {service.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Author Profile Card */}
            <div className="flex items-center justify-between rounded-2xl bg-gray-50/70 border border-gray-100 p-3.5">
              <Link
                href={`/${author.username}`}
                onClick={onClose}
                className="flex items-center gap-3 group"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 border border-white shadow-2xs shrink-0">
                  {author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:underline">
                    {author.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">@{author.username}</p>
                </div>
              </Link>

              <Link
                href={`/${author.username}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors"
              >
                <span>ดูโปรไฟล์</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Description */}
            {service.description && (
              <div className="space-y-1.5 pt-1">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  รายละเอียดและเงื่อนไข
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/40 rounded-2xl p-4 border border-gray-100">
                  {service.description}
                </p>
              </div>
            )}

            {/* Bottom Actions: Like, Views & Share */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{likesCount > 0 ? likesCount : 'ถูกใจ'}</span>
                </button>

                <div
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-500"
                  title="ยอดเข้าชม"
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>{viewsCount} ยอดวิว</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>แชร์</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
