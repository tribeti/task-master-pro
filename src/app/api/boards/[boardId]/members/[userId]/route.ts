import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; userId: string }> },
) {
  try {
    const { boardId: boardIdStr, userId: targetUserId } = await params;
    const boardId = Number(boardIdStr);

    if (isNaN(boardId) || !targetUserId) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // ── Auth check ──
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Owner check ──
    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("owner_id")
      .eq("id", boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (board.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Only the board owner can remove members" },
        { status: 403 },
      );
    }

    // You cannot remove the owner
    if (board.owner_id === targetUserId) {
      return NextResponse.json(
        { error: "Cannot remove the board owner" },
        { status: 400 },
      );
    }

    // ── Find all tasks of the board & unassign the removed user ──
    const { data: columns, error: colsError } = await supabase
      .from("columns")
      .select("id")
      .eq("board_id", boardId);

    if (colsError) {
      console.error("Failed to fetch columns:", colsError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 },
      );
    }

    if (columns && columns.length > 0) {
      const columnIds = columns.map((c) => c.id);

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .in("column_id", columnIds);

      if (tasksError) {
        console.error("Failed to fetch tasks:", tasksError);
        return NextResponse.json(
          { error: "Failed to remove member" },
          { status: 500 },
        );
      }

      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map((t) => t.id);

        const { data: affectedAssignees, error: assigneesError } =
          await supabase
            .from("task_assignees")
            .select("task_id")
            .eq("user_id", targetUserId)
            .in("task_id", taskIds);

        if (assigneesError) {
          console.error("Failed to fetch assignees:", assigneesError);
          return NextResponse.json(
            { error: "Failed to remove member" },
            { status: 500 },
          );
        }

        if (affectedAssignees && affectedAssignees.length > 0) {
          const affectedTaskIds = affectedAssignees.map((a) => a.task_id);

          // Remove the assignees
          const { error: deleteAssigneesError } = await supabase
            .from("task_assignees")
            .delete()
            .eq("user_id", targetUserId)
            .in("task_id", affectedTaskIds);

          if (deleteAssigneesError) {
            console.error(
              "Failed to delete task assignees:",
              deleteAssigneesError,
            );
            return NextResponse.json(
              { error: "Failed to remove member" },
              { status: 500 },
            );
          }

          // Re-sync primary assignees for affected tasks one by one
          for (const tId of affectedTaskIds) {
            const { data: assigneeRows, error: syncFetchError } = await supabase
              .from("task_assignees")
              .select("user_id, assigned_at, id")
              .eq("task_id", tId)
              .order("assigned_at", { ascending: true })
              .order("id", { ascending: true });

            if (syncFetchError) {
              console.error(
                "Failed to fetch remaining assignees:",
                syncFetchError,
              );
              return NextResponse.json(
                { error: "Failed to remove member" },
                { status: 500 },
              );
            }

            const primaryAssigneeId = assigneeRows?.[0]?.user_id || null;

            const { error: syncUpdateError } = await supabase
              .from("tasks")
              .update({ assignee_id: primaryAssigneeId })
              .eq("id", tId);

            if (syncUpdateError) {
              console.error(
                "Failed to sync primary assignee:",
                syncUpdateError,
              );
              return NextResponse.json(
                { error: "Failed to remove member" },
                { status: 500 },
              );
            }
          }
        }
      }
    }

    // ── Remove from board_members ──
    const { error: deleteError } = await supabase
      .from("board_members")
      .delete()
      .eq("board_id", boardId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Failed to remove board member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE board member unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
