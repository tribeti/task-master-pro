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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Cấu hình hệ thống không hợp lệ." },
      { status: 500 },
    );
  }

  try {
    const { oldPassword, newPassword } = await request.json();

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

    // 3. Khởi tạo server client (để lấy user hiện tại)
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

    // 4. Sử dụng biến đã verify để xác thực mật khẩu cũ
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
      return NextResponse.json(
        { error: "Mật khẩu hiện tại không đúng" },
        { status: 400 },
      );
    }

    // 5. Cập nhật mật khẩu mới
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: "Không thể đổi mật khẩu. Vui lòng thử lại sau." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi không xác định." },
      { status: 500 },
    );
  }
}
