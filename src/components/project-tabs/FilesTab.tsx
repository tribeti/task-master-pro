import React from "react";
import { FILES } from "@/lib/constants";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import {
  UploadCloudIcon,
  SearchIcon,
  FilterIcon,
  SortIcon,
} from "@/components/icons";

export function FilesTab() {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  return (
    <div className="flex-1 flex flex-col mt-4">
      <div className={`w-full border-2 border-dashed rounded-4xl h-40 flex flex-col items-center justify-center mb-8 cursor-pointer transition-all ${
        isCozy 
          ? "bg-slate-900/30 border-slate-800 hover:bg-slate-900/50 hover:border-[#FF8B5E]/50" 
          : "bg-white border-[#28B8FA]/30 hover:bg-slate-50"
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
          isCozy ? "bg-slate-800 text-[#FF8B5E]" : "bg-[#EAF7FF] text-[#28B8FA]"
        }`}>
          <UploadCloudIcon />
        </div>
        <h3 className={`text-lg font-bold ${isCozy ? "text-white" : "text-slate-800"}`}>
          Drop files here to upload
        </h3>
        <p className={`text-sm font-medium ${isCozy ? "text-slate-500" : "text-slate-400"}`}>
          or{" "}
          <span className={`underline decoration-dashed ${isCozy ? "text-[#FF8B5E]" : "text-[#28B8FA]"}`}>
            browse files
          </span>{" "}
          from your computer
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            className={`w-full border rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none transition-all shadow-sm ${
              isCozy 
                ? "bg-slate-900 border-slate-800 text-white placeholder-slate-700 focus:border-[#FF8B5E]" 
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#28B8FA]"
            }`}
          />
        </div>
        <div className="flex gap-3">
          <button className={`px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm border ${
            isCozy 
              ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}>
            <FilterIcon /> Filter
          </button>
          <button className={`px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-sm border ${
            isCozy 
              ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}>
            <SortIcon /> Sort
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20 overflow-y-auto">
        {FILES.map((file) => (
          <div key={file.id} className="group cursor-pointer">
            <div
              className={`aspect-square rounded-3xl ${file.color} flex items-center justify-center mb-3 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all relative overflow-hidden`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={file.iconColor || "text-white"}
              >
                <path d={file.icon}></path>
              </svg>
            </div>
            <h4 className={`font-bold text-sm truncate ${isCozy ? "text-slate-200" : "text-slate-800"}`}>
              {file.title}
            </h4>
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase mt-1 ${isCozy ? "text-slate-600" : "text-slate-400"}`}>
              <span>{file.size}</span>
              <div className={`w-1 h-1 rounded-full ${isCozy ? "bg-slate-800" : "bg-slate-300"}`}></div>
              <span>{file.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
