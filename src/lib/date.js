/**
 * ฟังก์ชันจัดรูปแบบเวลาแบบ Relative Time (เช่น Just now, 5m ago, 2h ago, 3d ago, Nov 11)
 * @param {string | Date} dateInput - วันที่ในรูปแบบ ISO string หรือ Date object
 * @returns {string} ข้อความแสดงเวลาที่อ่านง่าย
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // กรณีเวลาน้อยกว่า 30 วินาที หรือเป็นเวลาอนาคตเล็กน้อย
    if (diffInSeconds < 30) {
      return 'Just now';
    }

    // วินาที (< 60s)
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }

    // นาที (< 60m)
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    // ชั่วโมง (< 24h)
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    // วัน (< 7d)
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    // กรณีอยู่ในปีเดียวกัน แสดง เดือน วัน เช่น "Nov 11"
    const isSameYear = date.getFullYear() === now.getFullYear();
    if (isSameYear) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    // กรณีคนละปี แสดง เดือน วัน ปี เช่น "Nov 11, 2025"
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * ฟังก์ชันจัดรูปแบบวันที่และเวลาแบบเต็ม (เช่น "Nov 11, 2026 at 7:02 PM")
 * สำหรับใส่ใน Tooltip hover title
 */
export function formatFullDateTime(dateInput) {
  if (!dateInput) return '';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
}

