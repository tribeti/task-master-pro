"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables",
    );
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export async function checkEmailExistsAction(
  email: string,
): Promise<{ exists: boolean; error?: string }> {
  if (!isValidEmailFormat(email)) {
    return { exists: false, error: "Email không đúng định dạng." };
  }

  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error) {
      console.error("checkEmailExistsAction error:", error.message);
      return { exists: true };
    }

    const userExists = data.users.some(
      (user) => user.email?.toLowerCase() === email.trim().toLowerCase(),
    );

    return { exists: userExists };
  } catch (err) {
    console.error("checkEmailExistsAction unexpected error:", err);
    return { exists: true };
  }
}

export async function requestPasswordResetAction(
  email: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!isValidEmailFormat(email)) {
    return { error: "Email không đúng định dạng." };
  }

  try {
    const supabase = await createClient();
    const resetUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
        /\.supabase\.co.*/,
        "",
      )?.replace("https://", "http://localhost:3000") ||
      "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${resetUrl}/auth/reset-password`,
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
