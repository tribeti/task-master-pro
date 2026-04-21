import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/command";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let safeRedirectTo = "/";

      if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
        safeRedirectTo = redirectTo;
      } else {
        try {
          const url = new URL(redirectTo);
          if (url.origin === origin) {
            safeRedirectTo = redirectTo;
          }
        } catch (_) {
          // Invalid URL format, use default safeRedirectTo
        }
      }

      return NextResponse.redirect(new URL(safeRedirectTo, origin));
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", origin),
  );
}
