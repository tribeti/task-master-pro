import React from "react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md p-8 relative mx-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
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
        <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">
          Xóa dự án
        </h3>
        <p className="text-sm text-slate-500 text-center font-medium mb-8 leading-relaxed">
          Bạn có chắc chắn muốn xóa{" "}
          <span className="font-bold text-slate-700">
            &ldquo;{projectTitle}&rdquo;
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
