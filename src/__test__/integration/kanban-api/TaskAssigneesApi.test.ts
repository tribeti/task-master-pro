import { POST, DELETE } from "@/app/api/kanban/tasks/[taskId]/assignees/route";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  verifyTaskAccess,
  getTaskBoardId,
  ensureBoardMember,
  syncPrimaryAssignee,
} from "@/utils/board-access";

// --- MOCKING DEPENDENCIES ---
jest.mock("@/utils/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/utils/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("@/utils/board-access", () => ({
  verifyTaskAccess: jest.fn(),
  getTaskBoardId: jest.fn(),
  ensureBoardMember: jest.fn(),
  syncPrimaryAssignee: jest.fn(),
}));

// Helper function
const createRequest = (
  method: "POST" | "DELETE",
  bodyParams?: any,
  queryParams?: string,
) => {
  const url = `http://localhost/api/kanban/tasks/123/assignees${queryParams ? `?${queryParams}` : ""}`;
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: bodyParams ? JSON.stringify(bodyParams) : undefined,
  });
};

const createContext = (taskId: string = "123") => ({
  params: Promise.resolve({ taskId }),
});

describe("Task Assignees API (POST & DELETE)", () => {
  let mockSupabase: any;
  let mockQueryBuilder: any;
  let mockAdminSupabase: any;
  let mockAdminQueryBuilder: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // 1. Setup Query Builder (cho phép chain method và await ở cuối)
    mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({ data: { id: "assignee-456" }, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      // Hàm then giúp biến query builder thành 1 Promise ảo khi sử dụng `await`
      then: jest.fn((resolve) => resolve({ data: null, error: null })),
    };

    // 2. Setup Supabase Client (Object tĩnh, chứa auth và from)
    mockSupabase = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
      },
      from: jest.fn().mockReturnValue(mockQueryBuilder),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    // 3. Setup Admin Supabase Client (cho Notifications)
    mockAdminQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockResolvedValue({
          data: { title: "Mock Task", display_name: "Mock User" },
          error: null,
        }),
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    mockAdminSupabase = {
      from: jest.fn().mockReturnValue(mockAdminQueryBuilder),
    };
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);

    // 4. Mặc định các utils chạy thành công
    (verifyTaskAccess as jest.Mock).mockResolvedValue(undefined);
    (getTaskBoardId as jest.Mock).mockResolvedValue(10);
    (ensureBoardMember as jest.Mock).mockResolvedValue(undefined);
    (syncPrimaryAssignee as jest.Mock).mockResolvedValue(undefined);
  });

  describe("POST /api/kanban/tasks/[taskId]/assignees", () => {
    it("nên trả về 401 nếu chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createRequest("POST", { userId: "assignee-456" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Unauthorized" });
    });

    it("nên trả về 404 nếu không tìm thấy người dùng (assigneeErr)", async () => {
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: new Error("Not found"),
      });
      const req = createRequest("POST", { userId: "assignee-456" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Assignee not found." });
    });

    it("nên trả về 500 nếu thêm assignee thất bại (upsert error)", async () => {
      // Mock single thành công, nhưng upsert bị lỗi
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: "assignee-456" },
        error: null,
      });
      mockQueryBuilder.upsert.mockResolvedValueOnce({
        error: new Error("DB error"),
      });

      const req = createRequest("POST", { userId: "assignee-456" });
      const res = await POST(req, createContext());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to add assignee." });
    });

    it("nên gán task thành công, đồng bộ assignee và gửi thông báo", async () => {
      const assigneeId = "assignee-456";
      const req = createRequest("POST", { userId: assigneeId });
      const res = await POST(req, createContext());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });

      // Verify các logic liên quan
      expect(ensureBoardMember).toHaveBeenCalledWith(
        mockSupabase,
        10,
        assigneeId,
      );
      expect(mockQueryBuilder.upsert).toHaveBeenCalled();
      expect(syncPrimaryAssignee).toHaveBeenCalledWith(mockSupabase, 123);
      expect(mockAdminQueryBuilder.insert).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/kanban/tasks/[taskId]/assignees", () => {
    it("nên trả về 401 nếu chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createRequest("DELETE");
      const res = await DELETE(req, createContext());
      expect(res.status).toBe(401);
    });

    it("nên xóa tất cả assignees nếu truyền param removeAll=true", async () => {
      const req = createRequest("DELETE", undefined, "removeAll=true");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(200);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("task_id", 123);
      expect(syncPrimaryAssignee).toHaveBeenCalledWith(mockSupabase, 123);
    });

    it("nên trả về 500 nếu xóa tất cả assignees thất bại", async () => {
      // Ép chuỗi await cuối cùng trả về error
      mockQueryBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ error: new Error("DB Error") }),
      );

      const req = createRequest("DELETE", undefined, "removeAll=true");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: "Failed to remove all assignees.",
      });
    });

    it("nên trả về 400 nếu removeAll=false nhưng không truyền userId", async () => {
      const req = createRequest("DELETE", undefined, "removeAll=false");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "userId is required when removeAll is false",
      });
    });

    it("nên xóa 1 assignee cụ thể nếu truyền userId hợp lệ", async () => {
      const req = createRequest(
        "DELETE",
        undefined,
        "removeAll=false&userId=assignee-456",
      );
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(200);
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        "user_id",
        "assignee-456",
      );
      expect(syncPrimaryAssignee).toHaveBeenCalledWith(mockSupabase, 123);
    });

    it("nên trả về 500 nếu lệnh xóa assignee cụ thể bị lỗi", async () => {
      mockQueryBuilder.then.mockImplementationOnce((resolve: any) =>
        resolve({ error: new Error("Failed specific") }),
      );

      const req = createRequest("DELETE", undefined, "userId=assignee-456");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Failed to remove assignee." });
    });
  });
});
