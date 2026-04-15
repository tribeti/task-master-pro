import {
  createTaskAction,
  updateTaskAction,
  bulkUpdateTasksAction,
  bulkUpdateColumnsAction,
  deleteTaskAction,
  addLabelToTaskAction,
  removeLabelFromTaskAction,
  createLabelAction,
  addTaskAssigneeAction,
  removeTaskAssigneeAction,
  removeAllTaskAssigneesAction,
  deleteLabelAction,
  createColumnAction,
  updateColumnAction,
  deleteColumnAction,
  createCommentAction,
  deleteCommentAction,
} from "@/app/actions/kanban.actions";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  verifyBoardAccess,
  verifyAllBoardsAccess,
  verifyTaskAccess,
  syncPrimaryAssignee,
} from "@/utils/board-access";
import { revalidatePath } from "next/cache";

// --- MOCKS ---
jest.mock("@/utils/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/utils/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  verifyAllBoardsAccess: jest.fn(),
  verifyTaskAccess: jest.fn(),
  getTaskBoardId: jest.fn().mockResolvedValue(1),
  ensureBoardMember: jest.fn(),
  syncPrimaryAssignee: jest.fn(),
  validateString: jest.fn((str) => str), // Bỏ qua logic validate thực tế
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

// --- MOCK DB BUILDER ---
// Helper để giả lập Supabase chain method (.select.eq.single.then...)
const createMockChain = (chainRes: any, singleRes?: any) => {
  const chain: any = {
    select: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    upsert: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    // single() thường đi sau select()
    single: jest.fn(() =>
      Promise.resolve(singleRes !== undefined ? singleRes : chainRes),
    ),
    // then() được gọi khi ta await trực tiếp chuỗi (vd: await supabase.from('...').update('...'))
    then: jest.fn((resolve) => resolve(chainRes)),
  };
  return chain;
};

describe("Kanban / Task Server Actions Test", () => {
  let mockSupabase: any;
  let mockAdminSupabase: any;
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Ẩn log lỗi để terminal test không bị rối
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user_123" } },
          error: null,
        }),
      },
      from: jest.fn(),
    };

    mockAdminSupabase = {
      from: jest.fn().mockReturnValue(createMockChain({ error: null })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);
  });

  // Helper function để gán Mock DB cho mỗi test case
  const setDbMock = (
    tables: Record<string, { chainRes?: any; singleRes?: any }>,
  ) => {
    mockSupabase.from.mockImplementation((table: string) => {
      const mockSetup = tables[table] || {
        chainRes: { data: null, error: null },
      };
      return createMockChain(mockSetup.chainRes, mockSetup.singleRes);
    });
  };

  describe("createTaskAction", () => {
    it("creates a task successfully", async () => {
      setDbMock({
        columns: { singleRes: { data: { board_id: 1 }, error: null } },
        tasks: {
          singleRes: { data: { id: 10, title: "New Task" }, error: null },
        },
      });
      await createTaskAction({
        column_id: 1,
        title: "New Valid Task",
        position: 1,
      } as any);
      expect(verifyBoardAccess).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("throws error if column not found", async () => {
      setDbMock({
        columns: { singleRes: { data: null, error: new Error("Col Err") } },
      });
      await expect(
        createTaskAction({ column_id: 1, title: "Task" } as any),
      ).rejects.toThrow("Access denied.");
    });

    it("throws error on task insertion failure", async () => {
      setDbMock({
        columns: { singleRes: { data: { board_id: 1 }, error: null } },
        tasks: {
          singleRes: { data: null, error: new Error("Insert DB Error") },
        },
      });
      await expect(
        createTaskAction({ column_id: 1, title: "Task" } as any),
      ).rejects.toThrow("Failed to create task.");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("updateTaskAction", () => {
    it("updates task successfully without moving column", async () => {
      setDbMock({ tasks: { chainRes: { error: null } } });
      await updateTaskAction(10, { title: "Updated" });
      expect(verifyTaskAccess).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("throws error when moving to denied column", async () => {
      setDbMock({
        columns: { singleRes: { data: null, error: new Error("Col Err") } },
      });
      await expect(updateTaskAction(10, { column_id: 2 })).rejects.toThrow(
        "Access denied.",
      );
    });

    it("throws error on update failure", async () => {
      setDbMock({ tasks: { chainRes: { error: new Error("Update err") } } });
      await expect(updateTaskAction(10, { title: "Updated" })).rejects.toThrow(
        "Failed to update task.",
      );
    });
  });

  describe("bulkUpdateTasksAction", () => {
    it("returns early if updates array is empty", async () => {
      await bulkUpdateTasksAction([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("updates bulk tasks successfully", async () => {
      setDbMock({
        tasks: { chainRes: { data: [{ id: 1, column_id: 1 }], error: null } },
        columns: {
          chainRes: {
            data: [
              { id: 1, board_id: 1 },
              { id: 2, board_id: 1 },
            ],
            error: null,
          },
        },
      });
      // Test the upsert chain
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "tasks")
          return createMockChain({
            data: [{ id: 1, column_id: 1 }],
            error: null,
          });
        if (table === "columns")
          return createMockChain({
            data: [
              { id: 1, board_id: 1 },
              { id: 2, board_id: 1 },
            ],
            error: null,
          });
      });

      await bulkUpdateTasksAction([{ id: 1, position: 2, column_id: 2 }]);
      expect(verifyAllBoardsAccess).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("throws if fetched tasks mismatch length", async () => {
      setDbMock({ tasks: { chainRes: { data: [], error: null } } });
      await expect(
        bulkUpdateTasksAction([{ id: 1, position: 2, column_id: 2 }]),
      ).rejects.toThrow("one or more tasks could not be found");
    });
  });

  describe("bulkUpdateColumnsAction", () => {
    it("updates bulk columns successfully", async () => {
      setDbMock({
        columns: {
          chainRes: {
            data: [{ id: 1, board_id: 1, position: 1 }],
            error: null,
          },
        },
      });
      await bulkUpdateColumnsAction([{ id: 1, position: 2 }]);
      expect(verifyAllBoardsAccess).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("throws if columns fetch fails", async () => {
      setDbMock({
        columns: { chainRes: { data: null, error: new Error("Fetch err") } },
      });
      await expect(
        bulkUpdateColumnsAction([{ id: 1, position: 2 }]),
      ).rejects.toThrow("Failed to fetch existing columns");
    });
  });

  describe("deleteTaskAction", () => {
    it("deletes a task successfully", async () => {
      setDbMock({ tasks: { chainRes: { error: null } } });
      await deleteTaskAction(10);
      expect(verifyTaskAccess).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/projects");
    });

    it("throws if delete fails", async () => {
      setDbMock({ tasks: { chainRes: { error: new Error("Delete err") } } });
      await expect(deleteTaskAction(10)).rejects.toThrow(
        "Failed to delete task.",
      );
    });
  });

  describe("Labels Actions", () => {
    it("createLabelAction succeeds", async () => {
      setDbMock({ labels: { singleRes: { data: { id: 1 }, error: null } } });
      await createLabelAction(1, "Bug", "#FF0000");
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("createLabelAction fails with invalid hex", async () => {
      await expect(
        createLabelAction(1, "Bug", "invalid-color"),
      ).rejects.toThrow("Invalid color format.");
    });

    it("addLabelToTaskAction cross-board error", async () => {
      setDbMock({
        tasks: { singleRes: { data: { column_id: 1 }, error: null } },
        columns: { singleRes: { data: { board_id: 1 }, error: null } },
        labels: { singleRes: { data: { id: 1, board_id: 2 }, error: null } }, // Different board
      });
      await expect(addLabelToTaskAction(10, 1)).rejects.toThrow(
        "Label does not belong to this board.",
      );
    });

    it("removeLabelFromTaskAction succeeds", async () => {
      setDbMock({ task_labels: { chainRes: { error: null } } });
      await removeLabelFromTaskAction(10, 1);
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("deleteLabelAction succeeds", async () => {
      setDbMock({
        labels: {
          singleRes: { data: { board_id: 1 }, error: null },
          chainRes: { error: null },
        },
      });
      await deleteLabelAction(1);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe("Assignee Actions", () => {
    it("addTaskAssigneeAction succeeds", async () => {
      setDbMock({
        users: { singleRes: { data: { id: "u1" }, error: null } },
        task_assignees: { chainRes: { error: null } },
      });
      await addTaskAssigneeAction(10, "u1");
      expect(syncPrimaryAssignee).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("removeTaskAssigneeAction succeeds", async () => {
      setDbMock({ task_assignees: { chainRes: { error: null } } });
      await removeTaskAssigneeAction(10, "u1");
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("removeAllTaskAssigneesAction succeeds", async () => {
      setDbMock({ task_assignees: { chainRes: { error: null } } });
      await removeAllTaskAssigneesAction(10);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe("Column Actions", () => {
    it("createColumnAction succeeds", async () => {
      setDbMock({ columns: { singleRes: { data: { id: 1 }, error: null } } });
      await createColumnAction(1, "To Do", 1);
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("updateColumnAction succeeds", async () => {
      setDbMock({
        columns: {
          singleRes: { data: { board_id: 1 }, error: null },
          chainRes: { error: null },
        },
      });
      await updateColumnAction(1, { title: "Done" });
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("deleteColumnAction throws if column has tasks", async () => {
      setDbMock({
        columns: { singleRes: { data: { board_id: 1 }, error: null } },
        tasks: { chainRes: { count: 5, error: null } }, // Has tasks
      });
      await expect(deleteColumnAction(1)).rejects.toThrow(
        "Không thể xóa cột vẫn còn chứa task.",
      );
    });

    it("deleteColumnAction succeeds if no tasks", async () => {
      setDbMock({
        columns: {
          singleRes: { data: { board_id: 1 }, error: null },
          chainRes: { error: null },
        },
        tasks: { chainRes: { count: 0, error: null } }, // No tasks
      });
      await deleteColumnAction(1);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });

  describe("Comment Actions", () => {
    it("createCommentAction succeeds", async () => {
      setDbMock({ comments: { singleRes: { data: { id: 1 }, error: null } } });
      await createCommentAction(10, "Test comment");
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("createCommentAction fails on db error", async () => {
      setDbMock({
        comments: { singleRes: { data: null, error: new Error("DB Err") } },
      });
      await expect(createCommentAction(10, "Test comment")).rejects.toThrow(
        "DB Err",
      );
    });

    it("deleteCommentAction throws if not owner", async () => {
      setDbMock({
        comments: {
          singleRes: {
            data: { user_id: "other_user", task_id: 10 },
            error: null,
          },
        },
      });
      await expect(deleteCommentAction(1)).rejects.toThrow(
        "You can only delete your own comments.",
      );
    });

    it("deleteCommentAction succeeds", async () => {
      setDbMock({
        comments: {
          singleRes: {
            data: { user_id: "user_123", task_id: 10 },
            error: null,
          },
          chainRes: { error: null },
        },
      });
      await deleteCommentAction(1);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });
});
