import { GET } from "@/app/api/boards/[boardId]/kanban/route";
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

// 2. Mock Utilities
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: jest.fn(),
}));

// 3. SUPER MOCK CHAIN (Cho 6 bảng dữ liệu khác nhau)
const mockAuthGetUser = jest.fn();

// --- Chain cho "columns" ---
const mockColOrder = jest.fn();
const mockColEq = jest.fn().mockReturnValue({ order: mockColOrder });
const mockColSelect = jest.fn().mockReturnValue({ eq: mockColEq });

// --- Chain cho "tasks" ---
const mockTaskOrder = jest.fn();
const mockTaskIn = jest.fn().mockReturnValue({ order: mockTaskOrder });
const mockTaskSelect = jest.fn().mockReturnValue({ in: mockTaskIn });

// --- Chain cho "task_assignees" (Có 2 hàm order liên tiếp) ---
const mockAssigneeOrder2 = jest.fn();
const mockAssigneeOrder1 = jest
  .fn()
  .mockReturnValue({ order: mockAssigneeOrder2 });
const mockAssigneeIn = jest.fn().mockReturnValue({ order: mockAssigneeOrder1 });
const mockAssigneeSelect = jest.fn().mockReturnValue({ in: mockAssigneeIn });

// --- Chain cho "users" ---
const mockUserIn = jest.fn();
const mockUserSelect = jest.fn().mockReturnValue({ in: mockUserIn });

// --- Chain cho "labels" ---
const mockLabelOrder = jest.fn();
const mockLabelEq = jest.fn().mockReturnValue({ order: mockLabelOrder });
const mockLabelSelect = jest.fn().mockReturnValue({ eq: mockLabelEq });

// --- Chain cho "task_labels" ---
const mockTaskLabelIn = jest.fn();
const mockTaskLabelSelect = jest.fn().mockReturnValue({ in: mockTaskLabelIn });

// --- Chain cho "checklists" ---
const mockChecklistIn = jest.fn();
const mockChecklistSelect = jest.fn().mockReturnValue({ in: mockChecklistIn });

// --- Chain cho "checklist_items" ---
const mockChecklistItemIn = jest.fn();
const mockChecklistItemSelect = jest.fn().mockReturnValue({ in: mockChecklistItemIn });

// Hàm from() tổng quản: Chuyển hướng query về đúng chain của từng bảng
const mockFrom = jest.fn((tableName: string) => {
  switch (tableName) {
    case "columns":
      return { select: mockColSelect };
    case "tasks":
      return { select: mockTaskSelect };
    case "task_assignees":
      return { select: mockAssigneeSelect };
    case "users":
      return { select: mockUserSelect };
    case "labels":
      return { select: mockLabelSelect };
    case "task_labels":
      return { select: mockTaskLabelSelect };
    case "checklists":
      return { select: mockChecklistSelect };
    case "checklist_items":
      return { select: mockChecklistItemSelect };
    default:
      return {};
  }
});

