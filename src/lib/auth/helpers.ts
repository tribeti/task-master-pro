import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared auth helper utilities for API route handlers.
 * Reduces boilerplate for authentication checks and JSON responses.
 */

// ── Standardized JSON responses ──────────────────────────

/**
 * Creates a standardized error JSON response.
 */
export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a standardized success JSON response.
 */
export function createSuccessResponse(
  data: Record<string, unknown>,
  status: number = 200,
) {
  return NextResponse.json(data, { status });
}

// ── Authentication check ─────────────────────────────────

type AuthResult =
  | { user: NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>["data"]["user"]>; error: null }
  | { user: null; error: NextResponse };

/**
 * Verifies the current user is authenticated.
 * Returns the `user` object on success, or a 401 `NextResponse` on failure.
 *
 * @example
 * ```ts
 * const { user, error } = await getAuthenticatedUser(supabase);
 * if (error) return error; // 401 response
 * // user is guaranteed non-null here
 * ```
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<AuthResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      error: createErrorResponse(
        "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        401,
      ),
    };
  }

  return { user, error: null };
}
