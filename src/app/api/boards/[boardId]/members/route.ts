import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// ── Helper: Verify current user is the board owner ──
async function verifyBoardOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
) {
  const { data: board, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .single();

  if (error || !board) {
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────
// GET /api/boards/[boardId]/members
// Returns all members of a board with user info
// ────────────────────────────────────────────────
export async function GET(
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

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user has access to the board (owner or member)
    const isOwner = await verifyBoardOwnership(supabase, user.id, boardId);
    let isMember = false;
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("board_members")
        .select("user_id")
        .eq("board_id", boardId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (membership) {
        isMember = true;
      }
    }

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch board members joined with users table
    const { data: members, error } = await supabase
      .from("board_members")
      .select(
        `
        user_id,
        role,
        joined_at,
        users (
          id,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("board_id", boardId);

    if (error) {
      console.error("GET /api/boards/[boardId]/members error:", error);
      return NextResponse.json(
        { error: "Failed to fetch members: " + error.message, details: error },
        { status: 500 },
      );
    }

    // Flatten the response for easier frontend consumption
    const result = (members || []).map((m: any) => ({
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      display_name: m.users?.display_name || "Unknown",
      avatar_url: m.users?.avatar_url || null,
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET members unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────
// POST /api/boards/[boardId]/members
// Body: { email: string }
// Adds a member to the board by email
// ────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId: boardIdStr } = await params;
    const boardId = Number(boardIdStr);
    if (isNaN(boardId)) {
      return NextResponse.json({ error: "Invalid boardId" }, { status: 400 });
    }

    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the current user is the board owner
    const isOwner = await verifyBoardOwnership(supabase, user.id, boardId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── AC3: Look up user by email in auth.users using admin client ──
    const adminClient = createAdminClient();
    const { data: authListData, error: authError } =
      await adminClient.auth.admin.listUsers();

    if (authError) {
      console.error("Admin listUsers error:", authError.message);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const targetAuthUser = authListData.users.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!targetAuthUser) {
      return NextResponse.json(
        { error: "Không tìm thấy người dùng" },
        { status: 404 },
      );
    }

    const targetUserId = targetAuthUser.id;

    // ── AC2: Check if member already exists ──
    const { data: existingMember } = await supabase
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Thành viên đã tồn tại" },
        { status: 409 },
      );
    }

    // ── AC1: Insert new board member ──
    const { error: insertError } = await supabase.from("board_members").insert({
      user_id: targetUserId,
      board_id: boardId,
      role: "Member",
    });

    if (insertError) {
      console.error("Insert board member error:", insertError.message);
      return NextResponse.json(
        { error: "Failed to add member" },
        { status: 500 },
      );
    }

    // Return the new member info for immediate UI update
    const { data: newUserData } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", targetUserId)
      .single();

    return NextResponse.json(
      {
        user_id: targetUserId,
        role: "Member",
        joined_at: new Date().toISOString(),
        display_name: newUserData?.display_name || targetAuthUser.email,
        avatar_url: newUserData?.avatar_url || null,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("POST members unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err?.message || String(err)) },
      { status: 500 },
    );
  }
}
