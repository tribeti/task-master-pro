const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

const mockVerifyBoardAccess = jest.fn();
jest.mock("@/utils/board-access", () => ({
  verifyBoardAccess: (...args: any[]) => mockVerifyBoardAccess(...args),
}));

// Import *after* mocks are set up
import { GET } from "@/app/api/users/route";

// ─── Helpers ──────────────────────────────────────────────────

/**
 * The route handler only uses `request.nextUrl.searchParams`,
 * so we create a minimal mock object instead of a real NextRequest
 * to avoid jsdom/whatwg-fetch incompatibility.
 */
function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/users");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { nextUrl: url } as any;
}

// ─── Tests ────────────────────────────────────────────────────

describe("GET /api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 400: Missing boardId ────────────────────────────────────
  it("returns 400 when boardId query param is missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/boardId/);
  });

  it("returns 400 when boardId is not a number", async () => {
    const res = await GET(makeRequest({ boardId: "abc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/boardId/);
  });

  // ── 401: Unauthorized ──────────────────────────────────────
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeRequest({ boardId: "1" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  // ── 403: Access denied ─────────────────────────────────────
  it("returns 403 when user has no access to the board", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockVerifyBoardAccess.mockRejectedValue(new Error("Access denied."));

    const res = await GET(makeRequest({ boardId: "1" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Access denied.");
  });

  // ── 404: Board not found ────────────────────────────────────
  it("returns 404 when board does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockVerifyBoardAccess.mockResolvedValue(undefined);

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockReturnValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      }),
    });

    const res = await GET(makeRequest({ boardId: "999" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Board not found.");
  });

  // ── 500: board_members query fails ──────────────────────────
  it("returns 500 when board_members query fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockVerifyBoardAccess.mockResolvedValue(undefined);

    mockFrom.mockImplementation((table: string) => {
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { owner_id: "owner-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "board_members") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: null,
              error: { message: "DB failure" },
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest({ boardId: "1" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load users.");
  });

  // ── 200: Success — returns board members ───────────────────
  it("returns 200 with user list for valid board members", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockVerifyBoardAccess.mockResolvedValue(undefined);

    mockFrom.mockImplementation((table: string) => {
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { owner_id: "owner-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "board_members") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: [{ user_id: "member-1" }, { user_id: "member-2" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: [
                  {
                    id: "owner-1",
                    display_name: "Alice",
                    avatar_url: "http://avatar/alice.png",
                  },
                  { id: "member-1", display_name: "Bob", avatar_url: null },
                  { id: "member-2", display_name: null, avatar_url: null },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest({ boardId: "1" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(3);
    expect(body[0]).toEqual({
      user_id: "owner-1",
      display_name: "Alice",
      avatar_url: "http://avatar/alice.png",
    });
    // Null display_name should fallback to "Unknown"
    expect(body[2].display_name).toBe("Unknown");
    // Null avatar_url remains null
    expect(body[1].avatar_url).toBeNull();
  });

  // ── 500: users query fails ─────────────────────────────────
  it("returns 500 when users query fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockVerifyBoardAccess.mockResolvedValue(undefined);

    mockFrom.mockImplementation((table: string) => {
      if (table === "boards") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockReturnValue({
                data: { owner_id: "owner-1" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "board_members") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                data: null,
                error: { message: "DB failure" },
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await GET(makeRequest({ boardId: "1" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load users.");
  });
});
