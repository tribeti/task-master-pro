import { POST } from "@/app/api/auth/login/route";
import { createClient } from "@/utils/supabase/server";

// 2. Setup Mocks
jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock helper response thành Web API Response chuẩn
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

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- HÀM HELPER TẠO REQUEST ---
  const createMockRequest = (body: any) => {
    return new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("1. Lỗi 400 nếu thiếu email hoặc password", async () => {
    // Chỉ truyền email, thiếu password
    const req = createMockRequest({ email: "test@example.com" });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Vui lòng nhập đầy đủ thông tin.");
  });

  it("2. Lỗi 401 nếu Supabase trả về lỗi đăng nhập (Sai pass/email)", async () => {
    // Mock Supabase signInWithPassword thất bại
    const mockSignIn = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithPassword: mockSignIn },
    });

    const req = createMockRequest({
      email: "test@example.com",
      password: "wrong",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Invalid login credentials");
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "wrong",
    });
  });

  it("3. Đăng nhập thành công và trả về thông tin user (Status 200)", async () => {
    // Mock Supabase signInWithPassword thành công
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      user_metadata: { full_name: "John Doe" },
    };
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signInWithPassword: mockSignIn },
    });

    const req = createMockRequest({
      email: "test@example.com",
      password: "correct-pass",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Đăng nhập thành công!");

    // Kiểm tra xem helper map dữ liệu trả về có đúng cấu trúc không
    expect(body.user).toEqual({
      id: "user-123",
      email: "test@example.com",
      fullName: "John Doe",
    });
  });

  it("4. Lỗi 500 nếu có exception xảy ra (VD: Request body bị lỗi parse)", async () => {
    // Truyền vào một chuỗi không phải JSON hợp lệ để request.json() văng lỗi
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: "invalid-json-format",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Đã xảy ra lỗi không xác định.");
  });
});
