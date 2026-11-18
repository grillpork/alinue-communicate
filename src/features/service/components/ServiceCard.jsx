"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Eye,
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
} from "lucide-react";
import {
  useToggleServiceLikeMutation,
  useDeleteServiceMutation,
  useRenewServiceMutation,
  useToggleServiceStatusMutation,
} from "../hooks/use-services";
import { useMeQuery } from "@/features/auth";
import { getServicePath } from "@/lib/slug";
import { formatRelativeTime, formatFullDateTime } from "@/lib/date";
import PostAuthorProfileTrigger from "@/features/post/components/PostAuthorProfileTrigger";
import ServiceDetailModal from "./ServiceDetailModal";
import EditServiceModal from "./EditServiceModal";

export default function ServiceCard({
  service,
  currentUserId,
  onDeleted,
  isOwner: isOwnerProp,
  variant = "card",
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const previousUrlRef = useRef(null);

  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;

  const toggleLikeMutation = useToggleServiceLikeMutation();
  const deleteMutation = useDeleteServiceMutation();
  const renewMutation = useRenewServiceMutation();
  const toggleStatusMutation = useToggleServiceStatusMutation();

  const author = service.author || {
    id: service.userId,
    name: "Creator",
    username: "user",
    avatar: null,
  };

  const serviceAuthorUsername =
    service.author?.username || service.user?.username || author.username;

  const serviceAuthorId =
    service.userId ||
    service.user_id ||
    service.author?.id ||
    service.user?.id ||
    author.id;

  const isOwner =
    isOwnerProp !== undefined
      ? Boolean(isOwnerProp)
      : Boolean(
          (currentUser?.id &&
            serviceAuthorId &&
            Number(currentUser.id) === Number(serviceAuthorId)) ||
          (currentUser?.username &&
            serviceAuthorUsername &&
            currentUser.username.toLowerCase() ===
              serviceAuthorUsername.toLowerCase()),
        );

  const images =
    Array.isArray(service.images) && service.images.length > 0
      ? service.images
      : service.coverUrl
        ? [service.coverUrl]
        : [];

  const coverUrl = service.coverUrl || images[0] || "/empty/no-image.png";
  const status = service.status || "active";
  const isExpired = Boolean(service.isExpired);
  const daysLeft = service.daysLeft ?? 0;
  const isLiked = Boolean(service.isLiked);
  const likesCount = service.likesCount || 0;
  const viewsCount = service.viewsCount ?? service.views_count ?? 0;

  // ปิดเมนูเมื่อคลิกด้านนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const authorUsername = author?.username || "user";

  const handleCardClick = () => {
    setIsDetailOpen(true);
    if (typeof window !== "undefined") {
      previousUrlRef.current = window.location.pathname + window.location.search;
      const path = getServicePath(authorUsername, service);
      window.history.pushState({ modal: "service", id: service.id }, "", path);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname.includes("/services/")) {
        const fallbackUrl =
          previousUrlRef.current || `/${authorUsername}?tab=services`;
        window.history.replaceState({}, "", fallbackUrl);
      }
    }
  };

  useEffect(() => {
    if (!isDetailOpen) return;
    const handlePopState = () => {
      setIsDetailOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDetailOpen]);

  const handleToggleLike = (e) => {
    e.stopPropagation();
    toggleLikeMutation.mutate(service.id);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${getServicePath(authorUsername, service)}`;
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
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${getServicePath(authorUsername, service)}`;
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
    if (confirm("ต้องการต่ออายุโพสต์นี้อีก 30 วัน (1 เดือน) หรือไม่?")) {
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
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์รับงานนี้?")) {
      deleteMutation.mutate(service.id, {
        onSuccess: () => {
          if (onDeleted) onDeleted(service.id);
        },
      });
    }
  };

  const formattedPrice =
    service.startPrice !== undefined && service.startPrice !== null
      ? service.endPrice !== undefined &&
        service.endPrice !== null &&
        Number(service.endPrice) > Number(service.startPrice)
        ? `฿${Number(service.startPrice).toLocaleString()} - ฿${Number(service.endPrice).toLocaleString()}`
        : `฿${Number(service.startPrice).toLocaleString()}`
      : service.priceText ||
        (service.price ? `฿${Number(service.price).toLocaleString()}` : "");

  const renderMenuDropdown = (positionClass = "bottom-full mb-1") =>
    showMenu && (
      <div
        className={`absolute right-0 ${positionClass} w-44 rounded-2xl bg-white shadow-xl border border-gray-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-100`}
      >
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>ต่ออายุอีก 30 วัน</span>
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Power className="h-3.5 w-3.5" />
              <span>{status === "paused" ? "เปิดรับงาน" : "พักรับงาน"}</span>
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
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ลบโพสต์</span>
            </button>
          </>
        )}
      </div>
    );

  if (variant === "feed") {
    const feedImages = images.length > 0 ? images : [coverUrl];

    return (
      <>
        <article className="bg-white py-4 px-0 transition-colors">
          {/* 1. Header: รูปผู้แต่ง, ชื่อ, เวลา, เมนูตัวเลือก (เหมือน PostHeader) */}
          <div className="flex items-center justify-between px-3.5 sm:px-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <PostAuthorProfileTrigger author={author} />
              {service.createdAt && (
                <>
                  <span className="text-gray-400 text-xs">•</span>
                  <span
                    className="text-gray-400 hover:text-gray-600 transition-colors text-xs cursor-default shrink-0"
                    title={formatFullDateTime(service.createdAt)}
                  >
                    {formatRelativeTime(service.createdAt)}
                  </span>
                </>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {renderMenuDropdown("top-full mt-1")}
            </div>
          </div>

          {/* 2. Clickable Content & Full-Width Media */}
          <div onClick={handleCardClick} className="cursor-pointer group">
            {/* Title, Price, Description & Tags */}
            <div className="px-3.5 sm:px-4 mt-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-snug group-hover:text-black transition-colors">
                  {service.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isExpired && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      หมดอายุแล้ว
                    </span>
                  )}
                  {!isExpired && status === "paused" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      พักรับงาน
                    </span>
                  )}
                  {formattedPrice && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-900">
                      {formattedPrice}
                    </span>
                  )}
                </div>
              </div>

              {service.description && (
                <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
              )}

              {Array.isArray(service.tags) && service.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {service.tags.slice(0, 4).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Full-Width Images Showcase */}
            <div className="px-3.5 sm:px-4 mt-3">
              {feedImages.length >= 3 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {feedImages.slice(0, 3).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-[200px] sm:h-[260px] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`${service.title} ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = "/empty/no-image.png";
                        }}
                        className="h-full w-full object-cover"
                      />
                      {idx === 2 && feedImages.length > 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-bold">
                          +{feedImages.length - 3}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : feedImages.length === 2 ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {feedImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-[220px] sm:h-[280px] w-full overflow-hidden rounded-2xl border border-gray-100 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`${service.title} ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.src = "/empty/no-image.png";
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={feedImages[0]}
                    alt={service.title}
                    onError={(e) => {
                      e.currentTarget.src = "/empty/no-image.png";
                    }}
                    className="w-full max-h-[420px] sm:max-h-[460px] object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer Action Bar (สไตล์เดียวกับ PostActions) */}
          <div className="px-3.5 sm:px-4 mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleLike}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="ถูกใจ"
              >
                <Heart
                  className={`h-[18px] w-[18px] ${
                    isLiked ? "fill-rose-500 text-rose-500" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isLiked ? "text-rose-600 font-semibold" : "text-gray-500"
                  }`}
                >
                  {likesCount}
                </span>
              </button>

              <div
                className="flex items-center gap-1.5 text-xs text-gray-500"
                title="ยอดเข้าชม"
              >
                <Eye className="h-[18px] w-[18px] text-gray-500" />
                <span>{viewsCount}</span>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                title="แชร์บริการนี้"
              >
                <Share2 className="h-[17px] w-[17px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCardClick}
              className="rounded-full bg-gray-100 hover:bg-gray-200/80 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              ดูรายละเอียด
            </button>
          </div>
        </article>

        {/* Service Detail Modal */}
        {isDetailOpen && (
          <ServiceDetailModal
            isOpen={isDetailOpen}
            onClose={handleCloseDetail}
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

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex flex-col rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
      >
        {/* Cover Image & Badges */}
        <div className="relative aspect-4/3 w-full overflow-hidden p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={service.title}
            onError={(e) => {
              e.currentTarget.src = "/empty/no-image.png";
            }}
            className="h-full w-full object-cover  rounded-2xl"
          />
          {/* Top Left: Status Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            {isExpired ? (
              <span className="rounded-full bg-gray-900/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-semibold text-gray-200">
                หมดอายุแล้ว
              </span>
            ) : status === "paused" ? (
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
          </div>

          {/* Bottom Overlay: Price */}
          {(service.priceText || service.price || service.startPrice) && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
              <span className="rounded-xl bg-black/70 backdrop-blur-xs px-2.5 py-1 text-xs font-bold shadow-2xs">
                {service.startPrice !== undefined && service.startPrice !== null
                  ? service.endPrice !== undefined &&
                    service.endPrice !== null &&
                    Number(service.endPrice) > Number(service.startPrice)
                    ? `฿${Number(service.startPrice).toLocaleString()} - ฿${Number(service.endPrice).toLocaleString()}`
                    : `฿${Number(service.startPrice).toLocaleString()}`
                  : service.priceText ||
                    (service.price
                      ? `฿${Number(service.price).toLocaleString()}`
                      : "")}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between">
          <div>
            {/* Tags (up to 2 tags) */}
            {Array.isArray(service.tags) && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
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
          </div>

          {/* Card Footer: Author + Like + Menu */}
          <div className="mt-3.5 pt-2.5 border-t w-full border-gray-100 flex items-center justify-between">
            {/* Actions: Like & Views */}
            <div className="flex items-center gap-1">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className="flex items-center gap-1 rounded-full p-1.5 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="ถูกใจ"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    isLiked ? "fill-rose-500 text-rose-500" : "text-gray-400"
                  }`}
                />
                {likesCount > 0 && (
                  <span
                    className={`text-[11px] ${isLiked ? "text-rose-600 font-semibold" : ""}`}
                  >
                    {likesCount}
                  </span>
                )}
              </button>

              {/* View Count */}
              <div
                className="flex items-center gap-1 rounded-full p-1.5 text-xs text-gray-400"
                title="ยอดเข้าชม"
              >
                <Eye className="h-3.5 w-3.5 text-gray-400" />
                {viewsCount > 0 && (
                  <span className="text-[11px] font-medium text-gray-500">
                    {viewsCount}
                  </span>
                )}
              </div>
            </div>

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
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
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
                        <span>
                          {status === "paused" ? "เปิดรับงาน" : "พักรับงาน"}
                        </span>
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

      {/* Service Detail Modal */}
      {isDetailOpen && (
        <ServiceDetailModal
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
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
