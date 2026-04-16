import { POST } from "@/app/api/auth/change-password/route";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { validatePassword } from "@/lib/auth/validators";
import { getAuthenticatedUser } from "@/lib/auth/helpers";

// 2. Setup Mocks
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/auth/validators", () => ({
  validatePassword: jest.fn(),
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

describe("POST /api/auth/change-password", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Giả lập môi trường có đầy đủ biến env
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://mock-url.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "mock-anon-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // --- HÀM HELPER TẠO REQUEST ---
  const createMockRequest = (body: any) => {
    return new Request("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("1. Lỗi 500 nếu thiếu biến môi trường Supabase", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const req = createMockRequest({ oldPassword: "old", newPassword: "new" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Cấu hình hệ thống không hợp lệ.");
  });

  it("2. Lỗi 400 nếu thiếu oldPassword hoặc newPassword", async () => {
    const req = createMockRequest({ oldPassword: "old" }); // Thiếu newPassword
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Vui lòng nhập đầy đủ thông tin.");
  });

  it("3. Lỗi 400 nếu mật khẩu mới không qua được validate", async () => {
    (validatePassword as jest.Mock).mockReturnValue("Mật khẩu quá ngắn");

    const req = createMockRequest({ oldPassword: "old", newPassword: "123" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Mật khẩu quá ngắn");
  });

  it("4. Trả về lỗi từ helper nếu getAuthenticatedUser thất bại", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      user: null,
      error: {
        status: 401,
        json: () => Promise.resolve({ error: "Chưa đăng nhập" }),
      },
    });

    const req = createMockRequest({
      oldPassword: "old",
      newPassword: "newPass123!",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Chưa đăng nhập");
  });

  it("5. Lỗi 400 nếu mật khẩu hiện tại không đúng (signInWithPassword lỗi)", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
      error: null,
    });

    // Mock cho verifyClient (browser client)
    const mockSignInWithPassword = jest.fn().mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    (createBrowserClient as jest.Mock).mockReturnValue({
      auth: { signInWithPassword: mockSignInWithPassword },
    });

    const req = createMockRequest({
      oldPassword: "wrong",
      newPassword: "newPass123!",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Mật khẩu hiện tại không đúng");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "wrong",
    });
  });

  it("6. Đổi mật khẩu thành công trả về 200", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    (getAuthenticatedUser as jest.Mock).mockResolvedValue({
      user: { email: "test@example.com" },
      error: null,
    });

    // Mock verify pass cũ thành công
    (createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      },
    });

    // Mock update pass mới thành công (Server client)
    const mockUpdateUser = jest.fn().mockResolvedValue({ error: null });
    (createServerClient as jest.Mock).mockResolvedValue({
      auth: { updateUser: mockUpdateUser },
    });

    const req = createMockRequest({
      oldPassword: "old",
      newPassword: "newPass123!",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Đổi mật khẩu thành công!");
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newPass123!" });
  });

  it("7. Lỗi 500 nếu catch được exception (vd: lỗi parse JSON body)", async () => {
    // Tạo request với body lỗi để kích hoạt catch block
    const req = new Request("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      body: "invalid-json",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Đã xảy ra lỗi không xác định.");
  });
});
