import { createClient } from "@/utils/supabase/server";

export async function verifyBoardAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
) {
  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (board) return;

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

export async function verifyAllBoardsAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardIds: Set<number> | number[],
) {
  const ids = Array.from(boardIds);
  if (ids.length === 0) return;

  // Query 1: Lấy tất cả boards mà user là OWNER
  // Query 2: Lấy tất cả boards mà user là MEMBER
  const [ownedBoardsResult, memberBoardsResult] = await Promise.all([
    supabase.from("boards").select("id").eq("owner_id", userId).in("id", ids),
    supabase
      .from("board_members")
      .select("board_id")
      .eq("user_id", userId)
      .in("board_id", ids),
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

export async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  taskId: number,
) {
  const { data, error } = await supabase
    .from("tasks")
    .select("columns(board_id)")
    .eq("id", taskId)
    .single();

  const boardId = (data as { columns: { board_id: number } | null } | null)
    ?.columns?.board_id;

  if (error || !boardId) {
    throw new Error("Access denied.");
  }

  await verifyBoardAccess(supabase, userId, boardId);
}

export async function getTaskBoardId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("tasks")
    .select("columns(board_id)")
    .eq("id", taskId)
    .single();

  const boardId = (data as { columns: { board_id: number } | null } | null)
    ?.columns?.board_id;
  if (error || !boardId) {
    throw new Error("Task or associated column not found.");
  }

  return boardId;
}

export async function ensureBoardMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  boardId: number,
  userId: string,
) {
  const { data: board, error: boardErr } = await supabase
    .from("boards")
    .select("owner_id")
    .eq("id", boardId)
    .single();

  if (boardErr || !board) {
    throw new Error("Board not found.");
  }

  if (board.owner_id === userId) {
    return;
  }

  const { data: membership } = await supabase
    .from("board_members")
    .select("id")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) {
    return;
  }

  const { error: insertMemberErr } = await supabase
    .from("board_members")
    .insert({
      board_id: boardId,
      user_id: userId,
      role: "Member",
    });

  if (insertMemberErr) {
    console.error("ensureBoardMember error:", insertMemberErr.message);
    throw new Error("Failed to add assignee to board.");
  }
}

export async function syncPrimaryAssignee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: number,
) {
  const { data: assigneeRows, error: assigneeRowsErr } = await supabase
    .from("task_assignees")
    .select("user_id, assigned_at, id")
    .eq("task_id", taskId)
    .order("assigned_at", { ascending: true })
    .order("id", { ascending: true });

  if (assigneeRowsErr) {
    console.error("syncPrimaryAssignee fetch error:", assigneeRowsErr.message);
    throw new Error("Failed to sync assignees.");
  }

  const primaryAssigneeId = assigneeRows?.[0]?.user_id || null;

  const { error: updateTaskErr } = await supabase
    .from("tasks")
    .update({ assignee_id: primaryAssigneeId })
    .eq("id", taskId);

  if (updateTaskErr) {
    console.error("syncPrimaryAssignee update error:", updateTaskErr.message);
    throw new Error("Failed to sync assignees.");
  }
}

// Re-export from dedicated utility for backward compatibility
export { validateString } from "@/utils/validate-string";
