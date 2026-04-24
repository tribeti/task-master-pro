import { useState, useCallback, useEffect } from "react";
import {
  fetchUserBoards,
  deleteUserBoard,
  createNewBoard,
  createDefaultColumns,
  updateUserBoard,
} from "@/lib/services/project.service";
import { Board, JoinedBoard } from "@/lib/types/project";
import { toast } from "sonner";

export const useProjects = (userId?: string) => {
  const [ownedBoards, setOwnedBoards] = useState<Board[]>([]);
  const [joinedBoards, setJoinedBoards] = useState<JoinedBoard[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBoards = useCallback(async () => {
    if (!userId) {
      setOwnedBoards([]);
      setJoinedBoards([]);
      setBoardsLoading(false);
      return;
    }

    setBoardsLoading(true);

    try {
      const data = await fetchUserBoards();
      setOwnedBoards(data.ownedBoards);
      setJoinedBoards(data.joinedBoards);
    } catch (error: any) {
      toast.error(
        `Failed to fetch projects: ${error.message || "Unknown error"}`,
      );
      setOwnedBoards([]);
      setJoinedBoards([]);
    } finally {
      setBoardsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const confirmDeleteProject = async (projectId: number) => {
    if (!userId) return false;
    try {
      await deleteUserBoard(projectId, userId);
      toast.success("Project deleted successfully!");
      await fetchBoards();
      return true;
    } catch (error: any) {
      toast.error(
        `Failed to delete project: ${error.message || "Unknown error"}`,
      );
      return false;
    }
  };

  const handleCreateProject = async (data: {
    title: string;
    description: string;
    is_private: boolean;
    color: string;
    tag: string;
    selectedTeamMembers: string[];
  }) => {
    if (!userId) return false;

    setIsSubmitting(true);
    try {
      const newBoard = await createNewBoard(userId, {
        title: data.title,
        description: data.description || null,
        is_private: data.is_private,
        color: data.color,
        tag: data.tag,
      });

      toast.success("Tạo dự án thành công!");

      try {
        await createDefaultColumns(newBoard.id);
      } catch (columnsError: any) {
        toast.warning(
          `Project created, but failed to add default columns: ${columnsError.message}`,
        );
      }

      await fetchBoards();
      return true;
    } catch (error: any) {
      toast.error(
        `Failed to create project: ${error.message || "Unknown error"}`,
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExistingProject = async (
    projectId: number,
    data: Partial<Board>
  ) => {
    if (!userId) return false;

    setIsSubmitting(true);
    try {
      await updateUserBoard(userId, projectId, data);
      toast.success("Cập nhật dự án thành công!");
      await fetchBoards();
      return true;
    } catch (error: any) {
      toast.error(
        `Failed to update project: ${error.message || "Unknown error"}`
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ownedBoards,
    joinedBoards,
    boardsLoading,
    isSubmitting,
    fetchBoards,
    confirmDeleteProject,
    handleCreateProject,
    handleUpdateExistingProject,
  };
};
