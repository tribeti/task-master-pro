"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
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

// ── Helper: Verify user has access to multiple boards ──
async function verifyAllBoardsAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    boardIds: Set<number> | number[],
) {
    const ids = Array.from(boardIds);
    if (ids.length === 0) return;

    // Query 1: Lấy tất cả boards mà user là OWNER
    // Query 2: Lấy tất cả boards mà user là MEMBER
    const [ownedBoardsResult, memberBoardsResult] = await Promise.all([
        supabase
            .from("boards")
            .select("id")
            .eq("owner_id", userId)
            .in("id", ids),
        supabase
            .from("board_members")
            .select("board_id")
            .eq("user_id", userId)
            .in("board_id", ids)
    ]);

    const { data: ownedBoards, error: ownerError } = ownedBoardsResult;
    const { data: memberBoards, error: memberError } = memberBoardsResult;

    if (ownerError) throw ownerError;
    if (memberError) throw memberError;

    // Gộp các board ID có quyền truy cập
    const accessibleIds = new Set([
        ...(ownedBoards?.map((b) => b.id) ?? []),
        ...(memberBoards?.map((b) => b.board_id) ?? []),
    ]);

    // Kiểm tra từng board — throw nếu thiếu quyền
    for (const boardId of ids) {
        if (!accessibleIds.has(boardId)) {
            throw new Error(`Access denied for board: ${boardId}`);
        }
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

    const { data: insertedTask, error } = await supabase.from("tasks").insert([payload]).select("id").single();
    if (error) {
        console.error("createTaskAction error:", error.message);
        throw new Error("Failed to create task.");
    }

    // Tạo thông báo cho người tạo task (dùng admin client để bypass RLS)
    try {
        const adminSupabase = createAdminClient();
        await adminSupabase.from("notifications").insert([{
            user_id: user.id,
            project_id: column.board_id,
            task_id: insertedTask.id,
            content: `Tạo công việc thành công: ${payload.title}`,
            is_read: false,
        }]);
    } catch (notifErr) {
        console.error("createTaskAction notification error:", notifErr);
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
        .select("id, title, description, deadline, priority, column_id, assignee_id, position")
        .in("id", taskIds);

    if (fetchErr || !existingTasks) {
        console.error("bulkUpdateTasksAction fetch error:", fetchErr?.message);
        throw new Error("Failed to fetch existing tasks.");
    }

    // 2. Security Check: Collect all unique column IDs involved (both current and target)
    const involvedColumnIds = new Set<number>();

    // Add current column IDs
    existingTasks.forEach((task) => involvedColumnIds.add(task.column_id));

    // Add target column IDs from updates
    updates.forEach((update) => involvedColumnIds.add(update.column_id));

    // 3. Fetch board IDs for all involved columns
    const { data: columnsData, error: colsErr } = await supabase
        .from("columns")
        .select("id, board_id")
        .in("id", Array.from(involvedColumnIds));

    if (colsErr || !columnsData) {
        console.error("bulkUpdateTasksAction columns fetch error:", colsErr?.message);
        throw new Error("Failed to verify access.");
    }

    // 4. Verify access to all involved boards
    const involvedBoardIds = new Set<number>(columnsData.map(col => col.board_id));
    await verifyAllBoardsAccess(supabase, user.id, involvedBoardIds);

    // Merge changes
    const updatesMap = new Map(updates.map(u => [u.id, u]));
    const upsertData = existingTasks.map((task) => {
        const update = updatesMap.get(task.id)!;
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
