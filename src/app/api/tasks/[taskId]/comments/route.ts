import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Comment } from "@/types/project";

// ────────────────────────────────────────────────
// GET /api/tasks/[taskId]/comments
// Returns all comments for a task, accessible by owners and members
// ────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve task → column → board to verify access
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("column_id")
      .eq("id", taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: column, error: colErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", task.column_id)
      .single();

    if (colErr || !column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Check owner or member
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET comments error:", error.message);
      return NextResponse.json(
        { error: "Failed to load comments." },
        { status: 500 },
      );
    }

    return NextResponse.json((data as Comment[]) || []);
  } catch (err: any) {
    console.error("GET comments unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
