"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { KanbanBoard } from "@/components/Kanban/KanbanBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { ManageLabelsModal } from "./ManageLabelsModal";

import { useDashboardUser } from "@/app/(dashboard)/provider";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
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

  // ══════════════════════════════════════════════════════════════
  //  SHARED REF: KanbanBoard sets this to true while dragging
  //  Realtime subscription reads it to skip fetch during drags
  // ══════════════════════════════════════════════════════════════
  const isDraggingRef = useRef(false);

  // Tracks the timestamp of our most recent local write operation.
  // Realtime events arriving within 2s of a local write are suppressed
  // because they're echoes of our OWN changes (not other users').
  const lastLocalWriteRef = useRef(0);

  // Wrapper: call this around any CRUD action to stamp the write time
  const markLocalWrite = () => {
    lastLocalWriteRef.current = Date.now();
  };

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

  // Initial data fetch (ONLY on mount / projectId change)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ══════════════════════════════════════════════════════════════
  //  SUPABASE REALTIME — Stabilized subscription
  //
  //  Key design decisions:
  //  1. Use a REF to track column IDs, not state. This prevents
  //     the infinite re-subscribe loop (fetchData → setColumns →
  //     columns ref changes → useEffect re-runs → new channel).
  //  2. Skip fetchData when isDraggingRef is true (anti-race).
  //  3. Skip fetchData within 2s of a local write (anti-echo).
  //  4. Debounce 500ms to batch rapid DB changes.
  // ══════════════════════════════════════════════════════════════
  // Derive a stable string of column IDs. It only changes when columns are added or removed.
  // This solves the infinite re-subscribe loop while ensuring new columns are tracked.
  const columnIdsString = useMemo(() => {
    return columns
      .map((c) => c.id)
      .sort((a, b) => a - b)
      .join(",");
  }, [columns]);

  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: NodeJS.Timeout;

    const handleRealtimeEvent = () => {
      // 🛡️ Guard 1: If user is actively dragging, skip entirely
      if (isDraggingRef.current) return;

      // 🛡️ Guard 2: If this is an echo of our own recent write, skip
      if (Date.now() - lastLocalWriteRef.current < 2000) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchData();
      }, 500);
    };

    const channelBuilder = supabase
      .channel(`kanban-realtime-board-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setColumns((prev) => {
              // Anti-Duplication: check if we already appended it locally
              if (prev.some((c) => c.id === payload.new.id)) return prev;
              return [...prev, payload.new as Column].sort(
                (a, b) => a.position - b.position,
              );
            });
          } else {
            handleRealtimeEvent();
          }
        },
      );

    if (columnIdsString) {
      channelBuilder.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `column_id=in.(${columnIdsString})`,
        },
        () => handleRealtimeEvent(),
      );
    }

    const channel = channelBuilder.subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // Include columnIdsString here so it auto-re-subscribes when columns are added/removed!
  }, [projectId, fetchData, columnIdsString]);

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

  // ══════════════════════════════════════════════════════════════
  //  CRUD Handlers
  //  Each handler calls markLocalWrite() before fetchData() to
  //  suppress Realtime echo (prevents double GET)
  // ══════════════════════════════════════════════════════════════

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

    let error = false;

    if (editingTask) {
      try {
        const res = await fetch(`/api/kanban/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskPayload),
        });
        if (!res.ok) throw new Error();
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
        const res = await fetch("/api/kanban/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskPayload,
            assignee_id: null,
            position: nextPosition,
          }),
        });
        if (!res.ok) throw new Error();
      } catch (insertError) {
        console.error(insertError);
        error = true;
      }
    }

    if (error) {
      toast.error(
        editingTask ? "cập nhật nhiệm vụ thất bại" : "tạo nhiệm vụ thất bại",
      );
    } else {
      toast.success(
        editingTask
          ? "cập nhật nhiệm vụ thành công"
          : "tạo nhiệm vụ thành công",
      );
    }

    // Realtime will auto-refresh, but for CRUD we want immediate feedback
    markLocalWrite();
    await fetchData();
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/kanban/tasks/${editingTask.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("xóa nhiệm vụ thành công");
    } catch (error) {
      console.error(error);
      toast.error("xóa nhiệm vụ thất bại");
    }

    markLocalWrite();
    await fetchData();
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleAddLabel = async (taskId: number, labelId: number) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId })
      });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("Thêm nhãn thành công");
    } catch (error) {
      console.error("Failed to add label:", error);
      toast.error("Thêm nhãn thất bại");
    }
  };

  const handleRemoveLabel = async (taskId: number, labelId: number) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/labels?labelId=${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("xóa nhãn thành công");
    } catch (error) {
      console.error("Failed to remove label:", error);
      toast.error("xóa nhãn thất bại");
    }
  };

  const handleCreateLabel = async (name: string, color: string) => {
    try {
      const res = await fetch("/api/kanban/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: projectId, name, color_hex: color })
      });
      if (!res.ok) throw new Error();
      markLocalWrite();
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
      const createRes = await fetch("/api/kanban/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: projectId, name, color_hex: color })
      });
      if (!createRes.ok) throw new Error();
      const createdLabel = await createRes.json();
      
      const assignRes = await fetch(`/api/kanban/tasks/${taskId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId: createdLabel.id })
      });
      if (!assignRes.ok) throw new Error();
      
      markLocalWrite();
      await fetchData();
      toast.success("Tạo và gán nhãn thành công");
      return createdLabel;
    } catch (error) {
      console.error("Failed to create and assign label:", error);
      toast.error("Tạo và gán nhãn thất bại");
      throw error;
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    try {
      const res = await fetch(`/api/kanban/labels/${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("Đã xóa nhãn");
    } catch (error) {
      console.error("Failed to delete label:", error);
      toast.error("Xóa nhãn thất bại");
    }
  };

  const handleAddComment = async (taskId: number, content: string) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error();
      await fetchComments(taskId);
      toast.success("Thêm bình luận thành công");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Thêm bình luận thất bại");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!editingTask?.id) return;

    try {
      const res = await fetch(`/api/kanban/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchComments(editingTask.id);
      toast.success("Xóa bình luận thành công");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Xóa bình luận thất bại");
    }
  };

  const handleAddAssignee = async (taskId: number, assigneeId: string) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assigneeId })
      });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("Thêm người thực hiện thành công");
    } catch (error) {
      console.error("Failed to add assignee:", error);
      toast.error("Thêm người thực hiện thất bại");
      throw error;
    }
  };

  const handleRemoveAssignee = async (taskId: number, assigneeId: string) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/assignees?userId=${assigneeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("xóa người thực hiện thành công");
    } catch (error) {
      console.error("Failed to remove assignee:", error);
      toast.error("xóa người thực hiện thất bại");
      throw error;
    }
  };

  const handleRemoveAllAssignees = async (taskId: number) => {
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}/assignees?removeAll=true`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      markLocalWrite();
      await fetchData();
      toast.success("xóa tất cả người thực hiện thành công");
    } catch (error) {
      console.error("Failed to remove all assignees:", error);
      toast.error("xóa tất cả người thực hiện thất bại");
      throw error;
    }
  };

  const handleUpdateColumn = async (columnId: number, newTitle: string) => {
    try {
      const res = await fetch(`/api/kanban/columns/${columnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (!res.ok) throw new Error();
      toast.success("Cập nhật cột thành công");
      markLocalWrite();
      await fetchData();
    } catch (error) {
      console.error("Failed to update column:", error);
      toast.error("Cập nhật cột thất bại");
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      const res = await fetch(`/api/kanban/columns/${columnId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Đã xóa cột");
      markLocalWrite();
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
        boardLabels={boardLabels}
        isDraggingRef={isDraggingRef}
        markLocalWrite={markLocalWrite}
        onColumnAdded={(col) =>
          setColumns((prev) => {
            if (prev.some((c) => c.id === col.id)) return prev;
            return [...prev, col].sort((a, b) => a.position - b.position);
          })
        }
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
        boardId={projectId}
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
        onRemoveAllAssignees={handleRemoveAllAssignees}
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
