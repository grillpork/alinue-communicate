'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Loader2,
  Pencil,
  Plus,
  Coins,
  Tag,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useUpdateServiceMutation } from '@/services/service';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

export default function EditServiceModal({ isOpen, onClose, service }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  // existing images: Array of string URLs
  const [existingImages, setExistingImages] = useState([]);
  // newly added images: Array of { id, file, previewUrl }
  const [newImages, setNewImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const updateMutation = useUpdateServiceMutation();

  useEffect(() => {
    if (service && isOpen) {
      setTitle(service.title || '');
      setDescription(service.description || '');

      // Parse price range from priceText / price
      let minP = '';
      let maxP = '';
      if (service.priceText && service.priceText.includes('-')) {
        const parts = service.priceText.split('-');
        const p1 = parts[0]?.replace(/[^\d.]/g, '');
        const p2 = parts[1]?.replace(/[^\d.]/g, '');
        minP = p1 || '';
        maxP = p2 || '';
      } else if (service.price !== null && service.price !== undefined) {
        minP = String(service.price);
      }
      setMinPrice(minP);
      setMaxPrice(maxP);

      const rawTags = Array.isArray(service.tags) ? service.tags : [];
      setTags(rawTags.slice(0, 10));
      setTagInput('');

      const imgs = Array.isArray(service.images) ? service.images : service.coverUrl ? [service.coverUrl] : [];
      setExistingImages(imgs);
      setNewImages([]);
      setError('');
    }
  }, [service, isOpen]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      newImages.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [newImages]);

  if (!isOpen || !service) return null;

  const handleAddTag = (val) => {
    const raw = (val || tagInput).trim();
    if (!raw) return;
    const clean = raw.replace(/^#/, '').trim();
    if (!clean) return;
    if (tags.length >= 10) {
      setError('สามารถใส่แท็กได้สูงสุดไม่เกิน 10 แท็ก');
      return;
    }
    if (tags.includes(clean.toLowerCase())) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, clean.toLowerCase()]);
    setTagInput('');
    setError('');
  };

  const handleKeyDownTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleRemoveTag = (idxToRemove) => {
    setTags((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalid = [];
    const added = [];

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
      added.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl,
      });
    });

    if (invalid.length > 0) {
      setError(invalid[0]);
    } else {
      setError('');
    }

    if (added.length > 0) {
      setNewImages((prev) => [...prev, ...added]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExisting = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNew = (idToRemove) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleSetExistingCover = (index) => {
    if (index === 0) return;
    setExistingImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      copy.unshift(chosen);
      return copy;
    });
  };

  const handleClose = () => {
    if (isUploading) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่องานหรือบริการ');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const uploadedUrls = [];
      const totalNew = newImages.length;

      // อัปโหลดรูปใหม่ (ถ้ามี)
      for (let i = 0; i < totalNew; i++) {
        const item = newImages[i];
        setUploadStatusText(`กำลังอัปโหลดรูปตัวอย่างใหม่ (${i + 1}/${totalNew})...`);

        const result = await uploadToR2(item.file, {
          folder: 'services',
          onProgress: (percent) => {
            const overall = Math.round(((i + percent / 100) / totalNew) * 100);
            setUploadProgress(Math.min(99, overall));
          },
        });
        uploadedUrls.push(result.publicUrl);
      }

      setUploadProgress(100);
      setUploadStatusText('กำลังบันทึกการแก้ไข...');

      // รวมรูปล่าสุด
      const finalImages = [...existingImages, ...uploadedUrls];

      // จัดการ Tags
      let finalTags = [...tags];
      const pendingTag = tagInput.trim().replace(/^#/, '');
      if (pendingTag && finalTags.length < 10 && !finalTags.includes(pendingTag.toLowerCase())) {
        finalTags.push(pendingTag.toLowerCase());
      }

      // คำนวณราคาเริ่มต้นและราคาสูงสุด
      const parsedMin = minPrice !== '' && !isNaN(Number(minPrice)) ? Number(minPrice) : null;
      const parsedMax = maxPrice !== '' && !isNaN(Number(maxPrice)) ? Number(maxPrice) : null;

      let computedPrice = parsedMin !== null ? parsedMin : parsedMax;
      let computedPriceText = null;

      if (parsedMin !== null && parsedMax !== null) {
        if (parsedMin === parsedMax) {
          computedPriceText = `${parsedMin.toLocaleString()}`;
        } else {
          computedPriceText = `${parsedMin.toLocaleString()} - ${parsedMax.toLocaleString()}`;
        }
      } else if (parsedMin !== null) {
        computedPriceText = `${parsedMin.toLocaleString()}`;
      } else if (parsedMax !== null) {
        computedPriceText = `สูงสุด ${parsedMax.toLocaleString()}`;
      }

      await updateMutation.mutateAsync({
        id: service.id,
        title: title.trim(),
        description: description.trim() || '',
        price: computedPrice,
        priceText: computedPriceText,
        images: finalImages,
        coverUrl: finalImages[0] || null,
        tags: finalTags,
      });

      handleClose();
    } catch (err) {
      console.error('Failed to update service:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                แก้ไขประกาศรับงาน
              </h2>
              <p className="text-[11px] text-gray-500">
                ปรับปรุงรายละเอียด ราคา หรือตัวอย่างงาน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              ชื่องาน / บริการที่รับ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่องานรับทำหรือบริการ"
              maxLength={150}
              className="w-full rounded-2xl border border-gray-200 px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
              disabled={isUploading}
            />
          </div>

          {/* Price Range: Min & Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                ราคาเริ่มต้น
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="เช่น 500"
                  className="w-full pl-9 pr-3 rounded-2xl border border-gray-200 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
                  disabled={isUploading}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                ราคาสูงสุด
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="เช่น 3000"
                  className="w-full pl-9 pr-3 rounded-2xl border border-gray-200 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              รายละเอียดงานและเงื่อนไข
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุขอบเขตงาน รายละเอียดงาน..."
              rows={4}
              maxLength={2000}
              className="w-full rounded-2xl border border-gray-200 p-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors resize-none"
              disabled={isUploading}
            />
          </div>

          {/* Manage Images */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-800">
                รูปตัวอย่างงาน
              </label>
              <span className="text-[11px] text-gray-400">
                รวม {existingImages.length + newImages.length} ภาพ
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2.5">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div
                  key={`exist-${idx}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Existing ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 rounded-md bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      หน้าปก
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetExistingCover(idx)}
                        className="rounded-lg bg-white/90 p-1 text-[10px] font-medium text-gray-800 hover:bg-white"
                      >
                        ปก
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(idx)}
                      className="rounded-lg bg-red-500/90 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Newly Added Images */}
              {newImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-blue-200 bg-gray-50 shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="New sample" className="h-full w-full object-cover" />
                  <span className="absolute top-1 left-1 rounded-md bg-blue-600/90 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    ใหม่
                  </span>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveNew(img.id)}
                      className="rounded-lg bg-red-500/90 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-black/50 text-gray-400 hover:text-black transition-all cursor-pointer bg-gray-50/50"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[10px] mt-0.5 font-medium">เพิ่มรูป</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME.join(',')}
              onChange={handleFilesSelect}
              className="hidden"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-800">
                แท็ก (Tags)
              </label>
              <span className={`text-[11px] ${tags.length >= 10 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                {tags.length}/10 แท็ก
              </span>
            </div>

            <div className="w-full rounded-2xl border border-gray-200 p-2 focus-within:border-black transition-colors bg-white flex flex-wrap items-center gap-1.5 min-h-[46px]">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    disabled={isUploading}
                    className="text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {tags.length < 10 && (
                <div className="flex-1 min-w-[140px] flex items-center gap-1.5 px-1">
                  <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    placeholder={tags.length === 0 ? "พิมพ์แท็กแล้วกด Enter..." : "พิมพ์แท็กเพิ่ม..."}
                    className="w-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden bg-transparent"
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              พิมพ์ชื่อแท็กแล้วกด Enter เพื่อเพิ่ม (ใส่ได้สูงสุดไม่เกิน 10 แท็ก)
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadStatusText || 'กำลังบันทึก...'}</span>
                </span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-black transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-2xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUploading || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-black px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>บันทึกการแก้ไข</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
