"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BoltIcon,
  GridIcon,
  CheckIcon,
  ZapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UsersIcon,
  FlameIcon,
  TrophyIcon,
} from "@/components/icons";

export default function TaskMasterLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden selection:bg-[#28B8FA] selection:text-white">
      {/* --- BACKGROUND PATTERN --- */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-[#28B8FA] opacity-[0.08] blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* --- NAVBAR --- */}
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
              Features
            </a>
            <a
              href="#gamification"
              className="hover:text-slate-900 transition-colors"
            >
              Gamification
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="hidden sm:block font-bold text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-[#1E293B] hover:bg-slate-800 transition-transform hover:scale-105 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-slate-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-20">
        {/* --- HERO SECTION --- */}
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
            <strong className="text-slate-800">gamification</strong> to turn
            your daily workflow into a rewarding experience. Build streaks, earn
            XP, and get things done.
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
            <div className="absolute -left-4 sm:-left-12 top-10 bg-white p-6 rounded-4xl shadow-xl border border-slate-100 animate-[floatUp_4s_ease-in-out_infinite_alternate]">
              <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2">
                Deep Focus
              </h3>
              <div className="text-4xl font-black text-[#28B8FA] tracking-tighter mb-4">
                24:00
              </div>
              <div className="w-32 h-10 bg-slate-100 rounded-xl"></div>
            </div>

            {/* Floating Widget 2: Gamification XP */}
            <div className="absolute -right-4 sm:-right-12 bottom-20 bg-gradient-to-br from-[#FF8B5E] to-[#FF6B3E] p-6 rounded-4xl shadow-xl shadow-orange-200 text-white animate-[floatUp_5s_ease-in-out_infinite_alternate_reverse]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <ZapIcon />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/80">
                    Current Streak
                  </p>
                  <p className="text-3xl font-black tracking-tighter">
                    12 Days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES BENTO GRID --- */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Everything you need to stay in flow.
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Powerful features wrapped in an interface you&apos;ll actually
              enjoy using.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Gamification */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#34D399] opacity-10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-[#D1FAE5] rounded-2xl flex items-center justify-center mb-6">
                <CheckCircleIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Gamified Productivity
              </h3>
              <p className="text-slate-500 font-medium max-w-md mb-8">
                Earn XP for completing tasks, unlock badges, and maintain your
                daily streak. Work feels less like a chore and more like a game.
              </p>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-max">
                <div className="w-12 h-12 rounded-full bg-[#34D399] flex items-center justify-center shadow-md shadow-emerald-200">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 line-through opacity-60">
                    Morning Calibration
                  </h4>
                  <div className="text-xs font-bold text-[#10B981] bg-[#D1FAE5] px-2 py-0.5 rounded-full w-max mt-1">
                    +50 XP Earned
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Kanban Boards */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#28B8FA] opacity-10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-[#EAF7FF] rounded-2xl flex items-center justify-center mb-6">
                <GridIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Visual Kanban
              </h3>
              <p className="text-slate-500 font-medium">
                Drag and drop your way to a clearer mind. Intuitive boards that
                adapt to your workflow.
              </p>
            </div>

            {/* Feature 3: Deep Focus Timer */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8B5E] opacity-10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-[#FFF2DE] rounded-2xl flex items-center justify-center mb-6">
                <ZapIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Deep Focus Mode
              </h3>
              <p className="text-slate-500 font-medium">
                Built-in Pomodoro timers to help you reach the peak flow state
                without leaving the app.
              </p>
            </div>

            {/* Feature 4: Collaboration */}
            <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-10 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <UsersIcon />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Seamless Collaboration
              </h3>
              <p className="text-slate-500 font-medium max-w-md mb-8">
                Invite members, assign tasks, and monitor team workload in
                real-time. Built for high-performing teams.
              </p>

              <div className="flex -space-x-4">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex"
                  alt="U"
                  className="w-16 h-16 rounded-full bg-slate-800 border-4 border-white shadow-md z-30"
                />
                <div className="w-16 h-16 rounded-full bg-[#FFF2DE] border-4 border-white shadow-md flex items-center justify-center font-black text-xl text-[#FF8B5E] z-20">
                  JD
                </div>
                <div className="w-16 h-16 rounded-full bg-[#D1FAE5] border-4 border-white shadow-md flex items-center justify-center font-black text-xl text-[#34D399] z-10">
                  MK
                </div>
                <div className="w-16 h-16 rounded-full bg-white border-4 border-slate-100 shadow-md flex items-center justify-center font-bold text-slate-400 z-0 hover:bg-slate-50 cursor-pointer">
                  +
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- NEW: GAMIFICATION DEEP DIVE --- */}
        <section id="gamification" className="max-w-7xl mx-auto px-6 py-24">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col lg:flex-row items-center">
            {/* Visual Side */}
            <div className="w-full lg:w-1/2 p-10 lg:p-16 bg-[#F8FAFC] relative overflow-hidden flex items-center justify-center min-h-[400px]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8B5E] opacity-10 blur-[100px] rounded-full"></div>

              <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
                {/* Profile Level Card */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 transform -rotate-2 hover:rotate-0 transition-transform">
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex"
                      alt="Avatar"
                      className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-100"
                    />
                    <div>
                      <h4 className="font-black text-xl text-slate-800">
                        Alex Morgan
                      </h4>
                      <p className="text-sm font-bold text-[#FF8B5E]">
                        Level 12 Workflow Master
                      </p>
                    </div>
                  </div>
                  <div className="w-full">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>XP Progress</span>
                      <span>2,450 / 3,000</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#FF8B5E] to-[#FF6B3E] w-[80%] h-full rounded-full relative">
                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Streaks & Badges */}
                <div className="flex gap-4 transform translate-x-8 hover:translate-x-4 transition-transform">
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#FFF2DE] rounded-full flex items-center justify-center mb-2">
                      <FlameIcon />
                    </div>
                    <span className="font-black text-2xl text-slate-800">
                      14
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Day Streak
                    </span>
                  </div>
                  <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
                      <TrophyIcon />
                    </div>
                    <span className="font-black text-2xl text-slate-800">
                      6
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Badges Won
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Side */}
            <div className="w-full lg:w-1/2 p-10 lg:p-16 lg:pl-20">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
                Work should feel rewarding.
              </h2>
              <p className="text-lg text-slate-500 font-medium mb-8">
                We've combined proven productivity frameworks with game design
                mechanics. Stay motivated by leveling up your profile,
                maintaining daily streaks, and earning badges for completing
                tough projects.
              </p>
              <ul className="flex flex-col gap-5">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#EAF7FF] flex items-center justify-center shrink-0 mt-1">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      XP for every task
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">
                      Big tasks yield big rewards. Watch your level climb as you
                      clear your Kanban board.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2DE] flex items-center justify-center shrink-0 mt-1">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      Unbreakable Streaks
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">
                      Complete at least one task a day to keep your fire
                      burning. Don't break the chain.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center shrink-0 mt-1">
                    <CheckIcon />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      Unlockable Badges
                    </h4>
                    <p className="text-slate-500 text-sm font-medium">
                      Earn unique badges for special achievements like "Deep
                      Work Master" or "Early Bird".
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- NEW: PRICING SECTION --- */}
        <section
          id="pricing"
          className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/60"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Start for free, upgrade when your team grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: Starter (Free) */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Starter</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">
                Perfect for individuals wanting to level up.
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-slate-900">$0</span>
                <span className="text-slate-500 font-bold">/ forever</span>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 rounded-2xl transition-colors mb-8"
              >
                Get Started Free
              </button>
              <ul className="flex flex-col gap-4 text-sm font-medium text-slate-600">
                <li className="flex items-center gap-3">
                  <CheckIcon /> 3 Active Projects
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Basic Kanban Boards
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Standard Focus Timer
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Personal Gamification Profile
                </li>
              </ul>
            </div>

            {/* Card 2: Peak Flow (Pro) - Highlighted */}
            <div className="bg-[#1E293B] rounded-[2.5rem] p-10 border border-[#28B8FA]/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#28B8FA]/10 to-[#34D399]/10 pointer-events-none"></div>
              <div className="absolute top-6 right-6 bg-gradient-to-r from-[#28B8FA] to-[#34D399] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md">
                Most Popular
              </div>

              <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                Peak Flow Pro
              </h3>
              <p className="text-sm font-medium text-slate-400 mb-6 relative z-10">
                For power users and high-performing teams.
              </p>
              <div className="flex items-baseline gap-1 mb-8 relative z-10">
                <span className="text-5xl font-black text-white">$9</span>
                <span className="text-slate-400 font-bold">/ user / month</span>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-[#34D399] hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-colors mb-8 relative z-10"
              >
                Start 14-Day Free Trial
              </button>
              <ul className="flex flex-col gap-4 text-sm font-medium text-slate-300 relative z-10">
                <li className="flex items-center gap-3">
                  <CheckIcon />{" "}
                  <strong className="text-white">Unlimited</strong> Projects &
                  Tasks
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Team Collaboration & Chat
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Advanced Gamification Insights
                </li>
                <li className="flex items-center gap-3">
                  <CheckIcon /> Priority Support
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* --- BOTTOM CTA (Dark Mode) --- */}
        <section className="max-w-7xl mx-auto px-6 mt-10">
          <div className="bg-[#1E293B] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#28B8FA]/20 to-[#34D399]/20 z-0 mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#34D399] opacity-20 blur-[100px] rounded-full z-0"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#28B8FA] opacity-20 blur-[100px] rounded-full z-0"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                Ready to level up your work?
              </h2>
              <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto mb-10">
                Join Task Master Pro today and experience the future of project
                management. Free for individuals and small teams.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="bg-[#34D399] hover:bg-emerald-400 transition-transform hover:scale-105 text-white font-bold text-lg px-10 py-5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mx-auto"
              >
                Create Free Account <ArrowRightIcon />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200/60 bg-white mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 opacity-50 grayscale">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <BoltIcon />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 italic">
              TASKMASTER PRO
            </span>
          </div>
          <p className="text-slate-400 font-medium text-sm">
            © 2026 Apex Developers. Built for peak productivity.
          </p>
        </div>
      </footer>

      {/* --- CSS ANIMATIONS --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes floatUp {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-20px); }
        }
      `,
        }}
      />
    </div>
  );
}
