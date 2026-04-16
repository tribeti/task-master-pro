import { POST } from "@/app/api/boards/[boardId]/columns/default/route";

// 1. Import các module cần mock
import { createClient } from "@/utils/supabase/server";
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

jest.mock("@/utils/verify-board-ownership", () => ({
  verifyBoardOwnership: jest.fn(),
}));

// 3. Khởi tạo Mock Chain cho Supabase
const mockAuthGetUser = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

describe("POST /api/boards/[boardId]/columns/default", () => {
  const mockUser = { id: "owner-123", email: "owner@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    // Khởi tạo Supabase mock client
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    // Mặc định luôn đăng nhập thành công
    mockAuthGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Mặc định luôn là owner
    (verifyBoardOwnership as jest.Mock).mockResolvedValue(true);

    // Ẩn console.error khi test lỗi
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Hỗ trợ tạo NextRequest giả
  const createMockRequest = () => {
    return new Request("http://localhost:3000/api/boards/123/columns/default", {
      method: "POST",
    }) as any;
  };

  it("1. Lỗi 400 nếu boardId không hợp lệ (NaN)", async () => {
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "abc" }); // abc không parse ra số được

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid boardId");
  });

  it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "123" });

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("3. Lỗi 403 nếu user không phải là owner của board", async () => {
    (verifyBoardOwnership as jest.Mock).mockResolvedValue(false);
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "123" });

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Access denied.");
  });

  it("4. Lỗi 500 nếu Supabase insert thất bại", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB Error" } });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "123" });

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to create default columns.");
  });

  it("5. Tạo 3 cột mặc định thành công (201)", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "123" });

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);

    // Xác minh bảng được chọn là "columns"
    expect(mockFrom).toHaveBeenCalledWith("columns");

    // Xác minh payload insert có đủ 3 cột với đúng boardId và position
    expect(mockInsert).toHaveBeenCalledWith([
      { title: "To Do", board_id: 123, position: 0 },
      { title: "In Progress", board_id: 123, position: 1 },
      { title: "Done", board_id: 123, position: 2 },
    ]);
  });

  it("6. Catch block: Lỗi 500 nếu có exception (VD: params Promise bị reject)", async () => {
    const req = createMockRequest();
    // Gây crash ở await params
    const params = Promise.reject(new Error("Params error"));

    const res = await POST(req, { params });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Internal server error");
  });
});
