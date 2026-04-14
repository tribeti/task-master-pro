"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Draggable,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { PlusIcon } from "@/components/icons";
import {
  KanbanColumn as ColumnType,
  KanbanTask as KanbanTaskType,
  Label,
} from "@/types/project";
import { KanbanTask } from "./KanbanTask";
import { toast } from "sonner";

interface KanbanColumnProps {
  column: ColumnType;
  colIndex: number;
  tasks: KanbanTaskType[];
  onTaskClick: (task: KanbanTaskType) => void;
  onAddTask: (columnId: number) => void;
  onUpdateColumn: (columnId: number, newTitle: string) => void;
  onDeleteColumn: (columnId: number) => void;
  boardLabels?: Label[];
  onAddLabel?: (taskId: number, labelId: number) => Promise<void>;
  onRemoveLabel?: (taskId: number, labelId: number) => Promise<void>;
  isDragDisabled?: boolean;
  searchMatchedTaskIds?: Set<number> | null;
}

// All styles are visually distinct (no "plain/colorless" entry).
// Using 4 colors guarantees every consecutive column gets a unique color.
const COLUMN_STYLES = [
  {
    text: "text-[#28B8FA]",
    badge: "bg-[#EAF7FF] text-[#28B8FA]",
    border: "border-l-2 border-[#28B8FA]",
    dot: "bg-[#28B8FA]",
  },
  {
    text: "text-[#34D399]",
    badge: "bg-[#D1FAE5] text-[#34D399]",
    border: "border-l-2 border-[#34D399]",
    dot: "bg-[#34D399]",
  },
  {
    text: "text-[#A78BFA]",
    badge: "bg-[#EDE9FE] text-[#A78BFA]",
    border: "border-l-2 border-[#A78BFA]",
    dot: "bg-[#A78BFA]",
  },
  {
    text: "text-[#F472B6]",
    badge: "bg-[#FCE7F3] text-[#F472B6]",
    border: "border-l-2 border-[#F472B6]",
    dot: "bg-[#F472B6]",
  },
  {
    text: "text-[#F59E0B]",
    badge: "bg-[#FEF3C7] text-[#F59E0B]",
    border: "border-l-2 border-[#F59E0B]",
    dot: "bg-[#F59E0B]",
  },
  {
    text: "text-[#EF4444]",
    badge: "bg-[#FEE2E2] text-[#EF4444]",
    border: "border-l-2 border-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
];

export function KanbanColumn({
  column,
  colIndex,
  tasks,
  onTaskClick,
  onAddTask,
  onUpdateColumn,
  onDeleteColumn,
  boardLabels = [],
  onAddLabel,
  onRemoveLabel,
  isDragDisabled = false,
  searchMatchedTaskIds,
}: KanbanColumnProps) {
  // Prime multiplier spreads consecutive IDs across different colors.
  // e.g. id=10→4, id=11→1, id=12→4... wait, let's verify:
  // With 6 styles: (id * 7) % 6 → 10→4, 11→5, 12→0, 13→1, 14→2, 15→3 ✅ all different!
  const st = COLUMN_STYLES[(column.id * 7) % COLUMN_STYLES.length];

  /* ── Inline edit state ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      onUpdateColumn(column.id, trimmed);
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    if (tasks.length > 0) {
      toast.error(
        "Không thể xóa cột khi vẫn còn công việc. Vui lòng di chuyển hoặc xóa hết công việc trước.",
      );
      return;
    }
    onDeleteColumn(column.id);
  };

  return (
    <Draggable draggableId={`column-${column.id}`} index={colIndex}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-80 shrink-0 flex flex-col gap-4 p-2 rounded-2xl transition-shadow duration-200 max-h-[calc(100vh-16rem)] ${snapshot.isDragging
            ? "bg-white/90 shadow-xl ring-2 ring-[#28B8FA]/20"
            : "bg-slate-50/80"
            } ${st.border}`}
        >
          {/* Column Header */}
          <div
            {...provided.dragHandleProps}
            className={`font-bold text-xs tracking-widest uppercase flex items-center justify-between px-2 group ${st.text}`}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditTitle(column.title);
                    setIsEditing(false);
                  }
                }}
                className="bg-white/80 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#28B8FA] w-full mr-2"
              />
            ) : (
              <span
                className="flex items-center gap-2 cursor-pointer"
                onDoubleClick={() => setIsEditing(true)}
              >
                {colIndex > 0 && (
                  <div className={`w-2 h-2 rounded-full ${st.dot}`}></div>
                )}
                {column.title}
              </span>
            )}

            <div className="flex items-center gap-1">
              <span className={`px-2 rounded-md ${st.badge}`}>
                {tasks.length}
              </span>

              {/* Edit button */}
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                title="Rename column"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>

              {/* Delete button */}
              <button
                onClick={handleDeleteClick}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                title="Delete column"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" x2="10" y1="11" y2="17" />
                  <line x1="14" x2="14" y1="11" y2="17" />
                </svg>
              </button>
            </div>
          </div>{" "}
          {/* Tasks Droppable Zone */}
          <Droppable droppableId={`column-${column.id}`} type="TASK" isDropDisabled={isDragDisabled}>
            {(
              droppableProvided: DroppableProvided,
              droppableSnapshot: DroppableStateSnapshot,
            ) => {
              const visibleTasks = tasks;

              return (
              <div
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
                className={`flex flex-col gap-3 min-h-15 rounded-xl p-1 transition-colors duration-200 overflow-y-auto scroll-smooth kanban-scroll flex-1 ${droppableSnapshot.isDraggingOver
                  ? "bg-blue-50/60 ring-1 ring-[#28B8FA]/20"
                  : ""
                  }`}
              >
                {visibleTasks.length === 0 && !droppableSnapshot.isDraggingOver && (
                  <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                    Chưa có nhiệm vụ
                  </div>
                )}
                {visibleTasks.map((task, taskIndex) => (
                  <KanbanTask
                    key={task.id}
                    id={task.id}
                    index={taskIndex}
                    title={task.title}
                    priority={task.priority}
                    description={task.description || undefined}
                    labels={task.labels}
                    deadline={task.deadline}
                    assignee={task.assignee}
                    assignees={task.assignees}
                    boardLabels={boardLabels}
                    onAddLabel={onAddLabel}
                    onRemoveLabel={onRemoveLabel}
                    onClick={() => onTaskClick(task)}
                    isDragDisabled={isDragDisabled}
                  />
                ))}
                {droppableProvided.placeholder}
              </div>
            )}
            }
          </Droppable>
          <button
            onClick={() => onAddTask(column.id)}
            className="w-full mt-1 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
          >
            <PlusIcon /> Thêm nhiệm vụ
          </button>
        </div>
      )}
    </Draggable>
  );
}
