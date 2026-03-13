"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { createClient } from "@/utils/supabase/client";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { toast } from "sonner";

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
    const supabase = useMemo(() => createClient(), []);
    const { user } = useDashboardUser();
    const [columns, setColumns] = useState<Column[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ── Fetch data ── */
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const { data: colsData, error: colsErr } = await supabase
            .from("columns")
            .select("*")
            .eq("board_id", projectId)
            .order("position", { ascending: true });

        if (colsErr) {
            setColumns([]);
        } else setColumns(colsData || []);

        if (colsData && colsData.length > 0) {
            const colIds = colsData.map((c) => c.id);
            const { data: tasksData, error: tasksErr } = await supabase
                .from("tasks")
                .select("*")
                .in("column_id", colIds)
                .order("position", { ascending: true });

            if (tasksErr) {
                setTasks([]);
            } else setTasks(tasksData || []);
        } else {
            setTasks([]);
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ── Task CRUD ── */
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
            assignee_id: user?.id,
        };

        let error;
        if (editingTask) {
            const { error: updateError } = await supabase
                .from("tasks")
                .update(taskPayload)
                .eq("id", editingTask.id);
            error = updateError;
        } else {
            const columnTasks = tasks.filter((t) => t.column_id === selectedColumnId);
            const nextPosition =
                columnTasks.length > 0
                    ? Math.max(...columnTasks.map((t) => t.position)) + 1
                    : 0;
            const { error: insertError } = await supabase
                .from("tasks")
                .insert([{ ...taskPayload, position: nextPosition }]);
            error = insertError;
        }

        if (error) {
            toast.error(editingTask ? "Failed to update task" : "Failed to create task");
        } else {
            toast.success(editingTask ? "Task updated" : "Task created");
        }

        await fetchData();
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    const handleDeleteTask = async () => {
        if (!editingTask) return;
        setIsSubmitting(true);
        const { error } = await supabase.from("tasks").delete().eq("id", editingTask.id);
        if (error) {
            toast.error("Failed to delete task");
        } else {
            toast.success("Task deleted");
        }
        await fetchData();
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    /* ── Render ── */
    if (isLoading) {
        return (
            <div className="flex-1 overflow-x-auto mt-4 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-x-auto mt-4">
            <KanbanBoard
                projectId={projectId}
                columns={columns}
                tasks={tasks}
                onDataChange={fetchData}
                onTaskClick={openEditModal}
                onAddTask={openCreateModal}
            />

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
