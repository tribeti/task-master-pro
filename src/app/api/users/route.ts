import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .order("display_name", { ascending: true });

    if (error) {
      console.error("GET /api/users error:", error.message);
      return NextResponse.json(
        { error: "Failed to load users." },
        { status: 500 },
      );
    }

    const users = ((data as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    }[]) || []).map((item) => ({
      user_id: item.id,
      display_name: item.display_name || "Unknown",
      avatar_url: item.avatar_url || null,
    }));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET /api/users unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error.message || String(error)) },
      { status: 500 },
    );
  }
}
