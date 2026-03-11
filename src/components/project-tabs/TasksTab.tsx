"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BoardList } from "@/components/board/BoardList";
import { BoardCard } from "@/components/board/BoardCard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { createClient } from "@/utils/supabase/client";
import { PlusIcon } from "@/components/icons";

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

export function TasksTab({ projectId }: { projectId: number }) {
    const supabase = createClient();
    const [columns, setColumns] = useState<Column[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        // Fetch Columns
        const { data: colsData, error: colsErr } = await supabase
            .from("columns")
            .select("*")
            .eq("board_id", projectId)
            .order("position", { ascending: true });

        if (colsErr) console.error("Error fetching columns:", colsErr);
        else setColumns(colsData || []);

        if (colsData && colsData.length > 0) {
            const colIds = colsData.map((c) => c.id);
            // Fetch Tasks
            const { data: tasksData, error: tasksErr } = await supabase
                .from("tasks")
                .select("*")
                .in("column_id", colIds)
                .order("position", { ascending: true });

            if (tasksErr) console.error("Error fetching tasks:", tasksErr);
            else setTasks(tasksData || []);
        }
        setIsLoading(false);
    }, [projectId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return { text: "text-[#FF8B5E]", bg: "bg-[#FFF2DE]" };
            case "Medium": return { text: "text-[#28B8FA]", bg: "bg-[#EAF7FF]" };
            case "Low": return { text: "text-[#34D399]", bg: "bg-[#D1FAE5]" };
            default: return { text: "text-slate-500", bg: "bg-slate-100" };
        }
    };

    const openCreateModal = (columnId: number) => {
        setEditingTask(null);
        setSelectedColumnId(columnId);
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setSelectedColumnId(task.column_id);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (data: {
        title: string;
        description: string;
        priority: "Low" | "Medium" | "High";
        deadline: string;
    }) => {
        if (!selectedColumnId) return;
        setIsSubmitting(true);

        const taskPayload = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            deadline: data.deadline || null,
            column_id: selectedColumnId,
        };

        if (editingTask) {
            // Update
            const { error } = await supabase
                .from("tasks")
                .update(taskPayload)
                .eq("id", editingTask.id);
            if (error) console.error("Update error:", error);
        } else {
            // Insert
            const columnTasks = tasks.filter((t) => t.column_id === selectedColumnId);
            const nextPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.position)) + 1 : 0;
            const { error } = await supabase
                .from("tasks")
                .insert([{ ...taskPayload, position: nextPosition }]);
            if (error) console.error("Insert error:", error);
        }

        await fetchData();
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    const handleDeleteTask = async () => {
        if (!editingTask) return;
        setIsSubmitting(true);
        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", editingTask.id);
        if (error) console.error("Delete error:", error);

        await fetchData();
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex-1 overflow-x-auto mt-4 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-x-auto mt-4">
            {/* Grid background Pattern */}
            <div
                className="h-full w-max flex gap-6"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            >
                {columns.map((col, index) => {
                    const columnTasks = tasks.filter((t) => t.column_id === col.id);
                    // Cycle styles based on index for variety
                    const styles = [
                        { text: "text-slate-800", badge: "bg-slate-100 text-slate-800", border: "" },
                        { text: "text-[#28B8FA]", badge: "bg-[#EAF7FF] text-[#28B8FA]", border: "border-l-2 border-[#28B8FA]" },
                        { text: "text-[#34D399]", badge: "bg-[#D1FAE5] text-[#34D399]", border: "border-l-2 border-[#34D399]" }
                    ];
                    const st = styles[index % styles.length];

                    return (
                        <BoardList
                            key={col.id}
                            title={col.title}
                            count={columnTasks.length}
                            containerClass={st.border}
                            titleClass={st.text}
                            badgeClass={st.badge}
                            showDot={index !== 0}
                            dotClass={st.badge.split(" ")[0]} // fallback dot color to bg class
                        >
                            {columnTasks.map((task) => {
                                const pColor = getPriorityColor(task.priority);
                                return (
                                    <div
                                        key={task.id}
                                        className="relative group cursor-pointer"
                                        onClick={() => openEditModal(task)}
                                    >
                                        <BoardCard
                                            tagLabel={task.priority}
                                            tagColorClass={pColor.text}
                                            tagBgClass={pColor.bg}
                                            title={task.title}
                                            description={task.description || undefined}
                                        />
                                    </div>
                                );
                            })}

                            {/* Add Task Button per Column */}
                            <button
                                onClick={() => openCreateModal(col.id)}
                                className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                            >
                                <PlusIcon /> Add Task
                            </button>
                        </BoardList>
                    );
                })}
            </div>

            <TaskDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveTask}
                onDelete={editingTask ? handleDeleteTask : undefined}
                initialData={editingTask}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
