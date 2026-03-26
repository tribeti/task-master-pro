"use client";

import { Label } from "@/types/project";
import { getDeadlineStatus } from "@/utils/deadline";

interface KanbanTaskProps {
  id: number;
  title: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  labels?: Label[];
  deadline?: string | null;
  onDragStart: (e: React.DragEvent, taskId: number) => void;
  onClick: () => void;
}

const PRIORITY_STYLES: Record<string, { text: string; bg: string }> = {
  High: { text: "text-[#FF8B5E]", bg: "bg-[#FFF2DE]" },
  Medium: { text: "text-[#28B8FA]", bg: "bg-[#EAF7FF]" },
  Low: { text: "text-[#34D399]", bg: "bg-[#D1FAE5]" },
};

export function KanbanTask({
  id,
  title,
  priority,
  description,
  labels,
  deadline,
  onDragStart,
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

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onClick={onClick}
      className={`p-5 rounded-2xl shadow-sm border flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all active:opacity-70 active:scale-[0.98] ${cardClass}`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-[10px] font-bold w-max px-2 py-1 rounded-md uppercase ${pColor.text} ${pColor.bg}`}
        >
          {priority}
        </span>
        {deadlineBadge && (
            <span className={`text-[8px] font-black w-max px-2 py-1 rounded shadow-sm tracking-widest uppercase ${deadlineBadge.color}`}>
              {deadlineBadge.label}
            </span>
        )}
      </div>

      <h4 className="font-bold text-slate-800">{title}</h4>

      {labels && labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900"
              style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {description && (
        <p className="text-xs text-slate-500 line-clamp-2">{description}</p>
      )}
    </div>
  );
}
