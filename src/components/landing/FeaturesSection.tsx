"use client";
import React from "react";
import {
  CheckCircleIcon,
  GridIcon,
  ZapIcon,
  UsersIcon,
} from "@/components/icons";

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Everything you need to stay in flow.
        </h2>
        <p className="text-slate-500 font-medium text-lg">
          Powerful features wrapped in an interface you&apos;ll actually enjoy
          using.
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
            Earn XP for completing tasks, unlock badges, and maintain your daily
            streak. Work feels less like a chore and more like a game.
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
  );
}
