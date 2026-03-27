import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  Task,
  Label,
  KanbanColumn,
  KanbanTask,
} from "@/types/project";

// ── Helper: Verify user has access to a board (owner OR member) ──
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

// ────────────────────────────────────────────────
// GET /api/boards/[boardId]/kanban
// Returns columns, tasks (with labels), and board labels
// ────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: { boardId: string } },
) {
  try {
    const { boardId: boardIdStr } = params;
    const boardId = Number(boardIdStr);
    if (isNaN(boardId)) {
      return NextResponse.json({ error: "Invalid boardId" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await verifyBoardAccess(supabase, user.id, boardId);

    const { data: columns, error: colsErr } = await supabase
      .from("columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (colsErr) {
      console.error("GET kanban columns error:", colsErr.message);
      return NextResponse.json(
        { error: "Failed to load board data." },
        { status: 500 },
      );
    }

    let tasks: KanbanTask[] = [];
    let labels: Label[] = [];

    if (columns && columns.length > 0) {
      const colIds = columns.map((c: KanbanColumn) => c.id);

      const { data: tasksData, error: tasksErr } = await supabase
        .from("tasks")
        .select("*")
        .in("column_id", colIds)
        .order("position", { ascending: true });

      if (tasksErr) {
        console.error("GET kanban tasks error:", tasksErr.message);
        return NextResponse.json(
          { error: "Failed to load tasks." },
          { status: 500 },
        );
      }

      tasks = ((tasksData as Task[]) || []).map((task) => ({
        ...task,
        labels: [],
      }));

      const { data: boardLabels, error: labelsErr } = await supabase
        .from("labels")
        .select("*")
        .eq("board_id", boardId)
        .order("id", { ascending: true });

      if (labelsErr) {
        console.error("GET kanban labels error:", labelsErr.message);
        return NextResponse.json(
          { error: "Failed to load labels." },
          { status: 500 },
        );
      }

      labels = (boardLabels as Label[]) || [];

      if (tasks.length > 0) {
        const taskIds = tasks.map((task) => task.id);
        const { data: taskLabelsData, error: taskLabelsErr } = await supabase
          .from("task_labels")
          .select("task_id, label_id")
          .in("task_id", taskIds);

        if (taskLabelsErr) {
          console.error("GET kanban task_labels error:", taskLabelsErr.message);
          return NextResponse.json(
            { error: "Failed to load task labels." },
            { status: 500 },
          );
        }

        const taskLabelRows =
          (taskLabelsData as { task_id: number; label_id: number }[]) || [];

        const taskLabelsMap = new Map<number, Set<number>>();
        for (const row of taskLabelRows) {
          if (!taskLabelsMap.has(row.task_id)) {
            taskLabelsMap.set(row.task_id, new Set());
          }
          taskLabelsMap.get(row.task_id)!.add(row.label_id);
        }

        tasks = tasks.map((task) => {
          const relatedLabelIds =
            taskLabelsMap.get(task.id) ?? new Set<number>();
          return {
            ...task,
            labels: labels.filter((label) => relatedLabelIds.has(label.id)),
          };
        });
      }
    }

    return NextResponse.json({
      columns: (columns as KanbanColumn[]) || [],
      tasks,
      labels,
    });
  } catch (err: any) {
    if (err.message === "Access denied.") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    console.error("GET kanban unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error: " + (err.message || String(err)) },
      { status: 500 },
    );
  }
}
