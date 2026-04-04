import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess, getTaskBoardId, ensureBoardMember, syncPrimaryAssignee } from "@/utils/board-access";

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const { userId: assigneeId } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);
    const boardId = await getTaskBoardId(supabase, taskId);

    const { data: assignee, error: assigneeErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", assigneeId)
      .single();

    if (assigneeErr || !assignee) return NextResponse.json({ error: "Assignee not found." }, { status: 404 });

    await ensureBoardMember(supabase, boardId, assigneeId);

    const { error: insertAssigneeErr } = await supabase
      .from("task_assignees")
      .upsert(
        { task_id: taskId, user_id: assigneeId },
        { onConflict: "task_id,user_id", ignoreDuplicates: true }
      );

    if (insertAssigneeErr) return NextResponse.json({ error: "Failed to add assignee." }, { status: 500 });

    await syncPrimaryAssignee(supabase, taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const { searchParams } = new URL(request.url);
    const removeAll = searchParams.get("removeAll") === "true";
    const assigneeId = searchParams.get("userId");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    if (removeAll) {
      const { error: deleteAssigneesErr } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);

      if (deleteAssigneesErr) return NextResponse.json({ error: "Failed to remove all assignees." }, { status: 500 });
    } else {
      if (!assigneeId) return NextResponse.json({ error: "userId is required when removeAll is false" }, { status: 400 });
      
      const { error: deleteAssigneeErr } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", assigneeId);

      if (deleteAssigneeErr) return NextResponse.json({ error: "Failed to remove assignee." }, { status: 500 });
    }

    await syncPrimaryAssignee(supabase, taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
