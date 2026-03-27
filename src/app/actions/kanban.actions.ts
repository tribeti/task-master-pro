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
import { getDeadlineStatus } from "@/utils/deadline";

// ── Helper: Verify user has access to a board (owner OR member) ──
async function verifyBoardAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    boardId: number,
) {
    // Check if user is the board owner
    const { data: board } = await supabase
        .from("boards")
        .select("id")
        .eq("id", boardId)
        .eq("owner_id", userId)
        .maybeSingle();

    if (board) return; // User is the owner

    // Check if user is a member of the board
    const { data: membership } = await supabase
        .from("board_members")
        .select("user_id")
        .eq("board_id", boardId)
        .eq("user_id", userId)
        .maybeSingle();

    if (!membership) {
        throw new Error("Access denied.");
    }
}

// ── Helper: Verify user has access to the board that contains a specific task ──
async function verifyTaskAccess(
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

    await verifyBoardAccess(supabase, userId, column.board_id);
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

// fetchKanbanDataAction has been migrated to GET /api/boards/[boardId]/kanban

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

    const { error } = await supabase.from("tasks").insert([payload]);
    if (error) {
        console.error("createTaskAction error:", error.message);
        throw new Error("Failed to create task.");
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

    if (payload.description !== undefined && payload.description !== null) {
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

    const { error } = await supabase
        .from("columns")
        .insert([{ title: cleanTitle, board_id: projectId, position }]);
    if (error) {
        console.error("createColumnAction error:", error.message);
        throw new Error("Failed to create column.");
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

    if (colErr || !column) throw new Error("Column not found.");
    await verifyBoardAccess(supabase, user.id, column.board_id);

    const { error } = await supabase
        .from("columns")
        .update(payload)
        .eq("id", columnId);

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
