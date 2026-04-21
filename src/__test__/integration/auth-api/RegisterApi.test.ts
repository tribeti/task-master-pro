import { POST } from "@/app/api/auth/register/route";
import { createClient } from "@/utils/supabase/server";
import { validatePassword } from "@/lib/auth/validators";

// 2. Setup Mocks
jest.mock("@/utils/supabase/server", () => ({
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

describe("POST /api/auth/register", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv }; // Reset env trước mỗi test
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // --- HÀM HELPER TẠO REQUEST (Hỗ trợ thêm Headers) ---
  const createMockRequest = (body: any, headers?: Record<string, string>) => {
    return new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        ...headers,
      }),
      body: JSON.stringify(body),
    });
  };

  it("1. Lỗi 400 nếu thiếu email, password, hoặc fullName", async () => {
    const req = createMockRequest({
      email: "test@example.com",
      password: "123",
    }); // Thiếu fullName
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Vui lòng nhập đầy đủ thông tin.");
  });

  it("2. Lỗi 400 nếu mật khẩu không qua được validator", async () => {
    // Ép validator trả về lỗi
    (validatePassword as jest.Mock).mockReturnValue(
      "Mật khẩu phải có ít nhất 8 ký tự.",
    );

    const req = createMockRequest({
      email: "test@example.com",
      password: "short",
      fullName: "Test User",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Mật khẩu phải có ít nhất 8 ký tự.");
  });

  it("3. Lỗi 400 nếu Supabase signUp trả về lỗi (VD: Email đã tồn tại)", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);

    const mockSignUp = jest.fn().mockResolvedValue({
      error: { message: "User already registered" },
    });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: mockSignUp },
    });

    const req = createMockRequest({
      email: "exist@example.com",
      password: "StrongPassword123!",
      fullName: "Test User",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("User already registered");
  });

  it("4. Đăng ký thành công và URL callback lấy từ Header Origin", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);

    const mockSignUp = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: mockSignUp },
    });

    // Tạo request có chứa Header "origin"
    const req = createMockRequest(
      {
        email: "new@example.com",
        password: "StrongPassword123!",
        fullName: "Test User",
      },
      { origin: "https://myapp.com" }, // Giả lập request gọi từ domain thật
    );

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe(
      "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.",
    );

    // CỰC KỲ QUAN TRỌNG: Kiểm tra xem tham số truyền vào Supabase có ghép đúng URL không
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "StrongPassword123!",
      options: {
        data: { full_name: "Test User" },
        emailRedirectTo: "https://myapp.com/api/auth/callback", // Lấy từ Origin
      },
    });
  });

  it("5. Đăng ký thành công và URL callback có chứa query redirectTo", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    delete process.env.NEXT_PUBLIC_APP_URL; // Cố tình xóa để test fallback localhost:3000

    const mockSignUp = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockResolvedValue({
      auth: { signUp: mockSignUp },
    });

    // Request không có header origin, nhưng có gửi redirectTo trong body
    const req = createMockRequest({
      email: "new@example.com",
      password: "StrongPassword123!",
      fullName: "Test User",
      redirectTo: "/dashboard",
    });

    await POST(req);

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo:
            "http://localhost:3000/api/auth/callback?redirectTo=%2Fdashboard",
        }),
      }),
    );
  });

  it("6. Lỗi 500 nếu có exception (VD: Request body bị lỗi parse)", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: "invalid-json", // Kích hoạt nhánh catch
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Đã xảy ra lỗi không xác định.");
  });
});
