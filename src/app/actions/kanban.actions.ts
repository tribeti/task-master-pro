"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface Column {
    id: number;
    title: string;
    position: number;
    board_id: number;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    deadline: string | null;
    priority: "Low" | "Medium" | "High";
    position: number;
    column_id: number;
    assignee_id: string | null;
}

export const fetchKanbanDataAction = async (projectId: number) => {
    const supabase = await createClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // We should ideally check if the user has access to `projectId` here.
    // Assuming check logic or RLS handles it.

    const { data: columns, error: colsErr } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", projectId)
        .order("position", { ascending: true });

    if (colsErr) throw new Error(colsErr.message);

    let tasks: Task[] = [];
    if (columns && columns.length > 0) {
        const colIds = columns.map((c: Column) => c.id);
        const { data: tasksData, error: tasksErr } = await supabase
            .from("tasks")
            .select("*")
            .in("column_id", colIds)
            .order("position", { ascending: true });

        if (tasksErr) throw new Error(tasksErr.message);
        tasks = tasksData as Task[] || [];
    }

    return { columns: columns as Column[] || [], tasks };
};

export const createTaskAction = async (payload: Omit<Task, "id">) => {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { error } = await supabase.from("tasks").insert([payload]);
    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
};

export const updateTaskAction = async (taskId: number, payload: Partial<Task>) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", taskId);
    
    if (error) throw new Error(error.message);
    revalidatePath("/projects");
};

export const deleteTaskAction = async (taskId: number) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
};

export const createColumnAction = async (projectId: number, title: string, position: number) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase.from("columns").insert([
        { title, board_id: projectId, position }
    ]);
    if (error) throw new Error(error.message);
    
    revalidatePath("/projects");
};
