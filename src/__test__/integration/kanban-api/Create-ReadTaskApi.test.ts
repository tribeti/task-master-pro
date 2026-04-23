import { POST, PUT } from "@/app/api/kanban/tasks/route";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  verifyBoardAccess,
  verifyAllBoardsAccess,
  AuthorizationError,
} from "@/utils/board-access";

// --- MOCKING DEPENDENCIES ---
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));
jest.mock("@/utils/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));
jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  verifyAllBoardsAccess: jest.fn(),
  validateString: jest.fn((val) => val), // Trả về giá trị gốc để dễ test
  AuthorizationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthorizationError";
    }
  },
}));

// Helper function để tạo Request object
const createRequest = (method: "POST" | "PUT", body: any) => {
  return new Request("http://localhost/api/kanban/tasks", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

describe("Tasks API (POST & PUT)", () => {
  let mockSupabase: any;
  let mockAdminSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chaining cho Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    mockAdminSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);
  });

  describe("POST /api/kanban/tasks", () => {
    it("nên trả về 401 nếu user chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Auth err"),
      });
      const req = createRequest("POST", {
        title: "Test",
        column_id: 1,
        position: 0,
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("nên trả về 400 nếu column_id không hợp lệ", async () => {
      const req = createRequest("POST", {
        title: "Test",
        column_id: "invalid",
        position: 0,
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid column_id.");
    });

    it("nên trả về 403 nếu check verifyBoardAccess thất bại", async () => {
      // Mock tìm thấy column nhưng verify thất bại
      mockSupabase.single.mockResolvedValueOnce({
        data: { board_id: 10 },
        error: null,
      });
      (verifyBoardAccess as jest.Mock).mockRejectedValueOnce(
        new AuthorizationError("Access denied"),
      );

      const req = createRequest("POST", {
        title: "Test",
        column_id: 1,
        position: 0,
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Access denied.");
    });

    it("nên tạo task thành công và gửi notification", async () => {
      const payload = {
        title: "New Task",
        column_id: 1,
        position: 0,
        priority: "High",
      };

      // Mock check column tồn tại
      mockSupabase.single
        .mockResolvedValueOnce({ data: { board_id: 10 }, error: null }) // cho select column
        .mockResolvedValueOnce({ data: { id: 99, ...payload }, error: null }); // cho insert task

      (verifyBoardAccess as jest.Mock).mockResolvedValueOnce(undefined);

      const req = createRequest("POST", payload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe(99);

      // Verify Admin client được gọi để tạo notification
      expect(createAdminClient).toHaveBeenCalled();
      expect(mockAdminSupabase.from).toHaveBeenCalledWith("notifications");
      expect(mockAdminSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: "user-123",
          project_id: 10,
          task_id: 99,
          content: expect.stringContaining("New Task"),
        }),
      ]);
    });
  });

  describe("PUT /api/kanban/tasks", () => {
    it("nên trả về mảng rỗng nếu payload không phải array hoặc rỗng", async () => {
      const req1 = createRequest("PUT", {}); // Object thay vì Array
      const res1 = await PUT(req1);
      expect(await res1.json()).toEqual([]);

      const req2 = createRequest("PUT", []); // Array rỗng
      const res2 = await PUT(req2);
      expect(await res2.json()).toEqual([]);
    });

    it("nên trả về 400 nếu dữ liệu cập nhật không hợp lệ", async () => {
      const updates = [{ id: 1, column_id: "invalid", position: 0 }];
      const req = createRequest("PUT", updates);
      const res = await PUT(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Bad Request");
    });

    it("nên trả về 404 nếu không tìm thấy đủ số lượng task yêu cầu", async () => {
      const updates = [
        { id: 1, column_id: 2, position: 1 },
        { id: 2, column_id: 2, position: 2 },
      ];
      // Mock db chỉ trả về 1 task (thiếu 1 task so với payload)
      mockSupabase.in.mockResolvedValueOnce({
        data: [{ id: 1, column_id: 1, position: 0 }],
        error: null,
      });

      const req = createRequest("PUT", updates);
      const res = await PUT(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("one or more tasks could not be found");
    });

    it("nên cập nhật thành công nhiều task", async () => {
      const updates = [
        { id: 1, column_id: 2, position: 0 },
        { id: 2, column_id: 2, position: 1 },
      ];

      // Mock DB fetch existing tasks
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          { id: 1, column_id: 1, position: 0, title: "Task 1" },
          { id: 2, column_id: 1, position: 1, title: "Task 2" },
        ],
        error: null,
      });

      // Mock DB fetch columns (column cũ là 1, column mới là 2)
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          { id: 1, board_id: 10 },
          { id: 2, board_id: 10 },
        ],
        error: null,
      });

      (verifyAllBoardsAccess as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock DB upsert thành công
      mockSupabase.upsert.mockResolvedValueOnce({ error: null });

      const req = createRequest("PUT", updates);
      const res = await PUT(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Kiểm tra hàm upsert được gọi đúng dữ liệu
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            column_id: 2,
            position: 0,
            title: "Task 1",
          }),
          expect.objectContaining({
            id: 2,
            column_id: 2,
            position: 1,
            title: "Task 2",
          }),
        ]),
        { onConflict: "id" },
      );
    });
  });
});
