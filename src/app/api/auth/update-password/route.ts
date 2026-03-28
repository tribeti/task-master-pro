import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 6, label: "Ít nhất 6 ký tự" },
  { test: (p: string) => /[0-9]/.test(p), label: "Ít nhất 1 số" },
];

function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Mật khẩu cần: ${rule.label}`;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { oldPassword, newPassword } = await request.json();
    // ── Basic validation ──
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin." },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // ── Get current user session via server client ──
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." },
        { status: 401 },
      );
    }

    // ── Verify old password by attempting sign-in ──
    const verifyClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không đúng" },
        { status: 400 },
      );
    }

    // ── Update password ──
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("update-password error:", updateError.message);
      return NextResponse.json(
        { error: "Không thể đổi mật khẩu. Vui lòng thử lại sau." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    console.error("update-password unexpected error:", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
