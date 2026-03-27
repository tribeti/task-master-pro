"use server";

import { createClient } from "@supabase/supabase-js";
import { getDeadlineStatus } from "@/utils/deadline";

/**
 * Server action to generate deadline notifications.
 * Can be safely called from client code without exposing secrets.
 */
export async function triggerDeadlineNotifications() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(now.getDate() + 3);

        // 1. Fetch all tasks with upcoming deadlines
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
            console.error("Error fetching tasks for deadline check:", tasksError);
            return;
        }

        // Filter out tasks in "Done" columns
        const tasks = (rawTasks || []).filter(task => {
            const colInfo = Array.isArray(task.column) ? task.column[0] : task.column;
            const colTitle = (colInfo?.title || "").toLowerCase();
            return colTitle !== "done";
        });

        if (tasks.length === 0) return;

        // 2. Fetch existing deadline notifications to prevent duplicates
        const taskIds = tasks.map(t => t.id);
        const { data: existingNotifs, error: notifError } = await supabase
            .from("notifications")
            .select("task_id, content")
            .eq("type", "deadline")
            .in("task_id", taskIds);

        if (notifError) {
            console.error("Error fetching existing notifications:", notifError);
            return;
        }

        // 3. Insert notifications for new urgency stages only
        for (const task of tasks) {
            const status = getDeadlineStatus(task.deadline!);
            const urgencyStr = status.urgencyStr;

            const existingForTask = existingNotifs?.filter(n => n.task_id === task.id) || [];
            const alreadyNotified = existingForTask.some(n => n.content?.includes(urgencyStr));

            if (!alreadyNotified) {
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
                }
            }
        }
    } catch (err) {
        console.error("Deadline notification check error:", err);
    }
}
