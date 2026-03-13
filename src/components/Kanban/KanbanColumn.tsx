"use client";

import React, { useState } from "react";
import { KanbanTask } from "./KanbanTask";
import { PlusIcon } from "@/components/icons";

interface Task {
    id: number;
    title: string;
    description: string | null;
    deadline: string | null;
    priority: "Low" | "Medium" | "High";
    position: number;
    column_id: number;
    assignee_id: string | null;
}

interface KanbanColumnProps {
    id: number;
    title: string;
    colIndex: number;
    tasks: Task[];
    isToDoColumn: boolean;
    onDragStart: (e: React.DragEvent, taskId: number) => void;
    onDrop: (e: React.DragEvent, columnId: number) => void;
    onTaskClick: (task: Task) => void;
    onAddTask: (columnId: number) => void;
}

const COLUMN_STYLES = [
    { text: "text-slate-800", badge: "bg-slate-100 text-slate-800", border: "", dot: "" },
    { text: "text-[#28B8FA]", badge: "bg-[#EAF7FF] text-[#28B8FA]", border: "border-l-2 border-[#28B8FA]", dot: "bg-[#28B8FA]" },
    { text: "text-[#34D399]", badge: "bg-[#D1FAE5] text-[#34D399]", border: "border-l-2 border-[#34D399]", dot: "bg-[#34D399]" },
    { text: "text-[#A78BFA]", badge: "bg-[#EDE9FE] text-[#A78BFA]", border: "border-l-2 border-[#A78BFA]", dot: "bg-[#A78BFA]" },
    { text: "text-[#F472B6]", badge: "bg-[#FCE7F3] text-[#F472B6]", border: "border-l-2 border-[#F472B6]", dot: "bg-[#F472B6]" },
];

export function KanbanColumn({
    id,
    title,
    colIndex,
    tasks,
    isToDoColumn,
    onDragStart,
    onDrop,
    onTaskClick,
    onAddTask,
}: KanbanColumnProps) {
    const [isOver, setIsOver] = useState(false);
    const st = COLUMN_STYLES[colIndex % COLUMN_STYLES.length];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e, id);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-80 shrink-0 flex flex-col gap-4 p-2 rounded-2xl transition-all duration-200 ${
                isOver
                    ? "bg-blue-50/80 ring-2 ring-[#28B8FA]/30 scale-[1.01]"
                    : "bg-white/50 backdrop-blur-sm"
            } ${st.border}`}
        >
            {/* Column Header */}
            <h3 className={`font-bold text-xs tracking-widest uppercase flex items-center justify-between px-2 ${st.text}`}>
                {colIndex > 0 ? (
                    <span className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${st.dot}`}></div>
                        {title}
                    </span>
                ) : (
                    title
                )}
                <span className={`px-2 rounded-md ${st.badge}`}>{tasks.length}</span>
            </h3>

            {/* Tasks */}
            <div className="flex flex-col gap-3 min-h-[60px]">
                {tasks.map((task) => (
                    <KanbanTask
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        priority={task.priority}
                        description={task.description || undefined}
                        onDragStart={onDragStart}
                        onClick={() => onTaskClick(task)}
                    />
                ))}
            </div>

            {/* Only "To Do" column gets Add Task */}
            {isToDoColumn && (
                <button
                    onClick={() => onAddTask(id)}
                    className="w-full mt-1 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                >
                    <PlusIcon /> Add Task
                </button>
            )}
        </div>
    );
}
