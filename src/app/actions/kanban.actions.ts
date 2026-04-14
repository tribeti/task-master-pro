"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { 
  verifyBoardAccess,
  verifyAllBoardsAccess,
  verifyTaskAccess,
  getTaskBoardId,
  ensureBoardMember,
  syncPrimaryAssignee,
  validateString
} from "@/utils/board-access";
import { revalidatePath } from "next/cache";
import { Task, Label } from "@/types/project";

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
  await verifyBoardAccess(supabase, user.id, column.board_id);

  const { data: insertedTask, error } = await supabase
    .from("tasks")
    .insert([payload])
    .select("*")
    .single();
  if (error) {
    console.error("createTaskAction error:", error.message);
    throw new Error("Failed to create task.");
  }

  // Tạo thông báo cho người tạo task (dùng admin client để bypass RLS)
  try {
    const adminSupabase = createAdminClient();
    await adminSupabase.from("notifications").insert([
      {
        user_id: user.id,
        project_id: column.board_id,
        task_id: insertedTask.id,
        content: `Tạo công việc thành công: ${payload.title}`,
        is_read: false,
      },
    ]);
  } catch (notifErr) {
    console.error("createTaskAction notification error:", notifErr);
  }

  revalidatePath("/projects");
  return insertedTask as Task;
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

  if (
    payload.description !== undefined &&
    payload.description !== null &&
    payload.description !== ""
  ) {
    validateString(payload.description, "Description", 2000);
  }

  await verifyTaskAccess(supabase, user.id, taskId);

  // If moving to a different column, also verify we own that target column's board
  if (payload.column_id !== undefined) {
    const { data: targetCol, error: targetErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", payload.column_id)
      .single();

    if (targetErr || !targetCol) throw new Error("Access denied.");
    await verifyBoardAccess(supabase, user.id, targetCol.board_id);
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

export const bulkUpdateTasksAction = async (
  updates: { id: number; position: number; column_id: number }[],
) => {
  if (!updates.length) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch existing tasks to preserve other fields and get their current column_ids
  const taskIds = updates.map((u) => u.id);
  const { data: existingTasks, error: fetchErr } = await supabase
    .from("tasks")
    .select(
      "id, title, description, deadline, priority, column_id, assignee_id, position",
    )
    .in("id", taskIds);

  if (fetchErr) {
    console.error("bulkUpdateTasksAction fetch error:", fetchErr?.message);
    throw new Error("Failed to fetch existing tasks.");
  }

  if (!existingTasks || existingTasks.length !== new Set(taskIds).size) {
    console.error("bulkUpdateTasksAction task mismatch: some tasks not found.");
    throw new Error(
      "Failed to update tasks: one or more tasks could not be found.",
    );
  }

  // 2. Security Check: Collect all unique column IDs involved (both current and target)
  const involvedColumnIds = new Set([
    // Add current column IDs
    ...existingTasks.map((task) => task.column_id),
    // Add target column IDs from updates
    ...updates.map((update) => update.column_id),
  ]);

  // 3. Fetch board IDs for all involved columns
  const { data: columnsData, error: colsErr } = await supabase
    .from("columns")
    .select("id, board_id")
    .in("id", Array.from(involvedColumnIds));

  if (colsErr || !columnsData) {
    console.error(
      "bulkUpdateTasksAction columns fetch error:",
      colsErr?.message,
    );
    throw new Error("Failed to verify access.");
  }
  // Verify that all columns were found
  if (columnsData.length !== involvedColumnIds.size) {
    console.error(
      "bulkUpdateTasksAction column mismatch: some columns not found.",
    );
    throw new Error("Failed to verify access: One or more columns not found.");
  }

  // 4. Verify access to all involved boards
  const involvedBoardIds = new Set<number>(
    columnsData.map((col) => col.board_id),
  );
  await verifyAllBoardsAccess(supabase, user.id, involvedBoardIds);

  // Merge changes
  const updatesMap = new Map(updates.map((u) => [u.id, u]));
  const upsertData = existingTasks.map((task) => {
    const update = updatesMap.get(task.id);
    if (!update) {
      // This indicates a logic error, as every existing task should have a corresponding update.
      throw new Error(`Could not find update for task with id ${task.id}`);
    }
    return {
      ...task,
      position: update.position,
      column_id: update.column_id,
    };
  });

  const { error } = await supabase
    .from("tasks")
    .upsert(upsertData, { onConflict: "id" });

  if (error) {
    console.error("bulkUpdateTasksAction error:", error.message);
    throw new Error("Failed to bulk update tasks.");
  }
  revalidatePath("/projects");
};

export const bulkUpdateColumnsAction = async (
  updates: { id: number; position: number }[],
) => {
  if (!updates.length) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch existing columns to preserve other fields and check access
  const columnIds = updates.map((u) => u.id);
  const { data: existingColumns, error: fetchErr } = await supabase
    .from("columns")
    .select("id, title, position, board_id")
    .in("id", columnIds);

  if (
    fetchErr ||
    !existingColumns ||
    existingColumns.length !== new Set(columnIds).size
  ) {
    console.error("bulkUpdateColumnsAction fetch error:", fetchErr?.message);
    throw new Error(
      "Failed to fetch existing columns or some columns were not found.",
    );
  }

  // 2. Verify access to all involved boards
  const involvedBoardIds = new Set<number>(
    existingColumns.map((col) => col.board_id),
  );
  await verifyAllBoardsAccess(supabase, user.id, involvedBoardIds);

  // Merge changes
  const updatesMap = new Map(updates.map((u) => [u.id, u.position]));
  const upsertData = existingColumns.map((col) => ({
    ...col,
    position: updatesMap.get(col.id) ?? col.position,
  }));

  const { error } = await supabase
    .from("columns")
    .upsert(upsertData, { onConflict: "id" });

  if (error) {
    console.error("bulkUpdateColumnsAction error:", error.message);
    throw new Error("Failed to bulk update columns.");
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
  await verifyTaskAccess(supabase, user.id, taskId);

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

  await verifyTaskAccess(supabase, user.id, taskId);

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

  await verifyTaskAccess(supabase, user.id, taskId);

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

export const createLabelAction = async (
  boardId: number,
  name: string,
  color_hex: string,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const cleanName = validateString(name, "Label name", 50);

  // Validate hex color
  if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color_hex)) {
    throw new Error("Invalid color format.");
  }

  await verifyBoardAccess(supabase, user.id, boardId);

  const { data: label, error } = await supabase
    .from("labels")
    .insert([{ name: cleanName, color_hex, board_id: boardId }])
    .select("id, name, color_hex, board_id")
    .single();

  if (error || !label) {
    console.error("createLabelAction error:", error?.message);
    throw new Error("Failed to create label.");
  }

  revalidatePath("/projects");

  return label as Label;
};

export const addTaskAssigneeAction = async (taskId: number, userId: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await verifyTaskAccess(supabase, user.id, taskId);
  const boardId = await getTaskBoardId(supabase, taskId);

  const { data: assignee, error: assigneeErr } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (assigneeErr || !assignee) {
    throw new Error("Assignee not found.");
  }

  await ensureBoardMember(supabase, boardId, userId);

  const { error: insertAssigneeErr } = await supabase
    .from("task_assignees")
    .upsert(
      {
        task_id: taskId,
        user_id: userId,
      },
      {
        onConflict: "task_id,user_id",
        ignoreDuplicates: true,
      },
    );

  if (insertAssigneeErr) {
    console.error("addTaskAssigneeAction error:", insertAssigneeErr.message);
    throw new Error("Failed to add assignee.");
  }

  await syncPrimaryAssignee(supabase, taskId);
  revalidatePath("/projects");
};

export const removeTaskAssigneeAction = async (
  taskId: number,
  userId: string,
) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await verifyTaskAccess(supabase, user.id, taskId);

  const { error: deleteAssigneeErr } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq("user_id", userId);

  if (deleteAssigneeErr) {
    console.error("removeTaskAssigneeAction error:", deleteAssigneeErr.message);
    throw new Error("Failed to remove assignee.");
  }

  await syncPrimaryAssignee(supabase, taskId);
  revalidatePath("/projects");
};

export const removeAllTaskAssigneesAction = async (taskId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await verifyTaskAccess(supabase, user.id, taskId);

  const { error: deleteAssigneesErr } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId);

  if (deleteAssigneesErr) {
    console.error(
      "removeAllTaskAssigneesAction error:",
      deleteAssigneesErr.message,
    );
    throw new Error("Failed to remove all assignees.");
  }

  await syncPrimaryAssignee(supabase, taskId);
  revalidatePath("/projects");
};