describe("GET /api/boards/[boardId]/kanban", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    mockAuthGetUser.mockResolvedValue({ data: { user: mockUser } });
    (verifyBoardAccess as jest.Mock).mockResolvedValue(true);

    // Ẩn log lỗi terminal
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = () =>
    new Request("http://localhost:3000/api/boards/1/kanban") as any;

  // ==========================================
  // NHÓM 1: LỖI VALIDATION & QUYỀN TRUY CẬP
  // ==========================================
  it("1. Lỗi 400 nếu boardId không phải số hợp lệ", async () => {
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "abc" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid boardId");
  });

  it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null } });
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(401);
  });

  it("3. Lỗi 403 nếu không có quyền truy cập board", async () => {
    (verifyBoardAccess as jest.Mock).mockRejectedValue(
      new Error("Access denied."),
    );
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(403);
  });

  // ==========================================
  // NHÓM 2: LỖI TỪ DATABASE CỦA TỪNG BẢNG
  // ==========================================
  it("4. Lỗi 500 nếu query bảng columns thất bại", async () => {
    mockColOrder.mockResolvedValue({ error: { message: "Col DB Err" } });
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  it("5. Lỗi 500 nếu query bảng tasks thất bại", async () => {
    mockColOrder.mockResolvedValue({ data: [{ id: 10 }] }); // Trả về 1 cột để code chạy tiếp
    mockTaskOrder.mockResolvedValue({ error: { message: "Task DB Err" } });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  it("6. Lỗi 500 nếu query bảng task_assignees thất bại", async () => {
    mockColOrder.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskOrder.mockResolvedValue({ data: [{ id: 100, column_id: 10 }] });
    mockAssigneeOrder2.mockResolvedValue({
      error: { message: "Assignee DB Err" },
    });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  it("7. Lỗi 500 nếu query bảng users thất bại", async () => {
    mockColOrder.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskOrder.mockResolvedValue({ data: [{ id: 100 }] });
    mockAssigneeOrder2.mockResolvedValue({
      data: [{ task_id: 100, user_id: "u1" }],
    });
    mockUserIn.mockResolvedValue({ error: { message: "Users DB Err" } });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  it("8. Lỗi 500 nếu query bảng labels thất bại", async () => {
    mockColOrder.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskOrder.mockResolvedValue({ data: [] }); // Không có task để bỏ qua luồng assignee
    mockLabelOrder.mockResolvedValue({ error: { message: "Labels DB Err" } });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  it("9. Lỗi 500 nếu query bảng task_labels thất bại", async () => {
    mockColOrder.mockResolvedValue({ data: [{ id: 10 }] });
    mockTaskOrder.mockResolvedValue({ data: [{ id: 100 }] }); // Có task
    mockAssigneeOrder2.mockResolvedValue({ data: [] }); // Không có assignee
    mockLabelOrder.mockResolvedValue({ data: [{ id: 50 }] }); // Có label
    mockTaskLabelIn.mockResolvedValue({
      error: { message: "TaskLabels DB Err" },
    });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
  });

  // ==========================================
  // NHÓM 3: HAPPY PATH VÀ MAPPING DATA
  // ==========================================
  it("10. Trả về đúng cấu trúc khi Board không có cột nào", async () => {
    mockColOrder.mockResolvedValue({ data: [] }); // Board rỗng
    mockLabelOrder.mockResolvedValue({ data: [] });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ columns: [], tasks: [], labels: [] });
  });

  it("11. TRÙM CUỐI: Map thành công toàn bộ Tasks, Assignees, Profiles, và Labels", async () => {
    // 1. Data Cột
    mockColOrder.mockResolvedValue({ data: [{ id: 10, title: "To Do" }] });
    // 2. Data Task
    mockTaskOrder.mockResolvedValue({
      data: [{ id: 100, title: "Fix bug", column_id: 10 }],
    });
    // 3. Data Assignee (liên kết task_id với user_id)
    mockAssigneeOrder2.mockResolvedValue({
      data: [{ task_id: 100, user_id: "u1" }],
    });
    // 4. Data User Profiles
    mockUserIn.mockResolvedValue({
      data: [{ id: "u1", display_name: "Alice", avatar_url: "url.png" }],
    });
    // 5. Data Labels của Board
    mockLabelOrder.mockResolvedValue({
      data: [{ id: 50, name: "Urgent", color: "red" }],
    });
    // 6. Data Task-Labels (liên kết)
    mockTaskLabelIn.mockResolvedValue({
      data: [{ task_id: 100, label_id: 50 }],
    });
    // 7. Data Checklists
    mockChecklistIn.mockResolvedValue({
      data: [{ id: "cl-1", task_id: 100 }],
    });
    // 8. Data Checklist Items
    mockChecklistItemIn.mockResolvedValue({
      data: [{ id: "item-1", checklist_id: "cl-1", is_completed: false }],
    });

    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(200);

    // KIỂM TRA MAPPING KẾT QUẢ CUỐI CÙNG
    expect(body.columns).toHaveLength(1);
    expect(body.labels).toHaveLength(1);
    expect(body.tasks).toHaveLength(1);

    const mappedTask = body.tasks[0];

    // Đã map đúng assignee profile chưa?
    expect(mappedTask.assignees).toHaveLength(1);
    expect(mappedTask.assignee).toEqual({
      user_id: "u1",
      display_name: "Alice",
      avatar_url: "url.png",
    });

    // Đã map đúng nhãn (label) chưa?
    expect(mappedTask.labels).toHaveLength(1);
    expect(mappedTask.labels[0]).toEqual({
      id: 50,
      name: "Urgent",
      color: "red",
    });
  });

  it("12. Catch block: Xử lý exception bất ngờ", async () => {
    (verifyBoardAccess as jest.Mock).mockRejectedValue(
      new Error("Unexpected crash"),
    );
    const req = createMockRequest();
    const params = Promise.resolve({ boardId: "1" });
    const res = await GET(req, { params });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Internal server error");
  });
});
