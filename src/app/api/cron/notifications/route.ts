import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS and act as an admin job
const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseAdminUrl, supabaseServiceRoleKey);

export async function GET(request: Request) {
  try {
    // Optional: Add simple secret verification to prevent unauthorized triggering
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
      // Ignoring for now to allow manual testing, in production uncomment above
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    // 1. Fetch all tasks with upcoming deadlines (Under 3 days or Overdue)
    // We inner join columns to get the board_id (project_id)
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id, 
        title, 
        deadline, 
        assignee_id,
        column:columns(board_id)
      `)
      .not("deadline", "is", null)
      .not("assignee_id", "is", null)
      .lte("deadline", threeDaysFromNow.toISOString());

    if (tasksError) {
      console.error("Error fetching tasks for cron:", tasksError);
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: "No urgent tasks found." }, { status: 200 });
    }

    // 2. Fetch existing deadline notifications to prevent duplicates
    // We only care about matching task_id and type="deadline"
    const taskIds = tasks.map(t => t.id);
    const { data: existingNotifs, error: notifError } = await supabase
      .from("notifications")
      .select("task_id, content")
      .eq("type", "deadline")
      .in("task_id", taskIds);

    if (notifError) {
      console.error("Error fetching existing notifications:", notifError);
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    // 3. Filter out tasks that already have a notification
    // Also, we can filter out tasks that have an *identical* urgency string, 
    // to allow re-notifying if "IN 3 DAYS" becomes "DUE TODAY".
    // For simplicity, let's just create ONE notification per urgency stage 
    // by checking if the content string contains the current urgency state.

    let insertedCount = 0;

    for (const task of tasks) {
      const deadlineDate = new Date(task.deadline!);
      deadlineDate.setHours(0, 0, 0, 0);

      let urgencyStr = "IN 3 DAYS";
      if (deadlineDate < now) urgencyStr = "OVERDUE";
      else if (deadlineDate.getTime() === now.getTime()) urgencyStr = "DUE TODAY";
      else if (deadlineDate.getTime() === new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime()) urgencyStr = "DUE TOMORROW";

      const existingForTask = existingNotifs?.filter(n => n.task_id === task.id) || [];
      const alreadyNotifiedForThisStage = existingForTask.some(n => n.content?.includes(urgencyStr));

      if (!alreadyNotifiedForThisStage) {
        // Extract project (board) id safely
        const boardInfo = Array.isArray(task.column) ? task.column[0] : task.column;
        const projectId = boardInfo?.board_id;

        const { error: insertError } = await supabase.from("notifications").insert([{
          user_id: task.assignee_id,
          type: "deadline",
          content: `DEADLINE WARNING\n${task.title} is ${urgencyStr}`,
          is_read: false,
          task_id: task.id,
          project_id: projectId
        }]);

        if (insertError) {
          console.error(`Failed to insert notification for task ${task.id}:`, insertError);
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      scannedTasks: tasks.length,
      notificationsCreated: insertedCount
    }, { status: 200 });

  } catch (err: any) {
    console.error("Cron Error: ", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
