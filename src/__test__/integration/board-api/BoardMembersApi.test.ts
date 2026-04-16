import { GET, POST } from "@/app/api/boards/[boardId]/members/route";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyBoardOwnership } from "@/utils/verify-board-ownership";

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

jest.mock("@/utils/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

jest.mock("@/utils/verify-board-ownership", () => ({
  verifyBoardOwnership: jest.fn(),
}));

// 3. SMART MOCK CHAINS (Phân luồng triệt để chống race condition)
const mockAuthGetUser = jest.fn();
const mockAdminListUsers = jest.fn();

// --- Chains cho GET ---
const mockBoardAccessSingle = jest.fn();
const mockBoardAccessChain = {
  eq: jest.fn().mockReturnValue({ single: mockBoardAccessSingle }),
};

const mockBoardTitleSingle = jest.fn();
const mockBoardTitleChain = {
  eq: jest.fn().mockReturnValue({ single: mockBoardTitleSingle }),
};

const mockMemAccessMaybeSingle = jest.fn();
const mockMemAccessEq2 = jest
  .fn()
  .mockReturnValue({ maybeSingle: mockMemAccessMaybeSingle });
const mockMemAccessChain = {
  eq: jest.fn().mockReturnValue({ eq: mockMemAccessEq2 }),
};

const mockMemListEq = jest.fn();
const mockMemListChain = { eq: mockMemListEq }; // Được await trực tiếp

const mockOwnerProfileSingle = jest.fn();
const mockOwnerProfileChain = {
  eq: jest.fn().mockReturnValue({ single: mockOwnerProfileSingle }),
};

const mockInviterProfileSingle = jest.fn();
const mockInviterProfileChain = {
  eq: jest.fn().mockReturnValue({ single: mockInviterProfileSingle }),
};

// --- Chains cho POST ---
const mockInvCheckMaybeSingle = jest.fn();
const mockInvCheckEq3 = jest
  .fn()
  .mockReturnValue({ maybeSingle: mockInvCheckMaybeSingle });
const mockInvCheckEq2 = jest.fn().mockReturnValue({ eq: mockInvCheckEq3 });
const mockInvCheckChain = {
  eq: jest.fn().mockReturnValue({ eq: mockInvCheckEq2 }),
};

const mockInvInsertSingle = jest.fn();
const mockInvInsertChain = {
  select: jest.fn().mockReturnValue({ single: mockInvInsertSingle }),
};

const mockNotifInsert = jest.fn();

// Hàm from() thông minh định tuyến dựa trên table VÀ columns
const mockFrom = jest.fn((table: string) => {
  if (table === "boards") {
    return {
      select: jest.fn((cols) => {
        if (cols.includes("owner_id")) return mockBoardAccessChain;
        return mockBoardTitleChain;
      }),
    };
  }
  if (table === "board_members") {
    return {
      select: jest.fn((cols) => {
        if (cols.includes("users")) return mockMemListChain; // GET member list
        return mockMemAccessChain; // Access check or existing check
      }),
    };
  }
  if (table === "users") {
    return {
      select: jest.fn((cols) => {
        if (cols.includes("avatar_url")) return mockOwnerProfileChain;
        return mockInviterProfileChain;
      }),
    };
  }
  if (table === "board_invitations") {
    return {
      select: jest.fn(() => mockInvCheckChain),
      insert: jest.fn(() => mockInvInsertChain),
    };
  }
  if (table === "notifications") {
    return { insert: mockNotifInsert };
  }
  return {};
});

describe("/api/boards/[boardId]/members", () => {
  const MOCK_USER = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    (createAdminClient as jest.Mock).mockReturnValue({
      auth: { admin: { listUsers: mockAdminListUsers } },
    });

    mockAuthGetUser.mockResolvedValue({ data: { user: MOCK_USER } });
    (verifyBoardOwnership as jest.Mock).mockResolvedValue(true);

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const createMockRequest = (method: "GET" | "POST", bodyData?: any) => {
    return new Request("http://localhost:3000/api/boards/1/members", {
      method,
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    }) as any;
  };

  // ==========================================
  // TEST SUITE: GET
  // ==========================================
  describe("GET", () => {
    it("1. Lỗi 400 nếu boardId không hợp lệ", async () => {
      const params = Promise.resolve({ boardId: "abc" });
      const res = await GET(createMockRequest("GET"), { params });
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid boardId");
    });

    it("2. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });
      const res = await GET(createMockRequest("GET"), {
        params: Promise.resolve({ boardId: "1" }),
      });
      expect(res.status).toBe(401);
    });

    it("3. Lỗi 403 nếu không phải owner và cũng không phải member", async () => {
      mockBoardAccessSingle.mockResolvedValue({
        data: { owner_id: "other", created_at: "2024" },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null }); // Not member

      const res = await GET(createMockRequest("GET"), {
        params: Promise.resolve({ boardId: "1" }),
      });
      expect(res.status).toBe(403);
    });

    it("4. Lỗi 500 nếu query bảng board_members thất bại", async () => {
      mockBoardAccessSingle.mockResolvedValue({
        data: { owner_id: MOCK_USER.id },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null });
      mockMemListEq.mockResolvedValue({ error: { message: "DB Error" } });

      const res = await GET(createMockRequest("GET"), {
        params: Promise.resolve({ boardId: "1" }),
      });
      expect(res.status).toBe(500);
    });

    it("5. Thành công (200) trả về Owner ở đầu mảng và map data chuẩn xác", async () => {
      // Setup là Owner
      mockBoardAccessSingle.mockResolvedValue({
        data: { owner_id: MOCK_USER.id, created_at: "2024-01-01" },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null });

      // Danh sách member (bao gồm cả Owner bị lặp để test filter, và 1 user khác)
      mockMemListEq.mockResolvedValue({
        data: [
          {
            user_id: MOCK_USER.id,
            role: "Member",
            joined_at: "2024",
            users: { display_name: "Me" },
          }, // Sẽ bị filter
          {
            user_id: "u2",
            role: "Viewer",
            joined_at: "2024-02",
            users: { display_name: "Bob", avatar_url: "b.png" },
          },
        ],
      });

      // Profile của owner
      mockOwnerProfileSingle.mockResolvedValue({
        data: { display_name: "Alice Owner", avatar_url: "a.png" },
      });

      const res = await GET(createMockRequest("GET"), {
        params: Promise.resolve({ boardId: "1" }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(2); // Owner + u2

      // Index 0 luôn là Owner được map đè role "Owner"
      expect(body[0]).toEqual({
        user_id: MOCK_USER.id,
        role: "Owner",
        joined_at: "2024-01-01",
        display_name: "Alice Owner",
        avatar_url: "a.png",
      });

      // Index 1 là thành viên khác
      expect(body[1]).toEqual({
        user_id: "u2",
        role: "Viewer",
        joined_at: "2024-02",
        display_name: "Bob",
        avatar_url: "b.png",
      });
    });

    it("6. Catch block: Xử lý exception bất ngờ", async () => {
      mockBoardAccessSingle.mockRejectedValue(new Error("Crash"));
      const res = await GET(createMockRequest("GET"), {
        params: Promise.resolve({ boardId: "1" }),
      });
      expect(res.status).toBe(500);
    });
  });

  // ==========================================
  // TEST SUITE: POST (Mời thành viên)
  // ==========================================
  describe("POST", () => {
    it("1. Lỗi 400 nếu thiếu email", async () => {
      const res = await POST(createMockRequest("POST", { email: "  " }), {
        params: Promise.resolve({ boardId: "1" }),
      });
      expect(res.status).toBe(400);
    });

    it("2. Lỗi 403 nếu không phải là owner", async () => {
      (verifyBoardOwnership as jest.Mock).mockResolvedValue(false);
      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(403);
    });

    it("3. Lỗi 500 nếu Admin Client listUsers thất bại", async () => {
      mockAdminListUsers.mockResolvedValue({
        error: { message: "Admin Auth Error" },
      });
      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(500);
    });

    it("4. Lỗi 404 nếu email chưa đăng ký tài khoản Auth", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ email: "other@test.com" }] },
      });
      const res = await POST(
        createMockRequest("POST", { email: "notfound@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(404);
    });

    it("5. Lỗi 400 nếu tự mời chính mình", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: MOCK_USER.id, email: MOCK_USER.email }] },
      });
      const res = await POST(
        createMockRequest("POST", { email: MOCK_USER.email }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(400);
    });

    it("6. Lỗi 409 nếu target user đã là thành viên trong board_members", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: "target-123", email: "target@test.com" }] },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({
        data: { user_id: "target-123" },
      }); // Đã là member

      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(409);
    });

    it("7. Lỗi 409 nếu email này đang có một lời mời 'pending' khác", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: "target-123", email: "target@test.com" }] },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null }); // Chưa là member
      mockInvCheckMaybeSingle.mockResolvedValue({ data: { id: 99 } }); // Đang pending

      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(409);
    });

    it("8. Lỗi 500 nếu tạo record lời mời thất bại", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: "target-123", email: "target@test.com" }] },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null });
      mockInvCheckMaybeSingle.mockResolvedValue({ data: null });
      mockInvInsertSingle.mockResolvedValue({
        error: { message: "Insert fail" },
      });

      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(500);
    });

    it("9. Thành công (201): Tạo lời mời và thông báo In-App thành công", async () => {
      // Mock Pass tất cả rào cản
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: "target-123", email: "TARGET@test.com" }] },
      }); // Test case-insensitive
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null });
      mockInvCheckMaybeSingle.mockResolvedValue({ data: null });

      // Mock Insert Lời mời
      mockInvInsertSingle.mockResolvedValue({
        data: { id: 99, token: "xyz-token", created_at: "2024" },
      });

      // Mock lấy Tên board và Tên người mời để gán vào Notif
      mockBoardTitleSingle.mockResolvedValue({
        data: { title: "Super Project" },
      });
      mockInviterProfileSingle.mockResolvedValue({
        data: { display_name: "Alice Inviter" },
      });
      mockNotifInsert.mockResolvedValue({ error: null });

      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.accept_url).toBe(
        "http://localhost:3000/api/boards/1/invitations/accept?token=xyz-token",
      );

      // Đảm bảo insert notification với chuỗi JSON payload chính xác
      expect(mockNotifInsert).toHaveBeenCalledWith([
        {
          user_id: "target-123",
          type: "Invite",
          content: JSON.stringify({
            token: "xyz-token",
            inviterName: "Alice Inviter",
            boardTitle: "Super Project",
          }),
          is_read: false,
          project_id: 1,
        },
      ]);
    });

    it("10. Thành công (201) ngay cả khi lỗi tạo Notification (Không chặn luồng chính)", async () => {
      mockAdminListUsers.mockResolvedValue({
        data: { users: [{ id: "target-123", email: "target@test.com" }] },
      });
      mockMemAccessMaybeSingle.mockResolvedValue({ data: null });
      mockInvCheckMaybeSingle.mockResolvedValue({ data: null });
      mockInvInsertSingle.mockResolvedValue({
        data: { id: 99, token: "xyz-token", created_at: "2024" },
      });

      // Ép Notif Insert văng lỗi
      mockNotifInsert.mockResolvedValue({
        error: { message: "Notif DB Down" },
      });

      const res = await POST(
        createMockRequest("POST", { email: "target@test.com" }),
        { params: Promise.resolve({ boardId: "1" }) },
      );
      expect(res.status).toBe(201); // Luồng chính vẫn phải pass!
    });
  });
});
