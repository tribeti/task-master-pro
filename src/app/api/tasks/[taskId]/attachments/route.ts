import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { TaskAttachment } from "@/lib/types/project";

const BUCKET = "task-attachments";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// ─────────────────────────────────────────────────────────────────
// Helper: Verify access using admin client (bypasses RLS)
// Checks that userId is owner or member of the board owning taskId
// ─────────────────────────────────────────────────────────────────
async function verifyTaskAccess(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  taskId: number,
): Promise<{ boardId: number }> {
  const { data: task, error: taskErr } = await admin
    .from("tasks")
    .select("column_id")
    .eq("id", taskId)
    .single();
  if (taskErr || !task) throw new Error("TASK_NOT_FOUND");

  const { data: column, error: colErr } = await admin
    .from("columns")
    .select("board_id")
    .eq("id", task.column_id)
    .single();
  if (colErr || !column) throw new Error("COLUMN_NOT_FOUND");

  const boardId: number = column.board_id;

  // Check owner
  const { data: board } = await admin
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!board) {
    // Check member
    const { data: membership } = await admin
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) throw new Error("ACCESS_DENIED");
  }

  return { boardId };
}

// ─────────────────────────────────────────────────────────────────
// GET /api/tasks/[taskId]/attachments
// ─────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }

    // Auth check via cookie session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All DB ops via admin (bypasses RLS)
    const admin = createAdminClient();

    try {
      await verifyTaskAccess(admin, user.id, taskId);
    } catch (e: any) {
      const msg = e.message;
      if (msg === "TASK_NOT_FOUND")
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (msg === "ACCESS_DENIED")
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const { data, error } = await admin
      .from("task_attachments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET attachments error:", error.message);
      return NextResponse.json(
        { error: "Failed to load attachments" },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich with uploader info
    const uploaderIds = Array.from(new Set(data.map((a) => a.uploaded_by)));
    const { data: usersData } = await admin
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", uploaderIds);

    const userMap = new Map((usersData ?? []).map((u) => [u.id, u]));

    const attachments: TaskAttachment[] = data.map((a) => {
      const uploader = userMap.get(a.uploaded_by);
      return {
        ...a,
        uploader: uploader
          ? {
              display_name: uploader.display_name,
              avatar_url: uploader.avatar_url,
            }
          : undefined,
      };
    });

    return NextResponse.json(attachments);
  } catch (err: any) {
    console.error("GET attachments unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// POST /api/tasks/[taskId]/attachments
// Expects multipart/form-data with field "file"
// ─────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }

    // Auth check via cookie session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All DB/Storage ops via admin (bypasses RLS)
    const admin = createAdminClient();

    try {
      await verifyTaskAccess(admin, user.id, taskId);
    } catch (e: any) {
      const msg = e.message;
      if (msg === "TASK_NOT_FOUND")
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      if (msg === "ACCESS_DENIED")
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File quá lớn (tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 },
      );
    }

    if (!file.name || file.name.trim() === "") {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    // Generate a unique storage path to avoid collisions
    const ext = file.name.includes(".")
      ? file.name.substring(file.name.lastIndexOf("."))
      : "";
    const safeBaseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
      .substring(0, 60);
    const uuid = crypto.randomUUID();
    const storagePath = `${taskId}/${uuid}-${safeBaseName}${ext}`;

    // Upload to Supabase Storage via admin client
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError.message);
      return NextResponse.json(
        { error: "Upload file thất bại: " + uploadError.message },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: publicUrlData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Save metadata to DB via admin client
    const { data: attachment, error: insertError } = await admin
      .from("task_attachments")
      .insert({
        task_id: taskId,
        uploaded_by: user.id,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        storage_path: storagePath,
        public_url: publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert attachment error:", insertError.message);
      // Rollback: remove uploaded file
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: "Lưu thông tin file thất bại" },
        { status: 500 },
      );
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch (err: any) {
    console.error("POST attachments unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /api/tasks/[taskId]/attachments?attachmentId=X
// ─────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid taskId" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = Number(searchParams.get("attachmentId"));
    if (isNaN(attachmentId) || !attachmentId) {
      return NextResponse.json({ error: "Invalid attachmentId" }, { status: 400 });
    }

    // Auth check via cookie session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All DB/Storage ops via admin (bypasses RLS)
    const admin = createAdminClient();

    // Get the attachment record
    const { data: attachment, error: fetchErr } = await admin
      .from("task_attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("task_id", taskId)
      .single();

    if (fetchErr || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Check permission: must be uploader OR board owner
    if (attachment.uploaded_by !== user.id) {
      try {
        const { boardId } = await verifyTaskAccess(admin, user.id, taskId);
        const { data: board } = await admin
          .from("boards")
          .select("id")
          .eq("id", boardId)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!board) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Delete from storage
    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .remove([attachment.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError.message);
      // Don't block DB deletion even if storage fails
    }

    // Delete from DB
    const { error: deleteErr } = await admin
      .from("task_attachments")
      .delete()
      .eq("id", attachmentId);

    if (deleteErr) {
      console.error("DB delete attachment error:", deleteErr.message);
      return NextResponse.json(
        { error: "Xóa file thất bại" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE attachment unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

