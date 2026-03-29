import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Verify the current user is the owner of the given board.
 * @param supabase - Authenticated Supabase client (server-side).
 * @param userId  - The UUID of the current user.
 * @param boardId - The numeric ID of the board.
 * @returns `true` if the user owns the board, `false` otherwise.
 */
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

// ────────────────────────────────────────────────────────────────────────────
// GET /api/boards/[boardId]/members
// Returns all members of a board **including the board owner** at the top.
//
// Response shape: BoardMember[]
//   { user_id, role, joined_at, display_name, avatar_url }
//
// The board owner is injected with role = "Owner" and is always the first
// element in the array so the frontend can visually distinguish them.
// ────────────────────────────────────────────────────────────────────────────
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

    // ── Auth check ──
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Access check: owner OR member ──
    const [{ data: board }, { data: access }] = await Promise.all([
      supabase
        .from("boards")
        .select("owner_id, created_at")
        .eq("id", boardId)
        .single(),
      supabase
        .from("board_members")
        .select("user_id")
        .eq("board_id", boardId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const isOwner = board?.owner_id === user.id;
    const isMember = !!access;

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Fetch board members joined with users table ──
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

    // ── Fetch board owner profile from `users` table ──
    const { data: ownerProfile } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", board!.owner_id)
      .single();

    // Build the owner entry (always first in the list)
    const ownerEntry = {
      user_id: board!.owner_id,
      role: "Owner",
      joined_at: board!.created_at, // owner "joined" when they created the board
      display_name: ownerProfile?.display_name || "Unknown",
      avatar_url: ownerProfile?.avatar_url || null,
    };

    // Flatten regular members, excluding the owner to avoid duplicates
    const memberList = (members || [])
      .filter((m: any) => m.user_id !== board!.owner_id)
      .map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        display_name: m.users?.display_name || "Unknown",
        avatar_url: m.users?.avatar_url || null,
      }));

    return NextResponse.json([ownerEntry, ...memberList]);
  } catch (err: any) {
    console.error("GET members unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/boards/[boardId]/members
// Body: { email: string }
//
// **Invitation flow** – instead of adding the user directly, this endpoint:
//   1. Validates that the target user exists in auth.users.
//   2. Checks they are not already a member.
//   3. Checks there is no pending invitation already.
//   4. Creates a record in `board_invitations` with a unique token.
//   5. Sends an invitation email via Resend (if configured).
//   6. Returns the invitation details (status 201).
//
// The invitee must click the accept link to actually join the board.
// ────────────────────────────────────────────────────────────────────────────
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

    // ── Auth check ──
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Only the board owner can invite ──
    const isOwner = await verifyBoardOwnership(supabase, user.id, boardId);
    if (!isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ── Look up user by email in the public `users` table + auth ──
    // We query `auth.users` via the admin client's `listUsers` (the SDK
    // does not expose `getUserByEmail`).
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
        { error: "Không tìm thấy người dùng với email này" },
        { status: 404 },
      );
    }

    const targetUserId = targetAuthUser.id;

    // ── Cannot invite yourself ──
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Bạn không thể mời chính mình" },
        { status: 400 },
      );
    }

    // ── Check if already a member ──
    const { data: existingMember } = await supabase
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Người dùng đã là thành viên" },
        { status: 409 },
      );
    }

    // ── Check for existing pending invitation ──
    const { data: existingInvite } = await supabase
      .from("board_invitations")
      .select("id")
      .eq("board_id", boardId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "Lời mời đang chờ xử lý cho email này" },
        { status: 409 },
      );
    }

    // ── Create invitation record ──
    const { data: invitation, error: inviteError } = await supabase
      .from("board_invitations")
      .insert({
        board_id: boardId,
        inviter_id: user.id,
        email,
      })
      .select("id, token, created_at")
      .single();

    if (inviteError || !invitation) {
      console.error("Insert invitation error:", inviteError?.message);
      return NextResponse.json(
        { error: "Không thể tạo lời mời" },
        { status: 500 },
      );
    }

    // ── Build accept URL ──
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${appUrl}/api/boards/${boardId}/invitations/accept?token=${invitation.token}`;

    // ── Fetch board title for the email ──
    const { data: boardData } = await supabase
      .from("boards")
      .select("title")
      .eq("id", boardId)
      .single();

    // ── Get inviter display name ──
    const { data: inviterProfile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.display_name || user.email || "Someone";
    const boardTitle = boardData?.title || "a project";

    // ── Create In-App Notification ──
    try {
      const payload = JSON.stringify({
        token: invitation.token,
        acceptUrl: acceptUrl,
        inviterName: inviterName,
        boardTitle: boardTitle,
      });

      const { error: notifError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: targetUserId,
            type: "Invite",
            content: payload,
            is_read: false,
            project_id: boardId,
          },
        ]);

      if (notifError) {
        console.error("Failed to create in-app notification:", notifError);
      } else {
      }
    } catch (notifErr) {
      console.error("Failed to create in-app notification payload:", notifErr);
    }

    return NextResponse.json(
      {
        invitation_id: invitation.id,
        email,
        status: "pending",
        created_at: invitation.created_at,
        accept_url: acceptUrl,
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
