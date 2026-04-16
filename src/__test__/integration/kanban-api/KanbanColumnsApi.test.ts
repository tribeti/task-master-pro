import { POST, PUT } from "@/app/api/kanban/columns/route";
import { createClient } from "@/utils/supabase/server";
import {
  verifyBoardAccess,
  verifyAllBoardsAccess,
  validateString,
} from "@/utils/board-access";

// 1. Mock Next.js Server Components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// 2. Mock Supabase Client
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// 3. Mock Utilities
jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  verifyAllBoardsAccess: jest.fn(),
  validateString: jest.fn(),
}));

// 4. SMART MOCK CHAINS (Trả về object thay vì function để chống lỗi)
const mockAuthGetUser = jest.fn();

// --- Chain cho POST ---
const mockInsertSingle = jest.fn();
const mockInsertSelectChain = { single: mockInsertSingle };
const mockInsert = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue(mockInsertSelectChain),
});

// --- Chain cho PUT ---
const mockSelectIn = jest.fn();
const mockSelectChain = { in: mockSelectIn };
const mockSelect = jest.fn().mockReturnValue(mockSelectChain);
const mockUpsert = jest.fn();

// Hàm from() định tuyến chung cho bảng "columns"
const mockFrom = jest.fn((table: string) => {
  if (table === "columns") {
    return {
      insert: mockInsert,
      select: mockSelect,
      upsert: mockUpsert,
    };
  }
  return {};
});

describe("/api/kanban/columns", () => {
  const MOCK_USER = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mặc định khởi tạo client thành công
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    // Mặc định Pass Auth
    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_USER } });

    // Mặc định Pass quyền truy cập
    (verifyBoardAccess as jest.Mock).mockResolvedValue(true);
    (verifyAllBoardsAccess as jest.Mock).mockResolvedValue(true);

    // Mặc định string hợp lệ
    (validateString as jest.Mock).mockImplementation((val) => val);

    // Ẩn log lỗi
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (method: "POST" | "PUT", bodyData: any) => {
    return new Request("http://localhost:3000/api/kanban/columns", {
      method,
      body: JSON.stringify(bodyData),
    }) as any;
  };

  // ==========================================
  // TEST SUITE: POST (Tạo cột mới)
  // ==========================================
  describe("POST", () => {
    it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest("POST", {
        projectId: 1,
        title: "To Do",
        position: 0,
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("2. Lỗi 500 nếu validateString quăng lỗi (VD: chuỗi rỗng)", async () => {
      (validateString as jest.Mock).mockImplementation(() => {
        throw new Error("Title không hợp lệ");
      });
      const req = createMockRequest("POST", {
        projectId: 1,
        title: "",
        position: 0,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500); // Catch block của bạn mặc định throw 500
      expect(body.error).toBe("Title không hợp lệ");
    });

    it("3. Lỗi 500 nếu người dùng không có quyền truy cập bảng (verifyBoardAccess)", async () => {
      (verifyBoardAccess as jest.Mock).mockRejectedValue(
        new Error("Access denied"),
      );
      const req = createMockRequest("POST", {
        projectId: 1,
        title: "To Do",
        position: 0,
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });

    it("4. Lỗi 500 nếu insert vào Supabase thất bại", async () => {
      mockInsertSingle.mockResolvedValue({ error: { message: "DB Error" } });
      const req = createMockRequest("POST", {
        projectId: 1,
        title: "To Do",
        position: 0,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to create column.");
    });

    it("5. Tạo cột thành công (200)", async () => {
      const mockCreatedColumn = {
        id: 10,
        title: "To Do",
        board_id: 1,
        position: 0,
      };
      mockInsertSingle.mockResolvedValue({
        data: mockCreatedColumn,
        error: null,
      });

      const req = createMockRequest("POST", {
        projectId: 1,
        title: "To Do",
        position: 0,
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(mockCreatedColumn);

      // Xác minh tham số insert
      expect(mockInsert).toHaveBeenCalledWith([
        { title: "To Do", board_id: 1, position: 0 },
      ]);
    });
  });

  // ==========================================
  // TEST SUITE: PUT (Cập nhật hàng loạt vị trí)
  // ==========================================
  describe("PUT", () => {
    it("1. Trả về mảng rỗng (200) nếu gửi lên mảng updates rỗng", async () => {
      const req = createMockRequest("PUT", []);
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });

    it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const req = createMockRequest("PUT", [{ id: 1, position: 1 }]);
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it("3. Lỗi 404 nếu fetch columns lỗi hoặc số lượng cột trong DB không khớp số lượng gửi lên", async () => {
      // Gửi lên 2 cột cần update, nhưng DB chỉ tìm thấy 1 cột
      mockSelectIn.mockResolvedValue({
        data: [{ id: 1, title: "A", position: 0, board_id: 1 }],
        error: null,
      });

      const req = createMockRequest("PUT", [
        { id: 1, position: 2 },
        { id: 2, position: 3 },
      ]);
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain("Failed to fetch existing columns");
    });

    it("4. Lỗi 500 nếu user không có quyền vào một trong số các bảng chứa cột (verifyAllBoardsAccess)", async () => {
      mockSelectIn.mockResolvedValue({
        data: [{ id: 1, position: 0, board_id: 99 }],
        error: null,
      });
      (verifyAllBoardsAccess as jest.Mock).mockRejectedValue(
        new Error("Access denied for board 99"),
      );

      const req = createMockRequest("PUT", [{ id: 1, position: 2 }]);
      const res = await PUT(req);
      expect(res.status).toBe(500);
    });

    it("5. Lỗi 500 nếu lệnh upsert bulk update thất bại", async () => {
      mockSelectIn.mockResolvedValue({
        data: [{ id: 1, position: 0, board_id: 1 }],
        error: null,
      });
      mockUpsert.mockResolvedValue({ error: { message: "Upsert failed" } });

      const req = createMockRequest("PUT", [{ id: 1, position: 2 }]);
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to bulk update columns.");
    });

    it("6. Cập nhật vị trí kéo thả hàng loạt thành công (200)", async () => {
      const existingCols = [
        { id: 10, title: "To Do", position: 0, board_id: 1 },
        { id: 11, title: "Done", position: 1, board_id: 1 },
      ];
      mockSelectIn.mockResolvedValue({ data: existingCols, error: null });
      mockUpsert.mockResolvedValue({ error: null });

      // Đảo vị trí của 2 cột
      const req = createMockRequest("PUT", [
        { id: 10, position: 1 },
        { id: 11, position: 0 },
      ]);
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify Set được tạo đúng để check quyền
      expect(verifyAllBoardsAccess).toHaveBeenCalledWith(
        expect.anything(),
        MOCK_USER.id,
        new Set([1]), // Cả 2 cột đều thuộc board_id = 1
      );

      // Verify data đẩy vào upsert đã được mix (lấy position mới từ map)
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          { id: 10, title: "To Do", position: 1, board_id: 1 },
          { id: 11, title: "Done", position: 0, board_id: 1 },
        ],
        { onConflict: "id" },
      );
    });

    it("7. Catch block: Trả về 500 nếu body request gửi lên bị lỗi JSON", async () => {
      const req = new Request("http://localhost:3000/api/kanban/columns", {
        method: "PUT",
        body: "invalid-json", // Gây crash ở await request.json()
      }) as any;

      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Unexpected token"); // Lỗi gốc của JSON parse
    });
  });
});
