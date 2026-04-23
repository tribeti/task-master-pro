import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, validateString } from "@/utils/board-access";

export async function POST(request: Request) {
  try {
    const { boardId, name, color_hex } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cleanName = validateString(name, "Label name", 50);

    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color_hex)) {
      return NextResponse.json({ error: "Invalid color format." }, { status: 400 });
    }

    await verifyBoardAccess(supabase, user.id, boardId);

    const { data: label, error } = await supabase
      .from("labels")
      .insert([{ name: cleanName, color_hex, board_id: boardId }])
      .select("id, name, color_hex, board_id")
      .single();

    if (error || !label) return NextResponse.json({ error: "Failed to create label." }, { status: 500 });

    return NextResponse.json(label);
  } catch (error) {
    console.error("POST /api/kanban/labels failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
