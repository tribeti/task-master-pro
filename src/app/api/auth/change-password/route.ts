import { createClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { validatePassword } from "@/lib/auth/validators";
import {
  getAuthenticatedUser,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/auth/helpers";

/**
 * POST /api/auth/change-password
 * Changes the authenticated user's password after verifying the old one.
 */
export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return createErrorResponse("Cấu hình hệ thống không hợp lệ.", 500);
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return createErrorResponse("Vui lòng nhập đầy đủ thông tin.", 400);
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return createErrorResponse(passwordError, 400);
    }

    // Get current authenticated user
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError) return authError;

    if (!user.email) {
      return createErrorResponse(
        "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        401,
      );
    }

    // Verify old password using a throwaway client
    const verifyClient = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return createErrorResponse("Mật khẩu hiện tại không đúng", 400);
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return createErrorResponse(
        "Không thể đổi mật khẩu. Vui lòng thử lại sau.",
        500,
      );
    }

    return createSuccessResponse({ message: "Đổi mật khẩu thành công!" });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}
