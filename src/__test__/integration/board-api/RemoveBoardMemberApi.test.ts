import { DELETE } from "@/app/api/boards/[boardId]/members/[userId]/route";
import { createClient } from "@/utils/supabase/server";

// 1. Mock Next.js Server Components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

// 2. Mock Supabase
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// 3. SUPER SMART MOCK CHAINS
const mockAuthGetUser = jest.fn();

// --- Chain cho "boards" ---
const mockBoardSingle = jest.fn();
const mockBoardEq = jest.fn().mockReturnValue({ single: mockBoardSingle });
const mockBoardSelect = jest.fn().mockReturnValue({ eq: mockBoardEq });

// --- Chain cho "columns" ---
const mockColEq = jest.fn();
const mockColSelect = jest.fn().mockReturnValue({ eq: mockColEq });

// --- Chain cho "tasks" (Select và Update) ---
const mockTaskIn = jest.fn();
const mockTaskSelect = jest.fn().mockReturnValue({ in: mockTaskIn });
const mockTaskUpdateEq = jest.fn();
const mockTaskUpdate = jest.fn().mockReturnValue({ eq: mockTaskUpdateEq });

// --- Chain cho "task_assignees" (Gồm 3 luồng riêng biệt) ---
// 1. Fetch Affected
const mockAssigneeAffIn = jest.fn();
const mockAssigneeAffEq = jest.fn().mockReturnValue({ in: mockAssigneeAffIn });
const mockAssigneeAffChain = { eq: mockAssigneeAffEq };
// 2. Delete Assignees
const mockAssigneeDelIn = jest.fn();
const mockAssigneeDelEq = jest.fn().mockReturnValue({ in: mockAssigneeDelIn });
const mockAssigneeDelete = jest.fn().mockReturnValue({ eq: mockAssigneeDelEq });
// 3. Sync Fetch
const mockAssigneeSyncOrder2 = jest.fn();
const mockAssigneeSyncOrder1 = jest
  .fn()
  .mockReturnValue({ order: mockAssigneeSyncOrder2 });
const mockAssigneeSyncEq = jest
  .fn()
  .mockReturnValue({ order: mockAssigneeSyncOrder1 });
const mockAssigneeSyncChain = { eq: mockAssigneeSyncEq };

// --- Chain cho "board_members" ---
const mockMemberDelEq2 = jest.fn();
const mockMemberDelEq1 = jest.fn().mockReturnValue({ eq: mockMemberDelEq2 });
const mockMemberDelete = jest.fn().mockReturnValue({ eq: mockMemberDelEq1 });

// Router tổng quản
const mockFrom = jest.fn((table: string) => {
  if (table === "boards") return { select: mockBoardSelect };
  if (table === "columns") return { select: mockColSelect };
  if (table === "tasks")
    return { select: mockTaskSelect, update: mockTaskUpdate };
  if (table === "task_assignees") {
    return {
      select: jest.fn((cols) => {
        if (cols === "task_id") return mockAssigneeAffChain;
        if (cols.includes("assigned_at")) return mockAssigneeSyncChain;
        return {};
      }),
      delete: mockAssigneeDelete,
    };
  }
  if (table === "board_members") return { delete: mockMemberDelete };
  return {};
});

