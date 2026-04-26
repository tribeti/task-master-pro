"use client";

import React, { useState, useEffect, useRef } from "react";
import { XIcon } from "@/components/icons";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { Label, Comment, TaskAssignee, BoardMember } from "@/lib/types/project";
import { TaskLabels } from "./task-details/TaskLabels";
import { TaskChecklist } from "./task-details/TaskChecklist";
import { TaskAssignees } from "./task-details/TaskAssignees";
import { TaskComments } from "./task-details/TaskComments";

interface TaskDetailsModalProps {
  isOpen: boolean;
  boardId: number;
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
    assignee_id?: string | null;
    assignee?: TaskAssignee | null;
    assignees?: TaskAssignee[];
    labels?: Label[];
  } | null;
  isSubmitting?: boolean;
  boardLabels: Label[];
  onAddLabel: (taskId: number, labelId: number) => Promise<void>;
  onRemoveLabel: (taskId: number, labelId: number) => Promise<void>;
  onCreateAndAssignLabel: (
    taskId: number,
    name: string,
    color: string,
  ) => Promise<Label>;
  onAddAssignee: (taskId: number, assigneeId: string) => Promise<void>;
  onRemoveAssignee: (taskId: number, assigneeId: string) => Promise<void>;
  onRemoveAllAssignees: (taskId: number) => Promise<void>;
  boardMembers: BoardMember[];
  comments: Comment[];
  commentsLoading: boolean;
  currentUserId: string;
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onUpdateTask?: (
    taskId: number,
    updates: Partial<{
      title: string;
      description: string | null;
      priority: "Low" | "Medium" | "High";
      deadline: string | null;
    }>,
  ) => Promise<void>;
  onChecklistsUpdate?: (taskId: number, checklists: any[]) => void;
}

