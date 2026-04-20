import React from "react";
import { BoltIcon } from "@/components/icons";

export default function Footer() {
  return (
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
          © 2026 Apex Developers. Được xây dựng cho năng suất cao nhất.
        </p>
      </div>
    </footer>
  );
}
