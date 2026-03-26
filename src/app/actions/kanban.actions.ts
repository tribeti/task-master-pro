"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  Task,
  Label,
  KanbanColumn,
  Comment,
  KanbanTask,
} from "@/types/project";

// ── Helper: Verify user owns a board ──
async function verifyBoardOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
) {
  const { data: board, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .single();

  if (error || !board) {
    throw new Error("Access denied.");
  }
}

// ── Helper: Verify user owns the board that contains a specific task ──
async function verifyTaskOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskId: number,
) {
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("column_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new Error("Access denied.");
  }

  const { data: column, error: colError } = await supabase
    .from("columns")
    .select("board_id")
    .eq("id", task.column_id)
    .single();

  if (colError || !column) {
    throw new Error("Access denied.");
  }

  await verifyBoardOwnership(supabase, userId, column.board_id);
}

// ── Helper: Validate string input ──
function validateString(
  value: string,
  fieldName: string,
  maxLength: number = 500,
): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less.`);
  }
  return trimmed;
}

export const fetchKanbanDataAction = async (projectId: number) => {
  const supabase = await createClient();

  // Auth Check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // SECURE: Verify user owns this board
  await verifyBoardOwnership(supabase, user.id, projectId);

  const { data: columns, error: colsErr } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", projectId)
    .order("position", { ascending: true });

  if (colsErr) {
    console.error("fetchKanbanDataAction columns error:", colsErr.message);
    throw new Error("Failed to load board data.");
  }

  let tasks: KanbanTask[] = [];
  let labels: Label[] = [];

  if (columns && columns.length > 0) {
    const colIds = columns.map((c: KanbanColumn) => c.id);

    const { data: tasksData, error: tasksErr } = await supabase
      .from("tasks")
      .select("*")
      .in("column_id", colIds)
      .order("position", { ascending: true });

    if (tasksErr) {
      console.error("fetchKanbanDataAction tasks error:", tasksErr.message);
      throw new Error("Failed to load tasks.");
    }

    tasks = ((tasksData as Task[]) || []).map((task) => ({
      ...task,
      labels: [],
    }));

    const { data: boardLabels, error: labelsErr } = await supabase
      .from("labels")
      .select("*")
      .eq("board_id", projectId)
      .order("id", { ascending: true });

    if (labelsErr) {
      console.error("fetchKanbanDataAction labels error:", labelsErr.message);
      throw new Error("Failed to load labels.");
    }

    labels = (boardLabels as Label[]) || [];

    // AFTER
    if (tasks.length > 0) {
      const taskIds = tasks.map((task) => task.id);
      const { data: taskLabelsData, error: taskLabelsErr } = await supabase
        .from("task_labels")
        .select("task_id, label_id")
        .in("task_id", taskIds);
      if (taskLabelsErr) {
        console.error(
          "fetchKanbanDataAction task_labels error:",
          taskLabelsErr.message,
        );
        throw new Error("Failed to load task labels.");
      }
      const taskLabelRows =
        (taskLabelsData as { task_id: number; label_id: number }[]) || [];

      // Build map: task_id → Set<label_id> for O(1) lookup
      const taskLabelsMap = new Map<number, Set<number>>();
      for (const row of taskLabelRows) {
        if (!taskLabelsMap.has(row.task_id)) {
          taskLabelsMap.set(row.task_id, new Set());
        }
        taskLabelsMap.get(row.task_id)!.add(row.label_id);
      }

      tasks = tasks.map((task) => {
        const relatedLabelIds = taskLabelsMap.get(task.id) ?? new Set<number>();
        return {
          ...task,
          labels: labels.filter((label) => relatedLabelIds.has(label.id)),
        };
      });
    }
  }

  return {
    columns: (columns as KanbanColumn[]) || [],
    tasks,
    labels,
  };
};

export const createTaskAction = async (payload: Omit<Task, "id">) => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthorized");

  // Validate input
  validateString(payload.title, "Task title", 200);
  if (payload.description) {
    validateString(payload.description, "Description", 2000);
  }

  // SECURE: Verify user owns the board containing this column
  const { data: column, error: colErr } = await supabase
    .from("columns")
    .select("board_id")
    .eq("id", payload.column_id)
    .single();

  if (colErr || !column) throw new Error("Access denied.");
  await verifyBoardOwnership(supabase, user.id, column.board_id);

  const { data: newTaskData, error } = await supabase.from("tasks").insert([payload]).select().single();
  if (error) {
    console.error("createTaskAction error:", error.message);
    throw new Error("Failed to create task.");
  }

  // --- AUTOMATIC DEADLINE NOTIFICATION ---
  if (payload.deadline) {
    const deadlineDate = new Date(payload.deadline);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    if (deadlineDate <= threeDaysFromNow) {
        let urgencyStr = "IN 3 DAYS";
        if (deadlineDate < now) urgencyStr = "OVERDUE";
        else if (deadlineDate.toDateString() === now.toDateString()) urgencyStr = "DUE TODAY";
        else if (deadlineDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()) urgencyStr = "DUE TOMORROW";

        const targetUserId = payload.assignee_id || user.id;

        const { error: notifError } = await supabase.from("notifications").insert([{
            user_id: targetUserId,
            type: "deadline",
            content: `DEADLINE WARNING\n${payload.title} is ${urgencyStr}`,
            is_read: false
        }]);

        if (notifError) {
          console.error("Failed to insert automatic notification:", notifError);
        }
    }
  }

  revalidatePath("/projects");
};

export const updateTaskAction = async (
  taskId: number,
  payload: Partial<Task>,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validate input if title are being updated
  if (payload.title !== undefined) {
    validateString(payload.title, "Task title", 200);
  }

  await verifyTaskOwnership(supabase, user.id, taskId);

  // If moving to a different column, also verify we own that target column's board
  if (payload.column_id !== undefined) {
    const { data: targetCol, error: targetErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", payload.column_id)
      .single();

    if (targetErr || !targetCol) throw new Error("Access denied.");
    await verifyBoardOwnership(supabase, user.id, targetCol.board_id);
  }

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId);

  if (error) {
    console.error("updateTaskAction error:", error.message);
    throw new Error("Failed to update task.");
  }
  revalidatePath("/projects");
};

export const deleteTaskAction = async (taskId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // SECURE: Verify user owns the task's board
  await verifyTaskOwnership(supabase, user.id, taskId);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) {
    console.error("deleteTaskAction error:", error.message);
    throw new Error("Failed to delete task.");
  }

  revalidatePath("/projects");
};

export const addLabelToTaskAction = async (taskId: number, labelId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await verifyTaskOwnership(supabase, user.id, taskId);

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("column_id")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) throw new Error("Task not found.");

  const { data: column, error: colErr } = await supabase
    .from("columns")
    .select("board_id")
    .eq("id", task.column_id)
    .single();

  if (colErr || !column) throw new Error("Column not found.");

  const { data: label, error: labelErr } = await supabase
    .from("labels")
    .select("id, board_id")
    .eq("id", labelId)
    .single();

  if (labelErr || !label) throw new Error("Label not found.");
  if (label.board_id !== column.board_id) {
    throw new Error("Label does not belong to this board.");
  }

  const { error } = await supabase.from("task_labels").upsert(
    [
      {
        task_id: taskId,
        label_id: labelId,
      },
    ],
    {
      onConflict: "task_id,label_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    console.error("addLabelToTaskAction error:", error.message);
    throw new Error("Failed to add label to task.");
  }

  revalidatePath("/projects");
};

export const removeLabelFromTaskAction = async (
  taskId: number,
  labelId: number,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await verifyTaskOwnership(supabase, user.id, taskId);

  const { error } = await supabase
    .from("task_labels")
    .delete()
    .eq("task_id", taskId)
    .eq("label_id", labelId);

  if (error) {
    console.error("removeLabelFromTaskAction error:", error.message);
    throw new Error("Failed to remove label from task.");
  }

  revalidatePath("/projects");
};

export const createColumnAction = async (
  projectId: number,
  title: string,
  position: number,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Validate input
  const cleanTitle = validateString(title, "Column title", 100);

  // SECURE: Verify user owns this board
  await verifyBoardOwnership(supabase, user.id, projectId);

  const { error } = await supabase
    .from("columns")
    .insert([{ title: cleanTitle, board_id: projectId, position }]);
  if (error) {
    console.error("createColumnAction error:", error.message);
    throw new Error("Failed to create column.");
  }

  revalidatePath("/projects");
};

export const fetchCommentsForTaskAction = async (taskId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await verifyTaskOwnership(supabase, user.id, taskId);

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchCommentsForTaskAction error:", error.message);
    throw new Error("Failed to load comments.");
  }

  return (data as Comment[]) || [];
};

export const createCommentAction = async (taskId: number, content: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await verifyTaskOwnership(supabase, user.id, taskId);

  const cleanContent = validateString(content, "Comment", 2000);

  const payload = {
    content: cleanContent,
    task_id: taskId,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error(
      "createCommentAction supabase error full:",
      JSON.stringify(error, null, 2),
    );
    console.error("createCommentAction supabase error object:", error);
    throw new Error(error.message || "Failed to create comment.");
  }
  revalidatePath("/projects");
};

export const deleteCommentAction = async (commentId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: comment, error: commentErr } = await supabase
    .from("comments")
    .select("id, user_id, task_id")
    .eq("id", commentId)
    .single();

  if (commentErr || !comment) {
    throw new Error("Comment not found.");
  }

  await verifyTaskOwnership(supabase, user.id, comment.task_id);

  if (comment.user_id !== user.id) {
    throw new Error("You can only delete your own comments.");
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("deleteCommentAction error:", error.message);
    throw new Error("Failed to delete comment.");
  }

  revalidatePath("/projects");
};
