"use client";

import React from "react";
import { PlusIcon } from "@/components/icons";
import { KanbanTask } from "./KanbanTask";

interface Label {
  id: number;
  name: string;
  color_hex: string;
  board_id: number;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: "Low" | "Medium" | "High";
  position: number;
  column_id: number;
  assignee_id: string | null;
  labels?: Label[];
}

interface KanbanColumnProps {
  id: number;
  title: string;
  tasks: Task[];
  onDropTask: (taskId: number, newColumnId: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: number) => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onDropTask,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = Number(e.dataTransfer.getData("taskId"));
    if (!taskId) return;
    onDropTask(taskId, id);
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("taskId", String(taskId));
  };

  const isInProgress = title.toLowerCase().includes("progress");
  const isDone = title.toLowerCase().includes("done");

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-80 flex-shrink-0 rounded-3xl p-4 flex flex-col gap-4 bg-white/60 backdrop-blur-sm border border-slate-100 ${
        isInProgress
          ? "border-l-4 border-l-[#28B8FA]"
          : isDone
            ? "border-l-4 border-l-[#34D399]"
            : ""
      }`}
    >
      <div className="flex items-center justify-between px-2">
        <h3
          className={`font-bold text-xs tracking-widest uppercase ${
            isInProgress
              ? "text-[#28B8FA]"
              : isDone
                ? "text-[#34D399]"
                : "text-slate-400"
          }`}
        >
          {title}
        </h3>

        <span
          className={`px-2 rounded-md text-xs font-bold ${
            isInProgress
              ? "bg-[#EAF7FF] text-[#28B8FA]"
              : isDone
                ? "bg-[#D1FAE5] text-[#34D399]"
                : "bg-slate-200 text-slate-600"
          }`}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 min-h-[120px]">
        {tasks.length === 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No tasks yet
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanTask
              key={task.id}
              id={task.id}
              title={task.title}
              priority={task.priority}
              description={task.description || undefined}
              labels={task.labels}
              onDragStart={handleDragStart}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => onAddTask(id)}
        className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:border-[#28B8FA] hover:text-[#28B8FA] transition-colors"
      >
        <PlusIcon />
        Add Task
      </button>
    </div>
  );
}