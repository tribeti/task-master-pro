"use client";

import React, { useState, useEffect, useCallback } from "react";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import {
  fetchKanbanDataAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions/kanban.actions";
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
    try {
      const { columns: colsData, tasks: tasksData } =
        await fetchKanbanDataAction(projectId);
      setColumns(colsData);
      setTasks(tasksData);
    } catch (error) {
      setColumns([]);
      setTasks([]);
    }
    setIsLoading(false);
  }, [projectId]);

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
      assignee_id: user?.id ?? null,
    };

    let error = false;
    if (editingTask) {
      try {
        await updateTaskAction(editingTask.id, taskPayload);
      } catch (updateError) {
        error = true;
      }
    } else {
      const columnTasks = tasks.filter((t) => t.column_id === selectedColumnId);
      const nextPosition =
        columnTasks.length > 0
          ? Math.max(...columnTasks.map((t) => t.position)) + 1
          : 0;
      try {
        await createTaskAction({ ...taskPayload, position: nextPosition });
      } catch (insertError) {
        error = true;
      }
    }

    if (error) {
      toast.error(
        editingTask ? "Failed to update task" : "Failed to create task",
      );
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
    try {
      await deleteTaskAction(editingTask.id);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
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
