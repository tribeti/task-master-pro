"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { BoltIcon } from "@/components/icons";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F8FAFC]/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="mx-auto px-6 h-20 flex items-center justify-between">
        {/* LOGO CHUẨN TASKMASTER PRO */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-md shadow-cyan-500/30 transition-transform group-hover:scale-105">
            <BoltIcon />
          </div>
          <div className="flex items-center gap-1.5 focus:outline-none">
            <span className="font-black text-xl tracking-tight text-slate-900 italic">
              TASKMASTER
            </span>
            <span className="font-bold text-slate-900 italic text-[10px] tracking-widest bg-gradient-to-br from-cyan-300 to-[#28B8FA] px-1.5 py-0.5 rounded-md shadow-sm">
              PRO
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-500">
          <a
            href="#features"
            className="hover:text-slate-900 transition-colors"
          >
            Tính năng
          </a>
          <a
            href="#gamification"
            className="hover:text-slate-900 transition-colors"
          >
            Gamification
          </a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">
            Giá
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/login")}
            className="hidden sm:block font-bold text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => router.push("/login")}
            className="bg-[#1E293B] hover:bg-slate-800 transition-transform hover:scale-105 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-slate-300"
          >
            Bắt đầu
          </button>
        </div>
      </div>
    </nav>
  );
}
