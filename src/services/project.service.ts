import { Board, JoinedBoard } from "@/types/project";

export async function fetchUserBoards(): Promise<{
  ownedBoards: Board[];
  joinedBoards: JoinedBoard[];
}> {
  const res = await fetch("/api/boards", { method: "GET" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to fetch boards");
  }
  return res.json();
}

export { 
  deleteUserBoardAction as deleteUserBoard,
  createNewBoardAction as createNewBoard,
  createDefaultColumnsAction as createDefaultColumns,
  updateUserBoardAction as updateUserBoard
} from "@/app/actions/project.actions";
