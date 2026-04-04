import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateString } from "@/utils/validate-string";
import { verifyBoardOwnership } from "@/utils/verify-board-ownership";
import { Board } from "@/types/project";

// ────────────────────────────────────────────────
// PUT /api/boards/[boardId]
// Updates a board's metadata. Only the board owner may update.
// Body: Partial<Board> — { title?, description?, color?, tag?, is_private? }
// ────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
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

    const boardData: Partial<Board> = await request.json();

    const updates: Partial<Board> = {};
    if (boardData.title !== undefined)
      updates.title = validateString(boardData.title, "Project title", 100);
    if (boardData.description !== undefined)
      updates.description = boardData.description
        ? boardData.description.trim().slice(0, 1000)
        : null;
    if (boardData.color !== undefined)
      updates.color = validateString(boardData.color as string, "Color", 20);
    if (boardData.tag !== undefined)
      updates.tag = validateString(boardData.tag as string, "Tag", 50);
    if (boardData.is_private !== undefined)
      updates.is_private = boardData.is_private;

    const { error } = await supabase
      .from("boards")
      .update(updates)
      .eq("id", boardId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("PUT /api/boards/[boardId] error:", error.message);
      return NextResponse.json(
        { error: "Failed to update project." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Error && !err.message.startsWith("Internal")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("PUT /api/boards/[boardId] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────
// DELETE /api/boards/[boardId]
// Deletes a board atomically via an RPC function.
// Only the board owner may delete.
// Blocks if any tasks exist outside the "Done" column.
// ────────────────────────────────────────────────
export async function DELETE(
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

    const { error } = await supabase.rpc("delete_board", {
      p_board_id: boardId,
      p_owner_id: user.id,
    });

    if (error) {
      // Map Postgres error codes from the RPC function to HTTP statuses
      if (error.code === "P0002") {
        return NextResponse.json(
          { error: "Board not found." },
          { status: 404 },
        );
      }
      if (error.code === "P0003") {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }
      if (error.code === "P0004") {
        return NextResponse.json(
          {
            error:
              "Cannot delete project while there are tasks outside the Done column. Please complete or move tasks to Done before deleting.",
          },
          { status: 409 },
        );
      }

      console.error("DELETE /api/boards/[boardId] RPC error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete project." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/boards/[boardId] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
