"use client";

import React, { useState, useRef, useEffect } from "react";
import PostAuthorProfileTrigger from "./PostAuthorProfileTrigger";
import PostMenu from "./PostMenu";
import { formatRelativeTime, formatFullDateTime } from "@/lib/date";

/**
 * PostHeader - แถบหัวโพสต์แสดงรูปผู้แต่ง, ชื่อ, เวลา และเมนูตัวเลือก
 */
export default function PostHeader({
  author,
  createdAt,
  isOwner,
  onCopyLink,
  onShare,
  onEdit,
  onDelete,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between px-3.5 sm:px-4">
      <div className="flex items-center gap-2.5">
        <PostAuthorProfileTrigger author={author} />
        <span className="text-gray-400 text-xs">•</span>
        <span
          className="text-gray-400 hover:text-gray-600 transition-colors text-xs cursor-default"
          title={formatFullDateTime(createdAt)}
        >
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      <PostMenu
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        menuRef={menuRef}
        isOwner={isOwner}
        onCopyLink={onCopyLink}
        onShare={onShare}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
