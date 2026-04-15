import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getDeadlineStatus } from "@/utils/deadline";


export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    // Only enforce auth check when CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    console.log("[Cron] Scanning tasks with deadline <=", threeDaysFromNow.toISOString());

    // 1. Fetch all tasks with upcoming deadlines (Under 3 days or Overdue)
    // We inner join columns to get the board_id and column title
    const { data: rawTasks, error: tasksError } = await supabase
      .from("tasks")
      .select(`
        id, 
        title, 
        deadline, 
        assignee_id,
        column:columns(board_id, title)
      `)
      .not("deadline", "is", null)
      .not("assignee_id", "is", null)
      .lte("deadline", threeDaysFromNow.toISOString());

    if (tasksError) {
      console.error("Error fetching tasks for cron:", tasksError);
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // Filter out tasks that are in a "Done" column (case-insensitive)
    const tasks = (rawTasks || []).filter(task => {
      const colInfo = Array.isArray(task.column) ? task.column[0] : task.column;
      const colTitle = (colInfo?.title || "").toLowerCase();
      return colTitle !== "done";
    });

    console.log(`[Cron] Found ${rawTasks?.length ?? 0} urgent tasks, ${tasks.length} after filtering DONE`);

    if (tasks.length === 0) {
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
      const status = getDeadlineStatus(task.deadline!);
      const urgencyStr = status.urgencyStr;

      const existingForTask = existingNotifs?.filter(n => n.task_id === task.id) || [];
      const alreadyNotifiedForThisStage = existingForTask.some(n => n.content?.includes(urgencyStr));

      if (!alreadyNotifiedForThisStage) {
        // Extract project (board) id safely
        const boardInfo = Array.isArray(task.column) ? task.column[0] : task.column;
        const projectId = boardInfo?.board_id;

        const { error: insertError } = await supabase.from("notifications").insert([{
          user_id: task.assignee_id,
          type: "deadline",
          content: `Sắp đến hạn: Nhiệm vụ "${task.title}" (Deadline: ${urgencyStr})`,
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
