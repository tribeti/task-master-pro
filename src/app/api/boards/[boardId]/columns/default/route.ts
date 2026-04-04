import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardOwnership } from "@/utils/verify-board-ownership";

// ────────────────────────────────────────────────
// POST /api/boards/[boardId]/columns/default
// Seeds a board with the default columns: To Do, In Progress, Done.
// Only the board owner may call this.
// ────────────────────────────────────────────────
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId: boardIdStr } = await params;
    const boardId = Number(boardIdStr);
    if (isNaN(boardId)) {
      return NextResponse.json({ error: "Invalid boardId" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = await verifyBoardOwnership(supabase, user.id, boardId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { error } = await supabase.from("columns").insert([
      { title: "To Do", board_id: boardId, position: 0 },
      { title: "In Progress", board_id: boardId, position: 1 },
      { title: "Done", board_id: boardId, position: 2 },
    ]);

    if (error) {
      console.error(
        "POST /api/boards/[boardId]/columns/default error:",
        error.message,
      );
      return NextResponse.json(
        { error: "Failed to create default columns." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error(
      "POST /api/boards/[boardId]/columns/default unexpected error:",
      err,
    );
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
