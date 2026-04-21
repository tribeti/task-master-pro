"use server";

import { createClient } from "@/utils/supabase/server";
import { isValidEmail } from "@/lib/auth/validators";

export async function checkEmailExistsAction(
  email: string,
): Promise<{ exists: boolean; error?: string }> {
  if (!isValidEmail(email)) {
    return { exists: false, error: "Email không đúng định dạng." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("check_email_exists", {
      email_to_check: email.trim(),
    });

    if (error) {
      console.error("checkEmailExistsAction RPC error:", error.message);
      return { exists: true };
    }

    return { exists: data === true };
  } catch (err) {
    console.error("checkEmailExistsAction unexpected error:", err);
    return { exists: true };
  }
}

export async function requestPasswordResetAction(
  email: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!isValidEmail(email)) {
    return { error: "Email không đúng định dạng." };
  }

  try {
    const supabase = await createClient();
    let origin = process.env.NEXT_PUBLIC_APP_URL;
    if (!origin && process.env.NODE_ENV === "development") {
      origin = "http://localhost:3000";
    }
    
    if (!origin) {
      console.error("Missing NEXT_PUBLIC_APP_URL environment variable.");
      return { error: "Lỗi cấu hình hệ thống: Thiếu URL." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/api/auth/callback?redirectTo=/auth/reset-password`,
    });

    if (error) {
      console.error("requestPasswordResetAction error:", error.message);
      return { error: "Không thể gửi email. Vui lòng thử lại sau." };
    }

    return { success: true };
  } catch (err) {
    console.error("requestPasswordResetAction unexpected error:", err);
    return { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." };
  }
}
