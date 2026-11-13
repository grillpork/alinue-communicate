'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Loader2, Briefcase } from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useCreateShowcaseMutation } from '@/services/showcase';

export default function CreateShowcaseModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const createMutation = useCreateShowcaseMutation();

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type?.toLowerCase() || '';
    if (mime === 'image/gif' || mime.startsWith('video/')) {
      setError('ไม่อนุญาตให้อัปโหลดไฟล์ GIF หรือวิดีโอ (ระบบรองรับเฉพาะรูปภาพ JPG, PNG, WebP เท่านั้น)');
      return;
    }

    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED.includes(mime)) {
      setError('ระบบรองรับเฉพาะรูปภาพ JPG, PNG, WebP เท่านั้น');
      return;
    }

    setError('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview({
      url: objectUrl,
      type: 'image',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('กรุณากรอกชื่อผลงาน (Title)');
      return;
    }

    if (!selectedFile) {
      setError('กรุณาเลือกรูปภาพผลงาน');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // 1. Upload ไฟล์ขึ้น Cloudflare R2
      const uploadResult = await uploadToR2(selectedFile, {
        folder: 'showcases',
        onProgress: (percent) => setUploadProgress(percent),
      });

      const mediaUrl = uploadResult.publicUrl;

      // 2. แปลง tags
      const tags = tagsInput
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // 3. บันทึก Showcase ลงใน Neon DB
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        mediaUrls: [mediaUrl],
        media_urls: [mediaUrl],
        mediaType: 'image',
        media_type: 'image',
        coverUrl: mediaUrl,
        cover_url: mediaUrl,
        tags,
      });

      // ปิด modal และรีเซ็ตฟอร์ม
      onClose();
      setTitle('');
      setDescription('');
      setTagsInput('');
      setSelectedFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error('Failed to create showcase:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดผลงาน');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
              <p className="text-[11px] text-gray-400">แชร์ภาพหรือคลิปผลงานของคุณสู่ครีเอทีฟคอมมูนิตี้</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              ไฟล์รูปภาพผลงาน (เฉพาะ JPG, PNG, WebP) *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={handleFileSelect}
            />

            {filePreview ? (
              <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-16/9 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-400 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer p-6 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs text-gray-500 mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  คลิกเพื่อเลือกไฟล์รูปหรือคลิปผลงาน
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  รองรับ PNG, JPG, WebP, GIF หรือ MP4, WebM
                </p>
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

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUploading || Boolean(error) || !title.trim() || !selectedFile}
              className="flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังอัปโหลด ({uploadProgress}%)...</span>
                </>
              ) : (
                <span>เผยแพร่ผลงาน</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

