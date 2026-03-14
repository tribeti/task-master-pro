import React from "react";
import { FilterIcon, CalendarIcon } from "@/components/icons";

export function TimelineTab() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-4xl border border-slate-100 shadow-sm mt-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=A"
              alt="U"
              className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"
            />
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=B"
              alt="U"
              className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white"
            />
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=C"
              alt="U"
              className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white opacity-50"
            />
            <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
              +4
            </div>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <FilterIcon /> Filter
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <CalendarIcon /> Month
          </button>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <button className="text-slate-400 hover:text-slate-800">&lt;</button>
          <span className="font-bold text-sm text-slate-800">October 2023</span>
          <button className="text-slate-400 hover:text-slate-800">&gt;</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex">
        <div className="w-64 shrink-0 border-r border-slate-100 bg-white z-10">
          <div className="h-14 flex items-center px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b border-slate-100">
            Task Name
          </div>
          <div className="flex flex-col">
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FF8B5E] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">
                UI High Fidelity
              </h4>
              <p className="text-xs text-slate-400">Design System</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#28B8FA] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">
                API Integration
              </h4>
              <p className="text-xs text-slate-400">Backend</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#34D399] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">User Testing</h4>
              <p className="text-xs text-slate-400">QA Phase</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-400 rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">Final Review</h4>
              <p className="text-xs text-slate-400">Stakeholders</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-300 rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">Asset Prep</h4>
              <p className="text-xs text-slate-400">Marketing</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] relative">
          <div className="h-14 flex border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            {[
              "MON 16",
              "TUE 17",
              "WED 18",
              "THU 19",
              "FRI 20",
              "SAT 21",
              "SUN 22",
            ].map((day, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-center border-r border-slate-100"
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${i === 1 ? "text-[#28B8FA]" : "text-slate-400"}`}
                >
                  {day.split(" ")[0]}
                </span>
                <span
                  className={`text-sm font-black ${i === 1 ? "text-[#28B8FA]" : "text-slate-800"}`}
                >
                  {day.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-[15%] w-px bg-[#28B8FA] z-20">
            <div className="w-2 h-2 bg-[#28B8FA] rounded-full absolute -top-1 -left-[3.5px]"></div>
          </div>

          <div className="relative h-25">
            <div className="absolute top-5 left-[5%] w-[25%] h-10 bg-linear-to-r from-[#FF8B5E] to-[#FF6B3E] rounded-full shadow-md shadow-orange-200 flex items-center px-1 z-10">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=A"
                alt=""
                className="w-8 h-8 rounded-full bg-white/20"
              />
              <span className="text-white text-xs font-bold ml-2">
                3 days left
              </span>
            </div>
            <div className="absolute top-25 left-[15%] w-[40%] h-10 bg-[#28B8FA] rounded-full shadow-md shadow-cyan-200 flex items-center justify-between px-4 z-10">
              <span className="text-white text-xs font-bold flex items-center gap-1">
                <span className="opacity-50">&lt;&gt;</span> In Progress
              </span>
              <span className="text-white/80 text-[10px] font-bold">45%</span>
            </div>
            <div className="absolute top-45 left-[45%] w-[25%] h-10 bg-[#34D399] rounded-full shadow-md shadow-emerald-200 flex items-center px-1 z-10">
              <div className="flex -space-x-2">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=X"
                  alt=""
                  className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]"
                />
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Y"
                  alt=""
                  className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]"
                />
              </div>
            </div>
            <div className="absolute top-65 left-[60%] w-[12%] h-10 bg-indigo-300 rounded-full flex items-center justify-center z-10 opacity-70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="absolute top-85 left-[5%] w-[15%] h-10 bg-slate-200 rounded-full flex items-center justify-center z-10">
              <span className="text-slate-500 text-xs font-bold flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>{" "}
                Done
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
