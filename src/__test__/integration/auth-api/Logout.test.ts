import { POST } from "@/app/api/auth/logout/route";
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

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("1. Lỗi 500 nếu Supabase signOut thất bại", async () => {
    // Mock hàm signOut trả về có lỗi
    const mockSignOut = jest.fn().mockResolvedValue({
      error: { message: "Internal Server Error from Supabase" },
    });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signOut: mockSignOut },
    });

    // Gọi trực tiếp hàm POST (không cần truyền request object vì API không dùng đến)
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Không thể đăng xuất. Vui lòng thử lại.");
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("2. Đăng xuất thành công và trả về 200", async () => {
    // Mock hàm signOut thành công (error = null)
    const mockSignOut = jest.fn().mockResolvedValue({
      error: null,
    });

    (createClient as jest.Mock).mockResolvedValue({
      auth: { signOut: mockSignOut },
    });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Đăng xuất thành công!");
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("3. Lỗi 500 nếu có exception bất ngờ xảy ra", async () => {
    // Giả lập việc khởi tạo Supabase client bị crash (ném ra exception)
    (createClient as jest.Mock).mockRejectedValue(
      new Error("Unexpected crash"),
    );

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Đã xảy ra lỗi không xác định.");
  });
});
