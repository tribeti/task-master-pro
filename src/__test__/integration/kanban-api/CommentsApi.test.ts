import { DELETE } from "@/app/api/kanban/comments/[commentId]/route";
import { createClient } from "@/utils/supabase/server";
import { verifyTaskAccess } from "@/utils/board-access";

// 1. Mock Next.js Server Components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// 2. Mock Supabase & Utilities
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyTaskAccess: jest.fn(),
}));

// 3. SMART MOCK CHAINS
const mockAuthGetUser = jest.fn();

// Chain cho "comments"
const mockCommentSingle = jest.fn();
const mockCommentEqSingle = jest
  .fn()
  .mockReturnValue({ single: mockCommentSingle });
const mockCommentSelect = jest
  .fn()
  .mockReturnValue({ eq: mockCommentEqSingle });

const mockCommentDeleteEq = jest.fn();
const mockCommentDelete = jest
  .fn()
  .mockReturnValue({ eq: mockCommentDeleteEq });

const mockFrom = jest.fn((table: string) => {
  if (table === "comments") {
    return {
      select: mockCommentSelect,
      delete: mockCommentDelete,
    };
  }
  return {};
});

describe("DELETE /api/kanban/comments/[commentId]", () => {
  const MOCK_USER = { id: "user-123" };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    (verifyTaskAccess as jest.Mock).mockResolvedValue(true);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createContext = (commentId: string | number = 55) => ({
    params: Promise.resolve({ commentId: String(commentId) }),
  });

  const createMockRequest = () =>
    new Request("http://localhost:3000/api/kanban/comments/55", {
      method: "DELETE",
    }) as any;

  it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(401);
  });

  it("2. Lỗi 404 nếu không tìm thấy bình luận", async () => {
    mockCommentSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });
    const res = await DELETE(createMockRequest(), createContext());
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Comment not found.");
  });

  it("3. Lỗi 500 nếu người dùng không có quyền truy cập Task (verifyTaskAccess)", async () => {
    mockCommentSingle.mockResolvedValue({
      data: { id: 55, task_id: 10, user_id: MOCK_USER.id },
      error: null,
    });
    (verifyTaskAccess as jest.Mock).mockRejectedValue(
      new Error("Access denied"),
    );

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
  });

  it("4. Lỗi 403 nếu cố tình xóa bình luận của người khác", async () => {
    // Bình luận thuộc về 'someone-else'
    mockCommentSingle.mockResolvedValue({
      data: { id: 55, task_id: 10, user_id: "someone-else" },
      error: null,
    });

    const res = await DELETE(createMockRequest(), createContext());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("You can only delete your own comments.");
  });

  it("5. Lỗi 500 nếu lệnh delete của Supabase thất bại", async () => {
    mockCommentSingle.mockResolvedValue({
      data: { id: 55, task_id: 10, user_id: MOCK_USER.id },
      error: null,
    });
    mockCommentDeleteEq.mockResolvedValue({
      error: { message: "Delete error" },
    });

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to delete comment.");
  });

  it("6. Xóa thành công (200) bình luận của chính mình", async () => {
    mockCommentSingle.mockResolvedValue({
      data: { id: 55, task_id: 10, user_id: MOCK_USER.id },
      error: null,
    });
    mockCommentDeleteEq.mockResolvedValue({ error: null });

    const res = await DELETE(createMockRequest(), createContext(55));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Kiểm tra đã gọi delete đúng ID chưa
    expect(mockCommentDelete).toHaveBeenCalled();
    expect(mockCommentDeleteEq).toHaveBeenCalledWith("id", 55);
  });

  it("7. Catch block: Xử lý exception bất ngờ", async () => {
    // Mock lỗi trong try/catch (createClient) để tránh crash params bên ngoài
    (createClient as jest.Mock).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Unexpected error");
  });
});
