"use server";

import { createClient } from "@/utils/supabase/server";
import { Board } from "@/types/project";
import { revalidatePath } from "next/cache";

export const fetchUserBoardsAction = async (userId: string): Promise<Board[]> => {
  const supabase = await createClient();
  
  // SECURE: Verify session exists and matches the requested userId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data as Board[]) || [];
};

export const deleteUserBoardAction = async (projectId: number, userId: string): Promise<void> => {
  const supabase = await createClient();
  
  // SECURE: Verify session exists and matches the requested userId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", userId); // Double check owner_id even if RLS is enabled

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/projects");
};

export const createNewBoardAction = async (
  userId: string,
  boardData: {
    title: string;
    description: string | null;
    is_private: boolean;
    color: string;
    tag: string;
  }
): Promise<Board> => {
  const supabase = await createClient();
  
  // SECURE: Verify session exists and matches the requested userId
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    throw new Error("Unauthorized access");
  }

  const { data, error } = await supabase
    .from("boards")
    .insert([{ ...boardData, owner_id: userId }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create project: No data returned");
  }

  revalidatePath("/projects");
  return data[0] as Board;
};

export const createDefaultColumnsAction = async (boardId: number): Promise<void> => {
  const supabase = await createClient();
  
  // SECURE: Verify session exists
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized access");
  }
  
  // ideally we should also check if the user is the owner of the boardId but keeping it simple for now or assuming RLS

  const { error } = await supabase.from("columns").insert([
    { title: "To Do", board_id: boardId, position: 0 },
    { title: "In Progress", board_id: boardId, position: 1 },
    { title: "Done", board_id: boardId, position: 2 },
  ]);

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath("/projects");
};
