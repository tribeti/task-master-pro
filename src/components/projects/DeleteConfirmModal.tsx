import React from "react";
import { useDashboardUser } from "@/app/(dashboard)/provider";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectTitle: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
}: DeleteConfirmModalProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 ${
      isCozy ? "bg-slate-950/60" : "bg-slate-900/40"
    }`}>
      <div className={`rounded-4xl shadow-2xl w-full max-w-md p-8 relative mx-4 animate-in zoom-in-95 duration-200 transition-colors duration-500 ${
        isCozy ? "bg-[#0F172A] border border-slate-800" : "bg-white"
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          isCozy ? "bg-red-950/20" : "bg-red-50"
        }`}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <h3 className={`text-xl font-extrabold text-center mb-2 ${isCozy ? "text-white" : "text-slate-900"}`}>
          Xóa dự án
        </h3>
        <p className={`text-sm text-center font-medium mb-8 leading-relaxed ${isCozy ? "text-slate-400" : "text-slate-500"}`}>
          Bạn có chắc chắn muốn xóa{" "}
          <span className={`font-bold ${isCozy ? "text-white" : "text-slate-700"}`}>
            &ldquo;{projectTitle}&rdquo;
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors border-2 ${
              isCozy 
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800" 
                : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all ${
              isCozy 
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-950/40" 
                : "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
            }`}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
