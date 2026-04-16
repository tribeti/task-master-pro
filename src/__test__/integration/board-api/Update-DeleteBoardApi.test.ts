import { PUT, DELETE } from "@/app/api/boards/[boardId]/route";
import { createClient } from "@/utils/supabase/server";
import { validateString } from "@/utils/validate-string";
import { verifyBoardOwnership } from "@/utils/verify-board-ownership";

// 2. Setup Mocks
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/validate-string", () => ({
  validateString: jest.fn(),
}));

jest.mock("@/utils/verify-board-ownership", () => ({
  verifyBoardOwnership: jest.fn(),
}));

// 3. Khởi tạo Mock Chain cho Supabase
const mockAuthGetUser = jest.fn();

// Mock cho query Update
const mockEq2 = jest.fn();
const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq1 });
const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

// Mock cho RPC (Remote Procedure Call)
const mockRpc = jest.fn();

describe("/api/boards/[boardId]", () => {
  const mockUser = { id: "owner-123", email: "owner@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    // Khởi tạo Supabase mock client
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
      rpc: mockRpc,
    });

    // Mặc định luôn đăng nhập thành công
    mockAuthGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Mặc định luôn là owner
    (verifyBoardOwnership as jest.Mock).mockResolvedValue(true);

    // Mặc định validateString trả về nguyên gốc
    (validateString as jest.Mock).mockImplementation((val) => val);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Hỗ trợ tạo NextRequest giả
  const createMockRequest = (bodyData?: any) => {
    return new Request("http://localhost:3000/api/boards/123", {
      method: bodyData ? "PUT" : "DELETE",
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    }) as any;
  };

  // ==========================================
  // TEST SUITE: PUT
  // ==========================================
  describe("PUT", () => {
    it("1. Lỗi 400 nếu boardId không phải là số hợp lệ", async () => {
      const req = createMockRequest({});
      // Giả lập params chứa chuỗi không parse ra số được
      const params = Promise.resolve({ boardId: "abc" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid boardId");
    });

    it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest({});
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("3. Lỗi 403 nếu user không phải là owner của board", async () => {
      (verifyBoardOwnership as jest.Mock).mockResolvedValue(false);
      const req = createMockRequest({ title: "Mới" });
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Access denied.");
    });

    it("4. Lỗi 400 nếu dữ liệu truyền vào sai (validateString báo lỗi)", async () => {
      (validateString as jest.Mock).mockImplementation(() => {
        throw new Error("Project title không hợp lệ");
      });
      const req = createMockRequest({ title: "" });
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Project title không hợp lệ");
    });

    it("5. Cập nhật thành công (200) với các trường dữ liệu được xử lý đúng", async () => {
      mockEq2.mockResolvedValue({ error: null });

      const req = createMockRequest({
        title: "New Title",
        description: "   New Description   ",
        color: "#fff",
        tag: "dev",
        is_private: false,
      });
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Kiểm tra chuỗi mock.update -> eq(id) -> eq(owner_id)
      expect(mockUpdate).toHaveBeenCalledWith({
        title: "New Title",
        description: "New Description", // Đã được trim()
        color: "#fff",
        tag: "dev",
        is_private: false,
      });
      expect(mockEq1).toHaveBeenCalledWith("id", 123);
      expect(mockEq2).toHaveBeenCalledWith("owner_id", "owner-123");
    });

    it("6. Lỗi 500 nếu Supabase update thất bại", async () => {
      mockEq2.mockResolvedValue({ error: { message: "DB Error" } });

      const req = createMockRequest({ title: "New Title" });
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to update project.");
    });

    it("7. Lỗi 400 nếu body request gửi lên không phải JSON", async () => {
      const req = new Request("http://localhost:3000/api/boards/123", {
        method: "PUT",
        body: "invalid-json", // Kích hoạt SyntaxError ở request.json()
      }) as any;
      const params = Promise.resolve({ boardId: "123" });

      const res = await PUT(req, { params });
      const body = await res.json();

      expect(res.status).toBe(400); // Rơi vào nhánh catch bắt Error thường
      expect(body.error).toBeDefined();
    });
  });

  // ==========================================
  // TEST SUITE: DELETE
  // ==========================================
  describe("DELETE", () => {
    it("1. Lỗi 400 nếu boardId không hợp lệ (NaN)", async () => {
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "not-a-number" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid boardId");
    });

    it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(401);
    });

    it("3. Lỗi 404 (P0002) nếu board không tồn tại", async () => {
      mockRpc.mockResolvedValue({ error: { code: "P0002" } });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Board not found.");
    });

    it("4. Lỗi 403 (P0003) nếu user không có quyền xóa", async () => {
      mockRpc.mockResolvedValue({ error: { code: "P0003" } });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe("Access denied.");
    });

    it("5. Lỗi 409 (P0004) nếu vẫn còn task chưa Done", async () => {
      mockRpc.mockResolvedValue({ error: { code: "P0004" } });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toContain("Cannot delete project");
    });

    it("6. Lỗi 500 nếu gặp mã lỗi RPC không xác định", async () => {
      mockRpc.mockResolvedValue({
        error: { code: "XYZ123", message: "Unknown" },
      });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to delete project.");
    });

    it("7. Xóa thành công (200)", async () => {
      mockRpc.mockResolvedValue({ error: null });
      const req = createMockRequest();
      const params = Promise.resolve({ boardId: "123" });

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Đảm bảo RPC được gọi đúng với tham số
      expect(mockRpc).toHaveBeenCalledWith("delete_board", {
        p_board_id: 123,
        p_owner_id: "owner-123",
      });
    });

    it("8. Catch block: Lỗi 500 nếu có exception (VD: params Promise bị reject)", async () => {
      const req = createMockRequest();
      // Giả lập params ném lỗi bất ngờ
      const params = Promise.reject(new Error("Params parsing failed"));

      const res = await DELETE(req, { params });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Internal server error");
    });
  });
});
