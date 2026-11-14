'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Loader2,
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

      // Parse price range from startPrice / endPrice / priceText / price
      let minP = '';
      let maxP = '';
      if (service.startPrice !== undefined && service.startPrice !== null) {
        minP = String(service.startPrice);
        if (service.endPrice !== undefined && service.endPrice !== null) {
          maxP = String(service.endPrice);
        }
      } else if (service.priceText && service.priceText.includes('-')) {
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

    if (newItems.length > 0) {
      setNewImages((prev) => [...prev, ...newItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = (idxToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleRemoveNewImage = (idToRemove) => {
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
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      return updated;
    });
  };

  const totalImageCount = existingImages.length + newImages.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('กรุณากรอกชื่องาน / บริการที่รับ');
      return;
    }

    // Process price
    let parsedMin = null;
    let parsedMax = null;
    let priceText = '';

    if (minPrice !== '') {
      const p = parseFloat(minPrice);
      if (!isNaN(p) && p >= 0) parsedMin = p;
    }
    if (maxPrice !== '') {
      const p = parseFloat(maxPrice);
      if (!isNaN(p) && p >= 0) parsedMax = p;
    }

    if (parsedMin !== null && parsedMax !== null) {
      if (parsedMin > parsedMax) {
        setError('ราคาเริ่มต้นต้องไม่มากกว่าราคาสูงสุด');
        return;
      }
      priceText = `฿${parsedMin.toLocaleString()} - ฿${parsedMax.toLocaleString()}`;
    } else if (parsedMin !== null) {
      priceText = `฿${parsedMin.toLocaleString()}`;
    } else if (parsedMax !== null) {
      priceText = `฿${parsedMax.toLocaleString()}`;
    }

    try {
      setIsUploading(true);
      setError('');

      // 1. Upload any new images to R2
      const uploadedUrls = [];
      const totalNew = newImages.length;

      for (let i = 0; i < totalNew; i++) {
        const item = newImages[i];
        setUploadStatusText(`กำลังอัปโหลดรูปภาพใหม่ (${i + 1}/${totalNew})...`);

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
      setUploadStatusText('กำลังบันทึกการแก้ไขบริการ...');

      const finalImages = [...existingImages, ...uploadedUrls];

      // 2. Add any remaining tag
      const finalTags = [...tags];
      if (tagInput.trim()) {
        const clean = tagInput.trim().replace(/^#/, '');
        if (clean && !finalTags.includes(clean.toLowerCase()) && finalTags.length < 10) {
          finalTags.push(clean.toLowerCase());
        }
      }

      // 3. Update service via mutation
      await updateMutation.mutateAsync({
        id: service.id,
        title: trimmedTitle,
        description: description.trim() || null,
        price: parsedMin !== null ? parsedMin : parsedMax !== null ? parsedMax : null,
        priceText: priceText || null,
        startPrice: parsedMin,
        endPrice: parsedMax,
        start_price: parsedMin,
        end_price: parsedMax,
        coverUrl: finalImages[0] || null,
        images: finalImages,
        tags: finalTags,
      });

      onClose();
    } catch (err) {
      console.error('Failed to update service:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกบริการ');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[540px] max-h-[88vh] rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Edit service
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin] scrollbar-thumb-gray-200 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Media Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">ตัวอย่างงาน (Sample images)</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">
                  {totalImageCount} / 10
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
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME.join(',')}
              className="hidden"
              onChange={handleFilesSelect}
            />

            <div className="flex flex-wrap gap-3">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xs"
                >
                  <img
                    src={url}
                    alt={`Service ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {idx === 0 ? (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 text-center">
                      <span className="text-[10px] font-bold text-white tracking-wider uppercase">
                        COVER
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetExistingCover(idx)}
                      className="absolute bottom-1.5 inset-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/75 hover:bg-black text-white text-[9px] font-semibold py-0.5 text-center cursor-pointer backdrop-blur-xs"
                    >
                      Make cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    disabled={isUploading}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white shadow-xs hover:bg-black transition-all cursor-pointer"
                  >
                    <X className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              {/* New Images */}
              {newImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xs"
                >
                  <img
                    src={img.previewUrl}
                    alt="New upload"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(img.id)}
                    disabled={isUploading}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white shadow-xs hover:bg-black transition-all cursor-pointer"
                  >
                    <X className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              {totalImageCount === 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 hover:border-black/40 hover:bg-gray-50/80 transition-all text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <ImageIcon className="h-5 w-5 stroke-[1.5]" />
                  <span className="text-[11px] font-medium mt-1">Add media</span>
                </button>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              ชื่องาน / บริการที่รับ *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น รับวาดภาพประกอบจิบิ, ออกแบบ Logo & Mascot"
              maxLength={150}
              required
              disabled={isUploading}
              className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                ราคาเริ่มต้น (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="500"
                  disabled={isUploading}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                ราคาสูงสุด (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="3000"
                  disabled={isUploading}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              รายละเอียดงานและเงื่อนไข (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุขอบเขตงาน สิ่งที่ลูกค้าจะได้รับ หรือระยะเวลาการทำงาน..."
              rows={3}
              maxLength={2000}
              disabled={isUploading}
              className="w-full rounded-2xl border border-gray-200 p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors resize-none"
            />
            <div className="flex justify-end">
              <span className="text-xs text-gray-400 font-medium">
                {description.length}/2,000
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">
                แท็ก (Tags)
              </label>
              <span className="text-xs text-gray-400 font-medium">
                {tags.length}/10
              </span>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 p-2 focus-within:border-black transition-colors bg-white flex flex-wrap items-center gap-1.5 min-h-[44px]">
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
                <div className="flex-1 min-w-[120px] flex items-center gap-1.5 px-1">
                  <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    placeholder={tags.length === 0 ? "พิมพ์แท็กแล้วกด Enter..." : "พิมพ์แท็กเพิ่ม..."}
                    className="w-full text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden bg-transparent"
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadStatusText || 'กำลังบันทึกข้อมูล...'}</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || Boolean(error) || !title.trim()}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </span>
            ) : (
              <span>บันทึกการแก้ไข</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
