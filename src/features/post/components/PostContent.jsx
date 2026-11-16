"use client";

import React, { useState } from "react";
import Link from "next/link";

/**
 * แปลงข้อความที่มี #hashtag หรือ @user ให้เป็นลิงก์คลิกได้
 */
function renderPostText(text) {
  if (!text) return null;
  const regex = /(#[^\s#.,!?]+|@[^\s@.,!?]+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1);
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(tag)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 font-medium hover:underline cursor-pointer transition-colors"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return (
        <Link
          key={index}
          href={`/${username}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-500 font-medium hover:underline cursor-pointer transition-colors"
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * PostContent - แสดงข้อความของโพสต์พร้อมรองรับ Hashtag, Mention และย่อ/ขยายด้วย line-clamp-4
 */
export default function PostContent({ content }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content) return null;

  const isLongContent = content.length > 200 || content.split("\n").length > 4;

  return (
    <div className="mt-2.5 px-3.5 sm:px-4">
      <p
        className={`text-xs sm:text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words ${
          !isExpanded && isLongContent ? "line-clamp-4" : ""
        }`}
      >
        {renderPostText(content)}
      </p>
      {isLongContent && (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="mt-1 block text-xs sm:text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          {isExpanded ? "ดูน้อยลง" : "ดูเพิ่มเติม"}
        </button>
      )}
    </div>
  );
}
