'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Pencil } from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useUpdateShowcaseMutation } from '@/services/showcase';

export default function EditShowcaseModal({ showcase, isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const updateMutation = useUpdateShowcaseMutation();

  useEffect(() => {
    if (showcase) {
      setTitle(showcase.title || '');
      setDescription(showcase.description || '');
      const tags = Array.isArray(showcase.tags) ? showcase.tags : [];
      setTagsInput(tags.map((t) => `#${t}`).join(' '));
      const existingUrl = showcase.coverUrl || (Array.isArray(showcase.mediaUrls) && showcase.mediaUrls[0]) || null;
      setFilePreview(existingUrl ? { url: existingUrl, type: 'image' } : null);
      setSelectedFile(null);
      setError('');
    }
  }, [showcase, isOpen]);

  if (!isOpen || !showcase) return null;

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

    try {
      setIsUploading(true);
      setError('');

      let mediaUrl = showcase.coverUrl || (Array.isArray(showcase.mediaUrls) && showcase.mediaUrls[0]);

      // 1. ถ้ามีการเลือกไฟล์ใหม่ ให้อัปโหลดขึ้น Cloudflare R2
      if (selectedFile) {
        const uploadResult = await uploadToR2(selectedFile, {
          folder: 'showcases',
          onProgress: (percent) => setUploadProgress(percent),
        });
        mediaUrl = uploadResult.publicUrl;
      }

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
        mediaUrls: [mediaUrl],
        media_urls: [mediaUrl],
        mediaType: 'image',
        media_type: 'image',
        coverUrl: mediaUrl,
        cover_url: mediaUrl,
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
              <p className="text-[11px] text-gray-400">แก้ไขข้อมูลหรือเปลี่ยนรูปภาพผลงานของคุณ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* File Upload / Preview Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              รูปภาพผลงาน <span className="text-gray-400 font-normal">(คลิกเพื่อเปลี่ยนรูป)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {filePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 aspect-video flex items-center justify-center"
              >
                <img
                  src={filePreview.url}
                  alt="Preview"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                  <Upload className="h-4 w-4" />
                  <span>คลิกเพื่อเปลี่ยนรูปใหม่</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-gray-400 transition-colors bg-gray-50/50"
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">คลิกเพื่ออัปโหลดรูปภาพใหม่</p>
                <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP สูงสุด 20MB</p>
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
                <span>กำลังบันทึกข้อมูล...</span>
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
              disabled={isUploading || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
