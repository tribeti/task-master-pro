"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  created_at: string;
  isPending?: boolean;
}

export interface Checklist {
  id: string;
  task_id: number;
  title: string;
  created_at: string;
  items: ChecklistItem[];
  isPending?: boolean;
}

interface TaskChecklistProps {
  taskId: number;
  isSubmitting: boolean;
}

export function TaskChecklist({ taskId, isSubmitting }: TaskChecklistProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistsLoading, setChecklistsLoading] = useState(false);
  const [checklistsError, setChecklistsError] = useState<string | null>(null);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("Việc cần làm");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [supabase] = useState(() => createClient());

  // Reset local UI state when switching task
  useEffect(() => {
    setIsAddingChecklist(false);
    setNewChecklistTitle("Việc cần làm");
    setEditingChecklistId(null);
    setEditingChecklistTitle("");
  }, [taskId]);

  // Fetch Checklists
  useEffect(() => {
    let ignore = false;
    const fetchChecklists = async () => {
      setChecklistsLoading(true);
      setChecklistsError(null);

      try {
        const { data, error } = await supabase
          .from("checklists")
          .select("*, items:checklist_items(*)")
          .eq("task_id", taskId)
          .order("created_at", { ascending: true })
          .order("created_at", { foreignTable: "checklist_items", ascending: true });

        if (error) throw error;

        if (!ignore) {
          setChecklists((data as Checklist[]) || []);
        }
      } catch (err: any) {
        console.error("Error fetching checklists:", err);
        if (!ignore) {
          setChecklistsError(err.message || "Không thể tải danh sách công việc");
          setChecklists([]);
        }
      } finally {
        if (!ignore) {
          setChecklistsLoading(false);
        }
      }
    };

    fetchChecklists();

    return () => {
      ignore = true;
    };
  }, [taskId, supabase]);

  useEffect(() => {
    if (checklistsError) {
      const timer = setTimeout(() => {
        setChecklistsError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [checklistsError]);

  const handleAddChecklist = async (title: string = "Việc cần làm") => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const tempId = crypto.randomUUID();
    const newChecklist: Checklist = {
      id: tempId,
      task_id: taskId,
      title: trimmedTitle,
      created_at: new Date().toISOString(),
      items: [],
      isPending: true,
    };
    setChecklists((prev) => [...prev, newChecklist]);

    try {
      const { data, error } = await supabase
        .from("checklists")
        .insert({ task_id: taskId, title: trimmedTitle })
        .select()
        .single();

      if (data && !error) {
        setChecklists((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...data, items: [], isPending: false } : c
          )
        );
      } else {
        if (error) console.error("Error adding checklist:", error);
        setChecklists((prev) => prev.filter((c) => c.id !== tempId));
      }
    } catch (err) {
      console.error("Exception adding checklist:", err);
      setChecklists((prev) => prev.filter((c) => c.id !== tempId));
    }
  };

  const handleUpdateChecklistTitle = async (id: string, newTitle: string) => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) return;

    const checklist = checklists.find((c) => c.id === id);
    if (!checklist || checklist.isPending) return;

    const oldTitle = checklist.title;
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmedTitle } : c))
    );

    const { error } = await supabase
      .from("checklists")
      .update({ title: trimmedTitle })
      .eq("id", id);
    if (error) {
      console.error("Error updating checklist title:", error);
      setChecklistsError("Lỗi: Không thể đổi tên. Đã hoàn tác.");
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: oldTitle } : c))
      );
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const checklist = checklists.find((c) => c.id === id);
    if (!checklist || checklist.isPending) return;

    const oldChecklist = { ...checklist };
    setChecklists((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("checklists").delete().eq("id", id);
    if (error) {
      console.error("Error deleting checklist:", error);
      setChecklistsError("Lỗi: Không thể xóa nhóm việc. Đã hoàn tác.");
      setChecklists((prev) =>
        [...prev, oldChecklist].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        )
      );
    }
  };

  const handleAddItem = async (checklistId: string, content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist || checklist.isPending) return;

    const tempId = crypto.randomUUID();
    const newItem: ChecklistItem = {
      id: tempId,
      checklist_id: checklistId,
      content: trimmedContent,
      is_completed: false,
      created_at: new Date().toISOString(),
      isPending: true,
    };

    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId ? { ...c, items: [...c.items, newItem] } : c
      )
    );

    try {
      const { data, error } = await supabase
        .from("checklist_items")
        .insert({ checklist_id: checklistId, content: trimmedContent })
        .select()
        .single();

      if (data && !error) {
        setChecklists((prev) =>
          prev.map((c) =>
            c.id === checklistId
              ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === tempId ? { ...data, isPending: false } : i
                ),
              }
              : c
          )
        );
      } else {
        if (error) console.error("Error adding checklist item:", error);
        setChecklists((prev) =>
          prev.map((c) =>
            c.id === checklistId
              ? {
                ...c,
                items: c.items.filter((i) => i.id !== tempId),
              }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Exception adding checklist item:", err);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
              ...c,
              items: c.items.filter((i) => i.id !== tempId),
            }
            : c
        )
      );
    }
  };

  const handleToggleItem = async (
    checklistId: string,
    itemId: string,
    isCompleted: boolean
  ) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist || checklist.isPending) return;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item || item.isPending) return;

    const oldStatus = item.is_completed;
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? {
            ...c,
            items: c.items.map((i) =>
              i.id === itemId ? { ...i, is_completed: isCompleted } : i
            ),
          }
          : c
      )
    );

    const { error } = await supabase
      .from("checklist_items")
      .update({ is_completed: isCompleted })
      .eq("id", itemId);
    if (error) {
      console.error("Error toggling item:", error);
      setChecklistsError("Lỗi: Không thể cập nhật trạng thái mục. Đã hoàn tác.");
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
              ...c,
              items: c.items.map((i) =>
                i.id === itemId ? { ...i, is_completed: oldStatus } : i
              ),
            }
            : c
        )
      );
    }
  };

  const handleDeleteItem = async (checklistId: string, itemId: string) => {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist || checklist.isPending) return;

    const item = checklist.items.find((i) => i.id === itemId);
    if (!item || item.isPending) return;

    const oldItem = { ...item };
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      )
    );

    const { error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", itemId);
    if (error) {
      console.error("Error deleting item:", error);
      setChecklistsError("Lỗi: Không thể xóa mục. Đã hoàn tác.");
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId
            ? {
              ...c,
              items: [...c.items, oldItem].sort((a, b) =>
                a.created_at.localeCompare(b.created_at)
              ),
            }
            : c
        )
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Hệ thống Checklist
          </label>
          {!isAddingChecklist && (
            <button
              type="button"
              onClick={() => {
                setIsAddingChecklist(true);
                setNewChecklistTitle("Việc cần làm");
              }}
              disabled={isSubmitting}
              className="text-[10px] font-bold text-slate-500 hover:text-[#28B8FA] bg-slate-100 hover:bg-[#EAF7FF] px-2 py-1 rounded-lg transition-colors flex items-center gap-1 uppercase"
            >
              + Thêm Checklist
            </button>
          )}
        </div>
        {isAddingChecklist && (
          <div className="flex items-center gap-2 relative z-10 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <input
              type="text"
              className="text-xs text-slate-900 font-semibold border border-[#28B8FA] rounded-lg px-3 py-1.5 outline-none bg-white min-w-[150px]"
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddChecklist(newChecklistTitle);
                  setIsAddingChecklist(false);
                } else if (e.key === "Escape") {
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

      {checklistsError && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl mb-4 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <svg
            className="w-4 h-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="flex-1">{checklistsError}</span>
        </div>
      )}

      {checklistsLoading ? (
        <div className="text-sm text-slate-400 italic">Đang tải checklist...</div>
      ) : checklists.length === 0 ? (
        <div className="text-sm text-slate-400 italic">
          Chưa có checklist nào. Thêm một checklist từ bảng thao tác.
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.map((checklist) => {
            const totalItems = checklist.items.length;
            const completedItems = checklist.items.filter(
              (i) => i.is_completed
            ).length;
            const progress =
              totalItems === 0
                ? 0
                : Math.round((completedItems / totalItems) * 100);

            return (
              <div
                key={checklist.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative overflow-hidden group/checklist"
              >
                <div className="flex justify-between items-center mb-3">
                  {editingChecklistId === checklist.id ? (
                    <input
                      type="text"
                      value={editingChecklistTitle}
                      onChange={(e) => setEditingChecklistTitle(e.target.value)}
                      autoFocus
                      onBlur={() => {
                        if (
                          editingChecklistTitle.trim() &&
                          editingChecklistTitle !== checklist.title
                        ) {
                          handleUpdateChecklistTitle(
                            checklist.id,
                            editingChecklistTitle
                          );
                        }
                        setEditingChecklistId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        } else if (e.key === "Escape") {
                          setEditingChecklistId(null);
                        }
                      }}
                      className="text-sm font-bold text-slate-800 bg-white border border-[#28B8FA] rounded px-2 py-1 outline-none flex-1 mr-4"
                    />
                  ) : (
                    <h3
                      className={`text-sm font-bold transition-colors flex-1 mr-4 rounded px-2 py-1 -ml-2 ${checklist.isPending
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-slate-800 hover:bg-slate-200/50 cursor-pointer"
                        }`}
                      onClick={() => {
                        if (checklist.isPending) return;
                        setEditingChecklistId(checklist.id);
                        setEditingChecklistTitle(checklist.title);
                      }}
                    >
                      {checklist.title}{" "}
                      {checklist.isPending && (
                        <span className="text-[10px] font-normal italic ml-2">
                          (Đang tạo...)
                        </span>
                      )}
                    </h3>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    disabled={checklist.isPending}
                    className="text-[10px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-50 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    XÓA NHÓM
                  </button>
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 min-w-[32px]">
                      {progress}%
                    </span>
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? "bg-green-500" : "bg-[#28B8FA]"
                          }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 group ${item.isPending ? "opacity-50" : ""
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        disabled={item.isPending || checklist.isPending}
                        onChange={(e) =>
                          handleToggleItem(checklist.id, item.id, e.target.checked)
                        }
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#28B8FA] focus:ring-[#28B8FA] transition-colors cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                      />
                      <span
                        className={`text-sm font-medium flex-1 break-words transition-all duration-300 ${item.is_completed
                          ? "line-through text-slate-400 opacity-60"
                          : "text-slate-700"
                          }`}
                      >
                        {item.content}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        disabled={item.isPending || checklist.isPending}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all ml-2 p-1 disabled:cursor-not-allowed"
                        title="Xóa mục này"
                      >
                        {item.isPending ? "..." : "✕"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <input
                    type="text"
                    placeholder={
                      checklist.isPending ? "Vui lòng đợi..." : "Thêm mục..."
                    }
                    disabled={checklist.isPending}
                    className="w-full text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-[#28B8FA] transition-colors placeholder:text-slate-400 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        handleAddItem(checklist.id, e.currentTarget.value);
                        e.currentTarget.value = "";
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
  );
}
