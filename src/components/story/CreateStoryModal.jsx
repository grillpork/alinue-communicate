'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Loader2,
  Send,
} from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useCreateStoryMutation } from '@/services/story';

export default function CreateStoryModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const createMutation = useCreateStoryMutation();

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type?.toLowerCase() || '';
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED.includes(mime)) {
      setError('ระบบรองรับเฉพาะรูปภาพ JPG, PNG, WebP เท่านั้น');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 15MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleClose = () => {
    if (isUploading) return;
    setError('');
    setSelectedFile(null);
    setFilePreview(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('กรุณาเลือกรูปภาพสำหรับ Story');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // 1. Upload ไปยัง Cloudflare R2 ในโฟลเดอร์ stories
      const uploadResult = await uploadToR2(selectedFile, {
        folder: 'stories',
        onProgress: (percent) => setUploadProgress(percent),
      });

      const mediaUrl = uploadResult.publicUrl;

      // 2. ส่งไปบันทึกลง Neon DB
      await createMutation.mutateAsync({
        mediaUrl,
        mediaType: 'image',
      });

      // ปิด modal และรีเซ็ต
      handleClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการแชร์ Story');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header (ขาว ดำ สไตล์มินิมอล ไม่มี icon spark และไม่มีคำอธิบาย) */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">เพิ่มเรื่องราวของคุณ (Story)</h3>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-xl bg-gray-100 border border-gray-200 p-2.5 text-xs text-gray-900 font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Media Preview / Upload Area */}
          {filePreview ? (
            <div className="relative aspect-9/14 max-h-[380px] w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center shadow-inner group">
              <img
                src={filePreview}
                alt="Story preview"
                className="h-full w-full object-contain"
              />

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                disabled={isUploading}
                className="absolute top-2.5 right-2.5 rounded-full bg-black/70 p-1.5 text-white hover:bg-black transition-all cursor-pointer"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-9/14 max-h-[340px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-900 bg-gray-50/60 hover:bg-gray-50 transition-colors cursor-pointer p-6 text-center group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-gray-700 group-hover:scale-105 transition-transform mb-2 border border-gray-100">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-gray-900">
                คลิกเพื่อเลือกรูปภาพสำหรับ Story
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                รองรับไฟล์ PNG, JPG, WebP ขนาดไม่เกิน 15MB
              </p>
            </div>
          )}

          {/* Actions (Theme ขาว ดำ) */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-1.5 rounded-xl bg-black px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังอัปโหลด ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>แชร์ไปยัง Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
