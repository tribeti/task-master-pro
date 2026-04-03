import { createClient } from "@/utils/supabase/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/auth/helpers";

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies.
 */
export async function POST() {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return createErrorResponse("Không thể đăng xuất. Vui lòng thử lại.", 500);
    }

    return createSuccessResponse({ message: "Đăng xuất thành công!" });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}
