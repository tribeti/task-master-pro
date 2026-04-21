import {
  checkEmailExistsAction,
  requestPasswordResetAction,
} from "@/app/actions/auth.actions";
import { createClient } from "@/utils/supabase/server";

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(),
}));

// Mock next/headers để tránh lỗi khi gọi headers() trong Server Action
const mockGet = jest.fn();
jest.mock("next/headers", () => ({
  headers: jest.fn(() => Promise.resolve({ get: mockGet })),
}));

describe("Auth Actions (Server Actions)", () => {
  // Mock console.error để log không in ra làm rối terminal khi chạy test rẽ nhánh lỗi
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkEmailExistsAction", () => {
    it("returns error for invalid email", async () => {
      const result = await checkEmailExistsAction("invalid-email");
      expect(result.exists).toBe(false);
      expect(result.error).toBe("Email không đúng định dạng.");
    });

    it("returns true if email exists by calling Supabase RPC", async () => {
      const mockRpc = jest.fn().mockResolvedValue({ data: true, error: null });
      (createClient as jest.Mock).mockResolvedValue({ rpc: mockRpc });

      const result = await checkEmailExistsAction("test@gmail.com");
      expect(result.exists).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith("check_email_exists", {
        email_to_check: "test@gmail.com",
      });
    });

    // --- BỔ SUNG TEST CHO CÁC NHÁNH LỖI ---
    it("returns fallback exists: true if Supabase RPC returns an error", async () => {
      const mockRpc = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error("RPC failed") });
      (createClient as jest.Mock).mockResolvedValue({ rpc: mockRpc });

      const result = await checkEmailExistsAction("test@gmail.com");

      // Theo logic code hiện tại: if(error) return { exists: true }
      expect(result.exists).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        "checkEmailExistsAction RPC error:",
        "RPC failed",
      );
    });

    it("returns fallback exists: true if an unexpected exception occurs (catch block)", async () => {
      // Giả lập lỗi hệ thống khi gọi createClient (ví dụ: mất kết nối)
      const error = new Error("Network error");
      (createClient as jest.Mock).mockRejectedValue(error);

      const result = await checkEmailExistsAction("test@gmail.com");

      expect(result.exists).toBe(true);
      expect(console.error).toHaveBeenCalledWith(
        "checkEmailExistsAction unexpected error:",
        error,
      );
    });
  });

  describe("requestPasswordResetAction", () => {
    it("returns error for invalid email format", async () => {
      const result = await requestPasswordResetAction("bad-email");
      expect(result.error).toBe("Email không đúng định dạng.");
    });

    it("returns success and calls resetPasswordForEmail with correct callback URL", async () => {
      mockGet.mockReturnValue("my-app.vercel.app");

      const mockReset = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockResolvedValue({
        auth: { resetPasswordForEmail: mockReset },
      });

      const result = await requestPasswordResetAction("user@example.com");

      expect(result.success).toBe(true);
      expect(mockReset).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/api/auth/callback"),
        }),
      );
      expect(mockReset).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("redirectTo=/auth/reset-password"),
        }),
      );
    });

    it("uses https for non-localhost host", async () => {
      mockGet.mockReturnValue("my-app.vercel.app");

      const mockReset = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockResolvedValue({
        auth: { resetPasswordForEmail: mockReset },
      });

      await requestPasswordResetAction("user@example.com");

      expect(mockReset).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("https://"),
        }),
      );
    });

    it("uses http for localhost host", async () => {
      mockGet.mockReturnValue("localhost:3000");

      const mockReset = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockResolvedValue({
        auth: { resetPasswordForEmail: mockReset },
      });

      await requestPasswordResetAction("user@example.com");

      expect(mockReset).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("http://"),
        }),
      );
    });

    // --- BỔ SUNG TEST CHO CÁC NHÁNH LỖI ---
    it("returns friendly error message if Supabase Auth API returns an error", async () => {
      mockGet.mockReturnValue("localhost:3000");

      const mockReset = jest
        .fn()
        .mockResolvedValue({ error: new Error("Auth service down") });
      (createClient as jest.Mock).mockResolvedValue({
        auth: { resetPasswordForEmail: mockReset },
      });

      const result = await requestPasswordResetAction("user@example.com");

      expect(result.error).toBe("Không thể gửi email. Vui lòng thử lại sau.");
      expect(console.error).toHaveBeenCalledWith(
        "requestPasswordResetAction error:",
        "Auth service down",
      );
    });

    it("returns friendly error message if an unexpected exception occurs (catch block)", async () => {
      const error = new Error("Unexpected auth failure");
      (createClient as jest.Mock).mockRejectedValue(error);

      const result = await requestPasswordResetAction("user@example.com");

      expect(result.error).toBe("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      expect(console.error).toHaveBeenCalledWith(
        "requestPasswordResetAction unexpected error:",
        error,
      );
    });
  });
});
