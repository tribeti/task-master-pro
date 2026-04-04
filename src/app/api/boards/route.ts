import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validateString } from "@/utils/validate-string";

// ────────────────────────────────────────────────
// GET /api/boards
// Returns owned boards + joined boards for the authenticated user
// ────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch owned boards
    const { data: ownedBoards, error: ownedError } = await supabase
      .from("boards")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("GET /api/boards ownedBoards error:", ownedError.message);
      return NextResponse.json(
        { error: "Failed to fetch owned boards" },
        { status: 500 },
      );
    }

    // Fetch joined boards (where user is a member but NOT the owner)
    const { data: memberRows, error: memberError } = await supabase
      .from("board_members")
      .select(
        `
        role,
        boards (
          id,
          title,
          description,
          is_private,
          created_at,
          owner_id,
          color,
          tag
        )
      `,
      )
      .eq("user_id", user.id);

    if (memberError) {
      console.error("GET /api/boards joinedBoards error:", memberError.message);
      return NextResponse.json(
        { error: "Failed to fetch joined boards" },
        { status: 500 },
      );
    }

    // Flatten and exclude boards user already owns
    const joinedBoards = (memberRows || [])
      .filter((row: any) => row.boards && row.boards.owner_id !== user.id)
      .map((row: any) => ({
        ...row.boards,
        member_role: row.role,
      }));

    return NextResponse.json({
      ownedBoards: ownedBoards || [],
      joinedBoards,
    });
  } catch (err: any) {
    console.error("GET /api/boards unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────
// POST /api/boards
// Creates a new board for the authenticated user.
// Body: { title, description?, is_private, color, tag }
// ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const cleanTitle = validateString(body.title, "Project title", 100);
    const cleanTag = validateString(body.tag, "Tag", 50);
    const cleanColor = validateString(body.color, "Color", 20);
    const cleanDescription = body.description
      ? String(body.description).trim().slice(0, 1000)
      : null;

    const { data, error } = await supabase
      .from("boards")
      .insert([
        {
          title: cleanTitle,
          description: cleanDescription,
          is_private: !!body.is_private,
          color: cleanColor,
          tag: cleanTag,
          owner_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("POST /api/boards error:", error.message);
      return NextResponse.json(
        { error: "Failed to create project." },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Failed to create project: No data returned." },
        { status: 500 },
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (err: any) {
    // Validation errors from validateString
    if (err instanceof Error && !err.message.startsWith("Internal")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("POST /api/boards unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
