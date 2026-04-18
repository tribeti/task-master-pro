"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";

export default function PricingSection() {
  const router = useRouter();
  return (
    <section
      id="pricing"
      className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/60"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Giá cả hợp lý, minh bạch.
        </h2>
        <p className="text-slate-500 font-medium text-lg">
          Bắt đầu miễn phí, nâng cấp khi nhóm của bạn phát triển.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Card 1: Starter (Free) */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Starter</h3>
          <p className="text-sm font-medium text-slate-500 mb-6">
            Hoàn hảo cho cá nhân muốn nâng cao kỹ năng.
          </p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-5xl font-black text-slate-900">$0</span>
            <span className="text-slate-500 font-bold">/ forever</span>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 rounded-2xl transition-colors mb-8"
          >
            Bắt đầu miễn phí
          </button>
          <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
            <li className="flex items-center gap-3">
              <CheckIcon /> 3 Dự án hoạt động
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Bảng Kanban cơ bản
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Đồng hồ bấm giờ tiêu chuẩn
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Hồ sơ gamification cá nhân
            </li>
          </ul>
        </div>

        {/* Card 2: Peak Flow (Pro) - Highlighted */}
        <div className="bg-[#1E293B] rounded-[2.5rem] p-10 border border-[#28B8FA]/30 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#28B8FA]/10 to-[#34D399]/10 pointer-events-none"></div>
          <div className="absolute top-6 right-6 bg-gradient-to-r from-[#28B8FA] to-[#34D399] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
            Phổ biến nhất
          </div>

          <h3 className="text-xl font-bold text-white mb-2 relative z-10">
            Peak Flow Pro
          </h3>
          <p className="text-sm font-medium text-slate-400 mb-6 relative z-10">
            Dành cho người dùng chuyên nghiệp và các nhóm có hiệu suất cao.
          </p>
          <div className="flex items-baseline gap-1 mb-8 relative z-10">
            <span className="text-5xl font-black text-white">$9</span>
            <span className="text-slate-400 font-bold">/ người / Tháng</span>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#34D399] hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-colors mb-8 relative z-10"
          >
            Bắt đầu 14 ngày dùng thử
          </button>
          <ul className="flex flex-col gap-4 text-sm font-medium text-slate-300 relative z-10">
            <li className="flex items-center gap-3">
              <CheckIcon /> <strong className="text-white">Không giới hạn</strong>{" "}
              Dự án & Nhiệm vụ
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Cộng tác nhóm & Trò chuyện
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Phân tích gamification nâng cao
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon /> Hỗ trợ ưu tiên
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
