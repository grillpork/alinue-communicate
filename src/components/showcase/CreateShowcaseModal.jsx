'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Briefcase, Plus, Star } from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useCreateShowcaseMutation } from '@/services/showcase';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

export default function CreateShowcaseModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState([]); // Array of { id, file, previewUrl }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const createMutation = useCreateShowcaseMutation();

  // Cleanup object URLs when component unmounts
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
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
  };

  const handleResetForm = () => {
    images.forEach((img) => {
      if (img.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    setImages([]);
    setTitle('');
    setDescription('');
    setTagsInput('');
    setError('');
    setUploadProgress(0);
    setUploadStatusText('');
  };

  const handleClose = () => {
    if (isUploading) return;
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่อผลงาน (Title)');
      return;
    }

    if (images.length === 0) {
      setError('กรุณาเลือกรูปภาพผลงานอย่างน้อย 1 ภาพ');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const uploadedUrls = [];
      const total = images.length;

      // 1. อัปโหลดรูปภาพขึ้น Cloudflare R2 ทีละภาพ พร้อมคำนวณ Progress รวม
      for (let i = 0; i < total; i++) {
        const item = images[i];
        setUploadStatusText(`กำลังอัปโหลดรูปภาพ (${i + 1}/${total})...`);

        const result = await uploadToR2(item.file, {
          folder: 'showcases',
          onProgress: (percent) => {
            const overall = Math.round(((i + percent / 100) / total) * 100);
            setUploadProgress(Math.min(99, overall));
          },
        });
        uploadedUrls.push(result.publicUrl);
      }

      setUploadProgress(100);
      setUploadStatusText('กำลังบันทึกข้อมูลผลงาน...');

      // 2. แปลง tags
      const tags = tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // 3. บันทึก Showcase ลงในฐานข้อมูล
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        mediaUrls: uploadedUrls,
        media_urls: uploadedUrls,
        mediaType: 'image',
        media_type: 'image',
        coverUrl: uploadedUrls[0],
        cover_url: uploadedUrls[0],
        tags,
      });

      // ปิด modal และรีเซ็ตฟอร์ม
      handleClose();
    } catch (err) {
      console.error('Failed to create showcase:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดผลงาน');
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
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">โพสต์ผลงาน Showcase</h2>
              <p className="text-[11px] text-gray-400">แชร์ภาพผลงานของคุณสู่ครีเอทีฟคอมมูนิตี้ (รองรับหลายภาพ)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Media Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                รูปภาพผลงาน (เฉพาะ JPG, PNG, WebP) *
              </label>
              {images.length > 0 && (
                <span className="text-[11px] text-gray-500 font-medium">
                  {images.length} รูป (รูปแรกคือหน้าปก)
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={handleFilesSelect}
            />

            {images.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-16/9 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer p-6 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs text-gray-500 mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  คลิกเพื่อเลือกไฟล์รูปภาพผลงาน (เลือกได้หลายภาพ)
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  รองรับ PNG, JPG, WebP (สูงสุด 20MB ต่อรูป)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {images.map((img, index) => (
                    <div
                      key={img.id}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border bg-gray-50 group transition-all ${
                        index === 0
                          ? 'border-black ring-2 ring-black/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
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
                        onClick={() => handleRemoveImage(img.id)}
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

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ชื่อผลงาน (Title) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Vtuber 2D Model, Cyberpunk Character Design..."
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              คำอธิบายผลงาน (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เล่ารายละเอียด เทคนิค หรือโปรแกรมที่ใช้สร้างผลงานชิ้นนี้..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              แท็ก (Tags)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น 2D, Vtuber, Commission, Illustration (คั่นด้วยจุลภาคหรือเว้นวรรค)"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
            />
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 rounded-xl bg-gray-50 p-3 border border-gray-100">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>{uploadStatusText || 'กำลังอัปโหลด...'}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUploading || Boolean(error) || !title.trim() || images.length === 0}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังอัปโหลด ({uploadProgress}%)...</span>
                </>
              ) : (
                <span>เผยแพร่ผลงาน {images.length > 0 ? `(${images.length} รูป)` : ''}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
