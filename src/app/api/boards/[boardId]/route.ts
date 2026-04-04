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
      .eq("id", boardId);

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
// Deletes a board. Only the board owner may delete.
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

    const isOwner = await verifyBoardOwnership(supabase, user.id, boardId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    // Load columns for this board to determine DONE vs non-DONE locations
    const { data: columns, error: columnsError } = await supabase
      .from("columns")
      .select("id,title")
      .eq("board_id", boardId);

    if (columnsError) {
      console.error(
        "DELETE /api/boards/[boardId] error fetching columns:",
        columnsError.message,
      );
      return NextResponse.json(
        { error: "Failed to delete project." },
        { status: 500 },
      );
    }

    const DONE_COLUMN_TITLE = "done";
    const boardColumns =
      (columns as Array<{ id: number; title: string }>) || [];
    const { doneColumnIds, nonDoneColumnIds } = boardColumns.reduce(
      (acc, column) => {
        if (column.title?.trim().toLowerCase() === DONE_COLUMN_TITLE) {
          acc.doneColumnIds.push(column.id);
        } else {
          acc.nonDoneColumnIds.push(column.id);
        }
        return acc;
      },
      { doneColumnIds: [] as number[], nonDoneColumnIds: [] as number[] },
    );

    // Block if any task exists in non-DONE columns
    if (nonDoneColumnIds.length > 0) {
      const { data: nonDoneTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .in("column_id", nonDoneColumnIds);

      if (tasksError) {
        console.error(
          "DELETE /api/boards/[boardId] error fetching tasks:",
          tasksError.message,
        );
        return NextResponse.json(
          { error: "Failed to delete project." },
          { status: 500 },
        );
      }

      if (nonDoneTasks && nonDoneTasks.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete project while there are tasks outside the Done column. Please complete or move tasks to Done before deleting.",
          },
          { status: 409 },
        );
      }
    }

    // Clean up DONE tasks before deleting board
    if (doneColumnIds.length > 0) {
      const { error: deleteTasksError } = await supabase
        .from("tasks")
        .delete()
        .in("column_id", doneColumnIds);

      if (deleteTasksError) {
        console.error(
          "DELETE /api/boards/[boardId] error deleting done tasks:",
          deleteTasksError.message,
        );
        return NextResponse.json(
          { error: "Failed to delete project." },
          { status: 500 },
        );
      }
    }

    // Delete columns
    if (boardColumns.length > 0) {
      const { error: deleteColumnsError } = await supabase
        .from("columns")
        .delete()
        .eq("board_id", boardId);

      if (deleteColumnsError) {
        console.error(
          "DELETE /api/boards/[boardId] error deleting columns:",
          deleteColumnsError.message,
        );
        return NextResponse.json(
          { error: "Failed to delete project." },
          { status: 500 },
        );
      }
    }

    // Delete the board itself
    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", boardId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("DELETE /api/boards/[boardId] error:", error.message);
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