export const deleteLabelAction = async (labelId: number) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Tìm board_id của label để verify access
  const { data: label, error: labelErr } = await supabase
    .from("labels")
    .select("board_id")
    .eq("id", labelId)
    .single();

  if (labelErr || !label) throw new Error("Label not found.");
  await verifyBoardAccess(supabase, user.id, label.board_id);

  const { error } = await supabase.from("labels").delete().eq("id", labelId);

  if (error) {
    console.error("deleteLabelAction error:", error.message);
    throw new Error("Failed to delete label.");
  }

  revalidatePath("/projects");
};

// create column
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
  await verifyBoardAccess(supabase, user.id, projectId);

  const { data, error } = await supabase
    .from("columns")
    .insert([{ title: cleanTitle, board_id: projectId, position }])
    .select()
    .single();
  if (error) {
    console.error("createColumnAction error:", error.message);
    throw new Error("Failed to create column.");
  }

  revalidatePath("/projects");
  return data;
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

  if (colErr || !column) throw new Error("Column not found.");
  await verifyBoardAccess(supabase, user.id, column.board_id);

  const { error } = await supabase
    .from("columns")
    .update(payload)
    .eq("id", columnId);

  if (error) {
    console.error(
      "updateColumnAction error: Lỗi khi cập nhật cột",
      error.message,
    );
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

  const { error } = await supabase.from("columns").delete().eq("id", columnId);

  if (error) {
    console.error("deleteColumnAction error: Lỗi khi xóa cột", error.message);
    throw new Error("Không thể xóa cột lúc này.");
  }

  revalidatePath("/projects");
};
// fetchCommentsForTaskAction has been migrated to GET /api/tasks/[taskId]/comments

export const createCommentAction = async (taskId: number, content: string) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

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
