"use client";

import React, { useState, useEffect } from "react";
import { XIcon, TrashIcon } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { AssigneeOption, Label, Comment, TaskAssignee } from "@/types/project";
import { createClient } from "@/utils/supabase/client";

interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
}

interface Checklist {
  id: string;
  task_id: number;
  title: string;
  created_at: string;
  items: ChecklistItem[];
}

const INLINE_LABEL_PRESET_COLORS = [
  "#FF8B5E",
  "#FF6B6B",
  "#FFC300",
  "#34D399",
  "#28B8FA",
  "#818CF8",
];

const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

function formatCommentDate(dateString: string) {
  return COMMENT_DATE_FORMATTER.format(new Date(dateString));
}

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
  comments: Comment[];
  commentsLoading: boolean;
  currentUserId: string;
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
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
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [customLabelName, setCustomLabelName] = useState("");
  const [customLabelColor, setCustomLabelColor] = useState(
    INLINE_LABEL_PRESET_COLORS[0],
  );
  const [customLabelError, setCustomLabelError] = useState("");

  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [assigneeSubmitting, setAssigneeSubmitting] = useState(false);
  const [assigneeError, setAssigneeError] = useState("");
  const [assignableMembers, setAssignableMembers] = useState<AssigneeOption[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Việc cần làm");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || "");
        setPriority(initialData.priority);
        setDeadline(
          initialData.deadline ? initialData.deadline.split("T")[0] : "",
        );
      } else {
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setDeadline("");
      }

      setSelectedLabelId("");
      setShowCreateLabelForm(false);
      setCustomLabelName("");
      setCustomLabelColor(INLINE_LABEL_PRESET_COLORS[0]);
      setCustomLabelError("");
      setCommentInput("");
      setAssigneeError("");
      setSelectedAssigneeId("");
      setNameError(false);
      setIsAddingChecklist(false);
      setNewChecklistTitle("Việc cần làm");
      setEditingChecklistId(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen || !initialData?.id) {
      return;
    }

    let ignore = false;

    const fetchAssignableMembers = async () => {
      try {
        setMembersLoading(true);
        setAssigneeError("");
        const res = await fetch(`/api/users?boardId=${boardId}`);
        if (!res.ok) {
          throw new Error("Failed to load users");
        }
        const data = (await res.json()) as AssigneeOption[];
        if (!ignore) {
          setAssignableMembers(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch assignee options:", error);
        if (!ignore) {
          setAssignableMembers([]);
          setAssigneeError("Failed to load assignees.");
        }
      } finally {
        if (!ignore) {
          setMembersLoading(false);
        }
      }
    };

    fetchAssignableMembers();

    return () => {
      ignore = true;
    };
  }, [boardId, initialData?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !initialData?.id) return;

    let ignore = false;
    const fetchChecklists = async () => {
      setChecklistsLoading(true);
      const { data: lists, error: listsError } = await supabase
        .from("checklists")
        .select("*")
        .eq("task_id", initialData.id)
        .order("created_at", { ascending: true });

      if (!listsError && lists && !ignore) {
        if (lists.length === 0) {
          setChecklists([]);
        } else {
          const { data: items, error: itemsError } = await supabase
            .from("checklist_items")
            .select("*")
            .in("checklist_id", lists.map((l: any) => l.id))
            .order("created_at", { ascending: true });

          if (!itemsError && items && !ignore) {
            const enriched = lists.map((l: any) => ({
              ...l,
              items: items.filter((i: any) => i.checklist_id === l.id)
            }));
            setChecklists(enriched);
          } else if (!ignore) {
            setChecklists(lists.map((l: any) => ({ ...l, items: [] })));
          }
        }
      } else if (!ignore) {
        setChecklists([]);
      }
      if (!ignore) {
        setChecklistsLoading(false);
      }
    };

    fetchChecklists();

    return () => { ignore = true; };
  }, [isOpen, initialData?.id, supabase]);

  const handleAddChecklist = async (title: string = "Việc cần làm") => {
    if (!initialData?.id) return;
    const tempId = crypto.randomUUID();
    const newChecklist: Checklist = { id: tempId, task_id: initialData.id, title, created_at: new Date().toISOString(), items: [] };
    setChecklists(prev => [...prev, newChecklist]);

    const { data } = await supabase.from("checklists").insert({ task_id: initialData.id, title }).select().single();
    if (data) {
      setChecklists(prev => prev.map(c => c.id === tempId ? { ...data, items: [] } : c));
    }
  };

  const handleUpdateChecklistTitle = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setChecklists(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    await supabase.from("checklists").update({ title: newTitle }).eq("id", id);
  };

  const handleDeleteChecklist = async (id: string) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
    await supabase.from("checklists").delete().eq("id", id);
  };

  const handleAddItem = async (checklistId: string, content: string) => {
    if (!content.trim()) return;
    const tempId = crypto.randomUUID();
    const newItem: ChecklistItem = { id: tempId, checklist_id: checklistId, content, is_completed: false, created_at: new Date().toISOString() };
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, items: [...c.items, newItem] } : c));

    const { data } = await supabase.from("checklist_items").insert({ checklist_id: checklistId, content }).select().single();
    if (data) {
      setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, items: c.items.map(i => i.id === tempId ? data : i) } : c));
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string, isCompleted: boolean) => {
    setChecklists(prev => prev.map(c => c.id === checklistId ? {
      ...c, items: c.items.map(i => i.id === itemId ? { ...i, is_completed: isCompleted } : i)
    } : c));

    await supabase.from("checklist_items").update({ is_completed: isCompleted }).eq("id", itemId);
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
    await supabase.from("checklist_items").delete().eq("id", itemId);
  };

  const taskLabels = initialData?.labels || [];
  const currentAssignees = initialData?.assignees || [];
  const assignedAssigneeIds = new Set(currentAssignees.map((assignee) => assignee.user_id));
  const availableAssigneeOptions = assignableMembers.filter(
    (member) => !assignedAssigneeIds.has(member.user_id),
  );

  const availableLabels = boardLabels.filter(
    (label) => !taskLabels.some((taskLabel) => taskLabel.id === label.id),
  );

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

  const handleAddLabelClick = async () => {
    if (!initialData?.id || !selectedLabelId) return;

    try {
      setLabelSubmitting(true);
      await onAddLabel(initialData.id, Number(selectedLabelId));
      setSelectedLabelId("");
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleRemoveLabelClick = async (labelId: number) => {
    if (!initialData?.id) return;

    try {
      setLabelSubmitting(true);
      await onRemoveLabel(initialData.id, labelId);
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleCreateCustomLabelClick = async () => {
    if (!initialData?.id || labelSubmitting) return;

    const trimmedName = customLabelName.trim();
    if (!trimmedName) {
      setCustomLabelError("Label name is required.");
      return;
    }

    if (trimmedName.length > 50) {
      setCustomLabelError("Max 50 characters.");
      return;
    }

    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(customLabelColor)) {
      setCustomLabelError("Invalid color format.");
      return;
    }

    try {
      setLabelSubmitting(true);
      setCustomLabelError("");
      await onCreateAndAssignLabel(initialData.id, trimmedName, customLabelColor);
      setCustomLabelName("");
      setCustomLabelColor(INLINE_LABEL_PRESET_COLORS[0]);
      setShowCreateLabelForm(false);
    } catch (error) {
      console.error("Failed to create custom label:", error);
      setCustomLabelError("Failed to create label.");
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleAddCommentClick = async () => {
    if (!initialData?.id || !commentInput.trim()) return;

    try {
      setCommentSubmitting(true);
      await onAddComment(initialData.id, commentInput);
      setCommentInput("");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleAddAssigneeClick = async () => {
    if (!initialData?.id || assigneeSubmitting || !selectedAssigneeId) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onAddAssignee(initialData.id, selectedAssigneeId);
      setSelectedAssigneeId("");
    } catch (error) {
      console.error("Failed to add assignee:", error);
      setAssigneeError("Failed to add assignee.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  const handleRemoveAssigneeClick = async (assigneeId: string) => {
    if (!initialData?.id || assigneeSubmitting) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onRemoveAssignee(initialData.id, assigneeId);
    } catch (error) {
      console.error("Failed to remove assignee:", error);
      setAssigneeError("Failed to remove assignee.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  const handleUnassignAllClick = async () => {
    if (!initialData?.id || assigneeSubmitting || currentAssignees.length === 0) return;

    try {
      setAssigneeSubmitting(true);
      setAssigneeError("");
      await onRemoveAllAssignees(initialData.id);
      setSelectedAssigneeId("");
    } catch (error) {
      console.error("Failed to remove all assignees:", error);
      setAssigneeError("Failed to unassign all assignees.");
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={
            isSubmitting ||
            labelSubmitting ||
            commentSubmitting ||
            assigneeSubmitting
          }
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
        >
          <XIcon />
        </button>

        <div className="p-8 flex flex-col gap-5 overflow-y-auto w-full">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {initialData ? "Chỉnh sửa nhiệm vụ" : "Tạo nhiệm vụ"}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {initialData
                ? "Cập nhật chi tiết nhiệm vụ."
                : "Thêm một nhiệm vụ mới vào bảng."}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
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
              className={`w-full bg-white text-slate-900 px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${nameError
                ? "border-red-400 focus:border-red-400"
                : "border-slate-200 focus:border-[#28B8FA]"
                }`}
              required
              autoFocus
              disabled={isSubmitting}
            />
            {nameError && (
              <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                Tên nhiệm vụ là cần thiết.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Độ ưu tiên
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
                    onClick={() => setPriority(p)}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${priority === p
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
              Mô tả
            </label>
            <textarea
              placeholder="Mô tả chi tiết..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="w-full bg-white text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Hạn chót
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Người thực hiện
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {currentAssignees.length > 0
                        ? `${currentAssignees.length} người thực hiện`
                        : "Chưa giao"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {currentAssignees.length > 0
                        ? "Bạn có thể giao nhiều người thực hiện cho cùng một nhiệm vụ."
                        : "Nhiệm vụ này chưa có người thực hiện."}
                    </p>
                  </div>

                  {currentAssignees.length > 0 ? (
                    <div className="flex -space-x-2">
                      {currentAssignees.slice(0, 4).map((taskAssignee) => (
                        <div
                          key={taskAssignee.user_id}
                          className="ring-2 ring-white rounded-full"
                          title={taskAssignee.display_name}
                        >
                          <UserAvatar
                            avatarUrl={taskAssignee.avatar_url}
                            displayName={taskAssignee.display_name}
                            className="w-10 h-10"
                            fallbackClassName="bg-[#EAF7FF] text-[#0284C7]"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                      Chưa giao
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4 min-h-8">
                  {currentAssignees.length === 0 ? (
                    <span className="text-sm text-slate-400">
                      Chưa có người thực hiện
                    </span>
                  ) : (
                    currentAssignees.map((taskAssignee) => (
                      <div
                        key={taskAssignee.user_id}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm"
                      >
                        <UserAvatar
                          avatarUrl={taskAssignee.avatar_url}
                          displayName={taskAssignee.display_name}
                          className="w-6 h-6"
                          fallbackClassName="bg-[#EAF7FF] text-[#0284C7]"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {taskAssignee.display_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssigneeClick(taskAssignee.user_id)}
                          disabled={assigneeSubmitting || isSubmitting}
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Xóa người thực hiện"
                        >
                          x
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <select
                      value={selectedAssigneeId}
                      onChange={(e) => setSelectedAssigneeId(e.target.value)}
                      disabled={membersLoading || assigneeSubmitting || isSubmitting}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all focus:border-[#28B8FA] focus:ring-4 focus:ring-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {membersLoading ? "Loading assignees..." : "Select assignee"}
                      </option>
                      {availableAssigneeOptions.map((member) => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.display_name}
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
                    onClick={handleAddAssigneeClick}
                    disabled={
                      !selectedAssigneeId ||
                      membersLoading ||
                      assigneeSubmitting ||
                      isSubmitting
                    }
                    className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigneeSubmitting ? "Đang lưu..." : "Thêm người thực hiện"}
                  </button>

                  <button
                    type="button"
                    onClick={handleUnassignAllClick}
                    disabled={
                      currentAssignees.length === 0 ||
                      assigneeSubmitting ||
                      isSubmitting
                    }
                    className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:border-red-200 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bỏ giao tất cả
                  </button>
                </div>

                {assigneeError && (
                  <p className="mt-3 ml-1 text-xs font-medium text-red-400">
                    {assigneeError}
                  </p>
                )}

                <p className="mt-3 ml-1 text-xs text-slate-400">
                  Chọn một người dùng có sẵn để giao cho nhiệm vụ này.
                </p>
              </div>
            </div>
          )}

          {initialData && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Nhãn
              </label>

              <div className="flex flex-wrap gap-2 mb-4 min-h-7">
                {taskLabels.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    Chưa có nhãn
                  </span>
                ) : (
                  taskLabels.map((label) => (
                    <div
                      key={label.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-900 shadow-sm"
                      style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                    >
                      <span>{label.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabelClick(label.id)}
                        disabled={labelSubmitting || isSubmitting}
                        className="text-slate-700 hover:text-red-500 font-bold disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))
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
                    <option value="">Select label</option>
                    {availableLabels.map((label) => (
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
                  onClick={handleAddLabelClick}
                  disabled={!selectedLabelId || labelSubmitting || isSubmitting}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {labelSubmitting ? "Đang thêm..." : "Thêm nhãn"}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Tạo nhãn tùy chỉnh
                    </p>
                    <p className="text-xs text-slate-400">
                      Tạo một nhãn mới và gán nó cho nhiệm vụ này.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateLabelForm((prev) => !prev);
                      setCustomLabelError("");
                    }}
                    disabled={labelSubmitting || isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-[#28B8FA] hover:text-[#28B8FA] transition-all disabled:opacity-50"
                  >
                    {showCreateLabelForm ? "Ẩn" : "Nhãn mới"}
                  </button>
                </div>

                {showCreateLabelForm && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <input
                        type="text"
                        value={customLabelName}
                        onChange={(e) => {
                          setCustomLabelName(e.target.value);
                          if (e.target.value.trim()) {
                            setCustomLabelError("");
                          }
                        }}
                        placeholder="e.g. Bug, Backend, QA"
                        disabled={labelSubmitting || isSubmitting}
                        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-colors ${customLabelError
                          ? "border-red-400 focus:border-red-400"
                          : "border-slate-200 focus:border-[#28B8FA]"
                          }`}
                      />
                      {customLabelError && (
                        <p className="mt-2 ml-1 text-xs font-medium text-red-400">
                          {customLabelError}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {INLINE_LABEL_PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCustomLabelColor(color)}
                          disabled={labelSubmitting || isSubmitting}
                          className={`h-7 w-7 rounded-full transition-all hover:scale-110 ${customLabelColor === color
                            ? "ring-2 ring-slate-400 ring-offset-2"
                            : ""
                            }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}

                      <label
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                        title="Chọn màu tùy chỉnh"
                      >
                        <input
                          type="color"
                          value={customLabelColor}
                          onChange={(e) => setCustomLabelColor(e.target.value)}
                          disabled={labelSubmitting || isSubmitting}
                          className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                        Tùy chỉnh
                      </label>

                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-slate-900"
                        style={{ backgroundColor: customLabelColor }}
                      >
                        {customLabelName.trim() || "Xem trước"}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleCreateCustomLabelClick}
                        disabled={
                          labelSubmitting ||
                          isSubmitting ||
                          !customLabelName.trim()
                        }
                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {labelSubmitting ? "Đang tạo..." : "Tạo và gán"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {initialData && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Việc cần làm
                </label>
                {!isAddingChecklist ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingChecklist(true);
                      setNewChecklistTitle("Việc cần làm");
                    }}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-[#28B8FA] hover:text-[#0EA5E9] transition-colors bg-cyan-50 px-3 py-1.5 rounded-lg"
                  >
                    + Thêm việc cần làm
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="text-xs text-slate-900 font-semibold border border-[#28B8FA] rounded-lg px-3 py-1.5 outline-none bg-white min-w-[150px]"
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddChecklist(newChecklistTitle);
                          setIsAddingChecklist(false);
                        } else if (e.key === 'Escape') {
                          setIsAddingChecklist(false);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleAddChecklist(newChecklistTitle);
                        setIsAddingChecklist(false);
                      }}
                      className="text-xs font-bold text-white bg-[#28B8FA] px-3 py-1.5 rounded-lg hover:bg-[#0EA5E9] transition-colors"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingChecklist(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {checklistsLoading ? (
                <div className="text-sm text-slate-400 mb-6">Đang tải...</div>
              ) : (
                <div className="space-y-6 mb-6">
                  {checklists.map((checklist) => {
                    const totalItems = checklist.items.length;
                    const completedItems = checklist.items.filter((i) => i.is_completed).length;
                    const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

                    return (
                      <div key={checklist.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex justify-between items-center mb-3">
                          {editingChecklistId === checklist.id ? (
                            <input
                              type="text"
                              value={editingChecklistTitle}
                              onChange={(e) => setEditingChecklistTitle(e.target.value)}
                              autoFocus
                              onBlur={() => {
                                handleUpdateChecklistTitle(checklist.id, editingChecklistTitle);
                                setEditingChecklistId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateChecklistTitle(checklist.id, editingChecklistTitle);
                                  setEditingChecklistId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingChecklistId(null);
                                }
                              }}
                              className="text-sm font-bold text-slate-800 bg-white border border-[#28B8FA] rounded px-2 py-1 outline-none flex-1 mr-4"
                            />
                          ) : (
                            <h3
                              className="text-sm font-bold text-slate-800 hover:bg-slate-200/50 rounded px-2 py-1 cursor-pointer transition-colors flex-1 mr-4"
                              onClick={() => {
                                setEditingChecklistId(checklist.id);
                                setEditingChecklistTitle(checklist.title);
                              }}
                            >
                              {checklist.title}
                            </h3>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklist(checklist.id)}
                            className="text-xs text-slate-400 hover:text-red-500 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Xóa nhóm
                          </button>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 min-w-[32px]">{progress}%</span>
                            <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-[#28B8FA]'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-3 pl-1">
                          {checklist.items.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 group">
                              <input
                                type="checkbox"
                                checked={item.is_completed}
                                onChange={(e) => handleToggleItem(checklist.id, item.id, e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-[#28B8FA] focus:ring-[#28B8FA] transition-colors cursor-pointer"
                              />
                              <span className={`text-sm flex-1 break-words transition-all duration-300 ${item.is_completed ? 'line-through text-slate-400 opacity-60' : 'text-slate-700'}`}>
                                {item.content}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(checklist.id, item.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ml-2 p-1"
                                title="Xóa mục này"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4">
                          <input
                            type="text"
                            placeholder="Thêm mục..."
                            className="w-full text-sm text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#28B8FA] transition-colors placeholder:text-slate-300 shadow-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItem(checklist.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {initialData && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Bình luận
              </label>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {commentsLoading ? (
                  <div className="text-sm text-slate-400">
                    Đang tải bình luận...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-sm text-slate-400">Chưa có bình luận</div>
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
                              {isOwner
                                ? "You"
                                : `${comment.user_id.slice(0, 8)}...`}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatCommentDate(comment.created_at)}
                            </p>
                          </div>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => onDeleteComment(comment.id)}
                              disabled={commentSubmitting || isSubmitting}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              Xóa
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
                  placeholder="Viết bình luận..."
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
                    {commentSubmitting ? "Đang đăng..." : "Đăng bình luận"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {initialData && onDelete && (
              <button
                onClick={onDelete}
                disabled={isSubmitting}
                className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                title="Xóa nhiệm vụ"
              >
                <TrashIcon />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex-1 py-3 rounded-full bg-linear-to-r from-[#28B8FA] to-[#0EA5E9] text-white font-bold text-base hover:shadow-lg hover:shadow-cyan-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : initialData ? (
                "Lưu thay đổi"
              ) : (
                "Tạo nhiệm vụ"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
