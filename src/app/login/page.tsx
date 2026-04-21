"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import {
  checkEmailExistsAction,
  requestPasswordResetAction,
} from "@/app/actions/auth.actions";
import { validatePassword, isValidEmail } from "@/lib/auth/validators";

import {
  MailIcon,
  LockIcon,
  UserIconLogin as UserIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIconLogin as CheckIcon,
} from "@/components/icons";

type AuthView = "login" | "register" | "forgot";

export default function TaskFlowAuth() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [emailFormatError, setEmailFormatError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  // --- CÁC HÀM XỬ LÝ AUTH ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");

    // Preserve redirectTo query param for the callback page
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get("redirectTo");
    const callbackUrl = new URL("/api/auth/callback", window.location.origin);
    if (redirectTo) {
      callbackUrl.searchParams.set("redirectTo", redirectTo);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    if (error) setErrorMsg(error.message);
    setIsLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // Xử lý Remember Me
    if (rememberMe) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Đăng nhập thất bại.");
      } else {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectTo = searchParams.get("redirectTo");
        router.push(redirectTo || "/command");
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Validate password strength (client-side for instant feedback)
    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMsg(passwordError);
      setIsLoading(false);
      return;
    }

    // Preserve redirectTo for the email confirmation link
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get("redirectTo");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, redirectTo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Đăng ký thất bại.");
      } else {
        setSuccessMsg(
          data.message ||
            "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.",
        );
        setView("login");
      }
    } catch {
      setErrorMsg("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setEmailFormatError("");

    if (!isValidEmail(email)) {
      setEmailFormatError(
        "Email không đúng định dạng. Ví dụ: example@gmail.com",
      );
      return;
    }

    setIsLoading(true);

    // ── Kiểm tra email có tồn tại trong hệ thống ──
    const { exists, error: checkError } = await checkEmailExistsAction(email);
    if (checkError) {
      setErrorMsg(checkError);
      setIsLoading(false);
      return;
    }
    if (!exists) {
      setErrorMsg("Email không tồn tại. Vui lòng kiểm tra lại.");
      setIsLoading(false);
      return;
    }

    // ── Gửi link reset password ──
    const { success, error: resetError } =
      await requestPasswordResetAction(email);
    if (resetError) {
      setErrorMsg(resetError);
    } else if (success) {
      setSuccessMsg(
        "Đã gửi link reset password vào email! Vui lòng kiểm tra inbox.",
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans relative">
      {/* --- LOGO CHO MOBILE/TABLET --- */}
      <div className="absolute top-8 left-0 w-full flex justify-center lg:hidden z-20 animate-in fade-in slide-in-from-top-4 duration-700">
        <Logo isDarkTheme={false} />
      </div>

      {/* 1. LEFT PANEL (DESKTOP) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#1E293B]">
        <div className="absolute inset-0 bg-linear-to-br from-[#1E293B] via-[#0F172A] to-[#020617] z-0"></div>
        <div
          className="absolute inset-0 opacity-10 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div className="absolute top-0 left-0 w-full h-1/2 bg-[#28B8FA] opacity-20 blur-[120px] rounded-full z-0 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[#34D399] opacity-10 blur-[120px] rounded-full z-0 translate-y-1/2 translate-x-1/4"></div>

        <div className="relative z-10 p-12 flex flex-col h-full">
          {/* --- LOGO CHO DESKTOP --- */}
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <Logo isDarkTheme={true} />
          </div>

          <div className="mt-auto mb-auto">
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
              Làm chủ <br /> công việc. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#34D399] to-[#28B8FA]">
                Đạt trạng thái tốt nhất.
              </span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-md">
              Tham gia cùng hàng ngàn chuyên gia sử dụng gamification để chinh
              phục mục tiêu hàng ngày và xây dựng chuỗi thành tích không thể phá
              vỡ.
            </p>

            <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-4xl p-6 max-w-sm flex items-center gap-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#34D399] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckIcon />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">nhận 150 XP</h4>
                <p className="text-slate-300 text-sm font-medium mt-1">
                  Trạng thái tập trung sâu hoàn thành
                </p>
              </div>
            </div>
          </div>

          <div className="text-slate-500 text-sm font-medium">
            © 2026 Apex Developers. Đồ án CNPM.
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL - AUTH FORMS */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto min-h-screen">
        <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden mt-16 lg:mt-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#28B8FA] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-2xl border border-emerald-100 flex items-center gap-2">
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {errorMsg}
            </div>
          )}

          {/* --- LOGIN VIEW --- */}
          {view === "login" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-slate-800 mb-2">
                  Chào mừng trở lại
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  Đăng nhập để tiếp tục chuỗi thành tích của bạn.
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full mb-6 py-3.5 px-6 bg-white border-2 border-slate-100 hover:border-[#28B8FA]/30 hover:bg-[#EAF7FF] text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 focus:outline-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Tiếp tục với Google
              </button>

              <div className="flex items-center mb-6">
                <div className="grow border-t border-slate-100"></div>
                <span className="px-4 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hoặc email
                </span>
                <div className="grow border-t border-slate-100"></div>
              </div>

              <form className="space-y-4" onSubmit={handleEmailLogin}>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#28B8FA] focus:ring-[#28B8FA]"
                    />
                    <span className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                      Ghi nhớ đăng nhập
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-sm font-bold text-[#28B8FA] hover:text-cyan-600 transition-colors focus:outline-none"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-[#1E293B] hover:bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {isLoading ? "Processing..." : "Sign In"}
                  <ArrowRightIcon />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-medium">
                  Chưa có tài khoản?{" "}
                  <button
                    onClick={() => setView("register")}
                    className="text-[#34D399] font-bold hover:text-emerald-600 transition-colors"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* --- REGISTER VIEW --- */}
          {view === "register" && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 relative z-10">
              <button
                onClick={() => setView("login")}
                className="absolute -top-2 -left-2 p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-xl hover:bg-slate-50"
              >
                <ArrowLeftIcon />
              </button>
              <div className="mb-8 text-center mt-2">
                <h2 className="text-3xl font-black text-slate-800 mb-2">
                  Tạo tài khoản
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  Bắt đầu hành trình để đạt năng suất cao nhất.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleRegister}>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                    <LockIcon />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:bg-white transition-all placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-[#34D399] hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {isLoading ? "Creating..." : "Create Free Account"}
                    <ArrowRightIcon />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- FORGOT PASSWORD VIEW --- */}
          {view === "forgot" && (
            <div className="animate-in fade-in zoom-in-95 duration-500 relative z-10">
              <button
                onClick={() => setView("login")}
                className="absolute -top-2 -left-2 p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-xl hover:bg-slate-50"
              >
                <ArrowLeftIcon />
              </button>
              <div className="mb-10 text-center mt-6">
                <div className="w-16 h-16 bg-[#FFF2DE] rounded-full flex items-center justify-center text-[#FF8B5E] mx-auto mb-6">
                  <LockIcon />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">
                  Quên mật khẩu
                </h2>
                <p className="text-slate-500 text-sm font-medium px-4">
                  Nhập email và chúng tôi sẽ gửi liên kết khôi phục.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <div className="space-y-1">
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                        emailFormatError
                          ? "text-red-400"
                          : "text-slate-400 group-focus-within:text-[#FF8B5E]"
                      }`}
                    >
                      <MailIcon />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // AC3: Xoá lỗi format khi người dùng đang gõ
                        if (emailFormatError) setEmailFormatError("");
                      }}
                      placeholder="Email address"
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:bg-white transition-all placeholder:text-slate-400 ${
                        emailFormatError
                          ? "border-red-300 focus:border-red-400"
                          : "border-slate-200 focus:border-[#FF8B5E]"
                      }`}
                      aria-describedby="email-format-error"
                    />
                  </div>
                  {/* AC3: Inline email format error */}
                  {emailFormatError && (
                    <p
                      id="email-format-error"
                      className="text-xs font-medium text-red-500 pl-1 flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {emailFormatError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-[#FF8B5E] hover:bg-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/30 transition-all disabled:opacity-70"
                >
                  {isLoading ? "Đang gửi..." : "Gửi Link Reset"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
