import { POST } from "@/app/api/kanban/labels/route";
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

// 2. Mock Supabase & Utilities
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
  validateString: jest.fn(),
}));

// 3. SMART MOCK CHAINS
const mockAuthGetUser = jest.fn();

// Chain cho bảng "labels"
const mockInsertSingle = jest.fn();
const mockInsertSelect = jest
  .fn()
  .mockReturnValue({ single: mockInsertSingle });
const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });

const mockFrom = jest.fn((table: string) => {
  if (table === "labels") {
    return { insert: mockInsert };
  }
  return {};
});

describe("POST /api/kanban/labels", () => {
  const MOCK_USER = { id: "user-123" };

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

  const createMockRequest = (bodyData: any) => {
    return new Request("http://localhost:3000/api/kanban/labels", {
      method: "POST",
      body: JSON.stringify(bodyData),
    }) as any;
  };

  it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(
      createMockRequest({ name: "Urgent", color_hex: "#FF0000", boardId: 1 }),
    );
    expect(res.status).toBe(401);
  });

  it("2. Lỗi 400 nếu định dạng color_hex không hợp lệ (sai Regex)", async () => {
    // Thử gửi mã màu thiếu dấu # hoặc sai ký tự
    const invalidPayloads = [
      { name: "Red", color_hex: "FF0000", boardId: 1 }, // Thiếu #
      { name: "Red", color_hex: "#GG1122", boardId: 1 }, // Ký tự G không hợp lệ
      { name: "Red", color_hex: "#1234", boardId: 1 }, // Độ dài sai
    ];

    for (const payload of invalidPayloads) {
      const res = await POST(createMockRequest(payload));
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid color format.");
    }
  });

  it("3. Lỗi 500 nếu validateString quăng lỗi", async () => {
    (validateString as jest.Mock).mockImplementation(() => {
      throw new Error("Label name quá dài");
    });
    const res = await POST(
      createMockRequest({
        name: "A".repeat(100),
        color_hex: "#FFF",
        boardId: 1,
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe("Label name quá dài");
  });

  it("4. Lỗi 500 nếu user không có quyền vào board", async () => {
    (verifyBoardAccess as jest.Mock).mockRejectedValue(
      new Error("Access denied"),
    );
    const res = await POST(
      createMockRequest({ name: "Urgent", color_hex: "#F00", boardId: 1 }),
    );
    expect(res.status).toBe(500);
  });

  it("5. Lỗi 500 nếu Supabase insert thất bại", async () => {
    mockInsertSingle.mockResolvedValue({ error: { message: "Insert fail" } });
    const res = await POST(
      createMockRequest({ name: "Urgent", color_hex: "#FF0000", boardId: 1 }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create label.");
  });

  it("6. Tạo Label thành công (200) với mã màu 3 ký tự và 6 ký tự", async () => {
    const mockLabel = { id: 1, name: "Bug", color_hex: "#F00", board_id: 1 };
    mockInsertSingle.mockResolvedValue({ data: mockLabel, error: null });

    const payloads = [
      { name: "Bug", color_hex: "#F00", boardId: 1 }, // 3 ký tự
      { name: "Bug", color_hex: "#FF0000", boardId: 1 }, // 6 ký tự
    ];

    for (const payload of payloads) {
      const res = await POST(createMockRequest(payload));
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body).toEqual(mockLabel);
    }

    // Kiểm tra tham số insert của lần gọi cuối
    expect(mockInsert).toHaveBeenCalledWith([
      { name: "Bug", color_hex: "#FF0000", board_id: 1 },
    ]);
  });

  it("7. Catch block: Xử lý exception bất ngờ (vd: body rỗng)", async () => {
    const req = new Request("http://localhost:3000", {
      method: "POST",
      body: "invalid-json",
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
