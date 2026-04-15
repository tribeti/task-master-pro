"use client";

import { useState, useRef, useEffect } from "react";
import { Label, TaskAssignee } from "@/types/project";
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
}

const PRIORITY_BADGE: Record<
  string,
  { label: string; text: string; bg: string }
> = {
  High: { label: "High", text: "text-red-600", bg: "bg-red-50" },
  Medium: { label: "Medium", text: "text-sky-600", bg: "bg-sky-50" },
  Low: { label: "Low", text: "text-emerald-600", bg: "bg-emerald-50" },
};

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
}: KanbanTaskProps) {
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
          `}
        >
          <div className="px-4 py-3 flex flex-col gap-2">
            {/* Row 1: Priority badge + Title */}
            <div className="flex items-start gap-2">
              <span
                className={`text-[10px] font-black leading-none px-1.5 py-0.5 rounded mt-0.5 shrink-0 uppercase ${PRIORITY_BADGE[priority]?.text || "text-slate-500"} ${PRIORITY_BADGE[priority]?.bg || "bg-slate-50"}`}
                title={priority}
              >
                {PRIORITY_BADGE[priority]?.label || "?"}
              </span>
              <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
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
                          ${
                            showLabelPopover
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
                                className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
                                  isDisabled
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
          </div>
        </div>
      )}
    </Draggable>
  );
}