export function TaskDetailsModal({
  isOpen,
  boardId,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
  boardLabels,
  onAddLabel,
  onRemoveLabel,
  onCreateAndAssignLabel,
  onAddAssignee,
  onRemoveAssignee,
  onRemoveAllAssignees,
  boardMembers,
  comments,
  commentsLoading,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onUpdateTask,
  onChecklistsUpdate,
}: TaskDetailsModalProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [deadline, setDeadline] = useState("");
  const [nameError, setNameError] = useState(false);

  const isEditing = !!initialData;
  const initId = initialData?.id;
  const initTitle = initialData?.title;
  const initDescription = initialData?.description;
  const initPriority = initialData?.priority;
  const initDeadline = initialData?.deadline;

  const initializedFormKeyRef = useRef<string | null>(null);
  const updateSessionsRef = useRef({
    title: 0,
    priority: 0,
    deadline: 0,
    description: 0,
  });

  useEffect(() => {
    if (!isOpen) {
      initializedFormKeyRef.current = null;
      return;
    }

    const formKey = initId ? `edit:${initId}` : "create";
    if (initializedFormKeyRef.current === formKey) return;
    initializedFormKeyRef.current = formKey;

    if (isEditing) {
      setTitle(initTitle as string);
      setDescription(initDescription || "");
      setPriority(initPriority as "Low" | "Medium" | "High");
      setDeadline(initDeadline ? initDeadline.split("T")[0] : "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDeadline("");
    }
  }, [
    isOpen,
    isEditing,
    initId,
    initTitle,
    initDescription,
    initPriority,
    initDeadline,
  ]);

  useEffect(() => {
    if (isOpen) {
      setNameError(false);
    }
  }, [isOpen, initId]);

  const taskLabels = initialData?.labels || [];
  const availableLabels = boardLabels.filter(
    (label) => !taskLabels.some((taskLabel) => taskLabel.id === label.id),
  );
  const currentAssignees = initialData?.assignees || [];

  const handleSubmit = () => {
    if (!title.trim()) {
      setNameError(true);
      return;
    }

    onSubmit({
      title,
      description,
      priority,
      deadline,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 p-2 md:p-6 ${
        isCozy ? "bg-slate-950/60" : "bg-slate-900/40"
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-4xl md:rounded-[2.5rem] shadow-2xl w-full max-w-5xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] transition-colors duration-500 ${
          isCozy ? "bg-[#0F172A] border border-slate-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={`absolute top-4 right-4 md:top-6 md:right-6 transition-colors disabled:opacity-50 z-20 p-2 rounded-full backdrop-blur-md ${
            isCozy ? "bg-slate-800 text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600 bg-slate-100 md:bg-white/80"
          }`}
        >
          <XIcon />
        </button>

        <div className="p-5 md:p-8 overflow-y-auto w-full h-full custom-scrollbar">
          <div className="mb-6 pr-10">
            <h2 className={`text-2xl font-bold ${isCozy ? "text-white" : "text-slate-900"}`}>
              {initialData ? "Chỉnh sửa nhiệm vụ" : "Tạo nhiệm vụ"}
            </h2>
            <p className={`text-sm font-medium ${isCozy ? "text-slate-500" : "text-slate-400"}`}>
              {initialData
                ? "Cập nhật chi tiết nhiệm vụ."
                : "Thêm một nhiệm vụ mới vào bảng."}
            </p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr] gap-8 items-start">
            {/* CỘT TRÁI */}
            <div className="flex flex-col gap-6 w-full">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isCozy ? "text-slate-500" : "text-slate-500"}`}>
                  Tên nhiệm vụ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thiết kế giao diện"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  onBlur={async () => {
                    if (!initialData?.id) return;
                    const trimmedTitle = title.trim();
                    if (!trimmedTitle) {
                      setNameError(true);
                      setTitle(initialData.title ?? "");
                      return;
                    }
                    const original = initialData.title ?? "";
                    if (trimmedTitle !== original) {
                      const session = ++updateSessionsRef.current.title;
                      try {
                        await onUpdateTask?.(initialData.id, {
                          title: trimmedTitle,
                        });
                      } catch (error) {
                        if (session === updateSessionsRef.current.title) {
                          setTitle(original);
                        }
                      }
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold placeholder-slate-400 focus:outline-none transition-all ${
                    isCozy 
                      ? (nameError ? "border-red-500 bg-slate-900 text-white" : "bg-slate-900/50 border-slate-800 text-white focus:border-[#FF8B5E] focus:bg-slate-900")
                      : (nameError ? "border-red-400 focus:border-red-400" : "bg-white border-slate-200 text-slate-900 focus:border-[#28B8FA]")
                    }`}
                  required
                  maxLength={29}
                  autoFocus
                  disabled={isSubmitting}
                />
                {nameError && (
                  <p className="text-xs font-medium text-red-500 mt-1.5 ml-1">
                    Tên nhiệm vụ là cần thiết.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Độ ưu tiên
                  </label>
                  <div className="flex gap-2">
                    {(["Low", "Medium", "High"] as const).map((p) => {
                      const colors = {
                        Low: isCozy ? "text-[#34D399] bg-[#064E3B]/40 border-[#064E3B]/60" : "text-[#34D399] bg-[#D1FAE5]",
                        Medium: isCozy ? "text-[#FF8B5E] bg-orange-950/20 border-orange-900/40" : "text-[#28B8FA] bg-[#EAF7FF]",
                        High: isCozy ? "text-red-400 bg-red-950/40 border-red-900/60" : "text-[#FF8B5E] bg-[#FFF2DE]",
                      };

                      return (
                        <button
                          key={p}
                          onClick={async () => {
                            const original = initialData?.priority;
                            setPriority(p);
                            if (initialData?.id && p !== original) {
                              const session = ++updateSessionsRef.current
                                .priority;
                              try {
                                await onUpdateTask?.(initialData.id, {
                                  priority: p,
                                });
                              } catch (error) {
                                if (
                                  session ===
                                  updateSessionsRef.current.priority &&
                                  original
                                ) {
                                  setPriority(original);
                                }
                              }
                            }
                          }}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${priority === p
                              ? colors[p]
                              : (isCozy ? "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700" : "bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100")
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
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    onBlur={async () => {
                      if (!initialData?.id) return;
                      const original = initialData.deadline
                        ? initialData.deadline.split("T")[0]
                        : "";
                      if (deadline !== original) {
                        const session = ++updateSessionsRef.current.deadline;
                        try {
                          await onUpdateTask?.(initialData.id, {
                            deadline: deadline || null,
                          });
                        } catch (error) {
                          if (session === updateSessionsRef.current.deadline) {
                            setDeadline(original);
                          }
                        }
                      }
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold focus:outline-none transition-colors cursor-pointer ${
                      isCozy 
                        ? "bg-slate-900/50 border-slate-800 text-white focus:border-[#FF8B5E] [color-scheme:dark]" 
                        : "bg-white border-slate-200 text-slate-900 focus:border-[#28B8FA]"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {initialData?.id && (
                <TaskLabels
                  taskId={initialData.id}
                  taskLabels={taskLabels}
                  availableLabels={availableLabels}
                  isSubmitting={isSubmitting}
                  onAddLabel={onAddLabel}
                  onRemoveLabel={onRemoveLabel}
                  onCreateAndAssignLabel={onCreateAndAssignLabel}
                />
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Mô tả
                </label>
                <textarea
                  placeholder="Mô tả chi tiết..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={async () => {
                    const original = initialData?.description || "";
                    if (initialData?.id && description !== original) {
                      const session = ++updateSessionsRef.current.description;
                      try {
                        await onUpdateTask?.(initialData.id, { description });
                      } catch (error) {
                        if (session === updateSessionsRef.current.description) {
                          setDescription(original);
                        }
                      }
                    }
                  }}
                  rows={4}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-medium placeholder-slate-500 focus:outline-none transition-colors resize-y min-h-[100px] ${
                    isCozy 
                      ? "bg-slate-900/30 hover:bg-slate-900/50 focus:bg-slate-900 border-slate-800 text-white focus:border-[#FF8B5E]" 
                      : "bg-slate-50/50 hover:bg-white focus:bg-white border-slate-200 text-slate-900 focus:border-[#28B8FA]"
                  }`}
                />
              </div>

              {initialData?.id && (
                <TaskChecklist
                  taskId={initialData.id}
                  isSubmitting={isSubmitting}
                  onChecklistsUpdate={(data) =>
                    onChecklistsUpdate?.(initialData.id!, data)
                  }
                />
              )}
            </div>

            {/* CỘT PHẢI */}
            <div className="flex flex-col gap-6 w-full h-fit">
              {initialData?.id && (
                <TaskAssignees
                  boardId={boardId}
                  taskId={initialData.id}
                  currentAssignees={currentAssignees}
                  isSubmitting={isSubmitting}
                  onAddAssignee={onAddAssignee}
                  onRemoveAssignee={onRemoveAssignee}
                  onRemoveAllAssignees={onRemoveAllAssignees}
                  boardMembers={boardMembers}
                />
              )}

              {initialData?.id && (
                <TaskComments
                  taskId={initialData.id}
                  comments={comments}
                  commentsLoading={commentsLoading}
                  currentUserId={currentUserId}
                  boardMembers={boardMembers}
                  isSubmitting={isSubmitting}
                  onAddComment={onAddComment}
                  onDeleteComment={onDeleteComment}
                />
              )}

              <div className={`flex flex-col gap-2 mt-auto pt-4 border-t ${isCozy ? "border-slate-800" : "border-slate-100"}`}>
                {!initialData && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isCozy 
                        ? "bg-gradient-to-r from-[#FF8B5E] to-orange-600 text-white hover:shadow-lg hover:shadow-orange-950/20" 
                        : "bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white hover:shadow-lg hover:shadow-cyan-200"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      "Tạo nhiệm vụ"
                    )}
                  </button>
                )}
                {initialData && onDelete && (
                  <button
                    onClick={onDelete}
                    disabled={isSubmitting}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
                      isCozy ? "bg-red-950/30 text-red-400 hover:bg-red-950/50" : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    Xóa nhiệm vụ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
