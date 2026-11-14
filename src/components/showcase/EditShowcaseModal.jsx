'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Pencil, Plus, Star } from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useUpdateShowcaseMutation } from '@/services/showcase';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

export default function EditShowcaseModal({ showcase, isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mediaItems, setMediaItems] = useState([]); // Array of { id, url, file, isNew }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const updateMutation = useUpdateShowcaseMutation();

  useEffect(() => {
    if (showcase && isOpen) {
      setTitle(showcase.title || '');
      setDescription(showcase.description || '');
      const tags = Array.isArray(showcase.tags) ? showcase.tags : [];
      setTagsInput(tags.map((t) => `#${t}`).join(' '));

      let existingUrls = [];
      const rawMedia = showcase.mediaUrls || showcase.media_urls;
      if (Array.isArray(rawMedia)) {
        existingUrls = rawMedia;
      } else if (typeof rawMedia === 'string') {
        try {
          existingUrls = JSON.parse(rawMedia);
        } catch {
          existingUrls = [];
        }
      }

      if (existingUrls.length === 0 && (showcase.coverUrl || showcase.cover_url)) {
        existingUrls.push(showcase.coverUrl || showcase.cover_url);
      }

      setMediaItems(
        existingUrls.map((url, i) => ({
          id: `existing-${i}-${url}`,
          url,
          isNew: false,
        }))
      );
      setError('');
      setUploadProgress(0);
      setUploadStatusText('');
    }
  }, [showcase, isOpen]);

  // Cleanup object URLs when component unmounts or closes
  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        if (item.isNew && item.url?.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [mediaItems]);

  if (!isOpen || !showcase) return null;

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalid = [];
    const newItems = [];

    files.forEach((file) => {
      const mime = file.type?.toLowerCase() || '';
      if (mime === 'image/gif' || mime.startsWith('video/')) {
        invalid.push(`${file.name}: ไม่อนุญาตไฟล์ GIF หรือวิดีโอ (รองรับเฉพาะ JPG, PNG, WebP)`);
        return;
      }
      if (!ALLOWED_MIME.includes(mime)) {
        invalid.push(`${file.name}: รองรับเฉพาะรูปภาพ JPG, PNG, WebP เท่านั้น`);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url: previewUrl,
        file,
        isNew: true,
      });
    });

    if (invalid.length > 0) {
      setError(invalid[0]);
    } else {
      setError('');
    }

    if (newItems.length > 0) {
      setMediaItems((prev) => [...prev, ...newItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveItem = (idToRemove) => {
    setMediaItems((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.isNew && target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    setMediaItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่อผลงาน (Title)');
      return;
    }

    if (mediaItems.length === 0) {
      setError('กรุณามีรูปภาพผลงานอย่างน้อย 1 ภาพ');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const newFilesCount = mediaItems.filter((m) => m.isNew && m.file).length;
      let uploadedCount = 0;

      const finalUrls = [];
      for (const item of mediaItems) {
        if (item.isNew && item.file) {
          uploadedCount++;
          setUploadStatusText(`กำลังอัปโหลดรูปภาพใหม่ (${uploadedCount}/${newFilesCount})...`);

          const uploadResult = await uploadToR2(item.file, {
            folder: 'showcases',
            onProgress: (percent) => {
              if (newFilesCount > 0) {
                const overall = Math.round(((uploadedCount - 1 + percent / 100) / newFilesCount) * 100);
                setUploadProgress(Math.min(99, overall));
              }
            },
          });
          finalUrls.push(uploadResult.publicUrl);
        } else {
          finalUrls.push(item.url);
        }
      }

      setUploadProgress(100);
      setUploadStatusText('กำลังบันทึกข้อมูลผลงาน...');

      // 2. แปลง tags
      const tags = tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // 3. บันทึกข้อมูลที่แก้ไข
      await updateMutation.mutateAsync({
        id: showcase.id,
        title: title.trim(),
        description: description.trim() || null,
        mediaUrls: finalUrls,
        media_urls: finalUrls,
        mediaType: 'image',
        media_type: 'image',
        coverUrl: finalUrls[0],
        cover_url: finalUrls[0],
        tags,
      });

      // ปิด modal
      onClose();
    } catch (err) {
      console.error('Failed to update showcase:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการแก้ไขผลงาน');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">แก้ไขผลงาน Showcase</h2>
              <p className="text-[11px] text-gray-400">แก้ไขข้อมูลหรือจัดการรูปภาพผลงานของคุณ (รองรับหลายภาพ)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Upload / Preview Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                รูปภาพผลงาน <span className="text-gray-400 font-normal">(รูปแรกคือภาพหน้าปก)</span>
              </label>
              {mediaItems.length > 0 && (
                <span className="text-[11px] text-gray-500 font-medium">
                  {mediaItems.length} รูป
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={handleFilesSelect}
              className="hidden"
            />

            {mediaItems.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors bg-gray-50/50"
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">คลิกเพื่ออัปโหลดรูปภาพ</p>
                <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP สูงสุด 20MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {mediaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border bg-gray-50 group transition-all ${
                        index === 0
                          ? 'border-black ring-2 ring-black/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/empty/no-image.png';
                        }}
                      />

                      {/* Cover Badge */}
                      {index === 0 ? (
                        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-md bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs shadow-xs">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          <span>หน้าปก</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          className="absolute bottom-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-white/95 hover:bg-white text-gray-900 text-[10px] font-semibold px-2 py-0.5 shadow-xs cursor-pointer backdrop-blur-xs"
                        >
                          ตั้งเป็นหน้าปก
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isUploading}
                        className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 hover:bg-black text-white transition-all shadow-xs cursor-pointer active:scale-90"
                        title="ลบรูปภาพนี้"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add More Tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex aspect-4/3 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-50/80 transition-colors cursor-pointer text-gray-500 hover:text-black p-3"
                  >
                    <Plus className="h-5 w-5 mb-1" />
                    <span className="text-xs font-semibold">เพิ่มรูปภาพ</span>
                    <span className="text-[10px] text-gray-400">เลือกภาพเพิ่ม</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อผลงาน <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Live2D Anime Model, Character Illustration..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
              maxLength={120}
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              คำอธิบายผลงาน <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="บอกเล่าเรื่องราว เทคนิค หรือแรงบันดาลใจในการสร้างผลงานชิ้นนี้..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all resize-none"
              maxLength={1000}
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              แท็ก (Tags) <span className="text-gray-400 font-normal">(เว้นวรรคเพื่อแยกแท็ก เช่น #illustration #2d)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#art #illustration #design"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          {/* Progress Bar (ถ้ากำลังอัปโหลด) */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>{uploadStatusText || 'กำลังบันทึกข้อมูล...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isUploading || !title.trim() || mediaItems.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกการแก้ไข ({mediaItems.length} รูป)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
