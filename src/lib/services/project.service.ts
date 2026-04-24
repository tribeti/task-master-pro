import { Board, JoinedBoard } from "@/lib/types/project";

// ── Fetch all boards (owned + joined) ──
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

// ── Create a new board ──
export async function createNewBoard(
  _userId: string,
  boardData: {
    title: string;
    description: string | null;
    is_private: boolean;
    color: string;
    tag: string;
  },
): Promise<Board> {
  const res = await fetch("/api/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(boardData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create project.");
  }
  return res.json();
}

// ── Create default columns for a board ──
export async function createDefaultColumns(boardId: number): Promise<void> {
  const res = await fetch(`/api/boards/${boardId}/columns/default`, {
    method: "POST",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create default columns.");
  }
}

// ── Update a board ──
export async function updateUserBoard(
  _userId: string,
  boardId: number,
  boardData: Partial<Board>,
): Promise<void> {
  const res = await fetch(`/api/boards/${boardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(boardData),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to update project.");
  }
}

// ── Delete a board ──
export async function deleteUserBoard(
  projectId: number,
  _userId: string,
): Promise<void> {
  const res = await fetch(`/api/boards/${projectId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to delete project.");
  }
}
