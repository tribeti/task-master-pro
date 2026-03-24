"use server";

import { createClient } from "@/utils/supabase/server";
import { Board } from "@/types/project";
import { revalidatePath } from "next/cache";

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

export const fetchUserBoardsAction = async (
  userId: string,
): Promise<Board[]> => {
  const supabase = await createClient();

  // SECURE: Verify session exists and matches the requested userId
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchUserBoardsAction error:", error.message);
    throw new Error("Failed to fetch projects.");
  }
  return (data as Board[]) || [];
};

export const deleteUserBoardAction = async (
  projectId: number,
  userId: string,
): Promise<void> => {
  const supabase = await createClient();

  // SECURE: Verify session exists and matches the requested userId
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  // SECURE: Verify user owns this board before any mutations
  await verifyBoardOwnership(supabase, userId, projectId);

  // Load columns for this board to determine DONE vs non-DONE locations
  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .select("id,title")
    .eq("board_id", projectId);

  if (columnsError) {
    console.error("deleteUserBoardAction error while fetching columns:", columnsError.message);
    throw new Error("Failed to delete project.");
  }
  const DONE_COLUMN_TITLE = 'done';
  const boardColumns = (columns as Array<{ id: number; title: string }>) || [];
  const { doneColumnIds, nonDoneColumnIds } = boardColumns.reduce(
    (acc, column) => {
      if (column.title?.trim().toLowerCase() === DONE_COLUMN_TITLE) {
        acc.doneColumnIds.push(column.id);
      } else {
        acc.nonDoneColumnIds.push(column.id);
      }
      return acc;
    },
    { doneColumnIds: [] as number[], nonDoneColumnIds: [] as number[] },
  );

  // Block if any task exists in non-DONE columns
  if (nonDoneColumnIds.length > 0) {
    const { data: nonDoneTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id")
      .in("column_id", nonDoneColumnIds);

    if (tasksError) {
      console.error("deleteUserBoardAction error while fetching tasks:", tasksError.message);
      throw new Error("Failed to delete project.");
    }

    if (nonDoneTasks && nonDoneTasks.length > 0) {
      throw new Error(
        "Cannot delete project while there are tasks outside the Done column. Please complete or move tasks to Done before deleting.",
      );
    }
  }

  // If we reach here, only DONE tasks may exist; clean up tasks and columns before deleting board.
  if (doneColumnIds.length > 0) {
    const { error: deleteTasksError } = await supabase
      .from("tasks")
      .delete()
      .in("column_id", doneColumnIds);

    if (deleteTasksError) {
      console.error("deleteUserBoardAction error while deleting done tasks:", deleteTasksError.message);
      throw new Error("Failed to delete project.");
    }
  }

  if (boardColumns.length > 0) {
    const { error: deleteColumnsError } = await supabase
      .from("columns")
      .delete()
      .eq("board_id", projectId);

    if (deleteColumnsError) {
      console.error("deleteUserBoardAction error while deleting columns:", deleteColumnsError.message);
      throw new Error("Failed to delete project.");
    }
  }

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", userId); // Double check owner_id even if RLS is enabled

  if (error) {
    console.error("deleteUserBoardAction error:", error.message);
    throw new Error("Failed to delete project.");
  }

  revalidatePath("/projects");
};

export const createNewBoardAction = async (
  userId: string,
  boardData: {
    title: string;
    description: string | null;
    is_private: boolean;
    color: string;
    tag: string;
  },
): Promise<Board> => {
  const supabase = await createClient();

  // SECURE: Verify session exists and matches the requested userId
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  // Validate input
  const cleanTitle = validateString(boardData.title, "Project title", 100);
  const cleanTag = validateString(boardData.tag, "Tag", 50);
  const cleanColor = validateString(boardData.color, "Color", 20);
  const cleanDescription = boardData.description
    ? boardData.description.trim().slice(0, 1000)
    : null;

  const { data, error } = await supabase
    .from("boards")
    .insert([
      {
        title: cleanTitle,
        description: cleanDescription,
        is_private: boardData.is_private,
        color: cleanColor,
        tag: cleanTag,
        owner_id: userId,
      },
    ])
    .select();

  if (error) {
    console.error("createNewBoardAction error:", error.message);
    throw new Error("Failed to create project.");
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create project: No data returned.");
  }

  revalidatePath("/projects");
  return data[0] as Board;
};

export const createDefaultColumnsAction = async (
  boardId: number,
): Promise<void> => {
  const supabase = await createClient();

  // SECURE: Verify session exists
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized access");
  }

  // SECURE: Verify the user is the owner of the boardId
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", user.id)
    .single();

  if (boardError || !board) {
    throw new Error("Access denied.");
  }

  const { error } = await supabase.from("columns").insert([
    { title: "To Do", board_id: boardId, position: 0 },
    { title: "In Progress", board_id: boardId, position: 1 },
    { title: "Done", board_id: boardId, position: 2 },
  ]);

  if (error) {
    console.error("createDefaultColumnsAction error:", error.message);
    throw new Error("Failed to create default columns.");
  }

  revalidatePath("/projects");
};

export const updateUserBoardAction = async (
  userId: string,
  boardId: number,
  boardData: Partial<Board>
): Promise<void> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  await verifyBoardOwnership(supabase, userId, boardId);

  const updates: any = {};
  if (boardData.title !== undefined) updates.title = validateString(boardData.title, "Project title", 100);
  if (boardData.description !== undefined) updates.description = boardData.description ? boardData.description.trim().slice(0, 1000) : null;
  if (boardData.color !== undefined) updates.color = validateString(boardData.color as string, "Color", 20);
  if (boardData.tag !== undefined) updates.tag = validateString(boardData.tag as string, "Tag", 50);
  if (boardData.is_private !== undefined) updates.is_private = boardData.is_private;

  const { error } = await supabase
    .from("boards")
    .update(updates)
    .eq("id", boardId);

  if (error) {
    console.error("updateUserBoardAction error:", error.message);
    throw new Error("Failed to update project.");
  }

  revalidatePath("/projects");
};
