import React from "react";
import { FILES } from "@/lib/constants";
import {
  UploadCloudIcon,
  SearchIcon,
  FilterIcon,
  SortIcon,
} from "@/components/icons";

export function FilesTab() {
  return (
    <div className="flex-1 flex flex-col mt-4">
      <div className="w-full bg-white border-2 border-dashed border-[#28B8FA]/30 rounded-4xl h-40 flex flex-col items-center justify-center mb-8 cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-[#EAF7FF] flex items-center justify-center mb-2">
          <UploadCloudIcon />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Drop files here to upload
        </h3>
        <p className="text-sm text-slate-400 font-medium">
          or{" "}
          <span className="text-[#28B8FA] underline decoration-dashed">
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
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm">
            <FilterIcon /> Filter
          </button>
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm">
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
            <h4 className="font-bold text-sm text-slate-800 truncate">
              {file.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase mt-1">
              <span>{file.size}</span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span>{file.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
