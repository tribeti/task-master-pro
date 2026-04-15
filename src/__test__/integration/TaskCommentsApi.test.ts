const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// Import after mocks
import { GET } from "@/app/api/tasks/[taskId]/comments/route";

// ─── Helpers ──────────────────────────────────────────────────

/**
 * The route handler uses `_request` (ignored), so a minimal mock is enough.
 */
function makeRequest() {
  return {} as any;
}

function makeParams(taskId: string) {
  return { params: Promise.resolve({ taskId }) };
}

// ─── Tests ────────────────────────────────────────────────────

describe("GET /api/tasks/[taskId]/comments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 400: Invalid taskId ─────────────────────────────────────
  it("returns 400 when taskId is not a number", async () => {
    const res = await GET(makeRequest(), makeParams("abc"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid taskId");
  });

  // ── 401: Unauthorized ──────────────────────────────────────
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // ── 404: Task not found ─────────────────────────────────────
  it("returns 404 when task does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: null,
                error: { message: "Not found" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("999"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Task not found");
  });

  // ── 404: Column not found ───────────────────────────────────
  it("returns 404 when column does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: null,
                error: { message: "Column not found" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Column not found");
  });

  // ── 403: Access denied (not owner and not member) ──────────
  it("returns 403 when user is neither board owner nor member", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { board_id: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "board_members") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Access denied");
  });

  // ── 200: Owner can access comments ─────────────────────────
  it("returns 200 with comments when user is board owner", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "owner-1" } },
    });

    const mockComments = [
      {
        id: 1,
        content: "Hello",
        created_at: "2025-01-01",
        task_id: 1,
        user_id: "owner-1",
      },
      {
        id: 2,
        content: "World",
        created_at: "2025-01-02",
        task_id: 1,
        user_id: "user-2",
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { board_id: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: { id: 10 },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "comments") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].content).toBe("Hello");
    expect(body[1].content).toBe("World");
  });

  // ── 200: Board member can access comments ──────────────────
  it("returns 200 with comments when user is board member", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "member-1" } },
    });

    const mockComments = [
      {
        id: 3,
        content: "Member comment",
        created_at: "2025-02-01",
        task_id: 5,
        user_id: "member-1",
      },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { board_id: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "board_members") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: { user_id: "member-1" },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "comments") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: mockComments,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("5"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].content).toBe("Member comment");
  });

  // ── 500: Comments query fails ──────────────────────────────
  it("returns 500 when comments query fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "owner-1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { board_id: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: { id: 10 },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "comments") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: null,
                error: { message: "DB comments error" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load comments.");
  });

  // ── 200: Empty comments array ──────────────────────────────
  it("returns empty array when task has no comments", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "owner-1" } },
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { column_id: 50 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "columns") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { board_id: 10 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockReturnValue({
                  data: { id: 10 },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "comments") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest(), makeParams("1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
