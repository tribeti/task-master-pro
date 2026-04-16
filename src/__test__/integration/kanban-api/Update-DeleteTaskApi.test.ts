import { PUT, DELETE } from "@/app/api/kanban/tasks/[taskId]/route";
import { createClient } from "@/utils/supabase/server";
import {
  verifyBoardAccess,
  verifyTaskAccess,
  validateString,
} from "@/utils/board-access";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));
jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  verifyTaskAccess: jest.fn(),
  validateString: jest.fn(),
}));

// Helper function tạo Request và Context
const createRequest = (method: "PUT" | "DELETE", body?: any) => {
  return new Request(`http://localhost/api/kanban/tasks/123`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
};

const createContext = (taskId: string = "123") => ({
  params: Promise.resolve({ taskId }),
});

describe("Update/Delete Task API", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

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
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe("PUT /api/kanban/tasks/[taskId]", () => {
    it("nên trả về 401 nếu user chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createRequest("PUT", { title: "New Title" });
      const res = await PUT(req, createContext());

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("nên trả về lỗi (500) nếu validateString ném lỗi", async () => {
      (validateString as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid string length");
      });

      const req = createRequest("PUT", { title: "A".repeat(300) });
      const res = await PUT(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Invalid string length");
    });

    it("nên trả về 500 nếu verifyTaskAccess ném lỗi (vd: không có quyền)", async () => {
      (verifyTaskAccess as jest.Mock).mockRejectedValueOnce(
        new Error("No access to this task"),
      );

      const req = createRequest("PUT", { title: "Valid Title" });
      const res = await PUT(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("No access to this task");
    });

    it("nên trả về 403 nếu cố gắng chuyển sang cột (column_id) không tồn tại", async () => {
      (verifyTaskAccess as jest.Mock).mockResolvedValueOnce(undefined);
      // Mock db không tìm thấy column
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error("Not found"),
      });

      const req = createRequest("PUT", { column_id: 99 });
      const res = await PUT(req, createContext());

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Access denied.");
    });

    it("nên cập nhật task thành công khi chuyển sang cột mới", async () => {
      (verifyTaskAccess as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock db tìm thấy column_id mới và kiểm tra quyền truy cập board mới thành công
      mockSupabase.single.mockResolvedValueOnce({
        data: { board_id: 10 },
        error: null,
      });
      (verifyBoardAccess as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock update thành công
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 123, column_id: 99 },
        error: null,
      });

      const req = createRequest("PUT", { column_id: 99 });
      const res = await PUT(req, createContext());

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe(123);
      expect(verifyBoardAccess).toHaveBeenCalledWith(
        mockSupabase,
        "user-123",
        10,
      );
    });

    it("nên cập nhật thông tin task thành công mà không đổi cột", async () => {
      (verifyTaskAccess as jest.Mock).mockResolvedValueOnce(undefined);

      const payload = { description: "Updated desc" };
      // Chỉ mock 1 lần cho việc update (vì không cập nhật column_id nên không query bảng columns)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 123, ...payload },
        error: null,
      });

      const req = createRequest("PUT", payload);
      const res = await PUT(req, createContext());

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.description).toBe("Updated desc");

      // Không gọi verifyBoardAccess vì không đổi column
      expect(verifyBoardAccess).not.toHaveBeenCalled();
      expect(mockSupabase.update).toHaveBeenCalledWith(payload);
    });
  });

  describe("DELETE /api/kanban/tasks/[taskId]", () => {
    it("nên trả về 401 nếu user chưa đăng nhập", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });
      const req = createRequest("DELETE");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(401);
    });

    it("nên trả về lỗi (500) nếu verifyTaskAccess thất bại", async () => {
      (verifyTaskAccess as jest.Mock).mockRejectedValueOnce(
        new Error("Cannot access"),
      );

      const req = createRequest("DELETE");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Cannot access");
    });

    it("nên trả về 500 nếu lệnh xóa database thất bại", async () => {
      (verifyTaskAccess as jest.Mock).mockResolvedValueOnce(undefined);
      mockSupabase.eq.mockResolvedValueOnce({ error: new Error("DB Error") });

      const req = createRequest("DELETE");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe("Failed to delete task.");
    });

    it("nên xóa task thành công", async () => {
      (verifyTaskAccess as jest.Mock).mockResolvedValueOnce(undefined);
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const req = createRequest("DELETE");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", 123);
    });
  });
});
