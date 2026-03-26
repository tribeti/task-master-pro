"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import {
  fetchKanbanDataAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  addLabelToTaskAction,
  removeLabelFromTaskAction,
  fetchCommentsForTaskAction,
  createCommentAction,
  deleteCommentAction,
  updateColumnAction,
  deleteColumnAction,
} from "@/app/actions/kanban.actions";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { toast } from "sonner";
import {
  Label,
  Comment,
  KanbanColumn as Column,
  KanbanTask as Task,
} from "@/types/project";

export function TasksTab({ projectId }: { projectId: number }) {
  const { user } = useDashboardUser();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [taskComments, setTaskComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    // Only show loading spinner on initial load, not on subsequent refreshes
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    try {
      const data = await fetchKanbanDataAction(projectId);

      setColumns(data.columns || []);
      setTasks(data.tasks || []);
      setBoardLabels(data.labels || []);
    } catch (error) {
      console.error("Failed to fetch kanban data:", error);
      setColumns([]);
      setTasks([]);
      setBoardLabels([]);
      toast.error("Failed to load kanban data");
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchComments = useCallback(async (taskId: number) => {
    try {
      setCommentsLoading(true);
      const data = await fetchCommentsForTaskAction(taskId);
      setTaskComments(data || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setTaskComments([]);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const openCreateModal = (columnId: number) => {
    setEditingTask(null);
    setSelectedColumnId(columnId);
    setTaskComments([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (task: Task) => {
    setEditingTask(task);
    setSelectedColumnId(task.column_id);
    setIsModalOpen(true);
    await fetchComments(task.id);
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
        console.error(updateError);
        error = true;
      }
    } else {
      const columnTasks = tasks.filter((t) => t.column_id === selectedColumnId);
      const nextPosition =
        columnTasks.length > 0
          ? Math.max(...columnTasks.map((t) => t.position)) + 1
          : 0;

      try {
        await createTaskAction({
          ...taskPayload,
          position: nextPosition,
        });
      } catch (insertError) {
        console.error(insertError);
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
      console.error(error);
      toast.error("Failed to delete task");
    }

    await fetchData();
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleAddLabel = async (taskId: number, labelId: number) => {
    try {
      await addLabelToTaskAction(taskId, labelId);
      await fetchData();
      toast.success("Label added");
    } catch (error) {
      console.error("Failed to add label:", error);
      toast.error("Failed to add label");
    }
  };

  const handleRemoveLabel = async (taskId: number, labelId: number) => {
    try {
      await removeLabelFromTaskAction(taskId, labelId);
      await fetchData();
      toast.success("Label removed");
    } catch (error) {
      console.error("Failed to remove label:", error);
      toast.error("Failed to remove label");
    }
  };

  const handleAddComment = async (taskId: number, content: string) => {
    try {
      await createCommentAction(taskId, content);
      await fetchComments(taskId);
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!editingTask?.id) return;

    try {
      await deleteCommentAction(commentId);
      await fetchComments(editingTask.id);
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleUpdateColumn = async (columnId: number, newTitle: string) => {
    try {
      await updateColumnAction(columnId, { title: newTitle });
      toast.success("Cập nhật cột thành công");
      await fetchData();
    } catch (error) {
      console.error("Failed to update column:", error);
      toast.error("Cập nhật cột thất bại");
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      await deleteColumnAction(columnId);
      toast.success("Đã xóa cột");
      await fetchData();
    } catch (error) {
      console.error("Failed to delete column:", error);
      toast.error("Xóa cột thất bại");
    }
  };

  const currentEditingTask = editingTask
    ? tasks.find((task) => task.id === editingTask.id) || editingTask
    : null;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto mt-4 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 mt-4">
      <KanbanBoard
        projectId={projectId}
        columns={columns}
        tasks={tasks}
        onDataChange={fetchData}
        onTaskClick={openEditModal}
        onAddTask={openCreateModal}
        onUpdateColumn={handleUpdateColumn}
        onDeleteColumn={handleDeleteColumn}
      />

      <TaskDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        onDelete={currentEditingTask ? handleDeleteTask : undefined}
        initialData={currentEditingTask}
        isSubmitting={isSubmitting}
        boardLabels={boardLabels}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
        comments={taskComments}
        commentsLoading={commentsLoading}
        currentUserId={user?.id || ""}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
}
