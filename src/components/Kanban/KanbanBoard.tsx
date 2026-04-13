"use client";

import React, { useState, useRef, useEffect } from "react";
import isEqual from "fast-deep-equal";
import {
  DragDropContext,
  Droppable,
  DroppableProvided,
  DropResult,
} from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { PlusIcon } from "@/components/icons";
import { toast } from "sonner";
import { KanbanColumn as Column, KanbanTask, Label, BoardMember } from "@/types/project";
import { UserAvatar } from "@/components/UserAvatar";

interface KanbanBoardProps {
  projectId: number;
  columns: Column[];
  tasks: KanbanTask[];
  boardLabels?: Label[];
  boardMembers?: BoardMember[];
  filterUserId?: string | null;
  onFilterChange?: (userId: string | null) => void;
  filterLabelIds?: number[];
  onFilterLabelsChange?: (labelIds: number[]) => void;
  currentUserId?: string;
  isDraggingRef: React.MutableRefObject<boolean>;
  markLocalWrite: () => void;
  onColumnAdded: (column: Column) => void;
  onDataChange: () => Promise<void>;
  onTaskClick: (task: KanbanTask) => void;
  onAddTask: (columnId: number) => void;
  onUpdateColumn: (columnId: number, newTitle: string) => void;
  onDeleteColumn: (columnId: number) => void;
  onAddLabel?: (taskId: number, labelId: number) => Promise<void>;
  onRemoveLabel?: (taskId: number, labelId: number) => Promise<void>;
}

