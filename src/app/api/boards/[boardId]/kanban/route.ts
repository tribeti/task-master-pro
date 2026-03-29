import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess } from "@/utils/board-access";
import {
  Task,
  Label,
  KanbanColumn,
  KanbanTask,
  TaskAssignee,
} from "@/types/project";

type TaskAssigneeRow = {
  id: number;
  task_id: number;
  user_id: string;
  assigned_at: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const { boardId: boardIdStr } = await params;
    const boardId = Number(boardIdStr);
    if (Number.isNaN(boardId)) {
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
        assignee: null,
        assignees: [],
      }));

      if (tasks.length > 0) {
        const taskIds = tasks.map((task) => task.id);
        const { data: taskAssigneesData, error: taskAssigneesErr } = await supabase
          .from("task_assignees")
          .select("id, task_id, user_id, assigned_at")
          .in("task_id", taskIds)
          .order("assigned_at", { ascending: true })
          .order("id", { ascending: true });

        if (taskAssigneesErr) {
          console.error("GET kanban task_assignees error:", taskAssigneesErr.message);
          return NextResponse.json(
            { error: "Failed to load task assignees." },
            { status: 500 },
          );
        }

        const taskAssigneeRows = (taskAssigneesData as TaskAssigneeRow[]) || [];
        const assigneeIds = Array.from(
          new Set(taskAssigneeRows.map((row) => row.user_id)),
        );

        let assigneesMap = new Map<string, TaskAssignee>();
        if (assigneeIds.length > 0) {
          const { data: assigneesData, error: assigneesErr } = await supabase
            .from("users")
            .select("id, display_name, avatar_url")
            .in("id", assigneeIds);

          if (assigneesErr) {
            console.error("GET kanban assignees error:", assigneesErr.message);
            return NextResponse.json(
              { error: "Failed to load task assignees." },
              { status: 500 },
            );
          }

          assigneesMap = new Map(
            ((assigneesData as {
              id: string;
              display_name: string;
              avatar_url: string | null;
            }[]) || []).map((assignee) => [
              assignee.id,
              {
                user_id: assignee.id,
                display_name: assignee.display_name || "Unknown",
                avatar_url: assignee.avatar_url || null,
              },
            ]),
          );
        }

        const taskAssigneesMap = new Map<number, TaskAssignee[]>();
        for (const row of taskAssigneeRows) {
          const assignee = assigneesMap.get(row.user_id);
          if (!assignee) continue;

          if (!taskAssigneesMap.has(row.task_id)) {
            taskAssigneesMap.set(row.task_id, []);
          }
          taskAssigneesMap.get(row.task_id)!.push(assignee);
        }

        tasks = tasks.map((task) => ({
          ...task,
          assignees: taskAssigneesMap.get(task.id) || [],
          assignee: (taskAssigneesMap.get(task.id) || [])[0] || null,
        }));
      }

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
