import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, validateString } from "@/utils/board-access";

export async function PUT(request: Request, context: any) {
  const params = await context.params;
  const columnId = parseInt(params.columnId);

  try {
    const payload = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Whitelist: only allow title and position to be updated
    const updatePayload: Record<string, unknown> = {};
    if (payload.title !== undefined) {
      updatePayload.title = validateString(payload.title, "Column title", 100);
    }
    if (payload.position !== undefined) {
      const pos = Number(payload.position);
      if (!Number.isInteger(pos) || pos < 0) {
        return NextResponse.json({ error: "Invalid position." }, { status: 400 });
      }
      updatePayload.position = pos;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { data: column, error: colErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", columnId)
      .single();

    if (colErr || !column) return NextResponse.json({ error: "Column not found." }, { status: 404 });
    await verifyBoardAccess(supabase, user.id, column.board_id);

    const { error } = await supabase.from("columns").update(updatePayload).eq("id", columnId);
    if (error) return NextResponse.json({ error: "Không thể cập nhật cột lúc này." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const columnId = parseInt(params.columnId);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: column, error: colErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", columnId)
      .single();

    if (colErr || !column) return NextResponse.json({ error: "Column not found." }, { status: 404 });
    await verifyBoardAccess(supabase, user.id, column.board_id);

    const { count, error: countError } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("column_id", columnId);

    if (countError) return NextResponse.json({ error: "Không thể xóa cột lúc này." }, { status: 500 });
    if (count && count > 0) return NextResponse.json({ error: "Không thể xóa cột vẫn còn chứa task." }, { status: 400 });

    const { error } = await supabase.from("columns").delete().eq("id", columnId);
    if (error) return NextResponse.json({ error: "Không thể xóa cột lúc này." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
