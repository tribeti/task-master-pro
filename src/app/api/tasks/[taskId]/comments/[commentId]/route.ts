import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────
// DELETE /api/tasks/[taskId]/comments/[commentId]
// Deletes a specific comment. Only the author can delete.
// ────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string; commentId: string }> },
) {
  try {
    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow deletion if the user is the owner of the comment
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("DELETE comment error:", error.message);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (err: any) {
    console.error("DELETE comment unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
