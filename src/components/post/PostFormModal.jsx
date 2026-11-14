"use client";

import {
  ChevronRight,
  X,
  Plus,
  Loader2,
  Image as ImageIcon,
  Video,
  Smile,
  AlignLeft,
  MapPin,
  Music,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  MoreHorizontal,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { uploadToR2, submitModerationAppeal } from "@/lib/upload";
import { useSuggestedUsersQuery } from "@/services/user";
import { useMeQuery } from "@/services/auth";
import LinkServiceModal from "@/components/showcase/LinkServiceModal";

export default function PostFormModal({
  isOpen = true,
  onClose,
  onSubmit,
  isEdit = false,
  mode,
  initialPost = null,
}) {
  const { data: meData } = useMeQuery();
  const currentUser = meData?.user;
  const usernameDisplay = currentUser?.username
    ? `@${currentUser.username}`
    : initialPost?.author?.username
      ? `@${initialPost.author.username}`
      : "Post";

  const isUpdateMode = isEdit || mode === "update";
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link to service state
  const [isLinkServiceOpen, setIsLinkServiceOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Files currently in upload queue (for Skeleton loading cards)
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // Moderation Alert & Appeal States
  const [moderationAlert, setModerationAlert] = useState(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);

  // Tag (#) and User (@) Suggestion State
  const [suggestionType, setSuggestionType] = useState(null); // 'tag' | 'user' | null
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestionCursorPos, setSuggestionCursorPos] = useState(0);
  const [popupPos, setPopupPos] = useState({ left: 0, top: 0 });

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);
  const triggerMarkerRef = useRef(null);

  const availableTags = [
    { name: "Homescreen", color: "bg-blue-500" },
    { name: "Homepage", color: "bg-amber-400" },
    { name: "Dashboard", color: "bg-emerald-500" },
    { name: "Settings", color: "bg-purple-500" },
  ];

  // ดึงรายชื่อ Users แนะนำจาก Neon DB สำหรับ @mention
  const { data: suggestedData } = useSuggestedUsersQuery();
  const availableUsers = (suggestedData?.creators || []).map((c) => ({
    username: c.username,
    name: c.name,
    role: c.role || "Designer",
    avatar: c.avatar,
  }));

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().startsWith(suggestionQuery.toLowerCase()),
  );

  const filteredUsers = availableUsers.filter(
    (u) =>
      u.username.toLowerCase().startsWith(suggestionQuery.toLowerCase()) ||
      u.name.toLowerCase().startsWith(suggestionQuery.toLowerCase()),
  );

  // คำนวณตำแหน่ง Popup ให้อยู่ใต้เครื่องหมาย # หรือ @ พอดี
  useEffect(() => {
    if (suggestionType && triggerMarkerRef.current && containerRef.current) {
      const markerRect = triggerMarkerRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const left = markerRect.left - containerRect.left;
      const top = markerRect.bottom - containerRect.top + 6;
      // ป้องกันไม่ให้ popup ล้นขอบขวา
      const maxLeft = Math.max(0, containerRect.width - 220);
      setPopupPos({
        left: Math.min(Math.max(0, left), maxLeft),
        top,
      });
    }
  }, [suggestionType, suggestionCursorPos, content, suggestionQuery]);

  // ขยายความสูง Textarea อัตโนมัติ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(56, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  // รีเซ็ตข้อมูลฟอร์มทั้งหมดให้ว่างเปล่า
  const resetForm = () => {
    setContent("");
    setImages([]);
    setSelectedService(null);
    setUploadingFiles([]);
    setModerationAlert(null);
    setShowAppealForm(false);
    setAppealReason("");
    setAppealSuccess(false);
    setSuggestionType(null);
    setSuggestionQuery("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }
  };

  const handleClose = () => {
    if (!isUpdateMode) {
      resetForm();
    }
    if (onClose) onClose();
  };

  // ปิด modal หรือ popup เมื่อกด ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (suggestionType) {
          setSuggestionType(null);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestionType, isUpdateMode, onClose]);

  // ซิงก์ค่าเริ่มต้น หรือล้างการแจ้งเตือนและคิวอัปโหลดเมื่อเปิด/ปิด Modal
  useEffect(() => {
    if (!isOpen) {
      setModerationAlert(null);
      setShowAppealForm(false);
      setAppealSuccess(false);
      setAppealReason("");
      setSuggestionType(null);
      setSuggestionQuery("");
      uploadingFiles.forEach((u) => {
        if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
      });
      setUploadingFiles([]);
      if (!isUpdateMode) {
        resetForm();
      }
    } else if (initialPost) {
      setContent(initialPost.content || initialPost.caption || "");
      setImages(initialPost.images || initialPost.media_urls || []);
      if (initialPost.service) {
        setSelectedService(initialPost.service);
      } else if (initialPost.serviceId || initialPost.service_id) {
        setSelectedService({
          id: initialPost.serviceId || initialPost.service_id,
          title:
            initialPost.serviceTitle ||
            initialPost.service_title ||
            "Linked service",
        });
      } else {
        setSelectedService(null);
      }
    }
  }, [isOpen, initialPost, isUpdateMode]);

  if (!isOpen) return null;

  // ตรวจจับการพิมพ์ # หรือ @ เพื่อเปิด Dropdown
  const handleTextChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf("#");
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // หาตำแหน่งเครื่องหมายล่าสุด (# หรือ @) ที่อยู่ติดกับ cursor
    const lastTriggerIndex = Math.max(lastHashIndex, lastAtIndex);

    if (lastTriggerIndex !== -1) {
      const triggerChar = textBeforeCursor[lastTriggerIndex];
      const query = textBeforeCursor.slice(lastTriggerIndex + 1);

      // ถ้าไม่มี space คั่น ให้แสดงคำแนะนำ
      if (!query.includes(" ") && !query.includes("\n")) {
        setSuggestionQuery(query);
        setSuggestionCursorPos(lastTriggerIndex);
        setSuggestionType(triggerChar === "#" ? "tag" : "user");
        return;
      }
    }
    setSuggestionType(null);
  };

  // เลือก Tag จาก dropdown
  const handleSelectTag = (tagName) => {
    const textBeforeHash = content.slice(0, suggestionCursorPos);
    const textAfterCursor = content.slice(
      suggestionCursorPos + 1 + suggestionQuery.length,
    );
    const newText = `${textBeforeHash}#${tagName} ${textAfterCursor}`;
    setContent(newText);
    setSuggestionType(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // เลือก User จาก dropdown
  const handleSelectUser = (user) => {
    const textBeforeAt = content.slice(0, suggestionCursorPos);
    const textAfterCursor = content.slice(
      suggestionCursorPos + 1 + suggestionQuery.length,
    );
    const newText = `${textBeforeAt}@${user.username} ${textAfterCursor}`;
    setContent(newText);
    setSuggestionType(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // จัดการอัปโหลดไฟล์รูปภาพตรงเข้า Cloudflare R2 พร้อมแปลงเป็น WebP และแสดง Skeleton Card
  const handleFiles = async (fileList) => {
    const rawFiles = Array.from(fileList || []);
    if (rawFiles.length === 0) return;

    setIsUploading(true);
    setModerationAlert(null);
    setShowAppealForm(false);
    setAppealSuccess(false);
    setAppealReason("");

    // สร้างคิว Skeleton Cards ทันที เพื่อให้ User เห็นกล่อง Preview แบบ Realtime โดยไม่ต้องรอโหลด
    const queueItems = rawFiles.map((file) => ({
      tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      progress: 5,
    }));

    setUploadingFiles((prev) => [...prev, ...queueItems]);

    // ทยอยอัปโหลดทีละไฟล์ พร้อมอัปเดตเกจความคืบหน้า (Progress)
    for (const item of queueItems) {
      try {
        const result = await uploadToR2(item.file, {
          folder: "posts",
          onProgress: (percent) => {
            setUploadingFiles((prev) =>
              prev.map((u) =>
                u.tempId === item.tempId
                  ? { ...u, progress: Math.max(5, percent) }
                  : u,
              ),
            );
          },
        });

        // อัปโหลดสำเร็จ: นำข้อมูลรูปจริงเข้า images
        setImages((prev) => [
          ...prev,
          {
            id: result.fileKey,
            url: result.publicUrl,
            name: result.originalName,
          },
        ]);
      } catch (err) {
        console.error("Failed to upload image to R2:", err);

        if (err.isTimedOut) {
          setModerationAlert({
            type: "timeout",
            title: "พักการใช้งานชั่วคราว",
            message:
              err.message ||
              `ระบบระงับการอัปโหลดชั่วคราวเป็นเวลา ${err.remainingMinutes || 15} นาที เนื่องจากตรวจพบภาพที่ไม่สอดคล้องกับมาตรฐานชุมชนซ้ำหลายครั้ง เพื่อความปลอดภัยของทุกคนครับ`,
            reasons: err.reasons || [],
          });
        } else if (
          err.isModerationViolation ||
          (err.reasons && err.reasons.length > 0)
        ) {
          setModerationAlert({
            type: "moderation",
            title: "ขออภัย ไม่สามารถใช้รูปภาพนี้ได้",
            message:
              "ระบบตรวจพบเนื้อหาที่อาจขัดต่อมาตรฐานความปลอดภัยของชุมชน เพื่อรักษาบรรยากาศที่ดีและปลอดภัยสำหรับผู้ใช้งานทุกคน รบกวนเลือกรูปภาพอื่นนะครับ",
            reasons:
              err.reasons && err.reasons.length > 0
                ? err.reasons
                : [err.message || "ตรวจพบเนื้อหาที่อาจไม่เหมาะสม"],
            logId: err.logId,
            imageUrl: err.imageUrl,
          });
        } else {
          setModerationAlert({
            type: "error",
            title: "ไม่สามารถอัปโหลดรูปภาพได้",
            message:
              err.message ||
              "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้งครับ",
            reasons: [],
          });
        }
      } finally {
        // ลบ Skeleton Card ของไฟล์นี้ออก และคืน Memory ของ Object URL
        setUploadingFiles((prev) =>
          prev.filter((u) => u.tempId !== item.tempId),
        );
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    setIsUploading(false);
  };

  // ส่งคำร้องอุทธรณ์ไปยัง Admin Backoffice
  const handleSendAppeal = async () => {
    if (!appealReason.trim() || isAppealing) return;
    setIsAppealing(true);
    try {
      await submitModerationAppeal({
        logId: moderationAlert?.logId,
        imageUrl: moderationAlert?.imageUrl,
        appealReason: appealReason.trim(),
      });
      setAppealSuccess(true);
      setShowAppealForm(false);
    } catch (appealErr) {
      console.error("Appeal error:", appealErr);
      alert(
        appealErr.message ||
          "ไม่สามารถส่งคำร้องอุทธรณ์ได้ กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsAppealing(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveImage = (idToRemove) => {
    setImages((prev) => prev.filter((img) => img.id !== idToRemove));
  };

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // แสดงผลข้อความใน Backdrop เพื่อให้ #hashtag และ @user เป็นสีฟ้า
  const renderBackdropText = () => {
    if (!content) return null;

    const regex = /(#[^\s]+|@[^\s]+|#|@)/g;
    const elements = [];
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        elements.push(
          <span key={`txt-${lastIdx}`}>
            {content.slice(lastIdx, match.index)}
          </span>,
        );
      }

      const isCurrentActive =
        Boolean(suggestionType) && match.index === suggestionCursorPos;

      elements.push(
        <span
          key={`match-${match.index}`}
          ref={isCurrentActive ? triggerMarkerRef : null}
          className="text-blue-500 font-medium"
        >
          {match[0]}
        </span>,
      );

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < content.length) {
      elements.push(
        <span key={`txt-${lastIdx}`}>{content.slice(lastIdx)}</span>,
      );
    }

    if (content.endsWith("\n")) {
      elements.push(<br key="trailing-br" />);
    }

    return elements;
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      try {
        setIsSubmitting(true);
        await onSubmit({
          content,
          images,
          serviceId: selectedService?.id || null,
          serviceTitle: selectedService?.title || null,
        });
        // เคลียร์ข้อมูลฟอร์มทั้งหมดหลังสร้างโพสต์สำเร็จ
        resetForm();
        if (onClose) onClose();
      } catch (err) {
        console.error("Submit post error:", err);
        setModerationAlert({
          type: "error",
          title: "ไม่สามารถโพสต์ได้",
          message:
            err.message || "เกิดข้อผิดพลาดในการสร้างโพสต์ กรุณาลองใหม่อีกครั้ง",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative z-10 w-full max-w-[540px] max-h-[88vh] rounded-3xl bg-white shadow-2xl transition-all duration-200 flex flex-col overflow-hidden ${
          isDragging ? "ring-2 ring-blue-500 scale-[1.01]" : ""
        }`}
      >
        {/* Header: @username > New post / Update post & Close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {usernameDisplay}
            </span>
            <span className="text-xs text-gray-400">
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-gray-800">
              {isUpdateMode ? "Update post" : "New post"}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-5 [scrollbar-width:thin] scrollbar-thumb-gray-200 space-y-5">
          {/* Previews when images are added */}
          {(images.length > 0 || uploadingFiles.length > 0) && (
            <div className="">
              <div className="flex items-center justify-between mb-3 px-3">
                <span className="text-xs text-gray-400 font-medium">
                  {images.length + uploadingFiles.length} / 20
                </span>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 hover:bg-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Add media</span>
                </button>
              </div>

              {/* Horizontal Scrollable Carousel like reference image */}
              <div className="flex px-3 items-center gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative h-64 w-auto min-w-[140px] max-w-[340px] shrink-0 overflow-hidden rounded-2xl bg-neutral-900 shadow-md animate-in fade-in duration-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      className="h-full w-auto max-w-[340px] object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient overlay at bottom for controls */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    {/* Top Right: Remove (X) Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 transition-all cursor-pointer shadow-sm"
                      title="ลบรูปภาพ"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    {/* Bottom Bar: Action Pill & More Button */}
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx !== 0) {
                            setImages((prev) => {
                              const copy = [...prev];
                              const [selected] = copy.splice(idx, 1);
                              copy.unshift(selected);
                              return copy;
                            });
                          }
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all shadow-sm cursor-pointer ${
                          idx === 0
                            ? "bg-white/95 text-black hover:bg-white"
                            : "bg-black/60 hover:bg-black/80 text-white"
                        }`}
                      >
                        {idx === 0 ? "หน้าปก" : "ตั้งเป็นปก"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors shadow-sm cursor-pointer"
                        title="ตัวเลือกเพิ่มเติม"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {uploadingFiles.map((upload) => (
                  <div
                    key={upload.tempId}
                    className="relative h-64 w-48 shrink-0 overflow-hidden rounded-3xl bg-neutral-900 shadow-md animate-in fade-in duration-200"
                  >
                    {upload.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={upload.previewUrl}
                        alt={upload.name}
                        className="h-full w-full object-cover blur-[2px] opacity-60 scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-800 animate-pulse" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 backdrop-blur-[1px] p-2 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                      <span className="text-xs font-semibold text-white">
                        {upload.progress > 0 && upload.progress < 100
                          ? `${upload.progress}%`
                          : "Uploading..."}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Caption Textarea Area */}
          <div className=" px-3">
            <div ref={containerRef} className="relative min-h-[90px]">
              {/* Backdrop Layer: แสดงข้อความและไฮไลต์ #hashtag เป็นสีฟ้า */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 select-none whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-gray-800"
              >
                {renderBackdropText()}
              </div>

              {/* Textarea Layer */}
              <textarea
                ref={textareaRef}
                rows={3}
                value={content}
                onChange={handleTextChange}
                maxLength={2000}
                placeholder={!content ? "Adding a caption for this post" : ""}
                className="relative z-10 w-full resize-none border-none bg-transparent p-0 font-sans text-base leading-relaxed text-transparent caret-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 whitespace-pre-wrap break-words"
              />

              {/* Autocomplete Dropdown สำหรับ #tag */}
              {suggestionType === "tag" && filteredTags.length > 0 && (
                <div
                  style={{
                    left: `${popupPos.left}px`,
                    top: `${popupPos.top}px`,
                  }}
                  className="absolute z-30 w-52 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 transition-all duration-75"
                >
                  {filteredTags.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => handleSelectTag(t.name)}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Autocomplete Dropdown สำหรับ @user */}
              {suggestionType === "user" && filteredUsers.length > 0 && (
                <div
                  style={{
                    left: `${popupPos.left}px`,
                    top: `${popupPos.top}px`,
                  }}
                  className="absolute z-30 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 transition-all duration-75"
                >
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    People
                  </div>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.username}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-gray-50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt={u.username}
                        className="h-6 w-6 rounded-full object-cover shrink-0 border border-gray-100"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-gray-800 truncate leading-tight">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-blue-500 font-medium truncate leading-tight">
                          @{u.username}
                        </span>
                      </div>
                      {u.role && (
                        <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                          {u.role}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Character counter (0/2,000) */}
            <div className="flex justify-end pt-1">
              <span className="text-xs font-medium text-gray-400">
                {content.length}/2,000
              </span>
            </div>
          </div>

          {/* 3. Link to service Button Row */}
          <div className="pt-2 px-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsLinkServiceOpen(true)}
              className="flex w-full items-center justify-between py-2 px-1 hover:bg-gray-50/80 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-gray-800">
                <Layers className="h-5 w-5 text-gray-600 stroke-[1.75]" />
                <span className="text-sm font-medium text-gray-900">
                  Link to service
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-700 transition-colors">
                {selectedService ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200/80 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        selectedService.coverUrl ||
                        (Array.isArray(selectedService.images) &&
                          selectedService.images[0]) ||
                        selectedService.cover_url ||
                        "/empty/no-image.png"
                      }
                      alt={selectedService.title || "Linked service"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/empty/no-image.png";
                      }}
                    />
                  </div>
                ) : null}
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Drag Overlay State */}
          {isDragging && (
            <div className="my-2 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-6">
              <div className="relative flex flex-col items-center">
                <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-gray-200 text-xs font-bold text-gray-600 shadow-xs">
                  PNG
                </div>
                <span className="mt-2 text-xs font-medium text-blue-600">
                  Drop files here
                </span>
              </div>
            </div>
          )}

          {/* Moderation Alert Banner (การแจ้งเตือนความปลอดภัยของภาพที่เข้าใจง่ายและสุภาพ) */}
          {moderationAlert && (
            <div className="mt-3 rounded-2xl border border-rose-200/90 bg-rose-50/80 p-3.5 text-xs shadow-xs transition-all animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    {moderationAlert.type === "timeout" ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <ShieldAlert className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-rose-900">
                      {moderationAlert.title}
                    </h4>
                    <p className="mt-1 text-rose-700/90 leading-relaxed text-xs">
                      {moderationAlert.message}
                    </p>

                    {/* Badges เหตุผลที่ตรวจพบ */}
                    {moderationAlert.reasons &&
                      moderationAlert.reasons.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {moderationAlert.reasons.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-lg bg-white/80 px-2 py-0.5 font-medium text-[11px] text-rose-800 border border-rose-200/80 shadow-2xs"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                    {/* Appeal / Change Image Actions */}
                    {moderationAlert.type !== "timeout" && (
                      <div className="mt-3 pt-2.5 border-t border-rose-200/60">
                        {!appealSuccess ? (
                          <>
                            {!showAppealForm ? (
                              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.click();
                                    }
                                  }}
                                  className="font-semibold text-rose-900 underline underline-offset-2 hover:text-rose-950 cursor-pointer transition-colors"
                                >
                                  เลือกรูปภาพอื่น
                                </button>
                                <span className="text-rose-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => setShowAppealForm(true)}
                                  className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                                >
                                  คิดว่าเป็นข้อผิดพลาด? ยื่นให้แอดมินตรวจสอบ
                                </button>
                              </div>
                            ) : (
                              <div className="mt-1 space-y-2">
                                <p className="text-[11px] text-rose-800">
                                  ระบุเหตุผลเพื่อให้เจ้าหน้าที่ตรวจสอบ (เช่น
                                  ภาพวาดศิลปะ/งานดีไซน์):
                                </p>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={appealReason}
                                    onChange={(e) =>
                                      setAppealReason(e.target.value)
                                    }
                                    placeholder="ระบุเหตุผล เช่น เป็นภาพวาดศิลปะ ไม่ได้มีเจตนาอนาจาร"
                                    className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-rose-400 focus:outline-none shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={
                                      !appealReason.trim() || isAppealing
                                    }
                                    onClick={handleSendAppeal}
                                    className="rounded-xl bg-rose-600 px-3.5 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1 text-xs shrink-0"
                                  >
                                    {isAppealing ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      "ส่งคำร้อง"
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ส่งคำร้องให้เจ้าหน้าที่ตรวจสอบเรียบร้อยแล้ว
                            แอดมินจะพิจารณาให้โดยเร็วครับ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ปุ่มปิดคำเตือน */}
                <button
                  type="button"
                  onClick={() => {
                    setModerationAlert(null);
                    setShowAppealForm(false);
                    setAppealSuccess(false);
                  }}
                  className="rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                  title="ปิดการแจ้งเตือน"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Image Upload (เฉพาะรูปภาพ JPG, PNG, WebP) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Footer: Media Action Bar (Image, Smile, Poll, etc.) & Post / Update Button (Sticky Bottom) */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-400">
            {/* Image Upload */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept =
                    "image/png,image/jpeg,image/webp,image/avif";
                  fileInputRef.current.click();
                }
              }}
              title="เพิ่มรูปภาพ (JPG, PNG, WebP)"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </button>

            {/* Smile / Emoji */}
            <button
              type="button"
              onClick={() => setContent((prev) => prev + " 😊")}
              title="ใส่อิโมจิ"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <Smile className="h-4 w-4" />
            </button>

            {/* Poll / List */}
            <button
              type="button"
              onClick={() => setContent((prev) => prev + "\n• ")}
              title="รายการ / โพลล์"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <AlignLeft className="h-4 w-4" />
            </button>

            {/* Location */}
            <button
              type="button"
              onClick={() => setContent((prev) => prev + " 📍")}
              title="สถานที่"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <MapPin className="h-4 w-4" />
            </button>

            {/* Music */}
            <button
              type="button"
              onClick={() => setContent((prev) => prev + " 🎵")}
              title="เพลง / เสียง"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <Music className="h-4 w-4" />
            </button>
          </div>

          {/* Post / Update Button */}
          <button
            type="button"
            disabled={
              isUploading ||
              isSubmitting ||
              Boolean(moderationAlert) ||
              (!content.trim() && images.length === 0)
            }
            onClick={handleSubmit}
            title={
              moderationAlert
                ? "ไม่สามารถโพสต์ได้ขณะมีรูปภาพไม่ผ่านเกณฑ์ความปลอดภัย"
                : undefined
            }
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {isUploading
              ? "Uploading..."
              : isSubmitting
                ? "Posting..."
                : isUpdateMode
                  ? "Update post"
                  : "Post"}
          </button>
        </div>
      </div>

      {/* Link to Service Modal */}
      {isLinkServiceOpen && (
        <LinkServiceModal
          isOpen={isLinkServiceOpen}
          onClose={() => setIsLinkServiceOpen(false)}
          selectedServiceId={selectedService?.id || null}
          onSelectService={(srv) => setSelectedService(srv)}
        />
      )}
    </div>
  );
}
