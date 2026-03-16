"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface Column {
  id: number;
  title: string;
  position: number;
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
}

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

  let tasks: Task[] = [];
  if (columns && columns.length > 0) {
    const colIds = columns.map((c: Column) => c.id);
    const { data: tasksData, error: tasksErr } = await supabase
      .from("tasks")
      .select("*")
      .in("column_id", colIds)
      .order("position", { ascending: true });

    if (tasksErr) {
      console.error("fetchKanbanDataAction tasks error:", tasksErr.message);
      throw new Error("Failed to load tasks.");
    }
    tasks = (tasksData as Task[]) || [];
  }

  return { columns: (columns as Column[]) || [], tasks };
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

  const { error } = await supabase.from("tasks").insert([payload]);
  if (error) {
    console.error("createTaskAction error:", error.message);
    throw new Error("Failed to create task.");
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

  // Validate input if title/description are being updated
  if (payload.title !== undefined) {
    validateString(payload.title, "Task title", 200);
  }
  if (payload.description !== undefined && payload.description !== null) {
    validateString(payload.description, "Description", 2000);
  }

  // SECURE: Verify user owns the task's board
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
