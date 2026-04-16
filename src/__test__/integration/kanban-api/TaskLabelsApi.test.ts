import { POST, DELETE } from "@/app/api/kanban/tasks/[taskId]/labels/route";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess } from "@/utils/board-access";

// --- MOCKING DEPENDENCIES ---
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyTaskAccess: jest.fn(),
}));

// Helper functions tạo Request và Context
const createContext = (taskId: string = "123") => ({
  params: Promise.resolve({ taskId }),
});

const createPostRequest = (bodyParams?: any) => {
  return new Request("http://localhost/api/kanban/tasks/123/labels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyParams ? JSON.stringify(bodyParams) : undefined,
  });
};

const createDeleteRequest = (labelId?: string) => {
  const url = new URL("http://localhost/api/kanban/tasks/123/labels");
  if (labelId) url.searchParams.set("labelId", labelId);
  return new Request(url.toString(), { method: "DELETE" });
};

describe("Task Labels API (POST & DELETE)", () => {
  let mockSupabase: any;
  let mockTaskQuery: any;
  let mockLabelQuery: any;
  let mockTaskLabelsQuery: any;
  let mockDeleteChain: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTaskQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Setup Mock cho query của bảng 'labels'
    mockLabelQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    // Setup Mock cho chuỗi delete: .delete().eq().eq()
    mockDeleteChain = {
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    };

    // Setup Mock cho query của bảng 'task_labels' (upsert & delete)
    mockTaskLabelsQuery = {
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue(mockDeleteChain),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      // Định tuyến mock dựa trên tên bảng được truyền vào .from()
      from: jest.fn((table: string) => {
        if (table === "tasks") return mockTaskQuery;
        if (table === "labels") return mockLabelQuery;
        if (table === "task_labels") return mockTaskLabelsQuery;
        return { select: jest.fn() };
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (verifyTaskAccess as jest.Mock).mockResolvedValue(undefined);
  });

  describe("POST /api/kanban/tasks/[taskId]/labels", () => {
    it("nên trả về 401 nếu user chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(401);
    });

    it("nên trả về 500 nếu verifyTaskAccess bị lỗi (không có quyền)", async () => {
      (verifyTaskAccess as jest.Mock).mockRejectedValueOnce(
        new Error("No access"),
      );
      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("No access");
    });

    it("nên trả về 404 nếu không tìm thấy task", async () => {
      mockTaskQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });
      mockLabelQuery.single.mockResolvedValueOnce({
        data: { id: 1, board_id: 10 },
        error: null,
      });

      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Task not found.");
    });

    it("nên trả về 404 nếu không tìm thấy label", async () => {
      mockTaskQuery.single.mockResolvedValueOnce({
        data: { columns: { board_id: 10 } },
        error: null,
      });
      mockLabelQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe("Label not found.");
    });

    it("nên trả về 403 nếu label không thuộc cùng board với task", async () => {
      // Task thuộc board 10, nhưng Label thuộc board 99
      mockTaskQuery.single.mockResolvedValueOnce({
        data: { columns: { board_id: 10 } },
        error: null,
      });
      mockLabelQuery.single.mockResolvedValueOnce({
        data: { id: 1, board_id: 99 },
        error: null,
      });

      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe(
        "Label does not belong to this board.",
      );
    });

    it("nên thêm label vào task thành công", async () => {
      mockTaskQuery.single.mockResolvedValueOnce({
        data: { columns: { board_id: 10 } },
        error: null,
      });
      mockLabelQuery.single.mockResolvedValueOnce({
        data: { id: 1, board_id: 10 },
        error: null,
      });

      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });

      expect(mockTaskLabelsQuery.upsert).toHaveBeenCalledWith(
        [{ task_id: 123, label_id: 1 }],
        { onConflict: "task_id,label_id", ignoreDuplicates: true },
      );
    });

    it("nên trả về 500 nếu upsert bị lỗi", async () => {
      mockTaskQuery.single.mockResolvedValueOnce({
        data: { columns: { board_id: 10 } },
        error: null,
      });
      mockLabelQuery.single.mockResolvedValueOnce({
        data: { id: 1, board_id: 10 },
        error: null,
      });
      mockTaskLabelsQuery.upsert.mockResolvedValueOnce({
        error: new Error("DB Error"),
      });

      const req = createPostRequest({ labelId: 1 });
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Failed to add label to task.");
    });
  });

  describe("DELETE /api/kanban/tasks/[taskId]/labels", () => {
    it("nên trả về 400 nếu thiếu param labelId", async () => {
      const req = createDeleteRequest(); // Không truyền labelId
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe("labelId is required");
    });

    it("nên trả về 401 nếu chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createDeleteRequest("1");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(401);
    });

    it("nên xóa label khỏi task thành công", async () => {
      const req = createDeleteRequest("99");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });

      // Verify chuỗi delete().eq("task_id", 123).eq("label_id", 99)
      expect(mockTaskLabelsQuery.delete).toHaveBeenCalled();
      expect(mockDeleteChain.eq).toHaveBeenCalledWith("task_id", 123);
    });

    it("nên trả về 500 nếu lệnh xóa database thất bại", async () => {
      // Ép chuỗi eq cuối cùng trả về error
      mockDeleteChain.eq.mockReturnValueOnce({
        eq: jest
          .fn()
          .mockResolvedValue({ error: new Error("DB Delete Error") }),
      });

      const req = createDeleteRequest("99");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe(
        "Failed to remove label from task.",
      );
    });
  });
});