describe("DELETE /api/boards/[boardId]/members/[userId]", () => {
  const MOCK_OWNER = { id: "owner-123", email: "owner@example.com" };
  const TARGET_USER_ID = "target-456";

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    // Mặc định luôn Pass Auth
    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_OWNER } });

    // Mặc định User hiện tại là Owner của Board
    mockBoardSingle.mockResolvedValue({
      data: { owner_id: MOCK_OWNER.id },
      error: null,
    });

    // Ẩn log lỗi
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = () =>
    new Request("http://localhost:3000/api/boards/1/members/target-456", {
      method: "DELETE",
    }) as any;
  const createMockParams = (boardId = "1", userId = TARGET_USER_ID) =>
    Promise.resolve({ boardId, userId });

  // ==========================================
  // NHÓM 1: LỖI VALIDATION VÀ QUYỀN TRUY CẬP
  // ==========================================
  it("1. Lỗi 400 nếu params không hợp lệ (NaN boardId hoặc thiếu userId)", async () => {
    const res = await DELETE(createMockRequest(), {
      params: createMockParams("abc", TARGET_USER_ID),
    });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(401);
  });

  it("3. Lỗi 404 nếu không tìm thấy board", async () => {
    mockBoardSingle.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(404);
  });

  it("4. Lỗi 403 nếu người dùng không phải là owner của board", async () => {
    mockBoardSingle.mockResolvedValue({
      data: { owner_id: "someone-else" },
      error: null,
    });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Only the board owner can remove members");
  });

  it("5. Lỗi 400 nếu owner cố tình tự xóa chính mình", async () => {
    // Trùng ID owner với target userId
    const res = await DELETE(createMockRequest(), {
      params: createMockParams("1", MOCK_OWNER.id),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Cannot remove the board owner");
  });

  // ==========================================
  // NHÓM 2: LỖI XỬ LÝ DATABASE (CASCADING)
  // ==========================================
  it("6. Lỗi 500 nếu lấy danh sách cột thất bại", async () => {
    mockColEq.mockResolvedValue({ error: { message: "Col DB error" } });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("7. Lỗi 500 nếu lấy danh sách task thất bại", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] }); // Bỏ qua cột
    mockTaskIn.mockResolvedValue({ error: { message: "Task DB error" } });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("8. Lỗi 500 nếu lấy danh sách assignee bị ảnh hưởng thất bại", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeAffIn.mockResolvedValue({
      error: { message: "Assignee DB error" },
    });
    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("9. Lỗi 500 nếu lệnh xóa assignees thất bại", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeAffIn.mockResolvedValue({ data: [{ task_id: 100 }] }); // Có task bị ảnh hưởng
    mockAssigneeDelIn.mockResolvedValue({ error: { message: "Delete error" } }); // Xóa thất bại

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("10. Lỗi 500 nếu đồng bộ (sync) fetch lại assignee thất bại", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeAffIn.mockResolvedValue({ data: [{ task_id: 100 }] });
    mockAssigneeDelIn.mockResolvedValue({ error: null }); // Xóa thành công

    // Bước Sync fetch văng lỗi
    mockAssigneeSyncOrder2.mockResolvedValue({
      error: { message: "Sync Fetch error" },
    });

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("11. Lỗi 500 nếu đồng bộ (sync) update bảng tasks thất bại", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeAffIn.mockResolvedValue({ data: [{ task_id: 100 }] });
    mockAssigneeDelIn.mockResolvedValue({ error: null });
    mockAssigneeSyncOrder2.mockResolvedValue({
      data: [{ user_id: "next-user" }],
    });

    // Bước Sync update bảng tasks văng lỗi
    mockTaskUpdateEq.mockResolvedValue({
      error: { message: "Sync Update error" },
    });

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  it("12. Lỗi 500 nếu bước xóa board_members cuối cùng thất bại", async () => {
    // Pass hết luồng dọn task (giả lập board rỗng cho lẹ)
    mockColEq.mockResolvedValue({ data: [] });
    // Xóa member lỗi
    mockMemberDelEq2.mockResolvedValue({
      error: { message: "Final delete error" },
    });

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    expect(res.status).toBe(500);
  });

  // ==========================================
  // NHÓM 3: HAPPY PATHS (Thành công)
  // ==========================================
  it("13. Thành công (200) xóa member nhưng board rỗng (không có cột/task nào)", async () => {
    mockColEq.mockResolvedValue({ data: [] }); // Không có cột
    mockMemberDelEq2.mockResolvedValue({ error: null }); // Xóa member thành công

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockMemberDelete).toHaveBeenCalled();
  });

  it("14. Thành công (200) đầy đủ luồng: Xóa assignee và đôn người mới lên Primary", async () => {
    // 1. Có cột và task
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });

    // 2. User bị xóa có nằm trong task 100
    mockAssigneeAffIn.mockResolvedValue({ data: [{ task_id: 100 }] });

    // 3. Xóa assignee thành công
    mockAssigneeDelIn.mockResolvedValue({ error: null });

    // 4. Tìm thấy người dự bị tiếp theo là "next-user-999"
    mockAssigneeSyncOrder2.mockResolvedValue({
      data: [{ user_id: "next-user-999" }],
      error: null,
    });

    // 5. Update task cho "next-user-999" thành công
    mockTaskUpdateEq.mockResolvedValue({ error: null });

    // 6. Xóa khỏi board_members thành công
    mockMemberDelEq2.mockResolvedValue({ error: null });

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // Kiểm tra Update Task được gọi với đúng ID của người đôn lên
    expect(mockTaskUpdate).toHaveBeenCalledWith({
      assignee_id: "next-user-999",
    });
    expect(mockTaskUpdateEq).toHaveBeenCalledWith("id", 100);

    // Kiểm tra xóa đúng target user
    expect(mockMemberDelEq1).toHaveBeenCalledWith("board_id", 1);
    expect(mockMemberDelEq2).toHaveBeenCalledWith("user_id", TARGET_USER_ID);
  });

  it("15. Thành công (200) đầy đủ luồng: Không còn ai khác -> Primary assignee = null", async () => {
    mockColEq.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskIn.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeAffIn.mockResolvedValue({ data: [{ task_id: 100 }] });
    mockAssigneeDelIn.mockResolvedValue({ error: null });

    // KHÔNG CÒN AI KHÁC trong task (data: [])
    mockAssigneeSyncOrder2.mockResolvedValue({ data: [], error: null });
    mockTaskUpdateEq.mockResolvedValue({ error: null });
    mockMemberDelEq2.mockResolvedValue({ error: null });

    const res = await DELETE(createMockRequest(), {
      params: createMockParams(),
    });

    expect(res.status).toBe(200);
    // Task phải được update thành null
    expect(mockTaskUpdate).toHaveBeenCalledWith({ assignee_id: null });
  });

  it("16. Catch block: Xử lý các exception bất ngờ (vd: params Promise bị crash)", async () => {
    const res = await DELETE(createMockRequest(), {
      params: Promise.reject(new Error("Crash")),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
