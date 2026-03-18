"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { LockIcon, ArrowRightIcon } from "@/components/icons";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 6, label: "Ít nhất 6 ký tự" },
  { test: (p: string) => /[0-9]/.test(p), label: "Ít nhất 1 chữ số" },
];

function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Mật khẩu cần: ${rule.label}`;
    }
  }
  return null;
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setIsSessionReady(true);
      }
    });
  }, [router, supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp. Vui lòng thử lại.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(
        "Không thể đổi mật khẩu. Vui lòng thử lại hoặc yêu cầu link mới.",
      );
      console.error("resetPassword error:", error.message);
    } else {
      setSuccessMsg("Mật khẩu đã được đổi thành công! Đang chuyển hướng...");
      setTimeout(() => router.push("/command"), 2000);
    }
    setIsLoading(false);
  };

  if (!isSessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#28B8FA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#28B8FA] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="flex justify-center mb-6">
          <Logo isDarkTheme={false} />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#EAF7FF] rounded-full flex items-center justify-center text-[#28B8FA] mx-auto mb-4">
            <LockIcon />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">
            Đặt Mật Khẩu Mới
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-2xl border border-emerald-100 flex items-center gap-2">
            ✓ {successMsg}
          </div>
        )}

        {/* Error message */}
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

        {/* Form */}
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
              <LockIcon />
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:bg-white transition-all placeholder:text-slate-400"
              required
            />
          </div>

          {/* Password requirements hint */}
          <div className="px-1 space-y-1">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(newPassword);
              return (
                <div
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                    newPassword.length === 0
                      ? "text-slate-300"
                      : passed
                        ? "text-emerald-500"
                        : "text-red-400"
                  }`}
                >
                  <span>{passed ? "✓" : "○"}</span>
                  {rule.label}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full py-4 px-6 bg-[#1E293B] hover:bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? "Đang lưu..." : "Cập Nhật Mật Khẩu"}
              <ArrowRightIcon />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
