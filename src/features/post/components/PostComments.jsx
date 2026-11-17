"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FolderKanban,
  Loader2,
  Send,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import CommentPortfolioCard from "./CommentPortfolioCard";
import CommentActionsMenu from "./CommentActionsMenu";
import {
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} from "../hooks/use-posts";
import { formatRelativeTime, formatFullDateTime } from "@/lib/date";

/**
 * PostComments - กล่องแสดงและส่งความคิดเห็นใต้โพสต์
 */
export default function PostComments({
  postId,
  commentsCount,
  currentUser,
  postAuthorId,
  onOpenDetail,
}) {
  const [commentText, setCommentText] = useState("");
  const [attachPortfolio, setAttachPortfolio] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUserAvatar =
    currentUser?.avatarUrl || currentUser?.avatar || "";
  const currentUserName =
    currentUser?.name || currentUser?.username || "You";

  // ดึงความคิดเห็น
  const {
    data: commentsData,
    isLoading: isLoadingComments,
    isError: isCommentsError,
    refetch: refetchComments,
  } = useCommentsQuery(postId);

  const comments = commentsData?.comments || [];

  const addCommentMutation = useAddCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();

  // ส่งความคิดเห็นพร้อม Error Handling
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!content || addCommentMutation.isPending || !currentUser) return;

    setErrorMessage("");
    try {
      await addCommentMutation.mutateAsync({
        postId,
        content,
        attachPortfolio,
      });
      setCommentText("");
      setAttachPortfolio(false);
    } catch (err) {
      console.error("Failed to add comment:", err);
      setErrorMessage(err?.message || "ไม่สามารถส่งความคิดเห็นได้ในขณะนี้");
    }
  };

  // ลบความคิดเห็นเฉพาะรายการที่เลือก
  const handleDeleteComment = async (commentId) => {
    if (!commentId || deletingCommentId) return;

    setDeletingCommentId(commentId);
    try {
      await deleteCommentMutation.mutateAsync({
        postId,
        commentId,
      });
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="mt-3.5 pt-3 border-t border-gray-100 space-y-3 px-3.5 sm:px-4">
      {commentsCount > 0 && (
        <div className="flex items-center justify-between pb-1 text-xs">
          <span className="text-gray-500 font-medium">
            ความคิดเห็น ({commentsCount})
          </span>
          <button
            type="button"
            onClick={onOpenDetail}
            className="text-gray-500 hover:text-black font-medium transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmitComment} className="flex flex-col gap-2 py-1">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <UserAvatar
            src={currentUserAvatar}
            alt={currentUserName}
            className="h-10 w-10 sm:h-11 sm:w-11 ring-1 ring-gray-200/80 shrink-0"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                currentUser
                  ? "เขียนความคิดเห็น..."
                  : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"
              }
              value={commentText}
              disabled={!currentUser || addCommentMutation.isPending}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              className="w-full rounded-full bg-gray-50/90 hover:bg-gray-100/70 focus:bg-white border border-gray-200/80 focus:border-gray-400 py-2.5 sm:py-3 pl-4 sm:pl-5 pr-20 sm:pr-24 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all shadow-2xs"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setAttachPortfolio(!attachPortfolio)}
                  title={
                    attachPortfolio
                      ? `แนบ Portfolio (${currentUser.username}) แล้ว (คลิกเพื่อยกเลิก)`
                      : `แนบ Portfolio (${currentUser.username})`
                  }
                  aria-label="แนบ Portfolio"
                  className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all cursor-pointer ${
                    attachPortfolio
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-200/70"
                  }`}
                >
                  <FolderKanban className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={
                  !commentText.trim() ||
                  addCommentMutation.isPending ||
                  !currentUser
                }
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                aria-label="Send comment"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-500 pl-13 flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </form>

      {/* Comments List */}
      {isLoadingComments ? (
        <div className="flex items-center justify-center py-4 text-xs text-gray-400 gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>กำลังโหลดความคิดเห็น...</span>
        </div>
      ) : isCommentsError ? (
        <div className="flex flex-col items-center justify-center py-3 text-xs text-gray-500 gap-2">
          <p className="text-rose-500">โหลดความคิดเห็นไม่สำเร็จ</p>
          <button
            type="button"
            onClick={() => refetchComments()}
            className="flex items-center gap-1 text-gray-700 hover:text-black font-medium border border-gray-200 rounded-lg px-2.5 py-1 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-2 text-xs text-gray-400">
          ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!
        </p>
      ) : (
        <div className="space-y-4 pt-1">
          {comments.map((comment) => {
            const canDelete = Boolean(
              currentUser?.id &&
                ((comment.user?.id != null &&
                  String(comment.user.id) === String(currentUser.id)) ||
                  (postAuthorId != null &&
                    String(postAuthorId) === String(currentUser.id))),
            );
            const commentAvatar =
              comment.user?.avatar || comment.user?.avatarUrl;

            return (
              <div key={comment.id} className="flex items-start gap-3 group/comment">
                <div className="flex flex-col items-center shrink-0 w-10 mt-0.5">
                  <Link
                    href={
                      comment.user?.username ? `/${comment.user.username}` : "#"
                    }
                    className="shrink-0"
                  >
                    <UserAvatar
                      src={commentAvatar}
                      alt={comment.user?.name || "User"}
                      size="md"
                      className="ring-1 ring-gray-100"
                    />
                  </Link>
                  {comment.portfolioAttachment && (
                    <div className="relative w-full h-[125px]">
                      <svg
                        className="w-[52px] h-[125px] pointer-events-none overflow-visible"
                        viewBox="0 0 52 125"
                        fill="none"
                      >
                        <path
                          d="M 20 8 V 98 C 20 118, 40 118, 38 118"
                          stroke="#d1d5db"
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={
                          comment.user?.username
                            ? `/${comment.user.username}`
                            : "#"
                        }
                        className="font-bold text-sm sm:text-base text-gray-900 hover:underline truncate"
                      >
                        {comment.user?.name || "User"}
                      </Link>
                      <span className="text-gray-300 text-xs">•</span>
                      <span
                        className="text-gray-400 text-xs sm:text-[13px] shrink-0 font-normal"
                        title={formatFullDateTime(comment.createdAt)}
                      >
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <CommentActionsMenu
                      comment={comment}
                      canDelete={canDelete}
                      onDelete={() => handleDeleteComment(comment.id)}
                      isDeleting={deletingCommentId === comment.id}
                    />
                  </div>
                  <p className="text-sm sm:text-[15px] text-gray-900 whitespace-pre-wrap break-words mt-1 leading-relaxed">
                    {comment.content}
                  </p>

                  {comment.portfolioAttachment && (
                    <CommentPortfolioCard data={comment.portfolioAttachment} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
