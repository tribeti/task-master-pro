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
}

const PRIORITY_STYLES: Record<string, { text: string; bg: string }> = {
  High: { text: "text-[#FF8B5E]", bg: "bg-[#FFF2DE]" },
  Medium: { text: "text-[#28B8FA]", bg: "bg-[#EAF7FF]" },
  Low: { text: "text-[#34D399]", bg: "bg-[#D1FAE5]" },
};

export function KanbanTask({
  id,
  index,
  title,
  priority,
  description,
  labels,
  deadline,
  assignees = [],
  boardLabels = [],
  onAddLabel,
  onRemoveLabel,
  onClick,
}: KanbanTaskProps) {
  const pColor = PRIORITY_STYLES[priority] || {
    text: "text-slate-500",
    bg: "bg-slate-100",
  };

  let cardClass = "bg-white border-slate-100";
  let deadlineBadge = null;

  if (deadline) {
    const status = getDeadlineStatus(deadline);
    if (status.color === "red") {
      cardClass = "bg-red-50 border-red-200 border-l-[4px] border-l-red-500";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-red-600 bg-red-100",
      };
    } else if (status.color === "orange") {
      cardClass =
        "bg-orange-50 border-orange-200 border-l-[4px] border-l-orange-500";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-orange-600 bg-orange-100",
      };
    } else if (status.color === "yellow") {
      cardClass =
        "bg-yellow-50 border-yellow-200 border-l-[4px] border-l-yellow-400";
      deadlineBadge = {
        label: status.urgencyStr,
        color: "text-yellow-700 bg-yellow-100",
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
  const availableLabels = boardLabels.filter((l) => !assignedIds.has(l.id));

  const handleToggleLabel = async (
    e: React.MouseEvent,
    label: Label,
    isAssigned: boolean,
  ) => {
    e.stopPropagation();
    if (labelLoading) return;
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
    <Draggable draggableId={`task-${id}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`rounded-2xl shadow-sm border flex flex-col cursor-grab hover:shadow-md transition-all overflow-hidden group/card ${
            snapshot.isDragging
              ? "opacity-80 ring-2 ring-[#28B8FA]/50 scale-[1.02] rotate-1 z-50"
              : ""
          } ${cardClass}`}
        >
          {/* AC1: Label Color Stripes - Vạch màu nhãn ở đầu thẻ */}
          {taskLabels.length > 0 && (
            <div className="flex gap-1 px-3 pt-3">
              {taskLabels.map((label) => (
                <div
                  key={label.id}
                  className="h-[7px] flex-1 rounded-full"
                  style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          <div className="p-5 flex flex-col gap-3">
            {/* Priority + Deadline row */}
            <div className="flex justify-between items-start">
              <span
                className={`text-[10px] font-bold w-max px-2 py-1 rounded-md uppercase ${pColor.text} ${pColor.bg}`}
              >
                {priority}
              </span>
              {deadlineBadge && (
                <span
                  className={`text-[8px] font-black w-max px-2 py-1 rounded shadow-sm tracking-widest uppercase ${deadlineBadge.color}`}
                >
                  {deadlineBadge.label}
                </span>
              )}
            </div>

            {/* Title */}
            <h4 className="font-bold text-slate-800">{title}</h4>

            {/* Label badges + Add Label button */}
            <div className="flex flex-wrap gap-1 items-center">
              {/* AC2: Assigned label badges — biến mất khi bỏ chọn */}
              {taskLabels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900"
                  style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                >
                  {label.name}
                </span>
              ))}

              {/* Add Label button — chỉ hiện khi có boardLabels */}
              {boardLabels.length > 0 && (onAddLabel || onRemoveLabel) && (
                <div className="relative" ref={popoverRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLabelPopover((v) => !v);
                    }}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all
                      ${
                        showLabelPopover
                          ? "bg-[#28B8FA] text-white border-[#28B8FA]"
                          : "bg-white text-slate-400 border-slate-200 opacity-0 group-hover/card:opacity-100 hover:border-[#28B8FA] hover:text-[#28B8FA]"
                      }`}
                    title="Add / Remove Label"
                    disabled={labelLoading}
                  >
                    <svg
                      width="10"
                      height="10"
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
                    Label
                  </button>

                  {/* Popover dropdown */}
                  {showLabelPopover && (
                    <div
                      className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-2 pb-1">
                        Labels
                      </p>
                      {/* All board labels — checked if assigned */}
                      {boardLabels.map((label) => {
                        const isAssigned = assignedIds.has(label.id);
                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={(e) =>
                              handleToggleLabel(e, label, isAssigned)
                            }
                            disabled={labelLoading}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            {/* Color dot */}
                            <span
                              className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-sm"
                              style={{
                                backgroundColor: label.color_hex || "#E2E8F0",
                              }}
                            />
                            <span className="text-xs font-semibold text-slate-700 flex-1 text-left truncate">
                              {label.name}
                            </span>
                            {/* Checkmark if assigned */}
                            {isAssigned && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#28B8FA"
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
                      {boardLabels.length === 0 && (
                        <p className="text-xs text-slate-400 px-2 py-1">
                          No labels in board
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-slate-500 line-clamp-2">
                {description}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {assignees.length > 0 ? "Assigned" : "Unassigned"}
              </span>

              {assignees.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {assignees.slice(0, 3).map((taskAssignee) => (
                      <div
                        key={taskAssignee.user_id}
                        className="ring-2 ring-white rounded-full"
                        title={taskAssignee.display_name}
                      >
                        <UserAvatar
                          avatarUrl={taskAssignee.avatar_url}
                          displayName={taskAssignee.display_name}
                          className="w-7 h-7"
                          fallbackClassName="bg-[#EAF7FF] text-[#0284C7]"
                        />
                      </div>
                    ))}
                  </div>
                  {assignees.length > 3 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      +{assignees.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400">
                  Unassigned
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
