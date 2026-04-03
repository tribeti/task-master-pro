"use client";


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
  assignee,
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
      deadlineBadge = { label: status.urgencyStr, color: "text-red-600 bg-red-100" };
    } else if (status.color === "orange") {
      cardClass = "bg-orange-50 border-orange-200 border-l-[4px] border-l-orange-500";
      deadlineBadge = { label: status.urgencyStr, color: "text-orange-600 bg-orange-100" };
    } else if (status.color === "yellow") {
      cardClass = "bg-yellow-50 border-yellow-200 border-l-[4px] border-l-yellow-400";
      deadlineBadge = { label: status.urgencyStr, color: "text-yellow-700 bg-yellow-100" };
    }
  }

  const taskLabels = labels || [];

  return (
    <Draggable draggableId={`task-${id}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`rounded-xl shadow-sm border flex flex-[0_0_auto] flex-col cursor-grab hover:shadow-md transition-all duration-200 bg-white ${snapshot.isDragging
              ? "opacity-80 ring-2 ring-[#28B8FA]/50 scale-[1.02] rotate-1 z-50"
              : ""
            } ${cardClass}`}
        >
          <div className="p-3 flex flex-col gap-2.5">
            {/* Minimal Header: Title always visible */}
            <h4 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">{title}</h4>

            {/* Bottom Row: Priority, Deadline, Labels + Assignees */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Priority */}
                <span className={`text-[9.5px] font-bold w-max px-1.5 py-0.5 rounded-md uppercase ${pColor.text} ${pColor.bg}`}>
                  {priority}
                </span>

                {/* Deadline Badge */}
                {deadlineBadge && (
                  <span className={`text-[8.5px] font-black w-max px-1.5 py-0.5 rounded shadow-sm tracking-widest uppercase ${deadlineBadge.color}`}>
                    {deadlineBadge.label}
                  </span>
                )}
                
                {/* Labels dots */}
                {taskLabels.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 ml-0.5">
                    {taskLabels.map((label) => (
                      <div
                        key={label.id}
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                        title={label.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Assignees Avatars */}
              {assignees.length > 0 && (
                <div className="flex items-center justify-end">
                  <div className="flex -space-x-1.5">
                    {assignees.slice(0, 3).map((taskAssignee) => (
                      <div
                        key={taskAssignee.user_id}
                        className="ring-2 ring-white rounded-full bg-white shadow-sm"
                        title={taskAssignee.display_name}
                      >
                        <UserAvatar
                          avatarUrl={taskAssignee.avatar_url}
                          displayName={taskAssignee.display_name}
                          className="w-5 h-5 shadow-none"
                          fallbackClassName="bg-[#EAF7FF] text-[#0284C7] text-[9px]"
                        />
                      </div>
                    ))}
                  </div>
                  {assignees.length > 3 && (
                    <span className="text-[9px] font-bold text-slate-400 ml-1">
                      +{assignees.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
