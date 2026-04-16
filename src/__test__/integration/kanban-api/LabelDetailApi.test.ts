import { DELETE } from "@/app/api/kanban/labels/[labelId]/route";
import { createClient } from "@/utils/supabase/server";
import { verifyBoardAccess } from "@/utils/board-access";

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
  verifyBoardAccess: jest.fn(),
}));

// 3. SMART MOCK CHAINS
const mockAuthGetUser = jest.fn();

// Chain cho bảng "labels"
const mockLabelSingle = jest.fn();
const mockLabelEqSingle = jest
  .fn()
  .mockReturnValue({ single: mockLabelSingle });
const mockLabelSelect = jest.fn().mockReturnValue({ eq: mockLabelEqSingle });

const mockLabelDeleteEq = jest.fn();
const mockLabelDelete = jest.fn().mockReturnValue({ eq: mockLabelDeleteEq });

const mockFrom = jest.fn((table: string) => {
  if (table === "labels") {
    return {
      select: mockLabelSelect,
      delete: mockLabelDelete,
    };
  }
  return {};
});

describe("DELETE /api/kanban/labels/[labelId]", () => {
  const MOCK_USER = { id: "user-123" };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    (verifyBoardAccess as jest.Mock).mockResolvedValue(true);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createContext = (labelId: string | number = 88) => ({
    params: Promise.resolve({ labelId: String(labelId) }),
  });

  const createMockRequest = () =>
    new Request("http://localhost:3000/api/kanban/labels/88", {
      method: "DELETE",
    }) as any;

  it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(401);
  });

  it("2. Lỗi 404 nếu không tìm thấy Label", async () => {
    mockLabelSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });
    const res = await DELETE(createMockRequest(), createContext());
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe("Label not found.");
  });

  it("3. Lỗi 500 nếu verifyBoardAccess thất bại", async () => {
    mockLabelSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
    (verifyBoardAccess as jest.Mock).mockRejectedValue(
      new Error("Access denied"),
    );

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Access denied");
  });

  it("4. Lỗi 500 nếu Supabase delete thất bại", async () => {
    mockLabelSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
    mockLabelDeleteEq.mockResolvedValue({
      error: { message: "Delete failed" },
    });

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to delete label.");
  });

  it("5. Xóa thành công (200)", async () => {
    mockLabelSingle.mockResolvedValue({ data: { board_id: 1 }, error: null });
    mockLabelDeleteEq.mockResolvedValue({ error: null });

    const res = await DELETE(createMockRequest(), createContext(88));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Xác minh ID truyền vào lệnh xóa
    expect(mockLabelDeleteEq).toHaveBeenCalledWith("id", 88);
  });

  it("6. Catch block: Xử lý exception bất ngờ", async () => {
    // Ép createClient lỗi để nhảy vào catch
    (createClient as jest.Mock).mockRejectedValue(
      new Error("Unexpected error"),
    );

    const res = await DELETE(createMockRequest(), createContext());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Unexpected error");
  });
});
