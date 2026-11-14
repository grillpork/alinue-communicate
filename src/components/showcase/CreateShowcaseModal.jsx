'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Plus, Star, ChevronRight, Layers, Image as ImageIcon } from 'lucide-react';
import { uploadToR2 } from '@/lib/upload';
import { useCreateShowcaseMutation } from '@/services/showcase';
import LinkServiceModal from './LinkServiceModal';

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

export default function CreateShowcaseModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isLinkServiceOpen, setIsLinkServiceOpen] = useState(false);
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
    setSelectedService(null);
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

      // 2. บันทึก Showcase ลงในฐานข้อมูล
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        mediaUrls: uploadedUrls,
        media_urls: uploadedUrls,
        mediaType: 'image',
        media_type: 'image',
        coverUrl: uploadedUrls[0],
        cover_url: uploadedUrls[0],
        serviceId: selectedService?.id || null,
      });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[540px] max-h-[88vh] rounded-3xl bg-white shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Add showcase
          </h2>
          <button
            type="button"
            onClick={handleClose}
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
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          {/* Media Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Media</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-medium">
                  {images.length} / 20
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
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-2xs"
                >
                  <img
                    src={img.previewUrl}
                    alt={`Preview ${idx + 1}`}
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
                      onClick={() => handleSetCover(idx)}
                      className="absolute bottom-1.5 inset-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/75 hover:bg-black text-white text-[9px] font-semibold py-0.5 text-center cursor-pointer backdrop-blur-xs"
                    >
                      Make cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    disabled={isUploading}
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white shadow-xs hover:bg-black transition-all cursor-pointer"
                  >
                    <X className="h-3 w-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              {/* Empty / Add Card */}
              {images.length === 0 && (
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
              ชื่อผลงาน (Title) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น Cyberpunk Illustration, 2D Character Design..."
              maxLength={200}
              required
              disabled={isUploading}
              className="w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-hidden transition-colors"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              คำอธิบายผลงาน (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เล่าเรื่องราว เทคนิค หรือแรงบันดาลใจในการสร้างผลงานชิ้นนี้..."
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

          {/* Link to service Row */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsLinkServiceOpen(true)}
              className="flex w-full items-center justify-between py-2.5 px-1 hover:bg-gray-50/80 rounded-xl transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-gray-800">
                <Layers className="h-5 w-5 text-gray-600 stroke-[1.75]" />
                <span className="text-sm font-medium text-gray-900">
                  Link to service
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-700 transition-colors">
                {selectedService ? (
                  <span className="text-xs font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg max-w-[200px] truncate">
                    {selectedService.title}
                  </span>
                ) : null}
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadStatusText || 'กำลังอัปโหลด...'}</span>
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
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || Boolean(error) || !title.trim() || images.length === 0}
            className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-40 disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังเผยแพร่...</span>
              </span>
            ) : (
              <span>เผยแพร่ผลงาน {images.length > 0 ? `(${images.length})` : ''}</span>
            )}
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
