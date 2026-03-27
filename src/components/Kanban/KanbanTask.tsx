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
  const pColor =
    PRIORITY_STYLES[priority] || {
      text: "text-slate-500",
      bg: "bg-slate-100",
    };

  const activeLabel = labels && labels.length > 0 ? labels[0] : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onClick={onClick}
      className="relative bg-white rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all active:opacity-70 active:scale-[0.98] overflow-hidden"
    >
      {activeLabel && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: activeLabel.color_hex || "#CBD5E1" }}
        />
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`text-[10px] font-bold w-max px-2 py-1 rounded-md uppercase ${pColor.text} ${pColor.bg}`}
          >
            {priority}
          </span>

          {activeLabel && (
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-full text-slate-900"
              style={{ backgroundColor: activeLabel.color_hex || "#E2E8F0" }}
            >
              {activeLabel.name}
            </span>
          )}
        </div>

        <h4 className="font-bold text-slate-800">{title}</h4>

        {description && (
          <p className="text-xs text-slate-500 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
}