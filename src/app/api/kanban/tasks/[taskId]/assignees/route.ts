import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  verifyTaskAccess,
  getTaskBoardId,
  ensureBoardMember,
  syncPrimaryAssignee,
} from "@/utils/board-access";

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const { userId: assigneeId } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    const [boardId, { data: assignee, error: assigneeErr }] = await Promise.all(
      [
        getTaskBoardId(supabase, taskId),
        supabase.from("users").select("id").eq("id", assigneeId).single(),
      ],
    );

    if (assigneeErr || !assignee)
      return NextResponse.json(
        { error: "Assignee not found." },
        { status: 404 },
      );

    await ensureBoardMember(supabase, boardId, assigneeId);

    const { error: insertAssigneeErr } = await supabase
      .from("task_assignees")
      .upsert(
        { task_id: taskId, user_id: assigneeId },
        { onConflict: "task_id,user_id", ignoreDuplicates: true },
      );

    if (insertAssigneeErr)
      return NextResponse.json(
        { error: "Failed to add assignee." },
        { status: 500 },
      );

    await syncPrimaryAssignee(supabase, taskId);

    // Thêm logic gửi Notification
    try {
      const adminSupabase = createAdminClient();

      const [taskResponse, assignerResponse] = await Promise.all([
        adminSupabase.from("tasks").select("title, deadline, is_completed").eq("id", taskId).single(),
        adminSupabase.from("users").select("display_name").eq("id", user.id).single()
      ]);

      const taskTitle = taskResponse.data?.title || "một nhiệm vụ";
      const assignerName = assignerResponse.data?.display_name || "Ai đó";

      const { error: insertErr } = await adminSupabase.from("notifications").insert([{
        user_id: assigneeId,
        project_id: boardId,
        task_id: taskId,
        type: "System", // Added to satisfy NOT NULL constraint
        content: `${assignerName} đã giao cho bạn nhiệm vụ: ${taskTitle}`,
        is_read: false
      }]);

      if (insertErr) {
        console.error("Supabase insert error (Notification):", insertErr);
      }

      // Also instantly evaluate and generate Deadline notification if urgent
      if (taskResponse.data?.deadline && !taskResponse.data.is_completed) {
        // Check if urgent
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(now.getDate() + 3);
        
        if (new Date(taskResponse.data.deadline) <= threeDaysFromNow) {
          // It's urgent! We must import getDeadlineStatus to get the localized string
          const { getDeadlineStatus } = await import("@/utils/deadline");
          const status = getDeadlineStatus(taskResponse.data.deadline);
          
          await adminSupabase.from("notifications").insert([{
            user_id: assigneeId,
            project_id: boardId,
            task_id: taskId,
            type: "deadline",
            content: `Sắp đến hạn: Nhiệm vụ "${taskTitle}" (Hạn chót: ${status.urgencyStr})[DEADLINE_ISO:${taskResponse.data.deadline}]`,
            is_read: false
          }]);
        }
      }

    } catch (e: any) {
      console.error("Failed to insert notification exception:", e);
    }
    return NextResponse.json({ success: true });
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
    const { searchParams } = new URL(request.url);
    const removeAll = searchParams.get("removeAll") === "true";
    const assigneeId = searchParams.get("userId");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    if (removeAll) {
      const { error: deleteAssigneesErr } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId);

      if (deleteAssigneesErr)
        return NextResponse.json(
          { error: "Failed to remove all assignees." },
          { status: 500 },
        );
    } else {
      if (!assigneeId)
        return NextResponse.json(
          { error: "userId is required when removeAll is false" },
          { status: 400 },
        );

      const { error: deleteAssigneeErr } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", assigneeId);

      if (deleteAssigneeErr)
        return NextResponse.json(
          { error: "Failed to remove assignee." },
          { status: 500 },
        );
    }

    await syncPrimaryAssignee(supabase, taskId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
