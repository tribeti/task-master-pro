import { GET, POST } from "@/app/api/boards/route";
import { createClient } from "@/utils/supabase/server";
import { validateString } from "@/utils/validate-string";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
    })),
  },
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/utils/validate-string", () => ({
  validateString: jest.fn(),
}));

const mockAuthGetUser = jest.fn();
const mockOrderBoards = jest.fn();
const mockEqBoards = jest.fn().mockReturnValue({ order: mockOrderBoards });
const mockSelectBoards = jest.fn().mockReturnValue({ eq: mockEqBoards });

const mockEqMembers = jest.fn();
const mockSelectMembers = jest.fn().mockReturnValue({ eq: mockEqMembers });

const mockSelectInsert = jest.fn();
const mockInsert = jest.fn().mockReturnValue({ select: mockSelectInsert });

const mockFrom = jest.fn((tableName: string) => {
  if (tableName === "boards") {
    return { select: mockSelectBoards, insert: mockInsert };
  }
  if (tableName === "board_members") {
    return { select: mockSelectMembers };
  }
  return {};
});

describe("/api/boards", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup client mặc định
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      from: mockFrom,
    });

    // Mặc định luôn pass xác thực user
    mockAuthGetUser.mockResolvedValue({ data: { user: mockUser } });

    // Mặc định validateString trả về đúng giá trị truyền vào
    (validateString as jest.Mock).mockImplementation((val) => val);

    // Ẩn console.error để giữ terminal sạch sẽ khi test lỗi
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // TEST SUITE: GET /api/boards
  // ==========================================
  describe("GET", () => {
    it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });

      const res = (await GET()) as any;
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("2. Lỗi 500 nếu lấy danh sách owned boards thất bại", async () => {
      mockOrderBoards.mockResolvedValue({
        data: null,
        error: { message: "DB Error owned" },
      });

      const res = (await GET()) as any;
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to fetch owned boards");
    });

    it("3. Lỗi 500 nếu lấy danh sách joined boards thất bại", async () => {
      // Mock owned boards thành công
      mockOrderBoards.mockResolvedValue({ data: [], error: null });
      // Mock joined boards thất bại
      mockEqMembers.mockResolvedValue({
        data: null,
        error: { message: "DB Error joined" },
      });

      const res = (await GET()) as any;
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to fetch joined boards");
    });

    it("4. Thành công (200) và filter đúng các joined boards do user tự tạo", async () => {
      const mockOwnedBoards = [
        { id: 1, title: "Owned 1", owner_id: "user-123" },
      ];

      const mockMemberRows = [
        // Board này do user khác sở hữu -> Phải được giữ lại trong joinedBoards
        {
          role: "editor",
          boards: { id: 2, title: "Joined 1", owner_id: "other-user" },
        },
        // Board này do chính user này sở hữu -> Phải bị filter loại bỏ
        {
          role: "admin",
          boards: { id: 1, title: "Owned 1", owner_id: "user-123" },
        },
      ];

      mockOrderBoards.mockResolvedValue({ data: mockOwnedBoards, error: null });
      mockEqMembers.mockResolvedValue({ data: mockMemberRows, error: null });

      const res = (await GET()) as any;
      const body = await res.json();

      expect(res.status).toBe(200);

      // Kiểm tra ownedBoards
      expect(body.ownedBoards).toEqual(mockOwnedBoards);

      // Kiểm tra joinedBoards đã được filter và map đúng field member_role
      expect(body.joinedBoards).toHaveLength(1);
      expect(body.joinedBoards[0]).toEqual({
        id: 2,
        title: "Joined 1",
        owner_id: "other-user",
        member_role: "editor", // Đã được nhét thêm vào object
      });
    });

    it("5. Catch block: Trả về 500 nếu có exception bất ngờ", async () => {
      // Ép auth.getUser quăng lỗi thẳng ra ngoài
      mockAuthGetUser.mockRejectedValue(new Error("Unexpected crash"));

      const res = (await GET()) as any;
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Internal server error");
    });
  });

  // ==========================================
  // TEST SUITE: POST /api/boards
  // ==========================================
  describe("POST", () => {
    const createMockRequest = (bodyData: any) =>
      new Request("http://localhost:3000/api/boards", {
        method: "POST",
        body: JSON.stringify(bodyData),
      }) as any; // Cast về any để bypass type check của NextRequest

    it("1. Lỗi 401 nếu chưa đăng nhập", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } });

      const req = createMockRequest({ title: "New Board" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Unauthorized");
    });

    it("2. Lỗi 400 nếu validate input thất bại (VD: thiếu title)", async () => {
      // Mock validateString quăng ra lỗi giống hệt logic thật
      (validateString as jest.Mock).mockImplementation(() => {
        throw new Error("Project title không hợp lệ");
      });

      const req = createMockRequest({ title: "" });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400); // Check đúng status 400 cho validation
      expect(body.error).toBe("Project title không hợp lệ");
    });

    it("3. Lỗi 500 nếu insert vào database thất bại", async () => {
      mockSelectInsert.mockResolvedValue({
        data: null,
        error: { message: "Insert Error" },
      });

      const req = createMockRequest({ title: "New Board", is_private: true });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to create project.");
    });

    it("4. Lỗi 500 nếu insert thành công nhưng không trả về data", async () => {
      mockSelectInsert.mockResolvedValue({
        data: [], // Array rỗng
        error: null,
      });

      const req = createMockRequest({ title: "New Board", is_private: true });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to create project: No data returned.");
    });

    it("5. Tạo bảng thành công (201)", async () => {
      const mockCreatedBoard = {
        id: 99,
        title: "New Board",
        owner_id: "user-123",
      };

      mockSelectInsert.mockResolvedValue({
        data: [mockCreatedBoard],
        error: null,
      });

      const payload = {
        title: "New Board",
        description: " Desc ",
        is_private: true,
        tag: "dev",
        color: "#fff",
      };

      const req = createMockRequest(payload);
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toEqual(mockCreatedBoard);

      // Verify data insert có đúng cấu trúc và đã được trim() không
      expect(mockInsert).toHaveBeenCalledWith([
        {
          title: "New Board",
          description: "Desc", // " Desc " đã được .trim() thành "Desc"
          is_private: true,
          color: "#fff",
          tag: "dev",
          owner_id: "user-123",
        },
      ]);
    });

    it("6. Catch block: Trả về 500 nếu body request gửi lên bị lỗi JSON", async () => {
      const req = new Request("http://localhost:3000/api/boards", {
        method: "POST",
        body: "invalid-json",
      }) as any;

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe("string");
    });
  });
});
