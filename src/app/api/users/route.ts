import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type UserRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

async function verifyBoardAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
) {
  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (board) return;

  const { data: membership } = await supabase
    .from("board_members")
    .select("user_id")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Access denied.");
  }
}

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

    const { data: boardMembers, error: membersError } = await supabase
      .from("board_members")
      .select("user_id, role")
      .eq("board_id", boardId);

    if (membersError) {
      console.error("GET /api/users board_members error:", membersError.message);
      return NextResponse.json(
        { error: "Failed to load users." },
        { status: 500 },
      );
    }

    const memberRows =
      (boardMembers as { user_id: string; role: string | null }[]) || [];
    const memberRoleMap = new Map(
      memberRows.map((member) => [member.user_id, member.role ?? null]),
    );
    const relevantUserIds = Array.from(
      new Set([board.owner_id, ...memberRows.map((member) => member.user_id)]),
    );

    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", relevantUserIds)
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
      role: item.id === board.owner_id ? "Owner" : (memberRoleMap.get(item.id) ?? null),
      is_board_member: true,
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
