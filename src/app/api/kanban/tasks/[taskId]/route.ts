import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, verifyTaskAccess, validateString } from "@/utils/board-access";

export async function PUT(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const payload = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (payload.title !== undefined) {
      validateString(payload.title, "Task title", 200);
    }
    if (payload.description !== undefined && payload.description !== null && payload.description !== "") {
      validateString(payload.description, "Description", 2000);
    }

    await verifyTaskAccess(supabase, user.id, taskId);

    if (payload.column_id !== undefined) {
      const { data: targetCol, error: targetErr } = await supabase
        .from("columns")
        .select("board_id")
        .eq("id", payload.column_id)
        .single();

      if (targetErr || !targetCol) return NextResponse.json({ error: "Access denied." }, { status: 403 });
      await verifyBoardAccess(supabase, user.id, targetCol.board_id);
    }

    const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
    if (error) return NextResponse.json({ error: "Failed to update task." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
