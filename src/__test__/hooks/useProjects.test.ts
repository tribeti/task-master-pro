import { renderHook, waitFor, act } from "@testing-library/react";
import { useProjects } from "@/hooks/useProjects";
import * as projectService from "@/services/project.service";

jest.mock("@/services/project.service");
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

import { toast } from "sonner";

const mockOwnedBoards = [{ id: 1, title: "Board A" } as any];
const mockJoinedBoards = [{ id: 2, title: "Board B" } as any];
const mockFetchData = {
  ownedBoards: mockOwnedBoards,
  joinedBoards: mockJoinedBoards,
};

describe("useProjects Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── fetchBoards ────────────────────────────────────────────────────────────

  describe("fetchBoards (via useEffect)", () => {
    it("sets empty boards and loading=false when no userId", async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      expect(result.current.ownedBoards).toEqual([]);
      expect(result.current.joinedBoards).toEqual([]);
      expect(projectService.fetchUserBoards).not.toHaveBeenCalled();
    });

    it("fetches and sets boards when userId is provided", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);

      const { result } = renderHook(() => useProjects("user1"));

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      expect(projectService.fetchUserBoards).toHaveBeenCalledTimes(1);
      expect(result.current.ownedBoards).toEqual(mockOwnedBoards);
      expect(result.current.joinedBoards).toEqual(mockJoinedBoards);
    });

    it("shows error toast and resets boards on fetchUserBoards failure", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useProjects("user1"));

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch projects: Network error",
      );
      expect(result.current.ownedBoards).toEqual([]);
      expect(result.current.joinedBoards).toEqual([]);
    });

    it('uses "Unknown error" when error has no message on fetch', async () => {
      jest.mocked(projectService.fetchUserBoards).mockRejectedValue({});

      const { result } = renderHook(() => useProjects("user1"));

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to fetch projects: Unknown error",
      );
    });

    it("re-fetches when userId changes", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);

      const { result, rerender } = renderHook(({ id }) => useProjects(id), {
        initialProps: { id: "user1" },
      });

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));
      expect(projectService.fetchUserBoards).toHaveBeenCalledTimes(1);

      rerender({ id: "user2" });

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));
      expect(projectService.fetchUserBoards).toHaveBeenCalledTimes(2);
    });
  });

  // ─── confirmDeleteProject ────────────────────────────────────────────────────

  describe("confirmDeleteProject", () => {
    it("returns false immediately when no userId", async () => {
      const { result } = renderHook(() => useProjects());

      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.confirmDeleteProject(1);
      });

      expect(returnVal).toBe(false);
      expect(projectService.deleteUserBoard).not.toHaveBeenCalled();
    });

    it("deletes board, shows success toast, re-fetches, and returns true", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.deleteUserBoard)
        .mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.confirmDeleteProject(1);
      });

      expect(projectService.deleteUserBoard).toHaveBeenCalledWith(1, "user1");
      expect(toast.success).toHaveBeenCalledWith(
        "Project deleted successfully!",
      );
      expect(returnVal).toBe(true);
    });

    it("shows error toast and returns false on delete failure", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.deleteUserBoard)
        .mockRejectedValue(new Error("Delete failed"));

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.confirmDeleteProject(1);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to delete project: Delete failed",
      );
      expect(returnVal).toBe(false);
    });

    it('uses "Unknown error" when delete error has no message', async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest.mocked(projectService.deleteUserBoard).mockRejectedValue({});

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      await act(async () => {
        await result.current.confirmDeleteProject(1);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to delete project: Unknown error",
      );
    });
  });

  // ─── handleCreateProject ─────────────────────────────────────────────────────

  describe("handleCreateProject", () => {
    const createData = {
      title: "New Project",
      description: "Desc",
      is_private: false,
      color: "#fff",
      tag: "dev",
      selectedTeamMembers: ["a", "b"],
    };

    it("returns false immediately when no userId", async () => {
      const { result } = renderHook(() => useProjects());
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleCreateProject(createData);
      });

      expect(returnVal).toBe(false);
      expect(projectService.createNewBoard).not.toHaveBeenCalled();
    });

    it("creates board with default columns, shows success, re-fetches, returns true", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.createNewBoard)
        .mockResolvedValue({ id: 99 } as any);
      jest
        .mocked(projectService.createDefaultColumns)
        .mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleCreateProject(createData);
      });

      expect(projectService.createNewBoard).toHaveBeenCalledWith("user1", {
        title: createData.title,
        description: createData.description,
        is_private: createData.is_private,
        color: createData.color,
        tag: createData.tag,
      });
      expect(projectService.createDefaultColumns).toHaveBeenCalledWith(99);
      expect(toast.success).toHaveBeenCalledWith("Tạo dự án thành công!");
      expect(returnVal).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
    });

    it("passes null description when description is empty string", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.createNewBoard)
        .mockResolvedValue({ id: 99 } as any);
      jest
        .mocked(projectService.createDefaultColumns)
        .mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      await act(async () => {
        await result.current.handleCreateProject({
          ...createData,
          description: "",
        });
      });

      expect(projectService.createNewBoard).toHaveBeenCalledWith(
        "user1",
        expect.objectContaining({ description: null }),
      );
    });

    it("shows warning toast when createDefaultColumns fails but still returns true", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.createNewBoard)
        .mockResolvedValue({ id: 99 } as any);
      jest
        .mocked(projectService.createDefaultColumns)
        .mockRejectedValue(new Error("Columns error"));

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleCreateProject(createData);
      });

      expect(toast.warning).toHaveBeenCalledWith(
        "Project created, but failed to add default columns: Columns error",
      );
      expect(returnVal).toBe(true);
    });

    it("shows error toast and returns false when createNewBoard fails", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.createNewBoard)
        .mockRejectedValue(new Error("Create failed"));

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleCreateProject(createData);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to create project: Create failed",
      );
      expect(returnVal).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('uses "Unknown error" when createNewBoard error has no message', async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest.mocked(projectService.createNewBoard).mockRejectedValue({});

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      await act(async () => {
        await result.current.handleCreateProject(createData);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to create project: Unknown error",
      );
    });
  });

  // ─── handleUpdateExistingProject ─────────────────────────────────────────────

  describe("handleUpdateExistingProject", () => {
    const updateData = { title: "Updated" };

    it("returns false immediately when no userId", async () => {
      const { result } = renderHook(() => useProjects());
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleUpdateExistingProject(
          1,
          updateData,
        );
      });

      expect(returnVal).toBe(false);
      expect(projectService.updateUserBoard).not.toHaveBeenCalled();
    });

    it("updates board, shows success toast, re-fetches, and returns true", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.updateUserBoard)
        .mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleUpdateExistingProject(
          1,
          updateData,
        );
      });

      expect(projectService.updateUserBoard).toHaveBeenCalledWith(
        "user1",
        1,
        updateData,
      );
      expect(toast.success).toHaveBeenCalledWith("Cập nhật dự án thành công!");
      expect(returnVal).toBe(true);
      expect(result.current.isSubmitting).toBe(false);
    });

    it("shows error toast and returns false on update failure", async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest
        .mocked(projectService.updateUserBoard)
        .mockRejectedValue(new Error("Update failed"));

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      let returnVal: boolean | undefined;
      await act(async () => {
        returnVal = await result.current.handleUpdateExistingProject(
          1,
          updateData,
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update project: Update failed",
      );
      expect(returnVal).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('uses "Unknown error" when update error has no message', async () => {
      jest
        .mocked(projectService.fetchUserBoards)
        .mockResolvedValue(mockFetchData);
      jest.mocked(projectService.updateUserBoard).mockRejectedValue({});

      const { result } = renderHook(() => useProjects("user1"));
      await waitFor(() => expect(result.current.boardsLoading).toBe(false));

      await act(async () => {
        await result.current.handleUpdateExistingProject(1, updateData);
      });

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update project: Unknown error",
      );
    });
  });
});
