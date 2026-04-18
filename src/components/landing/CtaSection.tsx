"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";

export default function CtaSection() {
  const router = useRouter();
  return (
    <section className="max-w-7xl mx-auto px-6 mt-10">
      <div className="bg-[#1E293B] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#28B8FA]/20 to-[#34D399]/20 z-0 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#34D399] opacity-20 blur-[100px] rounded-full z-0"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#28B8FA] opacity-20 blur-[100px] rounded-full z-0"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Bắt đầu nâng cấp cách làm việc của bạn chưa?
          </h2>
          <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto mb-10">
            Tham gia Task Master Pro ngay hôm nay và trải nghiệm tương lai của
            quản lý dự án. Miễn phí cho cá nhân và nhóm nhỏ.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#34D399] hover:bg-emerald-400 transition-transform hover:scale-105 text-white font-bold text-lg px-10 py-5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto"
          >
            Tạo tài khoản miễn phí <ArrowRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
