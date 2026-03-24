"use client";

import React from "react";
import { Label } from "@/types/project";

interface KanbanTaskProps {
  id: number;
  title: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  labels?: Label[];
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
  onDragStart,
  onClick,
}: KanbanTaskProps) {
  const pColor = PRIORITY_STYLES[priority] || {
    text: "text-slate-500",
    bg: "bg-slate-100",
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onClick={onClick}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all active:opacity-70 active:scale-[0.98]"
    >
      <span
        className={`text-[10px] font-bold w-max px-2 py-1 rounded-md uppercase ${pColor.text} ${pColor.bg}`}
      >
        {priority}
      </span>

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
