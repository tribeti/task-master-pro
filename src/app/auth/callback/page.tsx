"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let hasNavigated = false;
    const timeout = setTimeout(() => {
      if (!hasNavigated) {
        router.push("/command");
      }
    }, 3000);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" && !hasNavigated) {
        hasNavigated = true;
        clearTimeout(timeout);
        router.push("/command");
      } else if (event === "PASSWORD_RECOVERY" && !hasNavigated) {
        hasNavigated = true;
        clearTimeout(timeout);
        router.push("/auth/reset-password");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#28B8FA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Đang xác thực...
        </h2>
        <p className="text-slate-500 font-medium">
          Vui lòng chờ trong giây lát để hệ thống tự động đăng nhập.
        </p>
      </div>
    </div>
  );
}
