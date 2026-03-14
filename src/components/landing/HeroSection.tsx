"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ZapIcon } from "@/components/icons";

export default function HeroSection() {
  const router = useRouter();
  return (
    <section className="max-w-7xl mx-auto px-6 pt-12 pb-24 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
        <span className="text-xs font-bold text-slate-600 tracking-widest uppercase">
          Task Master Pro 2.0 is live
        </span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
        Crush your tasks. <br className="hidden md:block" />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#28B8FA] via-[#34D399] to-[#34D399]">
          Achieve peak state.
        </span>
      </h1>

      <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        The first project management tool that uses{" "}
        <strong className="text-slate-800">gamification</strong> to turn your
        daily workflow into a rewarding experience. Build streaks, earn XP, and
        get things done.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
        <button
          onClick={() => router.push("/login")}
          className="w-full sm:w-auto bg-[#34D399] hover:bg-emerald-500 transition-all hover:scale-105 text-white font-bold text-lg px-8 py-4 rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
        >
          Start Free Trial <ArrowRightIcon />
        </button>
        <button
          onClick={() => router.push("/login")}
          className="w-full sm:w-auto bg-white hover:bg-slate-50 transition-colors text-slate-700 font-bold text-lg px-8 py-4 rounded-full shadow-sm border border-slate-200 flex items-center justify-center gap-2"
        >
          View Demo
        </button>
      </div>

      {/* Floating UI Elements (Hero Graphic) */}
      <div className="relative mt-24 max-w-4xl mx-auto h-100 sm:h-125 w-full animate-in fade-in zoom-in duration-1000 delay-300">
        {/* Main App Window Mockup */}
        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="h-1.5 w-full bg-linear-to-r from-[#28B8FA] to-[#34D399]"></div>
          <div className="p-8 flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')]">
            <div className="flex gap-6">
              <div className="w-1/3 h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4">
                <div className="w-1/2 h-4 bg-slate-200 rounded-full mb-4"></div>
                <div className="w-full h-24 bg-white rounded-xl shadow-sm mb-3"></div>
                <div className="w-full h-24 bg-white rounded-xl shadow-sm"></div>
              </div>
              <div className="w-1/3 h-64 bg-[#EAF7FF] rounded-2xl border-2 border-dashed border-[#28B8FA]/30 p-4">
                <div className="w-1/2 h-4 bg-[#28B8FA] rounded-full mb-4 opacity-50"></div>
                <div className="w-full h-24 bg-white rounded-xl shadow-sm border-l-4 border-[#28B8FA]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Widget 1: Focus Timer */}
        <div className="absolute -left-4 sm:-left-12 top-10 bg-white p-6 rounded-4xl shadow-xl border border-slate-100 animate-[floatUpBounce_4s_ease-in-out_infinite_alternate]">
          <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">
            Deep Focus
          </h3>
          <div className="text-4xl font-black text-[#28B8FA] tracking-tighter mb-4">
            24:00
          </div>
          <div className="w-32 h-10 bg-slate-100 rounded-xl"></div>
        </div>

        {/* Floating Widget 2: Gamification XP */}
        <div className="absolute -right-4 sm:-right-12 bottom-20 bg-gradient-to-br from-[#FF8B5E] to-[#FF6B3E] p-6 rounded-4xl shadow-xl shadow-orange-200 text-white animate-[floatUpBounce_5s_ease-in-out_infinite_alternate_reverse]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ZapIcon />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white/80">
                Current Streak
              </p>
              <p className="text-3xl font-black tracking-tighter">12 Days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
