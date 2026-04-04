import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, verifyAllBoardsAccess, validateString } from "@/utils/board-access";

export async function POST(request: Request) {
  try {
    const { projectId, title, position } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cleanTitle = validateString(title, "Column title", 100);

    await verifyBoardAccess(supabase, user.id, projectId);

    const { data, error } = await supabase
      .from("columns")
      .insert([{ title: cleanTitle, board_id: projectId, position }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Failed to create column." }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json();
    if (!updates || !updates.length) return NextResponse.json([]);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const columnIds = updates.map((u: any) => u.id);
    const { data: existingColumns, error: fetchErr } = await supabase
      .from("columns")
      .select("id, title, position, board_id")
      .in("id", columnIds);

    if (fetchErr || !existingColumns || existingColumns.length !== new Set(columnIds).size) {
      return NextResponse.json({ error: "Failed to fetch existing columns or some columns were not found." }, { status: 404 });
    }

    const involvedBoardIds = new Set<number>(existingColumns.map((col) => col.board_id));
    await verifyAllBoardsAccess(supabase, user.id, involvedBoardIds);

    const updatesMap = new Map(updates.map((u: any) => [u.id, u.position]));
    const upsertData = existingColumns.map((col) => ({
      ...col,
      position: updatesMap.get(col.id) ?? col.position,
    }));

    const { error } = await supabase.from("columns").upsert(upsertData, { onConflict: "id" });
    if (error) return NextResponse.json({ error: "Failed to bulk update columns." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
