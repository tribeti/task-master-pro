import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────
// DELETE /api/comments/[commentId]
// Deletes a specific comment if the user is the author
// and has access to the board.
// ────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const { commentId: commentIdStr } = await params;
    const commentId = Number(commentIdStr);
    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch the comment to check authorship and find taskId
    const { data: comment, error: commentErr } = await supabase
      .from("comments")
      .select("id, user_id, task_id")
      .eq("id", commentId)
      .single();

    if (commentErr || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 2. Check authorship
    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
    }

    // 3. Verify access to the task/board
    // Resolve task → column → board to verify access
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("column_id")
      .eq("id", comment.task_id)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: "Task not found associated with this comment" }, { status: 404 });
    }

    const { data: column, error: colErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", task.column_id)
      .single();

    if (colErr || !column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const { data: board } = await supabase
      .from("boards")
      .select("id")
      .eq("id", column.board_id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!board) {
      const { data: membership } = await supabase
        .from("board_members")
        .select("user_id")
        .eq("board_id", column.board_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Access denied to the project" }, { status: 403 });
      }
    }

    // 4. Perform deletion
    const { error: deleteErr } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (deleteErr) {
      console.error("DELETE comment error:", deleteErr.message);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE comment unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
