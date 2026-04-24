"use client";

import { useState, useRef, useEffect } from "react";
import { Label, TaskAssignee, ChecklistSummary } from "@/lib/types/project";
import { getDeadlineStatus } from "@/utils/deadline";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";

interface KanbanTaskProps {
  id: number;
  index: number;
  title: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  labels?: Label[];
  deadline?: string | null;
  assignee?: TaskAssignee | null;
  assignees?: TaskAssignee[];
  boardLabels?: Label[];
  onAddLabel?: (taskId: number, labelId: number) => Promise<void>;
  onRemoveLabel?: (taskId: number, labelId: number) => Promise<void>;
  onClick: () => void;
  isDragDisabled?: boolean;
  /* ── New: Checklist progress ── */
  checklists?: ChecklistSummary[];
  /* ── New: Quick complete ── */
  isCompleted?: boolean;
  onToggleComplete?: (taskId: number, newValue: boolean) => void;
}

const PRIORITY_BADGE: Record<
  string,
  { label: string; text: string; bg: string }
> = {
  High: { label: "High", text: "text-red-600", bg: "bg-red-50" },
  Medium: { label: "Medium", text: "text-sky-600", bg: "bg-sky-50" },
  Low: { label: "Low", text: "text-emerald-600", bg: "bg-emerald-50" },
};

/** Calculate total and completed checklist items across all checklists */
function getChecklistProgress(checklists?: ChecklistSummary[]) {
  if (!checklists || checklists.length === 0) return { total: 0, completed: 0 };
  let total = 0;
  let completed = 0;
  for (const cl of checklists) {
    for (const item of cl.checklist_items) {
      total++;
      if (item.is_completed) completed++;
    }
  }
  return { total, completed };
}

