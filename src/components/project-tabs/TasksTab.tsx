"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { ManageLabelsModal } from "./ManageLabelsModal";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  addTaskAssigneeAction,
  removeTaskAssigneeAction,
  addLabelToTaskAction,
  removeLabelFromTaskAction,
  createLabelAction,
  deleteLabelAction,
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
  const [isManageLabelsOpen, setIsManageLabelsOpen] = useState(false);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    // Only show loading spinner on initial load, not on subsequent refreshes
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`/api/boards/${projectId}/kanban`);
      if (!res.ok) throw new Error("Failed to fetch kanban data");
      const data = await res.json();

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
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
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

  const handleCreateLabel = async (name: string, color: string) => {
    try {
      await createLabelAction(projectId, name, color);
      await fetchData();
      toast.success("Tạo nhãn thành công");
    } catch (error) {
      console.error("Failed to create label:", error);
      toast.error("Tạo nhãn thất bại");
    }
  };

  const handleCreateAndAssignLabel = async (
    taskId: number,
    name: string,
    color: string,
  ) => {
    try {
      const createdLabel = await createLabelAction(projectId, name, color);
      await addLabelToTaskAction(taskId, createdLabel.id);
      await fetchData();
      toast.success("Label created and assigned");
      return createdLabel;
    } catch (error) {
      console.error("Failed to create and assign label:", error);
      toast.error("Failed to create or assign label");
      throw error;
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    try {
      await deleteLabelAction(labelId);
      await fetchData();
      toast.success("Đã xóa nhãn");
    } catch (error) {
      console.error("Failed to delete label:", error);
      toast.error("Xóa nhãn thất bại");
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

  const handleAddAssignee = async (
    taskId: number,
    assigneeId: string,
  ) => {
    try {
      await addTaskAssigneeAction(taskId, assigneeId);
      await fetchData();
      toast.success("Assignee added");
    } catch (error) {
      console.error("Failed to add assignee:", error);
      toast.error("Failed to add assignee");
      throw error;
    }
  };

  const handleRemoveAssignee = async (
    taskId: number,
    assigneeId: string,
  ) => {
    try {
      await removeTaskAssigneeAction(taskId, assigneeId);
      await fetchData();
      toast.success("Assignee removed");
    } catch (error) {
      console.error("Failed to remove assignee:", error);
      toast.error("Failed to remove assignee");
      throw error;
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
      {/* Toolbar: Manage Labels button */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setIsManageLabelsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-bold hover:border-[#28B8FA] hover:text-[#28B8FA] transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 5 4 4" />
            <path d="M13 7 8.7 2.7a2.72 2.72 0 0 0-3.86 0L2.7 4.86A2.72 2.72 0 0 0 2.7 8.7L13 19l9-9-4.7-4.7z" />
            <path d="m8.5 2.5 5 5" />
            <path d="m2 22 8-8" />
          </svg>
          Tạo label
        </button>
      </div>
      <KanbanBoard
        projectId={projectId}
        columns={columns}
        tasks={tasks}
        boardLabels={boardLabels}
        onDataChange={fetchData}
        onTaskClick={openEditModal}
        onAddTask={openCreateModal}
        onUpdateColumn={handleUpdateColumn}
        onDeleteColumn={handleDeleteColumn}
        onAddLabel={handleAddLabel}
        onRemoveLabel={handleRemoveLabel}
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
        onCreateAndAssignLabel={handleCreateAndAssignLabel}
        onAddAssignee={handleAddAssignee}
        onRemoveAssignee={handleRemoveAssignee}
        comments={taskComments}
        commentsLoading={commentsLoading}
        currentUserId={user?.id || ""}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Manage Labels Modal */}
      <ManageLabelsModal
        isOpen={isManageLabelsOpen}
        onClose={() => setIsManageLabelsOpen(false)}
        boardLabels={boardLabels}
        onCreateLabel={handleCreateLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    </div>
  );
}
