import { createClient } from "@/utils/supabase/client";
import { Board } from "@/types/project";

export const fetchUserBoards = async (userId: string): Promise<Board[]> => {
  const supabase = createClient();
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

export const deleteUserBoard = async (projectId: number, userId: string): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", userId);

  if (error) {
    throw new Error(error.message);
  }
};

export const createNewBoard = async (
  userId: string,
  boardData: {
    title: string;
    description: string | null;
    is_private: boolean;
    color: string;
    tag: string;
  }
): Promise<Board> => {
  const supabase = createClient();
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

  return data[0] as Board;
};

export const createDefaultColumns = async (boardId: number): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase.from("columns").insert([
    { title: "To Do", board_id: boardId, position: 0 },
    { title: "In Progress", board_id: boardId, position: 1 },
    { title: "Done", board_id: boardId, position: 2 },
  ]);

  if (error) {
    throw new Error(error.message);
  }
};
