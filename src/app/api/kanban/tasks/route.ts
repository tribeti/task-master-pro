import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  verifyBoardAccess,
  verifyAllBoardsAccess,
  validateString,
  AuthorizationError,
} from "@/utils/board-access";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await request.json();

    // Build a sanitized whitelist — never pass raw payload to insert
    const title = validateString(payload.title, "Task title", 200);
    const description = payload.description
      ? validateString(payload.description, "Description", 2000)
      : null;

    const columnId = Number(payload.column_id);
    if (!Number.isInteger(columnId) || columnId <= 0) {
      return NextResponse.json(
        { error: "Invalid column_id." },
        { status: 400 },
      );
    }

    const position = Number(payload.position);
    if (!Number.isInteger(position) || position < 0) {
      return NextResponse.json({ error: "Invalid position." }, { status: 400 });
    }

    const allowedPriorities = ["Low", "Medium", "High"];
    const priority = allowedPriorities.includes(payload.priority)
      ? payload.priority
      : null;

    const deadline = payload.deadline ? new Date(payload.deadline) : null;
    if (deadline !== null && isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "Invalid deadline." }, { status: 400 });
    }

    const { data: column, error: colErr } = await supabase
      .from("columns")
      .select("board_id")
      .eq("id", columnId)
      .single();

    if (colErr || !column)
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    await verifyBoardAccess(supabase, user.id, column.board_id);

    const sanitizedTask = {
      title,
      description,
      column_id: columnId,
      position,
      priority,
      deadline: deadline ? deadline.toISOString() : null,
    };

    const { data: insertedTask, error } = await supabase
      .from("tasks")
      .insert([sanitizedTask])
      .select("id")
      .single();

    if (error) {
      console.error("createTask error:", error.message);
      return NextResponse.json(
        { error: "Failed to create task." },
        { status: 500 },
      );
    }

    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.from("notifications").insert([
        {
          user_id: user.id,
          project_id: column.board_id,
          task_id: insertedTask.id,
          content: `Tạo công việc thành công: ${title}`,
          is_read: false,
        },
      ]);
    } catch (notifErr) {
      console.error("createTask notification error:", notifErr);
    }

    return NextResponse.json(insertedTask);
  } catch (error: any) {
    if (error instanceof AuthorizationError || error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("POST /api/kanban/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const rawUpdates = await request.json();
    if (!Array.isArray(rawUpdates) || rawUpdates.length === 0)
      return NextResponse.json([]);

    const updates = [];
    for (const update of rawUpdates) {
      if (!update || typeof update !== "object") {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const id = Number(update.id);
      const column_id = Number(update.column_id);
      const position = Number(update.position);

      if (
        !Number.isInteger(id) ||
        !Number.isInteger(column_id) ||
        !Number.isInteger(position)
      ) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      updates.push({ id, column_id, position });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const taskIds = updates.map((u: any) => u.id);
    const { data: existingTasks, error: fetchErr } = await supabase
      .from("tasks")
      .select(
        "id, title, description, deadline, priority, column_id, assignee_id, position",
      )
      .in("id", taskIds);

    if (fetchErr)
      return NextResponse.json(
        { error: "Failed to fetch existing tasks." },
        { status: 500 },
      );
    if (!existingTasks || existingTasks.length !== new Set(taskIds).size) {
      return NextResponse.json(
        {
          error:
            "Failed to update tasks: one or more tasks could not be found.",
        },
        { status: 404 },
      );
    }

    const involvedColumnIds = new Set([
      ...existingTasks.map((task) => task.column_id),
      ...updates.map((update: any) => update.column_id),
    ]);

    const { data: columnsData, error: colsErr } = await supabase
      .from("columns")
      .select("id, board_id")
      .in("id", Array.from(involvedColumnIds));

    if (
      colsErr ||
      !columnsData ||
      columnsData.length !== involvedColumnIds.size
    ) {
      return NextResponse.json(
        { error: "Failed to verify access." },
        { status: 403 },
      );
    }

    const involvedBoardIds = new Set<number>(
      columnsData.map((col) => col.board_id),
    );
    await verifyAllBoardsAccess(supabase, user.id, involvedBoardIds);

    const updatesMap = new Map<number, any>(updates.map((u: any) => [u.id, u]));
    const upsertData = existingTasks.map((task) => {
      const update = updatesMap.get(task.id) as any;
      return {
        ...task,
        position: update.position,
        column_id: update.column_id,
      };
    });

    const { error } = await supabase
      .from("tasks")
      .upsert(upsertData, { onConflict: "id" });
    if (error)
      return NextResponse.json(
        { error: "Failed to bulk update tasks." },
        { status: 500 },
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("PUT /api/kanban/tasks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
