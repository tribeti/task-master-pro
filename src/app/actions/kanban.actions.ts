"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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
  labels?: Label[];
}

interface Label {
  id: number;
  name: string;
  color_hex: string;
  board_id: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  task_id: number;
  user_id: string;
}

interface CreateTaskInput {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  deadline: string | null;
  position: number;
  column_id: number;
  assignee_id: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: "Low" | "Medium" | "High";
  deadline?: string | null;
  position?: number;
  column_id?: number;
  assignee_id?: string | null;
}

function validateString(value: string, fieldName: string, maxLength = 255) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    throw new Error(`${fieldName} is required.`);
  }

  if (cleanValue.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters.`);
  }

  return cleanValue;
}

async function verifyBoardOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
) {
  const { data, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Access denied.");
  }
}

async function verifyTaskOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, columns!inner(board_id)")
    .eq("id", taskId)
    .single();

  const taskData = data as
    | {
        id: number;
        columns: { board_id: number } | { board_id: number }[];
      }
    | null;

  if (error || !taskData) {
    throw new Error("Access denied.");
  }

  const boardId = Array.isArray(taskData.columns)
    ? taskData.columns[0]?.board_id
    : taskData.columns?.board_id;

  if (!boardId) {
    throw new Error("Access denied.");
  }

  await verifyBoardOwnership(supabase, userId, boardId);

  return boardId;
}

async function getBoardIdFromColumn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  columnId: number,
) {
  const { data, error } = await supabase
    .from("columns")
    .select("board_id")
    .eq("id", columnId)
    .single();

  if (error || !data) {
    throw new Error("Column not found.");
  }

  return data.board_id as number;
}

export const fetchKanbanDataAction = async (boardId: number) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await verifyBoardOwnership(supabase, user.id, boardId);

  const { data: columns, error: columnsErr } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (columnsErr) {
    console.error("fetchKanbanDataAction columns error:", columnsErr.message);
    throw new Error("Failed to load columns.");
  }

  const columnIds = ((columns as Column[]) || []).map((column) => column.id);

  let tasks: Task[] = [];
  if (columnIds.length > 0) {
    const { data: tasksData, error: tasksErr } = await supabase
      .from("tasks")
      .select("*")
      .in("column_id", columnIds)
      .order("position", { ascending: true });

    if (payload.description !== undefined && payload.description !== null) {
        validateString(payload.description, "Description", 2000);
    }

    tasks = ((tasksData as Task[]) || []).map((task) => ({
      ...task,
      labels: [],
    }));
  }

  const { data: labelsData, error: labelsErr } = await supabase
    .from("labels")
    .select("*")
    .eq("board_id", boardId)
    .order("id", { ascending: true });

  if (labelsErr) {
    console.error("fetchKanbanDataAction labels error:", labelsErr.message);
    throw new Error("Failed to load labels.");
  }

  const labels = (labelsData as Label[]) || [];

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

    const mappings =
      (taskLabelsData as { task_id: number; label_id: number }[]) || [];

    tasks = tasks.map((task) => {
      const taskLabelIds = mappings
        .filter((mapping) => mapping.task_id === task.id)
        .map((mapping) => mapping.label_id);

      return {
        ...task,
        labels: labels.filter((label) => taskLabelIds.includes(label.id)),
      };
    });
  }

  return {
    columns: (columns as Column[]) || [],
    tasks,
    labels,
  };
};

export const createTaskAction = async (input: CreateTaskInput) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const boardId = await getBoardIdFromColumn(supabase, input.column_id);
  await verifyBoardOwnership(supabase, user.id, boardId);

  const title = validateString(input.title, "Task title", 200);

  const payload = {
    title,
    description: input.description?.trim() || null,
    priority: input.priority,
    deadline: input.deadline || null,
    position: input.position,
    column_id: input.column_id,
    assignee_id: input.assignee_id,
  };

  const { error } = await supabase.from("tasks").insert([payload]);

  if (error) {
    console.error("createTaskAction error:", error.message);
    throw new Error("Failed to create task.");
  }

  revalidatePath("/projects");
};

export const updateTaskAction = async (taskId: number, input: UpdateTaskInput) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const currentBoardId = await verifyTaskOwnership(supabase, user.id, taskId);

  if (input.column_id) {
    const nextBoardId = await getBoardIdFromColumn(supabase, input.column_id);

    if (nextBoardId !== currentBoardId) {
      throw new Error("You cannot move a task to another board.");
    }
  }

  const updatePayload: UpdateTaskInput = {};

  if (typeof input.title === "string") {
    updatePayload.title = validateString(input.title, "Task title", 200);
  }

  if (typeof input.description === "string") {
    updatePayload.description = input.description.trim() || null;
  }

  if (typeof input.priority !== "undefined") {
    updatePayload.priority = input.priority;
  }

  if (typeof input.deadline !== "undefined") {
    updatePayload.deadline = input.deadline || null;
  }

  if (typeof input.position !== "undefined") {
    updatePayload.position = input.position;
  }

  if (typeof input.column_id !== "undefined") {
    updatePayload.column_id = input.column_id;
  }

  if (typeof input.assignee_id !== "undefined") {
    updatePayload.assignee_id = input.assignee_id;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updatePayload)
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

  if (!user) {
    throw new Error("Unauthorized");
  }

  await verifyTaskOwnership(supabase, user.id, taskId);

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("deleteTaskAction error:", error.message);
    throw new Error("Failed to delete task.");
  }

  revalidatePath("/projects");
};

export const createColumnAction = async (boardId: number, title: string) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await verifyBoardOwnership(supabase, user.id, boardId);

  const cleanTitle = validateString(title, "Column title", 100);

  const { data: existingColumns, error: countErr } = await supabase
    .from("columns")
    .select("id")
    .eq("board_id", boardId);

  if (countErr) {
    console.error("createColumnAction count error:", countErr.message);
    throw new Error("Failed to create column.");
  }

  const nextPosition = existingColumns?.length || 0;

  const { error } = await supabase.from("columns").insert([
    {
      title: cleanTitle,
      position: nextPosition,
      board_id: boardId,
    },
  ]);

  if (error) {
    console.error("createColumnAction error:", error.message);
    throw new Error("Failed to create column.");
  }

  revalidatePath("/projects");
};

export const createLabelAction = async (
  boardId: number,
  name: string,
  colorHex: string,
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await verifyBoardOwnership(supabase, user.id, boardId);

  const cleanName = validateString(name, "Label name", 50);

  const normalizedColor = colorHex.trim();
  const isHexColor = /^#([0-9A-Fa-f]{6})$/.test(normalizedColor);

  if (!isHexColor) {
    throw new Error("Color must be a valid hex value like #28B8FA");
  }

  const { data, error } = await supabase
    .from("labels")
    .insert([
      {
        name: cleanName,
        color_hex: normalizedColor,
        board_id: boardId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("createLabelAction error:", error.message);
    throw new Error("Failed to create label.");
  }

  revalidatePath("/projects");
  return data;
};

export const setTaskLabelAction = async (taskId: number, labelId: number) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const taskBoardId = await verifyTaskOwnership(supabase, user.id, taskId);

  const { data: label, error: labelErr } = await supabase
    .from("labels")
    .select("id")
    .eq("id", labelId)
    .eq("board_id", taskBoardId)
    .single();

  if (labelErr || !label) {
    throw new Error("Label not found or does not belong to this board.");
  }

  const { error } = await supabase.rpc("set_task_label_atomic", {
    p_task_id: taskId,
    p_label_id: labelId,
  });

  if (error) {
    console.error("setTaskLabelAction rpc error:", error.message);
    throw new Error("Failed to set task label.");
  }

    revalidatePath("/projects");
};

export const clearTaskLabelAction = async (taskId: number) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await verifyTaskOwnership(supabase, user.id, taskId);

  const { error } = await supabase
    .from("task_labels")
    .delete()
    .eq("task_id", taskId);

  if (error) {
    console.error("clearTaskLabelAction error:", error.message);
    throw new Error("Failed to clear task label.");
  }

  revalidatePath("/projects");
};
// update column
export const updateColumnAction = async (
    columnId: number,
    payload: { title?: string; position?: number },
) => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    if (payload.title !== undefined) {
        payload.title = validateString(payload.title, "Column title", 100);
    }

    // Get the column to find its board_id
    const { data: column, error: colErr } = await supabase
        .from("columns")
        .select("board_id")
        .eq("id", columnId)
        .single();

export const fetchCommentsForTaskAction = async (taskId: number) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

    if (error) {
        console.error("updateColumnAction error: Lỗi khi cập nhật cột", error.message);
        throw new Error("Không thể cập nhật cột lúc này.");
    }

    revalidatePath("/projects");
};
// delete column
export const deleteColumnAction = async (columnId: number) => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: column, error: colErr } = await supabase
        .from("columns")
        .select("board_id")
        .eq("id", columnId)
        .single();

    if (colErr || !column) throw new Error("Column not found.");
    await verifyBoardAccess(supabase, user.id, column.board_id);

    // Kiểm tra xem cột có còn task nào không
    const { count, error: countError } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("column_id", columnId);

    if (countError) {
        console.error("deleteColumnAction: Lỗi khi đếm task:", countError.message);
        throw new Error("Không thể xóa cột lúc này.");
    }

    if (count && count > 0) {
        throw new Error("Không thể xóa cột vẫn còn chứa task.");
    }

    const { error } = await supabase
        .from("columns")
        .delete()
        .eq("id", columnId);

    if (error) {
        console.error("deleteColumnAction error: Lỗi khi xóa cột", error.message);
        throw new Error("Không thể xóa cột lúc này.");
    }

    revalidatePath("/projects");
};
// fetchCommentsForTaskAction has been migrated to GET /api/tasks/[taskId]/comments

export const createCommentAction = async (
  taskId: number,
  content: string,
) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

    await verifyTaskAccess(supabase, user.id, taskId);

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

  console.log("createCommentAction inserted comment:", data);

  revalidatePath("/projects");
};

export const deleteCommentAction = async (commentId: number) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

    const { data: comment, error: commentErr } = await supabase
        .from("comments")
        .select("id, user_id, task_id")
        .eq("id", commentId)
        .single();

    if (commentErr || !comment) {
        throw new Error("Comment not found.");
    }

    await verifyTaskAccess(supabase, user.id, comment.task_id);

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
