import { createClient } from "@/utils/supabase/server";
import {
  getAuthenticatedUser,
  createErrorResponse,
  createSuccessResponse,
} from "@/lib/auth/helpers";

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile information.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError) return authError;

    // Fetch public profile from `users` table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("GET /api/auth/profile error:", profileError.message);
      return createErrorResponse("Không thể tải thông tin profile.", 500);
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
    });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}

/**
 * PUT /api/auth/profile
 * Updates the authenticated user's display name.
 * Avatar upload is handled separately via client-side Supabase Storage.
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getAuthenticatedUser(supabase);
    if (authError) return authError;

    const { displayName } = await request.json();

    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return createErrorResponse("Tên hiển thị không hợp lệ.", 400);
    }

    // 1. Update `users` table (public profile)
    const { error: updateError } = await supabase
      .from("users")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (updateError) {
      console.error("PUT /api/auth/profile DB error:", updateError.message);
      return createErrorResponse("Không thể cập nhật profile.", 500);
    }

    // 2. Sync to auth.users metadata
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        name: displayName,
      },
    });

    if (authUpdateError) {
      console.error(
        "PUT /api/auth/profile auth sync error:",
        authUpdateError.message,
      );
      return createErrorResponse(
        "Không thể đồng bộ hóa thông tin người dùng. Vui lòng thử lại.",
        500,
      );
    }

    return createSuccessResponse({ message: "Cập nhật profile thành công!" });
  } catch {
    return createErrorResponse("Đã xảy ra lỗi không xác định.", 500);
  }
}
