import React from "react";

interface DeleteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteMessageModal({ isOpen, onClose, onConfirm }: DeleteMessageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Thu hồi tin nhắn?</h3>
          <p className="text-sm text-slate-500 text-center">
            Bạn có chắc chắn muốn xóa tin nhắn này không? Hành động này sẽ xóa ở cả hai phía và không thể hoàn tác.
          </p>
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <div className="w-px bg-slate-100"></div>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            Xóa tin nhắn
          </button>
        </div>
      </div>
    </div>
  );
}
