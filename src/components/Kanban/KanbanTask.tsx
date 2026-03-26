"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Label } from "@/types/project";

interface KanbanTaskProps {
  id: number;
  index: number;
  title: string;
  priority: "Low" | "Medium" | "High";
  description?: string;
  labels?: Label[];
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
  onClick,
}: KanbanTaskProps) {
  const pColor = PRIORITY_STYLES[priority] || {
    text: "text-slate-500",
    bg: "bg-slate-100",
  };

  return (
    <Draggable draggableId={`task-${id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
            snapshot.isDragging
              ? "shadow-xl ring-2 ring-[#28B8FA]/40 opacity-95"
              : ""
          }`}
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
      )}
    </Draggable>
  );
}