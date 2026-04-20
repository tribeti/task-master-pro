const mockFrom = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
  })),
}));

jest.mock("@/utils/deadline", () => ({
  getDeadlineStatus: jest.fn((deadline: string) => {
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (d < now)
      return { label: "QUÁ HẠN", color: "red", urgencyStr: "QUÁ HẠN" };
    if (d.getTime() === now.getTime())
      return { label: "HÔM NAY", color: "red", urgencyStr: "HÔM NAY" };
    return {
      label: "TRONG 3 NGÀY",
      color: "yellow",
      urgencyStr: "TRONG 3 NGÀY",
    };
  }),
}));

// Set env vars before importing route
const ORIGINAL_ENV = process.env;

beforeAll(() => {
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// Import after mocks
import { GET } from "@/app/api/cron/notifications/route";

// ─── Helpers ──────────────────────────────────────────────────

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/cron/notifications", {
    headers,
  });
}

// ─── Tests ────────────────────────────────────────────────────

describe("GET /api/cron/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  // ── 401: Invalid CRON_SECRET ────────────────────────────────
  it("returns 401 when CRON_SECRET is set but authorization header is wrong", async () => {
    process.env.CRON_SECRET = "my-secret";

    const res = await GET(
      makeRequest({ authorization: "Bearer wrong-secret" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is set but authorization header is missing", async () => {
    process.env.CRON_SECRET = "my-secret";

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // ── 200: Valid CRON_SECRET passes auth ─────────────────────
  it("passes auth when CRON_SECRET matches authorization header", async () => {
    process.env.CRON_SECRET = "my-secret";

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest({ authorization: "Bearer my-secret" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("No urgent tasks found.");
  });

  // ── 200: No urgent tasks ───────────────────────────────────
  it("returns 200 with message when no urgent tasks found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("No urgent tasks found.");
  });

  // ── 500: Tasks query error ─────────────────────────────────
  it("returns 500 when tasks query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: null,
                    error: { message: "DB error" },
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB error");
  });

  // ── 200: Creates notifications for urgent tasks ────────────
  it("creates notifications for tasks with upcoming deadlines", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockInsert = jest.fn().mockReturnValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: [
                      {
                        id: 1,
                        title: "Task A",
                        deadline: yesterday.toISOString(),
                        assignee_id: "user-1",
                        column: { board_id: 10, title: "In Progress" },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      return {};
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.notificationsCreated).toBe(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertCall = mockInsert.mock.calls[0][0][0];
    expect(insertCall.user_id).toBe("user-1");
    expect(insertCall.type).toBe("deadline");
    expect(insertCall.is_read).toBe(false);
    expect(insertCall.task_id).toBe(1);
    expect(insertCall.project_id).toBe(10);
  });



  // ── 200: Skips duplicate notifications ─────────────────────
  it("skips notification if same urgency stage already exists", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockInsert = jest.fn().mockReturnValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: [
                      {
                        id: 3,
                        title: "Overdue Task",
                        deadline: yesterday.toISOString(),
                        assignee_id: "user-3",
                        column: { board_id: 20, title: "In Progress" },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: [
                  {
                    task_id: 3,
                    content:
                      'Sắp đến hạn: Nhiệm vụ "Overdue Task" (Deadline: QUÁ HẠN)',
                  },
                ],
                error: null,
              }),
            }),
          }),
          insert: mockInsert,
        };
      }
      return {};
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.notificationsCreated).toBe(0);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // ── 500: Notifications query error ─────────────────────────
  it("returns 500 when notifications query fails", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({
              not: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  lte: jest.fn().mockReturnValue({
                    data: [
                      {
                        id: 4,
                        title: "Task X",
                        deadline: yesterday.toISOString(),
                        assignee_id: "user-4",
                        column: { board_id: 30, title: "Todo" },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notifications") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                data: null,
                error: { message: "Notification DB error" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Notification DB error");
  });
});
