import { PUT, DELETE } from "@/app/api/kanban/columns/[columnId]/route";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess, validateString } from "@/utils/board-access";

// 1. Mock Next.js Server Components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// 2. Mock Utilities
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  validateString: jest.fn(),
  AuthorizationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "AuthorizationError";
    }
  },
}));

// 3. SMART MOCK CHAINS
const mockAuthGetUser = jest.fn();

// --- Chain cho "columns" ---
const mockColSingle = jest.fn();
const mockColEqSingle = jest.fn().mockReturnValue({ single: mockColSingle });
const mockColSelect = jest.fn().mockReturnValue({ eq: mockColEqSingle });

const mockColUpdateEq = jest.fn();
const mockColUpdate = jest.fn().mockReturnValue({ eq: mockColUpdateEq });

const mockColDeleteEq = jest.fn();
const mockColDelete = jest.fn().mockReturnValue({ eq: mockColDeleteEq });

// --- Chain cho "tasks" (Dùng cho lệnh đếm count) ---
const mockTaskCountEq = jest.fn();
const mockTaskSelect = jest.fn().mockReturnValue({ eq: mockTaskCountEq });

// Router tổng
const mockFrom = jest.fn((table: string) => {
  if (table === "columns") {
    return {
      select: mockColSelect,
      update: mockColUpdate,
      delete: mockColDelete,
    };
  }
  if (table === "tasks") {
    return {
      select: mockTaskSelect,
    };
  }
  return {};
});

describe("/api/kanban/columns/[columnId]", () => {
  const MOCK_USER = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    (verifyBoardAccess as jest.Mock).mockResolvedValue(true);
    (validateString as jest.Mock).mockImplementation((val) => val);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Hỗ trợ tạo params Promise theo chuẩn Next.js 15+
  const createContext = (columnId: string | number = 10) => ({
    params: Promise.resolve({ columnId: String(columnId) }),
  });

  const createMockRequest = (method: "PUT" | "DELETE", bodyData?: any) => {
    return new Request("http://localhost:3000/api/kanban/columns/10", {
      method,
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    }) as any;
  };

  // ==========================================
  // TEST SUITE: PUT (Cập nhật cột)
  // ==========================================
  describe("PUT", () => {
    it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest("PUT", { title: "New Title" });
      const res = await PUT(req, createContext());
      expect(res.status).toBe(401);
    });

    it("2. Lỗi 400 nếu position bị sai định dạng (số âm hoặc không phải số nguyên)", async () => {
      const req = createMockRequest("PUT", { position: -5 });
      const res = await PUT(req, createContext());
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid position.");
    });

    it("3. Lỗi 400 nếu payload gửi lên không có trường hợp lệ nào", async () => {
      // Gửi rác hoặc object rỗng
      const req = createMockRequest("PUT", { unknown_field: "xyz" });
      const res = await PUT(req, createContext());
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe("No valid fields to update.");
    });

    it("4. Lỗi 404 nếu không tìm thấy cột trong database", async () => {
      mockColSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const req = createMockRequest("PUT", { title: "New" });
      const res = await PUT(req, createContext());
      expect(res.status).toBe(404);
    });

    it("5. Lỗi 403 nếu bị chặn quyền (verifyBoardAccess văng lỗi AuthorizationError)", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      const authError = new Error("Access denied");
      authError.name = "AuthorizationError";
      (verifyBoardAccess as jest.Mock).mockRejectedValue(authError);

      const req = createMockRequest("PUT", { title: "New" });
      const res = await PUT(req, createContext());
      expect(res.status).toBe(403);
    });

    it("6. Lỗi 500 nếu update database thất bại", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockColUpdateEq.mockResolvedValue({ error: { message: "Update fail" } });

      const req = createMockRequest("PUT", { title: "New" });
      const res = await PUT(req, createContext());
      expect(res.status).toBe(500);
    });

    it("7. Thành công (200) update title và position", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockColUpdateEq.mockResolvedValue({ error: null });

      const req = createMockRequest("PUT", { title: "Updated", position: 3 });
      const res = await PUT(req, createContext(10)); // columnId = 10
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify đúng tải trọng (payload) và ID
      expect(mockColUpdate).toHaveBeenCalledWith({
        title: "Updated",
        position: 3,
      });
      expect(mockColUpdateEq).toHaveBeenCalledWith("id", 10);
    });

    it("8. Catch block: Xử lý exception bất ngờ (vd: Lỗi parse JSON)", async () => {
      const req = new Request("http://localhost:3000", {
        method: "PUT",
        body: "invalid-json",
      }) as any;
      const res = await PUT(req, createContext());
      expect(res.status).toBe(500);
    });
  });

  // ==========================================
  // TEST SUITE: DELETE (Xóa cột)
  // ==========================================
  describe("DELETE", () => {
    it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());
      expect(res.status).toBe(401);
    });

    it("2. Lỗi 404 nếu không tìm thấy cột trong database", async () => {
      mockColSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });
      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());
      expect(res.status).toBe(404);
    });

    it("3. Lỗi 403 nếu bị chặn quyền (verifyBoardAccess từ chối)", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockTaskCountEq.mockResolvedValue({ count: 0, error: null });

      const authError = new Error("Access denied");
      authError.name = "AuthorizationError";
      (verifyBoardAccess as jest.Mock).mockResolvedValueOnce(
        Promise.reject(authError),
      );

      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());

      expect(res.status).toBe(403);
      // Đảm bảo không gọi delete
      expect(mockColDelete).not.toHaveBeenCalled();
      expect(mockColDeleteEq).not.toHaveBeenCalled();
    });

    it("4. Lỗi 500 nếu đếm task thất bại", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockTaskCountEq.mockResolvedValue({
        count: null,
        error: { message: "Count fail" },
      });

      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());
      expect(res.status).toBe(500);
    });

    it("5. Lỗi 400 nếu cột vẫn còn chứa task (count > 0)", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockTaskCountEq.mockResolvedValue({ count: 5, error: null }); // Có 5 task

      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Không thể xóa cột vẫn còn chứa task.");
    });

    it("6. Lỗi 500 nếu lệnh xóa cột thất bại", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockTaskCountEq.mockResolvedValue({ count: 0, error: null }); // Rỗng task
      mockColDeleteEq.mockResolvedValue({ error: { message: "Delete fail" } });

      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext());
      expect(res.status).toBe(500);
    });

    it("7. Thành công (200) xóa cột rỗng", async () => {
      mockColSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
      mockTaskCountEq.mockResolvedValue({ count: 0, error: null });
      mockColDeleteEq.mockResolvedValue({ error: null });

      const req = createMockRequest("DELETE");
      const res = await DELETE(req, createContext(99)); // columnId = 99
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Xác minh lệnh delete đúng ID
      expect(mockColDelete).toHaveBeenCalled();
      expect(mockColDeleteEq).toHaveBeenCalledWith("id", 99);
    });

    it("8. Catch block: Xử lý exception bất ngờ (vd: params reject)", async () => {
      const res = await DELETE(createMockRequest("DELETE"), {
        params: Promise.reject(new Error("Crash")),
      });
      expect(res.status).toBe(500);
    });
  });
});
