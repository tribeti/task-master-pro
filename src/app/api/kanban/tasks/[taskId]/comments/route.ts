import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess, validateString } from "@/utils/board-access";

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const taskId = parseInt(params.taskId);

  try {
    const { content } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await verifyTaskAccess(supabase, user.id, taskId);

    const cleanContent = validateString(content, "Comment", 2000);

    const payload = {
      content: cleanContent,
      task_id: taskId,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("comments")
      .insert([payload])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message || "Failed to create comment." }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
