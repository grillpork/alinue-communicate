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
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full sm:h-[92vh] max-h-[900px] max-w-5xl overflow-hidden rounded-none sm:rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col md:flex-row animate-in zoom-in-95 duration-150"
        >
          {/* Floating Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md border border-gray-200/80 backdrop-blur-md hover:bg-white hover:text-black transition-all active:scale-95 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* 1. LEFT SIDE: Image Viewer with Embla Carousel */}
          <div className="relative flex-1 bg-white flex flex-col items-center justify-center select-none overflow-hidden min-h-[300px] sm:min-h-[420px] md:min-h-full border-b md:border-b-0 md:border-r border-gray-100 group">
            {images.length > 0 ? (
              <>
                {/* Embla Viewport */}
                <div
                  ref={emblaRef}
                  className="h-full w-full overflow-hidden cursor-grab active:cursor-grabbing"
                >
                  <div className="flex h-full w-full">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative min-w-0 flex-[0_0_100%] h-full flex items-center justify-center p-4 sm:p-6"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Sample ${idx + 1}`}
                          draggable={false}
                          className="max-h-[75vh] max-w-full object-contain pointer-events-auto rounded-xl shadow-xs"
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md border border-gray-200/80 hover:bg-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    {activeImageIdx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          emblaApi?.scrollNext();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md border border-gray-200/80 hover:bg-white hover:scale-105 transition-all active:scale-95 cursor-pointer"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    )}

                    {/* Counter Pill & Thumbnails Bar */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="text-[11px] font-semibold text-white/90">
                        {activeImageIdx + 1} / {images.length}
                      </span>
                      <div className="mx-1 h-2.5 w-px bg-white/20" />
                      <div className="flex items-center gap-1.5">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              emblaApi?.scrollTo(idx);
                            }}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              idx === activeImageIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                            }`}
                            aria-label={`Go to image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/empty/no-image.png"
                  alt="No image"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain opacity-90"
                />
              </div>
            )}
          </div>

          {/* 2. RIGHT SIDE: Service Details & Actions Panel */}
          <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 flex flex-col bg-white overflow-hidden border-t md:border-t-0 md:border-l border-gray-100">
            {/* Top Bar with Expiry & Actions */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-10">
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

              {/* Owner Options Menu */}
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
            </div>

            {/* Scrollable Content Body (Hidden Scrollbar) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* Thumbnails strip (If multiple images) */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

              {/* Description */}
              {service.description && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    รายละเอียดและเงื่อนไข
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/40 rounded-2xl p-4 border border-gray-100">
                    {service.description}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions: Like, Views & Share */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{likesCount > 0 ? likesCount : 'ถูกใจ'}</span>
                </button>

                <div
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500"
                  title="ยอดเข้าชม"
                >
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span>{viewsCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                      <span>คัดลอก</span>
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
