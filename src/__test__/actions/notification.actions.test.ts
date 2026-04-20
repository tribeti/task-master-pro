import { triggerDeadlineNotifications } from "@/app/actions/notification.actions";
import { createAdminClient } from "@/utils/supabase/admin";
import { getDeadlineStatus } from "@/utils/deadline";

// --- MOCKS ---
jest.mock("@/utils/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/utils/deadline", () => ({
  getDeadlineStatus: jest.fn(),
}));

describe("triggerDeadlineNotifications Server Action", () => {
  let mockAdminSupabase: any;
  let mockTables: Record<string, { data: any; error: any }>;
  let insertMock: jest.Mock;
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Ẩn console.error để log không bị rối khi chạy các test bắt lỗi
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mặc định: DB không có lỗi, data trống
    mockTables = {
      tasks: { data: [], error: null },
      notifications: { data: [], error: null },
    };

    // Mặc định: Insert thành công
    insertMock = jest.fn().mockResolvedValue({ error: null });

    // Cấu trúc mock chain của Supabase DB
    mockAdminSupabase = {
      from: jest.fn((table: string) => {
        const chain: any = {
          select: jest.fn(() => chain),
          not: jest.fn(() => chain),
          lte: jest.fn(() => chain),
          eq: jest.fn(() => chain),
          // in() thường là lệnh cuối khi lấy danh sách Notif
          in: jest.fn(() => Promise.resolve(mockTables[table])),
          // Lệnh insert khi thêm Notif
          insert: insertMock,
          // then() xử lý await chain cho việc lấy danh sách Tasks
          then: jest.fn((resolve) => resolve(mockTables[table])),
        };
        return chain;
      }),
    };

    (createAdminClient as jest.Mock).mockReturnValue(mockAdminSupabase);
    (getDeadlineStatus as jest.Mock).mockReturnValue({
      urgencyStr: "Ngày mai",
    });
  });

  // ==========================================
  // 1. LỖI FETCH & ĐIỀU KIỆN DỪNG SỚM
  // ==========================================

  it("catches and logs unexpected crash (try...catch block)", async () => {
    // Giả lập sập toàn bộ hệ thống ngay từ đầu
    mockAdminSupabase.from.mockImplementation(() => {
      throw new Error("Unexpected crash");
    });

    await triggerDeadlineNotifications();
    expect(console.error).toHaveBeenCalledWith(
      "Deadline notification check error:",
      expect.any(Error),
    );
  });

  it("returns early and logs error if fetching tasks fails", async () => {
    mockTables.tasks = { data: null, error: new Error("Task DB Error") };

    await triggerDeadlineNotifications();

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching tasks for deadline check:",
      expect.any(Error),
    );
    // Đảm bảo không gọi sang bảng notifications
    expect(mockAdminSupabase.from).toHaveBeenCalledTimes(1);
  });

  it("returns early if no tasks are returned", async () => {
    mockTables.tasks = { data: [], error: null };

    await triggerDeadlineNotifications();

    expect(mockAdminSupabase.from).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('filters out tasks in "Done" columns correctly', async () => {
    mockTables.tasks = {
      data: [
        { id: 1, title: "Task 1", column: { board_id: 1, title: "done" } }, // Object
        { id: 2, title: "Task 2", column: [{ board_id: 1, title: "DONE" }] }, // Array
      ],
      error: null,
    };

    await triggerDeadlineNotifications();

    // Đã filter hết vì tất cả đều là "Done", nên sẽ dừng luôn, không query notifications
    expect(mockAdminSupabase.from).toHaveBeenCalledTimes(1);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns early and logs error if fetching existing notifications fails", async () => {
    mockTables.tasks = {
      data: [
        {
          id: 1,
          title: "Task 1",
          column: { board_id: 1, title: "In Progress" },
        },
      ],
      error: null,
    };
    mockTables.notifications = {
      data: null,
      error: new Error("Notif DB Error"),
    };

    await triggerDeadlineNotifications();

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching existing notifications:",
      expect.any(Error),
    );
    expect(insertMock).not.toHaveBeenCalled();
  });

  // ==========================================
  // 2. XỬ LÝ LOGIC INSERT NOTIFICATION
  // ==========================================

  it("does NOT insert if user was already notified for the exact same urgency", async () => {
    mockTables.tasks = {
      data: [
        {
          id: 1,
          title: "Task 1",
          deadline: "2025-01-01",
          assignee_id: "user1",
          column: { board_id: 1, title: "To Do" },
        },
      ],
      error: null,
    };
    mockTables.notifications = {
      // Đã có notif trùng chữ "Ngày mai"
      data: [
        {
          task_id: 1,
          content: 'Sắp đến hạn: Nhiệm vụ "Task 1" (Deadline: Ngày mai)',
        },
      ],
      error: null,
    };

    await triggerDeadlineNotifications();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts new notification if valid task and not yet notified", async () => {
    mockTables.tasks = {
      data: [
        {
          id: 1,
          title: "Task 1",
          deadline: "2025-01-01",
          assignee_id: "user1",
          column: { board_id: 99, title: "To Do" },
        },
      ],
      error: null,
    };
    // Chưa có notif nào
    mockTables.notifications = { data: [], error: null };

    await triggerDeadlineNotifications();

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith([
      {
        user_id: "user1",
        type: "deadline",
        content: 'Sắp đến hạn: Nhiệm vụ "Task 1" (Deadline: Ngày mai)',
        is_read: false,
        task_id: 1,
        project_id: 99,
      },
    ]);
  });

  it("logs error but continues loop if insert fails", async () => {
    mockTables.tasks = {
      data: [
        {
          id: 1,
          title: "Task 1",
          deadline: "2025-01-01",
          assignee_id: "user1",
          column: { board_id: 1, title: "To Do" },
        },
      ],
      error: null,
    };
    mockTables.notifications = { data: [], error: null };

    // Ép lỗi khi Insert
    insertMock.mockResolvedValueOnce({ error: new Error("Insert Error") });

    await triggerDeadlineNotifications();

    expect(console.error).toHaveBeenCalledWith(
      "Failed to insert notification for task 1:",
      expect.any(Error),
    );
  });
});
