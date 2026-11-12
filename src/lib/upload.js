const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
).replace(/\/+$/, '');

/**
 * แปลงไฟล์รูปภาพทั่วไป (JPG, PNG, WebP, AVIF) เป็น WebP คุณภาพสูงและบีบอัดให้ขนาดเล็ก เพื่อการอัปโหลดที่เร็วที่สุด
 * (ไม่อนุญาต GIF หรือวิดีโอ)
 */
export async function convertImageToWebP(file, quality = 0.85, maxDimension = 2048) {
  const mime = file.type?.toLowerCase() || '';

  // ไม่อนุญาต GIF หรือ วิดีโอ
  if (mime === 'image/gif' || mime.startsWith('video/')) {
    throw new Error('ไม่อนุญาตให้อัปโหลดไฟล์ GIF หรือวิดีโอ (ระบบรองรับเฉพาะรูปภาพนิ่ง JPG, PNG, WebP เท่านั้น)');
  }

  if (!mime.startsWith('image/')) {
    throw new Error('รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP) เท่านั้น');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // ปรับขนาดความกว้าง/ยาวสูงสุดไม่ให้เกิน maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถโหลดไฟล์รูปภาพนี้ได้'));
    };

    img.src = objectUrl;
  });
}

/**
 * อัปโหลดไฟล์ตรงเข้า Cloudflare R2 ผ่านใบผ่านทางชั่วคราว (Presigned URL)
 * รองรับเฉพาะรูปภาพนิ่งเท่านั้น (บีบอัดเป็น WebP อัตโนมัติ)
 *
 * @param {File} rawFile - ไฟล์ที่เลือกจาก input
 * @param {Object} options - { folder, onProgress, token }
 * @returns {Promise<{ publicUrl: string, fileKey: string, contentType: string }>}
 */
export async function uploadToR2(rawFile, options = {}) {
  const { folder = 'posts', onProgress, token } = options;

  // ตรวจสอบประเภทไฟล์ทันที
  const mime = rawFile.type?.toLowerCase() || '';
  if (mime === 'image/gif' || mime.startsWith('video/')) {
    throw new Error('ไม่อนุญาตให้อัปโหลดไฟล์ GIF หรือวิดีโอ (ระบบรองรับเฉพาะรูปภาพนิ่ง JPG, PNG, WebP เท่านั้น)');
  }

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ];
  if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
    throw new Error('ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ (รองรับเฉพาะรูปภาพ JPG, PNG, WebP เท่านั้น)');
  }

  // 1. แปลงรูปเป็น .webp ล่วงหน้าใน Browser เพื่อให้ขนาดไฟล์เล็กลง 70-80% และอัปโหลดได้ไวที่สุด
  const processedFile = await convertImageToWebP(rawFile);

  // 2. ขอใบผ่านทางชั่วคราว (Presigned PUT URL) จาก Backend
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const presignedRes = await fetch(`${API_BASE_URL}/api/upload/presigned-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filename: processedFile.name,
      contentType: 'image/webp',
      folder,
      convertToWebp: true,
    }),
  });

  const presignedData = await presignedRes.json();
  if (!presignedData.success || !presignedData.uploadUrl) {
    // Tier 3: จัดการ HTTP 429 Timeout จาก presigned-url
    if (presignedRes.status === 429 && presignedData.isTimedOut) {
      const err = new Error(
        presignedData.message ||
          `บัญชีถูกระงับการอัปโหลดชั่วคราว กรุณารอ ${presignedData.remainingMinutes} นาที`
      );
      err.isTimedOut = true;
      err.remainingMinutes = presignedData.remainingMinutes;
      throw err;
    }
    throw new Error(presignedData.message || 'Failed to get upload authorization');
  }

  const { uploadUrl, publicUrl, fileKey, contentType } = presignedData;

  // 3. อัปโหลดตรงเข้า Cloudflare R2 ผ่าน HTTP PUT พร้อมเกจวัดความคืบหน้า (XHR)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during R2 upload'));
    xhr.send(processedFile);
  });

  // 4. แจ้ง Backend บันทึกข้อมูลลงฐานข้อมูล media table และตรวจสอบความปลอดภัยของภาพ (อนาจาร, อาวุธ, ความรุนแรง)
  const completeRes = await fetch(`${API_BASE_URL}/api/upload/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileKey,
      url: publicUrl,
      mimeType: contentType,
      originalName: rawFile.name,
      size: processedFile.size,
      entityType: folder,
    }),
  });

  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok) {
    // Tier 3: จัดการ HTTP 429 Timeout จาก complete
    if (completeRes.status === 429 && completeData.isTimedOut) {
      const err = new Error(
        completeData.message ||
          `บัญชีถูกระงับการอัปโหลดชั่วคราว กรุณารอ ${completeData.remainingMinutes} นาที`
      );
      err.isTimedOut = true;
      err.remainingMinutes = completeData.remainingMinutes;
      throw err;
    }
    const err = new Error(
      completeData.message ||
        'รูปภาพไม่ผ่านการตรวจสอบความปลอดภัย กรุณาเลือกรูปภาพอื่น'
    );
    err.logId = completeData.logId || null;
    err.imageUrl = publicUrl;
    err.reasons = completeData.reasons || [];
    throw err;
  }

  return {
    publicUrl,
    fileKey,
    contentType,
    originalName: rawFile.name,
    size: processedFile.size,
  };
}

/**
 * ส่งคำร้องอุทธรณ์สำหรับรูปภาพที่ติดฟิลเตอร์ (Tier 4 Appeal System)
 * @param {Object} payload - { logId, imageUrl, appealReason, token }
 * @returns {Promise<Object>}
 */
export async function submitModerationAppeal({ logId, imageUrl, appealReason, token }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/upload/appeal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      logId,
      imageUrl,
      appealReason,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'ไม่สามารถส่งคำร้องอุทธรณ์ได้');
  }
  return data;
}

