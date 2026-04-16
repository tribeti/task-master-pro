// app/api/auth/profile/route.test.ts
import { GET, PUT } from "@/app/api/auth/profile/route";

// 1. Import module cần mock
import { createClient } from "@/utils/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/helpers";

// 2. Setup Mocks cho Supabase và Helpers
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth/helpers", () => ({
  getAuthenticatedUser: jest.fn(), // Dành cho Profile và ChangePassword
  createErrorResponse: jest.fn((message, status) => {
    // Trả về một object giả lập Response
    return {
      status: status,
      json: () => Promise.resolve({ error: message }), // Hàm res.json() luôn là async
    };
  }),
  createSuccessResponse: jest.fn((data) => {
    return {
      status: 200,
      json: () => Promise.resolve(data),
    };
  }),
}));

// 3. Khởi tạo "Mock Chain" cho Supabase Database
const mockSingle = jest.fn();
const mockSelectEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockSelectEq });

const mockUpdateEq = jest.fn();
const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
});

const mockAuthUpdateUser = jest.fn();

describe("/api/auth/profile", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    user_metadata: { full_name: "Auth Name" },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Gán các hàm giả lập vào Supabase client
    (createClient as jest.Mock).mockResolvedValue({
      from: mockFrom,
      auth: { updateUser: mockAuthUpdateUser },
    });

    // Mặc định cho pass qua bước check auth
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    // Ẩn console.error để terminal không bị rác khi test lỗi
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // ==========================================
  // TEST SUITE: GET /api/auth/profile
  // ==========================================
  describe("GET", () => {
    it("1. Trả về lỗi 401 nếu chưa đăng nhập", async () => {
      (getAuthenticatedUser as jest.Mock).mockResolvedValue({
        user: null,
        error: {
          status: 401,
          json: () => Promise.resolve({ error: "Chưa đăng nhập" }),
        },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Chưa đăng nhập");
    });

    it("2. Lỗi 500 nếu query database thất bại (không phải lỗi PGRST116)", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "XYZ123", message: "Database connection failed" },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Không thể tải thông tin profile.");
    });

    it("3. Thành công (200) nhưng User chưa có profile trong bảng users (Lỗi PGRST116)", async () => {
      // PGRST116 là mã lỗi khi .single() không tìm thấy dòng nào, ta vẫn cho pass
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user.displayName).toBeNull();
      expect(body.user.avatarUrl).toBeNull();
    });

    it("4. Lấy thông tin profile thành công (200)", async () => {
      mockSingle.mockResolvedValue({
        data: {
          display_name: "My Display Name",
          avatar_url: "https://avatar.com/1",
        },
        error: null,
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user).toEqual({
        id: "user-123",
        email: "test@example.com",
        fullName: "Auth Name",
        displayName: "My Display Name",
        avatarUrl: "https://avatar.com/1",
      });
      // Kiểm tra xem query có đúng id không
      expect(mockSelectEq).toHaveBeenCalledWith("id", "user-123");
    });
  });

  // ==========================================
  // TEST SUITE: PUT /api/auth/profile
  // ==========================================
  describe("PUT", () => {
    const createMockRequest = (body: any) =>
      new Request("http://localhost:3000/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });

    it("1. Lỗi 400 nếu displayName bị trống hoặc không phải chuỗi", async () => {
      const req = createMockRequest({ displayName: "   " }); // Khoảng trắng
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Tên hiển thị không hợp lệ.");
    });

    it("2. Lỗi 500 nếu update bảng users thất bại", async () => {
      mockUpdateEq.mockResolvedValue({
        error: { message: "Cannot update table" },
      });

      const req = createMockRequest({ displayName: "New Name" });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Không thể cập nhật profile.");
    });

    it("3. Lỗi 500 nếu đồng bộ auth.users thất bại", async () => {
      // Update DB thành công
      mockUpdateEq.mockResolvedValue({ error: null });
      // Update Auth thất bại
      mockAuthUpdateUser.mockResolvedValue({
        error: { message: "Auth sync failed" },
      });

      const req = createMockRequest({ displayName: "New Name" });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe(
        "Không thể đồng bộ hóa thông tin người dùng. Vui lòng thử lại.",
      );
    });

    it("4. Cập nhật profile thành công (200)", async () => {
      mockUpdateEq.mockResolvedValue({ error: null });
      mockAuthUpdateUser.mockResolvedValue({ error: null });

      const req = createMockRequest({ displayName: "New Name" });
      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Cập nhật profile thành công!");

      // Kiểm tra Supabase query truyền đúng data
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: "New Name" });
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "user-123");
      expect(mockAuthUpdateUser).toHaveBeenCalledWith({
        data: { full_name: "New Name", name: "New Name" },
      });
    });

    it("5. Catch block: Lỗi 500 nếu body request gửi lên bị lỗi (VD: không parse được JSON)", async () => {
      const req = new Request("http://localhost:3000/api/auth/profile", {
        method: "PUT",
        body: "invalid-json", // Gây crash ở await request.json()
      });

      const res = await PUT(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Đã xảy ra lỗi không xác định.");
    });
  });
});
