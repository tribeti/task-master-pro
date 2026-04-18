const mockGetUser = jest.fn();

// A generic chainable mock for Supabase query builder
const createMockChain = (table?: string) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
};

const mockFrom = jest.fn().mockImplementation((table: string) => createMockChain(table));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: (...args: any[]) => mockGetUser(...args) },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

import { DELETE } from "@/app/api/comments/[commentId]/route";

function makeParams(commentId: string) {
  return { params: Promise.resolve({ commentId }) };
}

describe("DELETE /api/comments/[commentId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const res = await DELETE({} as any, makeParams("100"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when comment not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      const chain = createMockChain(table);
      if (table === "comments") {
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        });
      }
      return chain;
    });
    const res = await DELETE({} as any, makeParams("100"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the author", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-other" } } });
    mockFrom.mockImplementation((table: string) => {
      const chain = createMockChain(table);
      if (table === "comments") {
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 100, user_id: "user-owner", task_id: 1 },
              error: null
            }),
          }),
        });
      }
      return chain;
    });
    const res = await DELETE({} as any, makeParams("100"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("You can only delete your own comments");
  });

  it("returns 200 when author deletes their own comment", async () => {
    const userId = "user-owner";
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } });
    
    mockFrom.mockImplementation((table: string) => {
      const chain = createMockChain(table);
      if (table === "comments") {
        // First call: select comment
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 100, user_id: userId, task_id: 1 },
              error: null
            }),
          }),
        });
        // Second call: delete
        chain.delete.mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        });
      }
      if (table === "tasks") {
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { column_id: 50 }, error: null })
          })
        });
      }
      if (table === "columns") {
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { board_id: 10 }, error: null })
          })
        });
      }
      if (table === "boards") {
        chain.select.mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: { id: 10 }, error: null })
            })
          })
        });
      }
      return chain;
    });

    const res = await DELETE({} as any, makeParams("100"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
