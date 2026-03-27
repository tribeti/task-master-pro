"use client";

import React, { useEffect, useState } from "react";
import { XIcon, TrashIcon } from "@/components/icons";
import { CreateLabelModal } from "./CreateLabelModal";
import { Label, Comment } from "@/types/project";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    deadline: string;
  }) => void;
  onDelete?: () => void;
  initialData?: {
    id?: number;
    title: string;
    description: string | null;
    priority: "Low" | "Medium" | "High";
    deadline: string | null;
    labels?: Label[];
  } | null;
  isSubmitting?: boolean;
  boardId: number;
  boardLabels: Label[];
  onSetLabel: (taskId: number, labelId: number) => Promise<void>;
  onClearLabel: (taskId: number) => Promise<void>;
  onCreateLabel: (
    boardId: number,
    name: string,
    colorHex: string,
  ) => Promise<void>;
  comments: Comment[];
  commentsLoading: boolean;
  currentUserId: string;
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
  boardId,
  boardLabels,
  onSetLabel,
  onClearLabel,
  onCreateLabel,
  comments,
  commentsLoading,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: TaskDetailsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [deadline, setDeadline] = useState("");
  const [nameError, setNameError] = useState(false);

  const [selectedLabelId, setSelectedLabelId] = useState<number | "">("");
  const [labelSubmitting, setLabelSubmitting] = useState(false);

  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [isCreateLabelModalOpen, setIsCreateLabelModalOpen] = useState(false);
  const [createLabelSubmitting, setCreateLabelSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setPriority(initialData.priority);
        setDeadline(
          initialData.deadline ? initialData.deadline.split("T")[0] : "",
        );

        const activeLabel = initialData.labels?.[0];
        setSelectedLabelId(activeLabel ? activeLabel.id : "");
      } else {
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setDeadline("");
        setSelectedLabelId("");
      }

      setCommentInput("");
      setNameError(false);
    }
  }, [isOpen, initialData]);

  const activeLabel = initialData?.labels?.[0] || null;

  const handleSubmit = () => {
    if (!title.trim()) {
      setNameError(true);
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      deadline,
    });
  };

  const handleApplyLabel = async () => {
    if (!initialData?.id || !selectedLabelId) return;

    try {
      setLabelSubmitting(true);
      await onSetLabel(initialData.id, Number(selectedLabelId));
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleClearLabel = async () => {
    if (!initialData?.id) return;

    try {
      setLabelSubmitting(true);
      await onClearLabel(initialData.id);
      setSelectedLabelId("");
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleAddCommentClick = async () => {
    if (!initialData?.id || !commentInput.trim()) return;

    try {
      setCommentSubmitting(true);
      await onAddComment(initialData.id, commentInput.trim());
      setCommentInput("");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCreateLabel = async (data: {
    name: string;
    colorHex: string;
  }) => {
    try {
      setCreateLabelSubmitting(true);
      await onCreateLabel(boardId, data.name, data.colorHex);
      setIsCreateLabelModalOpen(false);
    } finally {
      setCreateLabelSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={
              isSubmitting ||
              labelSubmitting ||
              commentSubmitting ||
              createLabelSubmitting
            }
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
          >
            <XIcon />
          </button>

          <div className="p-8 flex flex-col gap-5 overflow-y-auto w-full">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {initialData ? "Edit Task" : "Create Task"}
              </h2>
              <p className="text-sm text-slate-400 font-medium">
                {initialData
                  ? "Update task details."
                  : "Add a new task to the board."}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Task Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Design wireframes"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                }}
                className={`w-full bg-white text-slate-900 px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${
                  nameError
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#28B8FA]"
                }`}
                required
                autoFocus
                disabled={isSubmitting}
              />
              {nameError && (
                <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                  Task name is required.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Priority
              </label>
              <div className="flex gap-2">
                {(["Low", "Medium", "High"] as const).map((p) => {
                  const colors = {
                    Low: "text-[#34D399] bg-[#D1FAE5]",
                    Medium: "text-[#28B8FA] bg-[#EAF7FF]",
                    High: "text-[#FF8B5E] bg-[#FFF2DE]",
                  };

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        priority === p
                          ? `${colors[p]}`
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Description
              </label>
              <textarea
                placeholder="Task details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="w-full bg-white text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#28B8FA] transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {initialData && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Label Color
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCreateLabelModalOpen(true)}
                    className="text-sm font-bold text-[#28B8FA] hover:text-[#0EA5E9]"
                  >
                    + New label
                  </button>
                </div>

                <div className="mb-4">
                  {activeLabel ? (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-slate-900 shadow-sm"
                      style={{
                        backgroundColor: activeLabel.color_hex || "#E2E8F0",
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
                      <span>{activeLabel.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No label selected
                    </span>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <select
                      value={selectedLabelId}
                      onChange={(e) =>
                        setSelectedLabelId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      disabled={labelSubmitting || isSubmitting}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-[#28B8FA] focus:ring-4 focus:ring-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select label color</option>
                      {boardLabels.map((label) => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyLabel}
                    disabled={!selectedLabelId || labelSubmitting || isSubmitting}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {labelSubmitting ? "Applying..." : "Apply Label"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearLabel}
                    disabled={!activeLabel || labelSubmitting || isSubmitting}
                    className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {initialData && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                  Comments
                </label>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {commentsLoading ? (
                    <div className="text-sm text-slate-400">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-slate-400">No comments yet</div>
                  ) : (
                    comments.map((comment) => {
                      const isOwner = comment.user_id === currentUserId;

                      return (
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {isOwner ? "You" : `${comment.user_id.slice(0, 8)}...`}
                              </p>
                              <p className="text-xs text-slate-400">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => onDeleteComment(comment.id)}
                                disabled={commentSubmitting || isSubmitting}
                                className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    disabled={commentSubmitting || isSubmitting}
                    className="w-full bg-white text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors resize-none"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddCommentClick}
                      disabled={
                        !commentInput.trim() || commentSubmitting || isSubmitting
                      }
                      className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commentSubmitting ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isSubmitting}
                  className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                  title="Delete Task"
                >
                  <TrashIcon />
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-3 rounded-full bg-linear-to-r from-[#28B8FA] to-[#0EA5E9] text-white font-bold text-base hover:shadow-lg hover:shadow-cyan-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : initialData ? (
                  "Save Changes"
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateLabelModal
        isOpen={isCreateLabelModalOpen}
        onClose={() => setIsCreateLabelModalOpen(false)}
        onSubmit={handleCreateLabel}
        isSubmitting={createLabelSubmitting}
      />
    </>
  );
}