import { createClient } from "@/utils/supabase/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/auth/helpers";

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return createErrorResponse("Vui lòng nhập đầy đủ thông tin.", 400);
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return createErrorResponse(error.message, 401);
    }

    return createSuccessResponse({
      message: "Đăng nhập thành công!",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
      },
    });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}
