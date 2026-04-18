"use client";

import React, { useState, useMemo } from "react";
import { Comment, BoardMember } from "@/types/project";
import { UserAvatar } from "@/components/UserAvatar";

const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatCommentDate(dateString: string) {
  return COMMENT_DATE_FORMATTER.format(new Date(dateString));
}

interface TaskCommentsProps {
  taskId: number;
  comments: Comment[];
  commentsLoading: boolean;
  currentUserId: string;
  boardMembers?: BoardMember[];
  isSubmitting: boolean;
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export function TaskComments({
  taskId,
  comments,
  commentsLoading,
  currentUserId,
  boardMembers = [],
  isSubmitting,
  onAddComment,
  onDeleteComment,
}: TaskCommentsProps) {
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  // Optimize member lookup: O(N) -> O(1)
  const memberMap = useMemo(() => {
    return new Map(boardMembers.map((m) => [m.user_id, m]));
  }, [boardMembers]);

  const handleAddCommentClick = async () => {
    if (!commentInput.trim() || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      await onAddComment(taskId, commentInput);
      setCommentInput("");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 mt-4 flex-1 pb-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Hoạt động & Bình luận
      </h3>

      <div className="space-y-3 pr-2 flex flex-col">
        {commentsLoading ? (
          <div className="text-sm text-slate-400 italic">Đang tải bình luận...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-slate-400 italic">Chưa có bình luận nào.</div>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.user_id === currentUserId;
            const memberInfo = memberMap.get(comment.user_id);
            const fallbackName = isOwner ? "Bạn" : "Thành viên";
            const displayName = comment.user?.display_name || memberInfo?.display_name || fallbackName;
            const avatarUrl = comment.user?.avatar_url || memberInfo?.avatar_url || null;

            return (
              <div
                key={comment.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm relative"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <div className="flex items-center gap-1.5 border border-transparent">
                      <UserAvatar
                        avatarUrl={avatarUrl}
                        displayName={displayName}
                        className="w-5 h-5 flex-shrink-0 text-[9px]"
                      />
                      <p className="text-xs font-bold text-slate-800">
                        {displayName}
                      </p>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 ml-6">
                      {formatCommentDate(comment.created_at)}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-200">
                      {deletingCommentId === comment.id ? (
                        <>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Chắc chắn?
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeletingCommentId(null)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase bg-slate-100 px-1.5 py-0.5 rounded transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setCommentSubmitting(true);
                              try {
                                await onDeleteComment(comment.id);
                              } catch (err) {
                                console.error("Failed to delete comment:", err);
                                // TODO: surface error to user (toast/banner)
                              } finally {
                                setCommentSubmitting(false);
                                setDeletingCommentId(null);
                              }
                            }}
                            disabled={commentSubmitting || isSubmitting}
                            className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 uppercase px-1.5 py-0.5 rounded shadow-sm transition-colors"
                          >
                            Xóa
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingCommentId(comment.id)}
                          disabled={commentSubmitting || isSubmitting}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase bg-slate-50 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap break-words mt-1">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2 mt-1 pr-2">
        <textarea
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder="Viết bình luận..."
          rows={2}
          disabled={commentSubmitting || isSubmitting}
          className="w-full bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-[#28B8FA] transition-colors resize-y min-h-[80px]"
        />
        <button
          type="button"
          onClick={handleAddCommentClick}
          disabled={!commentInput.trim() || commentSubmitting || isSubmitting}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {commentSubmitting ? "Đang đăng..." : "Đăng bình luận"}
        </button>
      </div>
    </div>
  );
}