export function KanbanTask({
  id,
  index,
  title,
  priority,
  labels,
  deadline,
  assignee,
  assignees = [],
  boardLabels = [],
  onAddLabel,
  onRemoveLabel,
  onClick,
  isDragDisabled = false,
  checklists,
  isCompleted = false,
  onToggleComplete,
}: KanbanTaskProps) {
  /* ── Optimistic completed state ── */
  const [localCompleted, setLocalCompleted] = useState(isCompleted);

  // Sync with prop changes (e.g. from realtime updates)
  useEffect(() => {
    setLocalCompleted(isCompleted);
  }, [isCompleted]);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleComplete) return;
    const newValue = !localCompleted;
    setLocalCompleted(newValue); // Optimistic update
    onToggleComplete?.(id, newValue);
  };

  /* ── Checklist progress ── */
  const { total: totalItems, completed: completedItems } = getChecklistProgress(checklists);
  const allChecklistDone = totalItems > 0 && completedItems === totalItems;

  /* ── Deadline logic ── */
  let deadlineBadge: { label: string; color: string } | null = null;
  let leftStripeColor = "";

  if (deadline) {
    const status = getDeadlineStatus(deadline);
    if (status.color === "red") {
      leftStripeColor = "border-l-red-500";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-red-600 bg-red-50",
      };
    } else if (status.color === "orange") {
      leftStripeColor = "border-l-orange-400";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-orange-600 bg-orange-50",
      };
    } else if (status.color === "yellow") {
      leftStripeColor = "border-l-yellow-400";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-yellow-700 bg-yellow-50",
      };
    } else {
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-slate-500 bg-slate-50",
      };
    }
  }

  /* ── Label Popover state ── */
  const [showLabelPopover, setShowLabelPopover] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showLabelPopover) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setShowLabelPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLabelPopover]);

  const taskLabels = labels || [];
  const assignedIds = new Set(taskLabels.map((l) => l.id));

  // Fallback từ assignee sang assignees nếu assignees rỗng
  const effectiveAssignees =
    assignees.length > 0 ? assignees : assignee ? [assignee] : [];

  // Kiểm tra xem có thể toggle label hay không dựa vào callback có sẵn
  const canToggleLabel = (isAssigned: boolean): boolean => {
    if (isAssigned) return !!onRemoveLabel;
    return !!onAddLabel;
  };

  const handleToggleLabel = async (
    e: React.MouseEvent,
    label: Label,
    isAssigned: boolean,
  ) => {
    e.stopPropagation();
    if (labelLoading || !canToggleLabel(isAssigned)) return;
    try {
      setLabelLoading(true);
      if (isAssigned && onRemoveLabel) {
        await onRemoveLabel(id, label.id);
      } else if (!isAssigned && onAddLabel) {
        await onAddLabel(id, label.id);
      }
    } finally {
      setLabelLoading(false);
    }
  };

  return (
    <Draggable
      draggableId={`task-${id}`}
      index={index}
      isDragDisabled={isDragDisabled}
    >
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            rounded-xl bg-white border border-slate-100
            cursor-grab hover:shadow-md transition-all
            group/card
            ${leftStripeColor ? `border-l-[3px] ${leftStripeColor}` : ""}
            ${snapshot.isDragging ? "opacity-80 ring-2 ring-sky-300/50 scale-[1.02] rotate-1 z-50 shadow-lg" : "shadow-sm"}
            ${localCompleted ? "opacity-60" : ""}
          `}
        >
          <div className="px-4 py-3 flex flex-col gap-2">
            {/* Row 1: Completion checkbox + Priority badge + Title */}
            <div className="flex items-start gap-2">
              {/* Completion Checkbox */}
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={!onToggleComplete}
                aria-pressed={localCompleted}
                aria-label={localCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                className={`mt-0.5 shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all duration-200 ${localCompleted
                  ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
                  : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                  }`}
                title={localCompleted ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
              >
                {localCompleted && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>

              <span
                className={`text-[10px] font-black leading-none px-1.5 py-0.5 rounded mt-0.5 shrink-0 uppercase ${PRIORITY_BADGE[priority]?.text || "text-slate-500"} ${PRIORITY_BADGE[priority]?.bg || "bg-slate-50"}`}
                title={priority}
              >
                {PRIORITY_BADGE[priority]?.label || "?"}
              </span>
              <h4
                className={`text-sm font-semibold leading-snug line-clamp-2 transition-all ${localCompleted
                  ? "line-through text-slate-400"
                  : "text-slate-800"
                  }`}
              >
                {title}
              </h4>
            </div>

            {/* Row 2: Label dots + Deadline badge + Add label button */}
            {/* Render this row if there are labels, a deadline, OR we can add labels */}
            {(taskLabels.length > 0 ||
              deadlineBadge ||
              (boardLabels.length > 0 && (onAddLabel || onRemoveLabel))) && (
                <div className="flex items-center justify-between gap-2 pl-4">
                  {/* Label color dots + Add label button */}
                  <div
                    className="flex items-center gap-1 relative"
                    ref={popoverRef}
                  >
                    {taskLabels.map((label) => (
                      <span
                        key={label.id}
                        className="w-3 h-3 rounded-full ring-1 ring-white shadow-sm"
                        style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                        title={label.name}
                      />
                    ))}

                    {/* Add label button — always visible when allowed, tiny on hover for clean look */}
                    {boardLabels.length > 0 && (onAddLabel || onRemoveLabel) && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowLabelPopover((v) => !v);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all
                          ${showLabelPopover
                              ? "bg-sky-500 text-white"
                              : "bg-slate-100 text-slate-400 opacity-0 group-hover/card:opacity-100 hover:bg-sky-100 hover:text-sky-500"
                            }`}
                          title="Nhãn"
                          disabled={labelLoading}
                        >
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>

                        {/* Popover dropdown */}
                        {showLabelPopover && (
                          <div
                            className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 min-w-35"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1">
                              Nhãn
                            </p>
                            {boardLabels.map((label) => {
                              const isAssigned = assignedIds.has(label.id);
                              const isDisabled = !canToggleLabel(isAssigned);
                              return (
                                <button
                                  key={label.id}
                                  type="button"
                                  onClick={(e) =>
                                    handleToggleLabel(e, label, isAssigned)
                                  }
                                  disabled={labelLoading || isDisabled}
                                  className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${isDisabled
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:bg-slate-50"
                                    } disabled:opacity-50`}
                                  title={
                                    isDisabled
                                      ? isAssigned
                                        ? "Không có quyền remove label"
                                        : "Không có quyền add label"
                                      : ""
                                  }
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{
                                      backgroundColor:
                                        label.color_hex || "#E2E8F0",
                                    }}
                                  />
                                  <span className="text-[11px] font-medium text-slate-700 flex-1 text-left truncate">
                                    {label.name}
                                  </span>
                                  {isAssigned && (
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#0ea5e9"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Deadline badge + Avatars (right side) */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {deadlineBadge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase whitespace-nowrap ${deadlineBadge.color}`}
                      >
                        {deadlineBadge.label}
                      </span>
                    )}
                    {effectiveAssignees.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {effectiveAssignees.slice(0, 3).map((a) => (
                          <div
                            key={a.user_id}
                            className="ring-1 ring-white rounded-full"
                            title={a.display_name}
                          >
                            <UserAvatar
                              avatarUrl={a.avatar_url}
                              displayName={a.display_name}
                              className="w-6 h-6"
                              fallbackClassName="bg-sky-50 text-sky-600 text-[9px]"
                            />
                          </div>
                        ))}
                        {effectiveAssignees.length > 3 && (
                          <span className="text-[8px] font-bold text-slate-400 pl-1">
                            +{effectiveAssignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Avatars row — only if no labels/deadline row rendered above AND there are assignees */}
            {taskLabels.length === 0 &&
              !deadlineBadge &&
              !(boardLabels.length > 0 && (onAddLabel || onRemoveLabel)) &&
              effectiveAssignees.length > 0 && (
                <div className="flex items-center justify-end pl-4">
                  <div className="flex -space-x-1.5">
                    {effectiveAssignees.slice(0, 3).map((a) => (
                      <div
                        key={a.user_id}
                        className="ring-1 ring-white rounded-full"
                        title={a.display_name}
                      >
                        <UserAvatar
                          avatarUrl={a.avatar_url}
                          displayName={a.display_name}
                          className="w-6 h-6"
                          fallbackClassName="bg-sky-50 text-sky-600 text-[9px]"
                        />
                      </div>
                    ))}
                    {effectiveAssignees.length > 3 && (
                      <span className="text-[9px] font-bold text-slate-400 pl-1">
                        +{effectiveAssignees.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Footer: Checklist progress badge */}
            {totalItems > 0 && (
              <div className="flex items-center pl-4">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${allChecklistDone
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
                    }`}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="6" height="6" rx="1" />
                    <path d="m3 17 2 2 4-4" />
                    <path d="M13 6h8" />
                    <path d="M13 12h8" />
                    <path d="M13 18h8" />
                  </svg>
                  {completedItems}/{totalItems}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
