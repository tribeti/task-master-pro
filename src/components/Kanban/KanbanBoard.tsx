"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { PlusIcon } from "@/components/icons";
import { createClient } from "@/utils/supabase/client";

interface Column {
    id: number;
    title: string;
    position: number;
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
}

interface KanbanBoardProps {
    projectId: number;
    columns: Column[];
    tasks: Task[];
    onDataChange: () => Promise<void>;
    onTaskClick: (task: Task) => void;
    onAddTask: (columnId: number) => void;
}

export function KanbanBoard({
    projectId,
    columns,
    tasks,
    onDataChange,
    onTaskClick,
    onAddTask,
}: KanbanBoardProps) {
    const supabase = createClient();
    const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);

    // Add column state
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const newColInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAddingColumn && newColInputRef.current) {
            newColInputRef.current.focus();
        }
    }, [isAddingColumn]);

    /* ── Drag handlers ── */
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(taskId));
    };

    const handleDrop = async (e: React.DragEvent, targetColumnId: number) => {
        e.preventDefault();
        const taskId = Number(e.dataTransfer.getData("text/plain"));
        if (!taskId) return;

        const task = tasks.find((t) => t.id === taskId);
        if (!task || task.column_id === targetColumnId) {
            setDraggingTaskId(null);
            return;
        }

        // Calculate next position in the target column
        const targetColTasks = tasks.filter(
            (t) => t.column_id === targetColumnId && t.id !== taskId
        );
        const newPosition =
            targetColTasks.length > 0
                ? Math.max(...targetColTasks.map((t) => t.position)) + 1
                : 0;

        const { error } = await supabase
            .from("tasks")
            .update({ column_id: targetColumnId, position: newPosition })
            .eq("id", taskId);

        if (error) console.error("Move task error:", error);

        setDraggingTaskId(null);
        await onDataChange();
    };

    /* ── Add column ── */
    const handleAddColumn = async () => {
        if (!newColumnTitle.trim()) return;
        const nextPos =
            columns.length > 0 ? Math.max(...columns.map((c) => c.position)) + 1 : 0;
        const { error } = await supabase.from("columns").insert([
            { title: newColumnTitle.trim(), board_id: projectId, position: nextPos },
        ]);
        if (error) console.error("Error adding column:", error);
        else {
            setNewColumnTitle("");
            setIsAddingColumn(false);
            await onDataChange();
        }
    };

    return (
        <div
            className="h-full w-max flex gap-6"
            style={{
                backgroundImage:
                    "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }}
        >
            {columns.map((col, index) => {
                const columnTasks = tasks
                    .filter((t) => t.column_id === col.id)
                    .sort((a, b) => a.position - b.position);

                const isToDoColumn = col.title.toLowerCase() === "to do";

                return (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        colIndex={index}
                        tasks={columnTasks}
                        isToDoColumn={isToDoColumn}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onTaskClick={onTaskClick}
                        onAddTask={onAddTask}
                    />
                );
            })}

            {/* Add Column Card */}
            {isAddingColumn ? (
                <div className="w-80 shrink-0 flex flex-col gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <input
                        ref={newColInputRef}
                        type="text"
                        placeholder="Column name..."
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddColumn();
                            if (e.key === "Escape") {
                                setIsAddingColumn(false);
                                setNewColumnTitle("");
                            }
                        }}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddColumn}
                            className="flex-1 py-2 rounded-xl bg-[#28B8FA] text-white font-bold text-sm hover:bg-[#0EA5E9] transition-colors"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => {
                                setIsAddingColumn(false);
                                setNewColumnTitle("");
                            }}
                            className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAddingColumn(true)}
                    className="w-80 shrink-0 min-h-[120px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all cursor-pointer group"
                >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm group-hover:scale-110 transition-transform">
                        <PlusIcon />
                    </div>
                    Add Column
                </button>
            )}
        </div>
    );
}