export function KanbanBoard({
  projectId,
  columns,
  tasks,
  boardLabels = [],
  boardMembers = [],
  filterUserId = null,
  onFilterChange,
  filterLabelIds = [],
  onFilterLabelsChange,
  currentUserId = "",
  isDraggingRef,
  markLocalWrite,
  onColumnAdded,
  onDataChange,
  onTaskClick,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  onAddLabel,
  onRemoveLabel,
}: KanbanBoardProps) {
  /* ── Hydration fix for Next.js ── */
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ── Local optimistic state ── */
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);
  const [localTasks, setLocalTasks] = useState<KanbanTask[]>(tasks);

  const lastSyncedColumnsRef = useRef(columns);
  const lastSyncedTasksRef = useRef(tasks);

  // Track if there are pending drags or API calls to avoid UI jumps
  const pendingTasksUpdatesRef = useRef(0);
  const pendingColumnsUpdatesRef = useRef(0);

  // When pending transitions from >0 to 0, we need to re-trigger the sync useEffect.
  // Refs don't cause re-renders, so we use a state-based "signal" to force re-evaluation.
  const [columnSyncTrigger, setColumnSyncTrigger] = useState(0);
  const [taskSyncTrigger, setTaskSyncTrigger] = useState(0);

  // Sync with parent state only when actual data changes (ignore reference changes during optimistic updates)
  useEffect(() => {
    if (pendingColumnsUpdatesRef.current === 0) {
      if (!isEqual(columns, lastSyncedColumnsRef.current)) {
        setLocalColumns(columns);
        lastSyncedColumnsRef.current = columns;
      }
    }
  }, [columns, columnSyncTrigger]);

  useEffect(() => {
    if (pendingTasksUpdatesRef.current === 0) {
      if (!isEqual(tasks, lastSyncedTasksRef.current)) {
        setLocalTasks(tasks);
        lastSyncedTasksRef.current = tasks;
      }
    }
  }, [tasks, taskSyncTrigger]);

  // Add column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const newColInputRef = useRef<HTMLInputElement>(null);

  // Label filter popover state
  const [showLabelFilterPopover, setShowLabelFilterPopover] = useState(false);
  const labelFilterPopoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showLabelFilterPopover) return;
    const handler = (e: MouseEvent) => {
      if (labelFilterPopoverRef.current && !labelFilterPopoverRef.current.contains(e.target as Node)) {
        setShowLabelFilterPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLabelFilterPopover]);

  useEffect(() => {
    if (isAddingColumn && newColInputRef.current) {
      newColInputRef.current.focus();
    }
  }, [isAddingColumn]);

  // Ref timer for debouncing updates
  const debounceTaskTimerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceColumnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragCooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Release isDraggingRef with a cooldown so Realtime events from our OWN
  // DB writes are ignored (they arrive within ~1s of the commit).
  const releaseDragLock = () => {
    if (dragCooldownTimerRef.current) {
      clearTimeout(dragCooldownTimerRef.current);
    }
    dragCooldownTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      dragCooldownTimerRef.current = null;
    }, 1500); // > Realtime debounce (500ms) + network jitter
  };

  // Cleanup timers khi component bị hủy (Unmount)
  useEffect(() => {
    return () => {
      if (debounceTaskTimerRef.current) {
        clearTimeout(debounceTaskTimerRef.current);
      }
      if (debounceColumnTimerRef.current) {
        clearTimeout(debounceColumnTimerRef.current);
      }
      if (dragCooldownTimerRef.current) {
        clearTimeout(dragCooldownTimerRef.current);
      }
    };
  }, []);
  /* ══════════════════════════════════════════════════════════════
   *  onDragEnd — Optimistic UI Update
   *
   *  Flow:
   *  1. Backup current state (deep clone)
   *  2. Calculate new state
   *  3. setLocalColumns / setLocalTasks IMMEDIATELY (no await!)
   *  4. Fire API calls in background (.then / .catch)
   *  5. On error → rollback to backup + toast.error
   * ══════════════════════════════════════════════════════════════ */
  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;

    // Dropped outside any droppable
    if (!destination) return;

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // ── Step 1: Backup state (deep clone) ──
    const previousColumns = localColumns.map((col) => ({ ...col }));
    const previousTasks = localTasks.map((t) => ({
      ...t,
      labels: [...(t.labels || [])],
    }));

    /* ══════════════════════════════════════════════
     *  Case 1: Kéo đổi vị trí CỘT
     * ══════════════════════════════════════════════ */
    if (type === "COLUMN") {
      const reordered = Array.from(localColumns);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // ── Step 2: Calculate new positions ──
      const updatedColumns = reordered.map((col, i) => ({
        ...col,
        position: i,
      }));

      // ── Step 3: Update UI IMMEDIATELY ──
      setLocalColumns(updatedColumns);

      // ── Step 4: Debounce API Call & Bulk Update ──
      // Always manage the timer first to avoid orphaned timers
      if (debounceColumnTimerRef.current) {
        clearTimeout(debounceColumnTimerRef.current);
      } else {
        pendingColumnsUpdatesRef.current++;
        isDraggingRef.current = true;
      }

      debounceColumnTimerRef.current = setTimeout(() => {
        debounceColumnTimerRef.current = null;

        // Dirty Checking: only send changes that actually differ from server state
        const oldColumnsMap = new Map(columns.map((c) => [c.id, c]));
        const changedColumns = updatedColumns.filter((newCol) => {
          const oldCol = oldColumnsMap.get(newCol.id);
          if (!oldCol) return false;
          return oldCol.position !== newCol.position;
        });

        if (changedColumns.length === 0) {
          // Nothing actually changed vs server — just release the lock
          pendingColumnsUpdatesRef.current--;
          if (pendingColumnsUpdatesRef.current === 0) {
            releaseDragLock();
            setColumnSyncTrigger((c) => c + 1);
          }
          return;
        }

        markLocalWrite();
        fetch("/api/kanban/columns", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            changedColumns.map((c) => ({
              id: c.id,
              position: c.position,
            })),
          ),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error();
          })
          .catch(() => {
            setLocalColumns(previousColumns);
            toast.error("Lưu vị trí cột thất bại, đang hoàn tác!");
          })
          .finally(() => {
            pendingColumnsUpdatesRef.current--;
            if (pendingColumnsUpdatesRef.current === 0) {
              releaseDragLock();
              setColumnSyncTrigger((c) => c + 1);
            }
          });
      }, 500);

      return;
    }

    /* ══════════════════════════════════════════════
     *  Case 2 & 3: Kéo TASK
     * ══════════════════════════════════════════════ */
    if (type === "TASK") {
      const sourceColId = Number(source.droppableId.replace("column-", ""));
      const destColId = Number(destination.droppableId.replace("column-", ""));

      const allTasks = localTasks.map((t) => ({
        ...t,
        labels: [...(t.labels || [])],
      }));

      // Get tasks in source column (sorted by position)
      const sourceTasks = allTasks
        .filter((t) => t.column_id === sourceColId)
        .sort((a, b) => a.position - b.position);

      // Remove the dragged task from source
      const [movedTask] = sourceTasks.splice(source.index, 1);
      if (!movedTask) return;

      let newTasks = [];

      /* ─────────────────────────────────────
       *  Case 2: Kéo Task TRONG CÙNG một Cột
       * ───────────────────────────────────── */
      if (sourceColId === destColId) {
        // Insert at new position
        sourceTasks.splice(destination.index, 0, {
          ...movedTask,
          column_id: destColId,
        });

        // Recalculate positions
        const updatedSourceTasks = sourceTasks.map((t, i) => ({
          ...t,
          position: i,
        }));

        // Merge into newTasks
        const updatedTaskIds = new Set(updatedSourceTasks.map((t) => t.id));
        newTasks = [
          ...allTasks.filter((t) => !updatedTaskIds.has(t.id)),
          ...updatedSourceTasks,
        ];
      } else {
        /* ─────────────────────────────────────
         *  Case 3: Kéo Task SANG CỘT KHÁC
         * ───────────────────────────────────── */
        const destTasks = allTasks
          .filter((t) => t.column_id === destColId)
          .sort((a, b) => a.position - b.position);

        // Insert dragged task into destination at new index
        destTasks.splice(destination.index, 0, {
          ...movedTask,
          column_id: destColId,
        });

        // Recalculate positions for both columns
        const updatedSourceTasks = sourceTasks.map((t, i) => ({
          ...t,
          position: i,
        }));
        const updatedDestTasks = destTasks.map((t, i) => ({
          ...t,
          position: i,
        }));

        // Merge into newTasks
        const movedAndUpdated = [...updatedSourceTasks, ...updatedDestTasks];
        const movedIds = new Set(movedAndUpdated.map((t) => t.id));
        newTasks = [
          ...allTasks.filter((t) => !movedIds.has(t.id)),
          ...movedAndUpdated,
        ];
      }

      // ── Step 3: Update UI IMMEDIATELY ──
      setLocalTasks(newTasks);

      // ── Step 5: Debounce API Call & Bulk Update ──
      // Always manage the timer first to avoid orphaned timers
      if (debounceTaskTimerRef.current) {
        clearTimeout(debounceTaskTimerRef.current);
      } else {
        pendingTasksUpdatesRef.current++;
        isDraggingRef.current = true;
      }

      debounceTaskTimerRef.current = setTimeout(() => {
        debounceTaskTimerRef.current = null;

        // Dirty Checking: only send changes that actually differ from server state
        const oldTasksMap = new Map(tasks.map((t) => [t.id, t]));
        const changedTasks = newTasks.filter((newTask) => {
          const oldTask = oldTasksMap.get(newTask.id);
          if (!oldTask) return false;
          return (
            oldTask.column_id !== newTask.column_id ||
            oldTask.position !== newTask.position
          );
        });

        if (changedTasks.length === 0) {
          pendingTasksUpdatesRef.current--;
          if (pendingTasksUpdatesRef.current === 0) {
            releaseDragLock();
            setTaskSyncTrigger((c) => c + 1);
          }
          return;
        }

        markLocalWrite();
        fetch("/api/kanban/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            changedTasks.map((t) => ({
              id: t.id,
              column_id: t.column_id,
              position: t.position,
            })),
          ),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error();
          })
          .catch(() => {
            setLocalTasks(previousTasks);
            toast.error("Lưu vị trí tác vụ thất bại, đang hoàn tác!");
          })
          .finally(() => {
            pendingTasksUpdatesRef.current--;
            if (pendingTasksUpdatesRef.current === 0) {
              releaseDragLock();
              setTaskSyncTrigger((c) => c + 1);
            }
          });
      }, 500);
    }
  };

  /* ── Add column ── */
  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    const nextPos =
      localColumns.length > 0
        ? Math.max(...localColumns.map((c) => c.position)) + 1
        : 0;
    try {
      markLocalWrite();
      const res = await fetch("/api/kanban/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: newColumnTitle.trim(),
          position: nextPos,
        }),
      });

      if (!res.ok) throw new Error("Failed to create column");

      const newColumn = await res.json();
      toast.success("Column added");
      setNewColumnTitle("");
      setIsAddingColumn(false);

      // Cập nhật state trực tiếp từ kết quả trả về, KHÔNG fetch lại data
      onColumnAdded(newColumn);
    } catch {
      toast.error("Failed to add column");
    }
  };

  // Don't render on server to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div
        className="h-full w-full overflow-x-auto flex gap-6 pb-2"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Placeholder skeleton */}
        {columns.map((col) => (
          <div
            key={col.id}
            className="w-80 shrink-0 flex flex-col gap-4 p-2 rounded-2xl bg-slate-50/80 animate-pulse"
          >
            <div className="h-5 bg-slate-200 rounded w-1/2 mx-2"></div>
            <div className="h-24 bg-slate-100 rounded-2xl"></div>
          </div>
        ))}
      </div>
    );
  }

  // Filter tasks by assignee and labels (client-side)
  let filteredTasks = localTasks;

  if (filterUserId) {
    filteredTasks = filteredTasks.filter((t) =>
      t.assignees?.some((a) => a.user_id === filterUserId)
    );
  }

  if (filterLabelIds && filterLabelIds.length > 0) {
    filteredTasks = filteredTasks.filter((t) =>
      t.labels?.some((l) => filterLabelIds.includes(l.id))
    );
  }

  const isFiltering = !!filterUserId || filterLabelIds.length > 0;

  return (
    <>
      {/* ── Assignee & Label Filters Bar ── */}
      {(boardMembers.length > 0 || boardLabels.length > 0) && (
        <div className="flex items-center gap-2 px-1 pb-3 flex-wrap">
          {boardMembers.length > 0 && (
            <>
              {/* My Tasks button */}
              <button
                onClick={() =>
                  onFilterChange?.(
                    filterUserId === currentUserId ? null : currentUserId
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${filterUserId === currentUserId
                    ? "bg-[#28B8FA] border-[#28B8FA] text-white shadow-md shadow-cyan-200"
                    : "bg-white border-slate-200 text-slate-500 hover:border-[#28B8FA] hover:text-[#28B8FA]"
                  }`}
                title="Chỉ hiện nhiệm vụ của tôi"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Nhiệm vụ của tôi
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-slate-200" />

              {/* Member avatars */}
              {boardMembers.map((member) => {
                const isActive = filterUserId === member.user_id;
                return (
                  <button
                    key={member.user_id}
                    onClick={() =>
                      onFilterChange?.(
                        isActive ? null : member.user_id
                      )
                    }
                    title={`Lọc theo: ${member.display_name}`}
                    className={`relative rounded-full transition-all focus:outline-none ${isActive
                        ? "ring-3 ring-[#28B8FA] ring-offset-2 scale-110"
                        : "ring-2 ring-transparent hover:ring-[#28B8FA]/40 hover:ring-offset-1 hover:scale-105"
                      }`}
                  >
                    <UserAvatar
                      avatarUrl={member.avatar_url}
                      displayName={member.display_name}
                      className="w-8 h-8"
                      fallbackClassName="bg-[#EAF7FF] text-[#0284C7]"
                    />
                    {isActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#28B8FA] rounded-full flex items-center justify-center">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none">
                          <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Separator if both exist */}
          {boardMembers.length > 0 && boardLabels.length > 0 && (
            <div className="w-px h-6 bg-slate-200 mx-1" />
          )}

          {/* Label Filters Popover Button */}
          {boardLabels.length > 0 && (
            <div className="relative" ref={labelFilterPopoverRef}>
              <button
                onClick={() => setShowLabelFilterPopover((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${filterLabelIds.length > 0 || showLabelFilterPopover
                    ? "bg-[#28B8FA] border-[#28B8FA] text-white shadow-md shadow-cyan-200"
                    : "bg-white border-slate-200 text-slate-500 hover:border-[#28B8FA] hover:text-[#28B8FA]"
                  }`}
                title="Lọc theo nhãn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                Nhãn {filterLabelIds.length > 0 && `(${filterLabelIds.length})`}
              </button>

              {/* Popover dropdown */}
              {showLabelFilterPopover && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 pb-2 border-b border-slate-100 mb-2">Lọc theo nhãn màu</p>
                  <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                    {boardLabels.map((label) => {
                      const isActive = filterLabelIds.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => {
                            if (!onFilterLabelsChange) return;
                            if (isActive) {
                              onFilterLabelsChange(filterLabelIds.filter(id => id !== label.id));
                            } else {
                              onFilterLabelsChange([...filterLabelIds, label.id]);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-colors ${isActive ? "bg-[#F0F9FF] hover:bg-[#E0F2FE]" : "hover:bg-slate-50"}`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                          />
                          <span className={`text-xs flex-1 text-left truncate ${isActive ? "font-bold text-[#0284C7]" : "font-semibold text-slate-700"}`}>
                            {label.name}
                          </span>
                          {/* Checkmark style */}
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? "bg-[#28B8FA] border-[#28B8FA]" : "bg-white border-slate-200"}`}>
                            {isActive && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clear filter button */}
          {(filterUserId || filterLabelIds.length > 0) && (
            <button
              onClick={() => {
                onFilterChange?.(null);
                onFilterLabelsChange?.([]);
              }}
              className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-200 transition-all"
              title="Xóa bộ lọc"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Tất cả
            </button>
          )}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal" isDropDisabled={isFiltering}>
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="h-full w-full overflow-x-auto flex gap-6 pb-2"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            >
              {localColumns.map((col, index) => {
                const columnTasks = filteredTasks
                  .filter((t) => t.column_id === col.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    colIndex={index}
                    tasks={columnTasks}
                    onTaskClick={onTaskClick}
                    onAddTask={onAddTask}
                    onUpdateColumn={onUpdateColumn}
                    onDeleteColumn={onDeleteColumn}
                    boardLabels={boardLabels}
                    onAddLabel={onAddLabel}
                    onRemoveLabel={onRemoveLabel}
                    isDragDisabled={isFiltering}
                  />
                );
              })}
              {provided.placeholder}

              {/* Add Column Card */}
              {isAddingColumn ? (
                <div className="w-80 shrink-0 flex flex-col gap-3 bg-slate-50/80 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <input
                    ref={newColInputRef}
                    type="text"
                    placeholder="Column name..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") {
                        setIsAddingColumn(false);
                        setNewColumnTitle("");
                      }
                    }}
                    className="w-full px-4 py-3 border text-slate-800 border-slate-200 rounded-xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="flex-1 py-2 rounded-xl bg-[#28B8FA] text-white font-bold text-sm hover:bg-[#0EA5E9] transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnTitle("");
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-80 shrink-0 min-h-30 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm group-hover:scale-110 transition-transform">
                    <PlusIcon />
                  </div>
                  Add Column
                </button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
}
