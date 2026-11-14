'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Heart,
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
  Sparkles,
  User,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  useToggleServiceLikeMutation,
  useDeleteServiceMutation,
  useRenewServiceMutation,
  useToggleServiceStatusMutation,
} from '@/services/service';
import { useMeQuery } from '@/services/auth';
import EditServiceModal from './EditServiceModal';

export default function ServiceDetailModal({
  isOpen,
  onClose,
  service,
  onDeleted,
  isOwner: isOwnerProp,
}) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const toggleLikeMutation = useToggleServiceLikeMutation();
  const deleteMutation = useDeleteServiceMutation();
  const renewMutation = useRenewServiceMutation();
  const toggleStatusMutation = useToggleServiceStatusMutation();

  useEffect(() => {
    setActiveImageIdx(0);
  }, [service?.id]);

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

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="relative aspect-video sm:aspect-16/10 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/60 shadow-2xs flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={images[activeImageIdx]}
                    alt={`Sample ${activeImageIdx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />

                  {/* Slider Arrows if multiple images */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-xs p-1.5 text-white hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 backdrop-blur-xs p-1.5 text-white hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white">
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
                        onClick={() => setActiveImageIdx(idx)}
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

            {/* Owner Controls Banner */}
            {isOwner && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    จัดการโพสต์นี้ (Creator Tools)
                  </span>
                  <span className="text-[11px] text-gray-500">
                    สร้างเมื่อ {new Date(service.createdAt).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Renew Button */}
                  <button
                    type="button"
                    onClick={handleRenew}
                    disabled={renewMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>ต่ออายุอีก 30 วัน</span>
                  </button>

                  {/* Toggle Status (Open/Pause) */}
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={toggleStatusMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Power className="h-3 w-3" />
                    <span>{status === 'paused' ? 'เปิดรับงาน' : 'พักรับงาน'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>แก้ไข</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-2xs hover:bg-red-100 transition-colors cursor-pointer ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>ลบโพสต์</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Actions: Like & Share */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
