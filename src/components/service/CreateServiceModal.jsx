'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Loader2,
  LayoutList,
  Plus,
  Clock,
  Coins,
  Tag,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useCreateServiceMutation } from '@/services/service';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

export default function CreateServiceModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]); // Array of { id, file, previewUrl }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const createMutation = useCreateServiceMutation();

  // Cleanup object URLs when modal closes or images change
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl && img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [images]);

  if (!isOpen) return null;

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
      setImages((prev) => [...prev, ...newItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idToRemove) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === idToRemove);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== idToRemove);
    });
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      return updated;
    });
  };

  const handleClose = () => {
    if (isUploading) return;
    setTitle('');
    setDescription('');
    setMinPrice('');
    setMaxPrice('');
    setTags([]);
    setTagInput('');
    setImages([]);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่องานหรือบริการที่รับ');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const uploadedUrls = [];
      const total = images.length;

      // 1. อัปโหลดรูปภาพขึ้น Cloudflare R2
      for (let i = 0; i < total; i++) {
        const item = images[i];
        setUploadStatusText(`กำลังอัปโหลดรูปตัวอย่างงาน (${i + 1}/${total})...`);

        const result = await uploadToR2(item.file, {
          folder: 'services',
          onProgress: (percent) => {
            const overall = Math.round(((i + percent / 100) / total) * 100);
            setUploadProgress(Math.min(99, overall));
          },
        });
        uploadedUrls.push(result.publicUrl);
      }

      setUploadProgress(100);
      setUploadStatusText('กำลังสร้างโพสต์รับงาน...');

      // 2. จัดการ Tags (รวม tag ที่กำลังพิมพ์อยู่ถ้ามี)
      let finalTags = [...tags];
      const pendingTag = tagInput.trim().replace(/^#/, '');
      if (pendingTag && finalTags.length < 10 && !finalTags.includes(pendingTag.toLowerCase())) {
        finalTags.push(pendingTag.toLowerCase());
      }

      // 3. คำนวณราคาเริ่มต้นและราคาสูงสุด
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

      // 4. ส่งข้อมูลไปยัง Backend API
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || '',
        price: computedPrice,
        priceText: computedPriceText,
        images: uploadedUrls,
        coverUrl: uploadedUrls[0] || null,
        tags: finalTags,
        durationDays: 30, // อายุ 1 เดือน
      });

      handleClose();
    } catch (err) {
      console.error('Failed to create service:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างโพสต์รับงาน');
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
              <LayoutList className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                โพสต์รับงาน (Service)
              </h2>
              <p className="text-[11px] text-gray-500">
                ประกาศรับงานและแสดงตัวอย่างผลงาน โพสต์มีอายุ 1 เดือน
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

        {/* Notice Pill: 1 Month Expiration */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3 text-amber-900">
          <Clock className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed">
            โพสต์นี้จะมีอายุ <strong className="font-semibold">30 วัน (1 เดือน)</strong> และจะปิดรับอัตโนมัติเมื่อครบกำหนด (สามารถกดต่ออายุได้ตลอดเวลา)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Service Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              ชื่องาน / บริการที่รับ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น รับวาดภาพประกอบจิบิ, ออกแบบ Logo & Mascot"
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
              รายละเอียดงานและเงื่อนไข (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุขอบเขตงาน สิ่งที่ลูกค้าจะได้รับ ระยะเวลาการทำงาน หรือช่องทางการติดต่อเพิ่มเติม..."
              rows={4}
              maxLength={2000}
              className="w-full rounded-2xl border border-gray-200 p-3 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors resize-none"
              disabled={isUploading}
            />
          </div>

          {/* Sample Images Upload (Multiple) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-800">
                ตัวอย่างงาน (Sample Images)
              </label>
              <span className="text-[11px] text-gray-400">
                {images.length > 0 ? `${images.length} ภาพ` : 'เลือกได้หลายภาพ'}
              </span>
            </div>

            {/* Thumbnail Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2.5">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {/* Cover Badge */}
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 rounded-md bg-black/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        หน้าปก
                      </span>
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(idx)}
                          title="ตั้งเป็นภาพหน้าปก"
                          className="rounded-lg bg-white/90 p-1 text-[10px] font-medium text-gray-800 hover:bg-white transition-colors"
                        >
                          ปก
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        title="ลบรูปนี้"
                        className="rounded-lg bg-red-500/90 p-1 text-white hover:bg-red-600 transition-colors"
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
            )}

            {/* Empty Upload Area */}
            {images.length === 0 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-black/50 transition-colors cursor-pointer bg-gray-50/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-2xs text-gray-500 mb-2">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  คลิกเพื่อเลือกรูปตัวอย่างงาน
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  รองรับ JPG, PNG, WebP (เลือกพร้อมกันได้หลายภาพ)
                </p>
              </div>
            )}

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
                  <span>{uploadStatusText || 'กำลังประมวลผล...'}</span>
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

          {/* Footer Actions */}
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
                <>
                  <LayoutList className="h-3.5 w-3.5" />
                  <span>โพสต์รับงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
