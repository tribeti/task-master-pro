"use client";
import React from "react";
import { FlameIcon, TrophyIcon, CheckIcon } from "@/components/icons";

export default function GamificationSection() {
  return (
    <section id="gamification" className="max-w-7xl mx-auto px-6 py-24">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col lg:flex-row items-center">
        {/* Visual Side */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 bg-[#F8FAFC] relative overflow-hidden flex items-center justify-center min-h-100">
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
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-size[20px_20px] animate-[pulse_2s_linear_infinite]"></div>
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
                <span className="font-black text-2xl text-slate-800">14</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Chuỗi ngày
                </span>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-2">
                  <TrophyIcon />
                </div>
                <span className="font-black text-2xl text-slate-800">6</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Huy hiệu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Side */}
        <div className="w-full lg:w-1/2 p-10 lg:p-16 lg:pl-20">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">
            Làm việc nên có cảm giác thú vị.
          </h2>
          <p className="text-lg text-slate-500 font-medium mb-8">
            Chúng tôi đã kết hợp các phương pháp năng suất đã được chứng minh
            với các cơ chế thiết kế trò chơi. Giữ động lực bằng cách nâng cấp
            hồ sơ của bạn, duy trì chuỗi ngày và kiếm huy hiệu khi hoàn thành
            các dự án khó.
          </p>
          <ul className="flex flex-col gap-5">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#EAF7FF] flex items-center justify-center shrink-0 mt-1">
                <CheckIcon />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  XP cho mỗi nhiệm vụ
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Nhiệm vụ lớn mang lại phần thưởng lớn. Hãy xem cấp độ của bạn
                  tăng lên khi bạn hoàn thành bảng Kanban của mình.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FFF2DE] flex items-center justify-center shrink-0 mt-1">
                <CheckIcon />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  Chuỗi ngày không thể phá vỡ
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Hoàn thành ít nhất một nhiệm vụ mỗi ngày để giữ cho ngọn lửa
                  của bạn cháy. Đừng phá vỡ chuỗi.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center shrink-0 mt-1">
                <CheckIcon />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  Huy hiệu có thể mở khóa
                </h4>
                <p className="text-slate-500 text-sm font-medium">
                  Kiếm huy hiệu độc đáo cho các thành tích đặc biệt như "Bậc
                  thầy làm việc sâu" hoặc "Chim sớm".
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
