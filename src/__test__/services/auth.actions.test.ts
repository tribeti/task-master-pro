const mockRpc = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetSession = jest.fn();

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getSession: mockGetSession,
      },
      rpc: mockRpc,
    }),
  ),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: jest.fn(),
    }),
  ),
}));

import {
  checkEmailExistsAction,
  requestPasswordResetAction,
} from "@/app/actions/auth.actions";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

// ── checkEmailExistsAction ─────────────────────────────────────────────────

describe("checkEmailExistsAction", () => {
  describe("AC3: Email format validation (server-side)", () => {
    it("returns error for invalid email format - no @", async () => {
      const result = await checkEmailExistsAction("invalidemail");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("returns error for invalid email format - no domain", async () => {
      const result = await checkEmailExistsAction("test@");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("returns error for empty string", async () => {
      const result = await checkEmailExistsAction("");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe("AC2: Email existence check via RPC", () => {
    it("calls supabase.rpc with correct function name and parameter", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      await checkEmailExistsAction("test@example.com");

      expect(mockRpc).toHaveBeenCalledWith("check_email_exists", {
        email_to_check: "test@example.com",
      });
    });

    it("returns exists: true when RPC returns true", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      const result = await checkEmailExistsAction("registered@example.com");
      expect(result.exists).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns exists: false when RPC returns false", async () => {
      mockRpc.mockResolvedValue({ data: false, error: null });

      const result = await checkEmailExistsAction("notregistered@example.com");
      expect(result.exists).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("trims whitespace from email before sending to RPC", async () => {
      mockRpc.mockResolvedValue({ data: true, error: null });

      await checkEmailExistsAction("  test@example.com  ");

      expect(mockRpc).toHaveBeenCalledWith("check_email_exists", {
        email_to_check: "test@example.com",
      });
    });

    it("fails open (returns exists: true) when RPC returns an error", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "function does not exist" },
      });

      const result = await checkEmailExistsAction("anything@example.com");
      expect(result.exists).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("fails open when an unexpected exception is thrown", async () => {
      mockRpc.mockRejectedValue(new Error("Network error"));

      const result = await checkEmailExistsAction("test@example.com");
      expect(result.exists).toBe(true);
    });
  });
});

// ── requestPasswordResetAction ─────────────────────────────────────────────

describe("requestPasswordResetAction", () => {
  describe("AC1: Send reset email to registered address", () => {
    it("returns success when Supabase sends reset email successfully", async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await requestPasswordResetAction("registered@example.com");
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("calls resetPasswordForEmail with correct redirectTo URL", async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await requestPasswordResetAction("test@example.com");

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/reset-password"),
        }),
      );
    });

    it("trims whitespace from email before sending", async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });

      await requestPasswordResetAction("  test@example.com  ");

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(Object),
      );
    });

    it("uses NEXT_PUBLIC_APP_URL for the redirectTo base URL", async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      process.env.NEXT_PUBLIC_APP_URL = "https://myapp.vercel.app";

      await requestPasswordResetAction("test@example.com");

      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        { redirectTo: "https://myapp.vercel.app/auth/reset-password" },
      );
    });
  });

  describe("Error handling", () => {
    it("returns error message when Supabase API fails", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Rate limit exceeded" },
      });

      const result = await requestPasswordResetAction("test@example.com");
      expect(result.error).toBeTruthy();
      expect(result.success).toBeUndefined();
    });

    it("returns format error for invalid email — does NOT call resetPasswordForEmail", async () => {
      const result = await requestPasswordResetAction("not-an-email");
      expect(result.error).toContain("định dạng");
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });
});
