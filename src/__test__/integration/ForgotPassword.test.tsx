import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

jest.mock("@/utils/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  })),
}));

jest.mock("@/app/actions/auth.actions", () => ({
  checkEmailExistsAction: jest.fn(),
  requestPasswordResetAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import TaskFlowAuth from "@/app/login/page";
import * as authActions from "@/app/actions/auth.actions";

const mockCheckEmailExists = jest.mocked(authActions.checkEmailExistsAction);
const mockRequestPasswordReset = jest.mocked(
  authActions.requestPasswordResetAction,
);

function renderAndGoToForgot() {
  render(<TaskFlowAuth />);
  // Navigate to forgot password view
  const forgotBtn = screen.getByText(/forgot password\?/i);
  fireEvent.click(forgotBtn);
}

describe("Forgot Password Form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: localStorage is empty
    localStorage.clear();
  });

  describe("Email format validation", () => {
    it("shows inline format error when submitting empty input", async () => {
      renderAndGoToForgot();

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/email không đúng định dạng/i),
      ).toBeInTheDocument();
      expect(mockCheckEmailExists).not.toHaveBeenCalled();
    });

    it("shows format error for string without @", async () => {
      renderAndGoToForgot();

      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "notanemail" } });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/email không đúng định dạng/i),
      ).toBeInTheDocument();
      expect(mockCheckEmailExists).not.toHaveBeenCalled();
    });

    it("clears format error message when user starts typing again", async () => {
      renderAndGoToForgot();

      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "bad" } });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Error appears
      expect(
        await screen.findByText(/email không đúng định dạng/i),
      ).toBeInTheDocument();

      // User types again → error should disappear
      fireEvent.change(emailInput, { target: { value: "bad@" } });
      expect(
        screen.queryByText(/email không đúng định dạng/i),
      ).not.toBeInTheDocument();
    });

    it("does NOT show format error for a valid email format", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: true });
      mockRequestPasswordReset.mockResolvedValue({ success: true });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        screen.queryByText(/email không đúng định dạng/i),
      ).not.toBeInTheDocument();
    });
  });

  // ── Email not registered ─────────────────────────────────────────────

  describe("AC2: Unregistered email shows 'Email không tồn tại'", () => {
    it("shows 'Email không tồn tại' error when server returns exists: false", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: false });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, {
        target: { value: "notregistered@test.com" },
      });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/email không tồn tại/i),
      ).toBeInTheDocument();
      // Should NOT proceed to send reset email
      expect(mockRequestPasswordReset).not.toHaveBeenCalled();
    });

    it("calls checkEmailExistsAction with entered email", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: false });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(mockCheckEmailExists).toHaveBeenCalledWith("test@example.com");
    });
  });

  // ── Registered email sends reset link ────────────────────────────────

  describe("AC1: Registered email triggers password reset email", () => {
    it("shows success message when email exists and reset is sent", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: true });
      mockRequestPasswordReset.mockResolvedValue({ success: true });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, {
        target: { value: "registered@example.com" },
      });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/đã gửi link reset password/i),
      ).toBeInTheDocument();
    });

    it("calls requestPasswordResetAction when email exists", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: true });
      mockRequestPasswordReset.mockResolvedValue({ success: true });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, {
        target: { value: "registered@example.com" },
      });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(
          "registered@example.com",
        );
      });
    });

    it("shows error when reset email fails to send", async () => {
      mockCheckEmailExists.mockResolvedValue({ exists: true });
      mockRequestPasswordReset.mockResolvedValue({
        error: "Không thể gửi email. Vui lòng thử lại sau.",
      });

      renderAndGoToForgot();
      const emailInput = screen.getByPlaceholderText(/email address/i);
      fireEvent.change(emailInput, {
        target: { value: "registered@example.com" },
      });

      const submitBtn = screen.getByRole("button", { name: /gửi link reset/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(
        await screen.findByText(/không thể gửi email/i),
      ).toBeInTheDocument();
    });
  });
});
