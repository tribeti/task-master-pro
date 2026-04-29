import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, validateString, ValidationError } from "@/utils/board-access";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate body is a non-null plain object and not an Array
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { boardId, name, color_hex } = body;
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu." }, { status: 500 });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let cleanName;
    try {
      cleanName = validateString(name, "Label name", 50);
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 },
        );
      }
      console.error("Unexpected error during validation:", error);
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 },
      );
    }

    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color_hex)) {
      return NextResponse.json(
        { error: "Invalid color format." },
        { status: 400 },
      );
    }

    await verifyBoardAccess(supabase, user.id, boardId);

    const { data: label, error } = await supabase
      .from("labels")
      .insert([{ name: cleanName, color_hex, board_id: boardId }])
      .select("id, name, color_hex, board_id")
      .single();

    if (error || !label)
      return NextResponse.json(
        { error: "Failed to create label." },
        { status: 500 },
      );

    return NextResponse.json(label);
  } catch (error) {
    console.error("POST /api/kanban/labels failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
