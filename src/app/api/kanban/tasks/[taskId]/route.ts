import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  verifyBoardAccess,
  verifyTaskAccess,
  validateString,
} from "@/utils/board-access";

export async function PUT(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const payload = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (payload.title !== undefined) {
      validateString(payload.title, "Task title", 200);
    }
    if (
      payload.description !== undefined &&
      payload.description !== null &&
      payload.description !== ""
    ) {
      validateString(payload.description, "Description", 2000);
    }

    await verifyTaskAccess(supabase, user.id, taskId);

    if (payload.column_id !== undefined) {
      const { data: targetCol, error: targetErr } = await supabase
        .from("columns")
        .select("board_id")
        .eq("id", payload.column_id)
        .single();

      if (targetErr || !targetCol)
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      await verifyBoardAccess(supabase, user.id, targetCol.board_id);
    }

    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .select("*, column:columns(board_id)")
      .single();

    if (error)
      return NextResponse.json(
        { error: "Failed to update task." },
        { status: 500 },
      );

    // If deadline was updated and is urgent, instantly notify assignee
    if (payload.deadline !== undefined && updatedTask.deadline && updatedTask.assignee_id && !updatedTask.is_completed) {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(now.getDate() + 3);
        
        if (new Date(updatedTask.deadline) <= threeDaysFromNow) {
          const { createAdminClient } = await import("@/utils/supabase/admin");
          const { getDeadlineStatus } = await import("@/utils/deadline");
          
          const adminSupabase = createAdminClient();
          const status = getDeadlineStatus(updatedTask.deadline);
          
          let boardIdToUse = Array.isArray(updatedTask.column) ? updatedTask.column[0]?.board_id : updatedTask.column?.board_id;

          const { data: existingDeadlineNotif } = await adminSupabase
            .from("notifications")
            .select("id")
            .eq("user_id", updatedTask.assignee_id)
            .eq("task_id", taskId)
            .eq("type", "deadline")
            .like("content", `%${status.urgencyStr}%`)
            .maybeSingle();

          if (!existingDeadlineNotif) {
            await adminSupabase.from("notifications").insert([{
              user_id: updatedTask.assignee_id,
              project_id: boardIdToUse,
              task_id: taskId,
              type: "deadline",
              content: `Sắp đến hạn: Nhiệm vụ "${updatedTask.title}" (Hạn chót: ${status.urgencyStr})[DEADLINE_ISO:${updatedTask.deadline}]`,
              is_read: false
            }]);
          }
        }
      } catch (e) {
        console.error("Instant deadline evaluation error on PUT", e);
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error)
      return NextResponse.json(
        { error: "Failed to delete task." },
        { status: 500 },
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
