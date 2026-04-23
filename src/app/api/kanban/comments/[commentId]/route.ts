import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess } from "@/utils/board-access";

type RouteContext = { params: Promise<{ commentId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { commentId: commentIdStr } = await context.params;
  const commentId = parseInt(commentIdStr, 10);

  if (isNaN(commentId)) {
    return NextResponse.json({ error: "Invalid comment ID." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: comment, error: commentErr } = await supabase
      .from("comments")
      .select("id, user_id, task_id")
      .eq("id", commentId)
      .single();

    if (commentErr || !comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

    await verifyTaskAccess(supabase, user.id, comment.task_id);

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
    }

    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) return NextResponse.json({ error: "Failed to delete comment." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
