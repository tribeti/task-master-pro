import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────────────────────────────────
// GET /api/boards/[boardId]/invitations/accept?token=<uuid>
//
// Handles the invitation accept flow:
//   1. Validates the token against `board_invitations`.
//   2. Ensures the invitation is still "pending".
//   3. Looks up the authenticated user and verifies the email matches.
//   4. Inserts the user into `board_members` with role "Member".
//   5. Updates the invitation status to "accepted".
//   6. Redirects the user to the board page.
//
// If the user is not logged in, they are redirected to the login page
// with a `redirectTo` parameter so they come back after authentication.
// ────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId: boardIdStr } = await params;
  const boardId = Number(boardIdStr);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (isNaN(boardId)) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_board`);
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${appUrl}/?error=missing_token`);
  }

  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in → redirect to login, then back here
    const currentUrl = request.nextUrl.toString();
    return NextResponse.redirect(
      `${appUrl}/login?redirectTo=${encodeURIComponent(currentUrl)}`,
    );
  }

  // ── Fetch the invitation by token ──
  const { data: invitation, error: invError } = await supabase
    .from("board_invitations")
    .select("id, board_id, email, status")
    .eq("token", token)
    .eq("board_id", boardId)
    .single();

  if (invError || !invitation) {
    return NextResponse.redirect(
      `${appUrl}/?error=invitation_not_found`,
    );
  }

  // ── Check invitation status ──
  if (invitation.status !== "pending") {
    return NextResponse.redirect(
      `${appUrl}/?error=invitation_${invitation.status}`,
    );
  }

  // ── Verify the user's email matches the invitation ──
  if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.redirect(
      `${appUrl}/?error=email_mismatch`,
    );
  }

  // ── Check if already a member (edge case) ──
  const { data: existing } = await supabase
    .from("board_members")
    .select("user_id")
    .eq("board_id", boardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    // ── Insert into board_members ──
    const { error: insertErr } = await supabase.from("board_members").insert({
      user_id: user.id,
      board_id: boardId,
      role: "Member",
    });

    if (insertErr) {
      console.error("Accept invitation – insert error:", insertErr.message);
      return NextResponse.redirect(`${appUrl}/?error=join_failed`);
    }
  }

  await supabase
    .from("board_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.redirect(`${appUrl}/projects`);
}
