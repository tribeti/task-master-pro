import { createClient } from "@/utils/supabase/server";

/**
 * Verify that a user is the **owner** of a specific board.
 *
 * @param supabase - Authenticated server-side Supabase client.
 * @param userId   - UUID of the user to check.
 * @param boardId  - Numeric board ID.
 * @returns `true` if the user owns the board, `false` otherwise.
 */
export async function verifyBoardOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  boardId: number,
): Promise<boolean> {
  const { data: board, error } = await supabase
    .from("boards")
    .select("id")
    .eq("id", boardId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!board;
}
