import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess } from "@/utils/board-access";

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const labelId = parseInt(params.labelId);

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: label, error: labelErr } = await supabase
      .from("labels")
      .select("board_id")
      .eq("id", labelId)
      .single();

    if (labelErr || !label) return NextResponse.json({ error: "Label not found." }, { status: 404 });
    await verifyBoardAccess(supabase, user.id, label.board_id);

    const { error } = await supabase.from("labels").delete().eq("id", labelId);
    if (error) return NextResponse.json({ error: "Failed to delete label." }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
