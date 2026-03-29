"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    DragDropContext,
    Droppable,
    DroppableProvided,
    DropResult,
} from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { PlusIcon } from "@/components/icons";
import {
    updateTaskAction,
    createColumnAction,
    updateColumnAction,
    bulkUpdateTasksAction,
} from "@/app/actions/kanban.actions";
import { toast } from "sonner";
import {
    KanbanColumn as Column,
    KanbanTask,
    Label,
} from "@/types/project";

interface KanbanBoardProps {
    projectId: number;
    columns: Column[];
    tasks: KanbanTask[];
    boardLabels?: Label[];
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

    // Sync with parent state only when actual data changes (ignore reference changes during optimistic updates)
    useEffect(() => {
        if (JSON.stringify(columns) !== JSON.stringify(lastSyncedColumnsRef.current)) {
            setLocalColumns(columns);
            lastSyncedColumnsRef.current = columns;
        }
    }, [columns]);

    useEffect(() => {
        if (pendingTasksUpdatesRef.current === 0) {
            if (JSON.stringify(tasks) !== JSON.stringify(lastSyncedTasksRef.current)) {
                setLocalTasks(tasks);
                lastSyncedTasksRef.current = tasks;
            }
        }
    }, [tasks]);

    // Add column state
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const newColInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAddingColumn && newColInputRef.current) {
            newColInputRef.current.focus();
        }
    }, [isAddingColumn]);

    // Ref timer for debouncing task updates
    const debounceTaskTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        const previousTasks = localTasks.map((t) => ({ ...t, labels: [...(t.labels || [])] }));

        /* ══════════════════════════════════════════════
         *  Case 1: Kéo đổi vị trí CỘT
         * ══════════════════════════════════════════════ */
        if (type === "COLUMN") {
            const reordered = Array.from(localColumns);
            const [moved] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, moved);

            // ── Step 2: Calculate new positions ──
            const updatedColumns = reordered.map((col, i) => ({ ...col, position: i }));

            // ── Step 3: Update UI IMMEDIATELY ──
            setLocalColumns(updatedColumns);

            // ── Step 4: Fire API in background (non-blocking) ──
            Promise.all(
                updatedColumns.map((col) =>
                    updateColumnAction(col.id, { position: col.position }),
                ),
            )
                .then(() => {
                    // Sync silently with server after success
                    onDataChange();
                })
                .catch(() => {
                    // ── Step 5: Rollback on error ──
                    setLocalColumns(previousColumns);
                    toast.error("Lưu vị trí thất bại, đang hoàn tác!");
                });

            return;
        }

        /* ══════════════════════════════════════════════
         *  Case 2 & 3: Kéo TASK
         * ══════════════════════════════════════════════ */
        if (type === "TASK") {
            const sourceColId = Number(source.droppableId.replace("column-", ""));
            const destColId = Number(destination.droppableId.replace("column-", ""));

            const allTasks = localTasks.map((t) => ({ ...t, labels: [...(t.labels || [])] }));

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

            // ── Step 4: Dirty Checking ──
            const changedTasks = newTasks.filter((newTask) => {
                // Compare with original props (tasks) representing the server state
                const oldTask = tasks.find((t) => t.id === newTask.id);
                if (!oldTask) return false;
                return (
                    oldTask.column_id !== newTask.column_id ||
                    oldTask.position !== newTask.position
                );
            });

            if (changedTasks.length === 0) return;

            const updates = changedTasks.map((t) => ({
                id: t.id,
                column_id: t.column_id,
                position: t.position,
            }));

            // ── Step 5: Debounce API Call & Bulk Update ──
            if (debounceTaskTimerRef.current) {
                clearTimeout(debounceTaskTimerRef.current);
            } else {
                // Only increment if we are starting a fresh debounce cycle
                pendingTasksUpdatesRef.current++;
            }

            debounceTaskTimerRef.current = setTimeout(() => {
                // clear timer ref so a new drag during API execution will increment pending
                debounceTaskTimerRef.current = null;
                bulkUpdateTasksAction(updates)
                    .then(() => {
                        return onDataChange();
                    })
                    .catch(() => {
                        // Rollback to last known server state (props)
                        setLocalTasks(tasks);
                        toast.error("Lưu vị trí tác vụ thất bại, đang hoàn tác!");
                    })
                    .finally(() => {
                        pendingTasksUpdatesRef.current--;
                        // If it reaches 0 and the latest tasks prop is different, we can manually sync
                        if (
                            pendingTasksUpdatesRef.current === 0 &&
                            JSON.stringify(tasks) !== JSON.stringify(lastSyncedTasksRef.current)
                        ) {
                            setLocalTasks(tasks);
                            lastSyncedTasksRef.current = tasks;
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
            await createColumnAction(projectId, newColumnTitle.trim(), nextPos);
            toast.success("Column added");
            setNewColumnTitle("");
            setIsAddingColumn(false);
            await onDataChange();
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

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board" type="COLUMN" direction="horizontal">
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
                            const columnTasks = localTasks
                                .filter((t) => t.column_id === col.id)
                                .sort((a, b) => a.position - b.position);

                            const isToDoColumn = col.title.toLowerCase() === "to do";

                            return (
                                <KanbanColumn
                                    key={col.id}
                                    column={col}
                                    colIndex={index}
                                    tasks={columnTasks}
                                    isToDoColumn={isToDoColumn}
                                    onTaskClick={onTaskClick}
                                    onAddTask={onAddTask}
                                    onUpdateColumn={onUpdateColumn}
                                    onDeleteColumn={onDeleteColumn}
                                    boardLabels={boardLabels}
                                    onAddLabel={onAddLabel}
                                    onRemoveLabel={onRemoveLabel}
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
    );
}