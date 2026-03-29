import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { validatePassword } from "@/lib/auth/validators";
import { createErrorResponse, createSuccessResponse } from "@/lib/auth/helpers";

/**
 * POST /api/auth/register
 * Registers a new user with email and password.
 */
export async function POST(request: Request) {
  try {
    const { email, password, fullName, redirectTo } = await request.json();

    if (!email || !password || !fullName) {
      return createErrorResponse("Vui lòng nhập đầy đủ thông tin.", 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return createErrorResponse(passwordError, 400);
    }

    const supabase = await createClient();

    // Build email confirmation callback URL
    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = new URL("/auth/callback", origin);
    if (redirectTo) {
      callbackUrl.searchParams.set("redirectTo", redirectTo);
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return createErrorResponse(error.message, 400);
    }

    return createSuccessResponse({
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.",
    });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}
