import React, { useState } from "react";
import {
  XIcon,
  BriefcaseIcon,
  UserIcon,
  ZapIcon,
  CheckIcon,
} from "@/components/icons";
import { useDashboardUser } from "@/app/(dashboard)/provider";

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickEntryModal({ isOpen, onClose }: QuickEntryModalProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleClose = () => {
    onClose();
    setSelectedTags([]);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 ${
      isCozy ? "bg-slate-950/60" : "bg-slate-900/40"
    }`}>
      <div className={`rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-2 relative mx-4 animate-in zoom-in-95 duration-200 transition-colors duration-500 ${
        isCozy ? "bg-[#0F172A] border border-slate-800" : "bg-white"
      }`}>
        <button
          onClick={handleClose}
          className={`absolute top-6 right-6 transition-colors p-1 rounded-full ${
            isCozy ? "text-slate-500 hover:text-white bg-slate-800" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <XIcon />
        </button>
        <div className="p-8 flex flex-col gap-8">
          <input
            type="text"
            placeholder="Bạn đang nghĩ gì?"
            className={`text-3xl md:text-4xl font-extrabold placeholder-slate-300 bg-transparent border-none outline-none w-[90%] ${
              isCozy ? "text-white" : "text-slate-800"
            }`}
            autoFocus
            required
            maxLength={200}
          />
          <div className="flex items-center justify-between mt-4 h-24">
            <div className="flex items-center gap-3">
              {selectedTags.length > 0 && (
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mr-2">
                  Gắn thẻ nhanh:
                </span>
              )}
              {[
                {
                  label: "Công việc",
                  icon: <BriefcaseIcon />,
                  active: isCozy ? "bg-cyan-950/40 text-[#28B8FA] border-[#28B8FA]/30" : "bg-[#EAF7FF] text-[#28B8FA]",
                },
                {
                  label: "Cá nhân",
                  icon: <UserIcon />,
                  active: isCozy ? "bg-emerald-950/40 text-[#34D399] border-[#34D399]/30" : "bg-[#D1FAE5] text-[#34D399]",
                },
                {
                  label: "Khẩn cấp",
                  icon: <ZapIcon />,
                  active: isCozy ? "bg-orange-950/40 text-[#FF8B5E] border-[#FF8B5E]/30" : "bg-[#FFF2DE] text-[#FF8B5E]",
                },
              ].map(({ label, icon, active }) => (
                <button
                  key={label}
                  onClick={() => toggleTag(label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedTags.includes(label)
                    ? active
                    : (isCozy ? "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700" : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100")
                    }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              {selectedTags.length === 0 ? (
                <button className={`hover:bg-emerald-500 transition-colors text-white font-bold rounded-4xl w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg ${
                  isCozy ? "bg-emerald-600 shadow-emerald-950/40" : "bg-[#34D399] shadow-emerald-200"
                }`}>
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  Tạo nhiệm vụ
                </button>
              ) : (
                <button className={`hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-right-4 ${
                  isCozy ? "bg-[#FF8B5E] shadow-orange-950/40" : "bg-[#FF8B5E] shadow-orange-200"
                }`}>
                  Thêm nhiệm vụ{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
