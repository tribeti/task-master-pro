import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess } from "@/utils/board-access";

type UserRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type BoardMemberRow = {
  user_id: string;
};

export async function GET(request: NextRequest) {
  try {
    const boardIdParam = request.nextUrl.searchParams.get("boardId");
    const boardId = Number(boardIdParam);

    if (!boardIdParam || Number.isNaN(boardId)) {
      return NextResponse.json(
        { error: "boardId query param is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await verifyBoardAccess(supabase, user.id, boardId);

    const { data: board, error: boardError } = await supabase
      .from("boards")
      .select("owner_id")
      .eq("id", boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    }

    const { data: boardMembers, error: boardMembersError } = await supabase
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardId);

    if (boardMembersError) {
      console.error("GET /api/users board members error:", boardMembersError.message);
      return NextResponse.json(
        { error: "Failed to load users." },
        { status: 500 },
      );
    }

    const memberIds = Array.from(
      new Set([
        board.owner_id,
        ...(((boardMembers as BoardMemberRow[] | null) ?? []).map(
          (member) => member.user_id,
        )),
      ]),
    );

    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", memberIds)
      .order("display_name", { ascending: true });

    if (error) {
      console.error("GET /api/users error:", error.message);
      return NextResponse.json(
        { error: "Failed to load users." },
        { status: 500 },
      );
    }

    const users = ((data as UserRow[]) || []).map((item) => ({
      user_id: item.id,
      display_name: item.display_name || "Unknown",
      avatar_url: item.avatar_url || null,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === "Access denied.") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    console.error("GET /api/users unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error.message || String(error)) },
      { status: 500 },
    );
  }
}
