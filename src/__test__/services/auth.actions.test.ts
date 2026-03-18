const mockListUsers = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockGetSession = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
      },
    },
  })),
}));

jest.mock("@/utils/supabase/server", () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getSession: mockGetSession,
      },
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

  // Setup default env vars
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

// ── checkEmailExistsAction ─────────────────────────────────────────────────

describe("checkEmailExistsAction", () => {
  describe("AC3: Email format validation (server-side)", () => {
    it("returns error for invalid email format - no @", async () => {
      const result = await checkEmailExistsAction("invalidemail");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
    });

    it("returns error for invalid email format - no domain", async () => {
      const result = await checkEmailExistsAction("test@");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
    });

    it("returns error for empty string", async () => {
      const result = await checkEmailExistsAction("");
      expect(result.exists).toBe(false);
      expect(result.error).toContain("định dạng");
    });
  });

  describe("AC2: Email existence check via Admin API", () => {
    it("returns exists: true when email is found in user list", async () => {
      mockListUsers.mockResolvedValue({
        data: {
          users: [
            { email: "registered@example.com", id: "user-1" },
            { email: "other@example.com", id: "user-2" },
          ],
        },
        error: null,
      });

      const result = await checkEmailExistsAction("registered@example.com");
      expect(result.exists).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns exists: false when email is NOT found in user list", async () => {
      mockListUsers.mockResolvedValue({
        data: {
          users: [{ email: "other@example.com", id: "user-2" }],
        },
        error: null,
      });

      const result = await checkEmailExistsAction("notregistered@example.com");
      expect(result.exists).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it("is case-insensitive when matching email", async () => {
      mockListUsers.mockResolvedValue({
        data: {
          users: [{ email: "User@Example.COM", id: "user-1" }],
        },
        error: null,
      });

      const result = await checkEmailExistsAction("user@example.com");
      expect(result.exists).toBe(true);
    });

    it("fails open (returns exists: true) when Admin API returns error", async () => {
      mockListUsers.mockResolvedValue({
        data: null,
        error: { message: "Admin API error" },
      });

      const result = await checkEmailExistsAction("anything@example.com");
      // Fail open: don't block user when admin API fails
      expect(result.exists).toBe(true);
    });

    it("fails open when SERVICE_ROLE_KEY is missing", async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const result = await checkEmailExistsAction("test@example.com");
      // Should not throw, should fail gracefully
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

    it("returns format error for invalid email", async () => {
      const result = await requestPasswordResetAction("not-an-email");
      expect(result.error).toContain("định dạng");
      // Should NOT call the Supabase API at all
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });
});
