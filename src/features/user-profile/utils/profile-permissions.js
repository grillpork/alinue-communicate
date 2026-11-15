/**
 * ตรวจสอบความเป็นเจ้าของ Content (Showcase, Service, Post)
 * ปลอดภัยสำหรับทั้ง ID แบบ Number, String และ UUID
 */
export function isContentOwner(currentUser, content) {
  if (!currentUser || !content) return false;

  const ownerId = content.userId ?? content.author?.id;

  if (
    ownerId != null &&
    currentUser.id != null &&
    String(currentUser.id) === String(ownerId)
  ) {
    return true;
  }

  return Boolean(
    currentUser.username &&
      content.author?.username &&
      currentUser.username.toLowerCase() ===
        content.author.username.toLowerCase(),
  );
}
