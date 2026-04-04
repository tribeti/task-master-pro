import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess } from "@/utils/board-access";

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);
  try {
    const { labelId } = await request.json();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    // Single query with join instead of two sequential round-trips
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .select("columns(board_id)")
      .eq("id", taskId)
      .single();
    if (taskErr || !task)
      return NextResponse.json({ error: "Task not found." }, { status: 404 });

    const column = (task as any).columns;
    if (!column)
      return NextResponse.json({ error: "Column not found." }, { status: 404 });

    const { data: label, error: labelErr } = await supabase
      .from("labels")
      .select("id, board_id")
      .eq("id", labelId)
      .single();
    if (labelErr || !label)
      return NextResponse.json({ error: "Label not found." }, { status: 404 });

    if (label.board_id !== column.board_id) {
      return NextResponse.json(
        { error: "Label does not belong to this board." },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("task_labels")
      .upsert([{ task_id: taskId, label_id: labelId }], {
        onConflict: "task_id,label_id",
        ignoreDuplicates: true,
      });
    if (error)
      return NextResponse.json(
        { error: "Failed to add label to task." },
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
export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const { searchParams } = new URL(request.url);
    const labelIdParam = searchParams.get("labelId");
    if (!labelIdParam)
      return NextResponse.json(
        { error: "labelId is required" },
        { status: 400 },
      );
    const labelId = parseInt(labelIdParam);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    const { error } = await supabase
      .from("task_labels")
      .delete()
      .eq("task_id", taskId)
      .eq("label_id", labelId);

    if (error)
      return NextResponse.json(
        { error: "Failed to remove label from task." },
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
