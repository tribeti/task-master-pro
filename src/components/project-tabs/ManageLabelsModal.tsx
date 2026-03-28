"use client";

import React, { useState } from "react";
import { XIcon, TrashIcon } from "@/components/icons";
import { Label } from "@/types/project";

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardLabels: Label[];
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onDeleteLabel: (labelId: number) => Promise<void>;
}

// Bảng màu gợi ý sẵn
const PRESET_COLORS = [
  "#FF8B5E", // orange
  "#FF6B6B", // red
  "#FFC300", // yellow
  "#34D399", // green
  "#28B8FA", // cyan
  "#818CF8", // indigo
  "#A78BFA", // violet
  "#F472B6", // pink
  "#64748B", // slate
  "#0EA5E9", // sky blue
  "#10B981", // emerald
  "#F59E0B", // amber
];

export function ManageLabelsModal({
  isOpen,
  onClose,
  boardLabels,
  onCreateLabel,
  onDeleteLabel,
}: ManageLabelsModalProps) {
  const [labelName, setLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [nameError, setNameError] = useState("");

  const handleCreate = async () => {
    const trimmed = labelName.trim();
    if (!trimmed) {
      setNameError("Label name is required.");
      return;
    }
    if (trimmed.length > 50) {
      setNameError("Max 50 characters.");
      return;
    }

    try {
      setIsCreating(true);
      setNameError("");
      await onCreateLabel(trimmed, selectedColor);
      setLabelName("");
      setSelectedColor(PRESET_COLORS[0]);
      setCustomColor(PRESET_COLORS[0]);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (labelId: number) => {
    try {
      setDeletingId(labelId);
      await onDeleteLabel(labelId);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
        >
          <XIcon />
        </button>

        <div className="p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Manage Labels</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Tạo và quản lý nhãn màu cho board này.
            </p>
          </div>

          {/* ── Create new label ── */}
          <div className="bg-slate-50 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Tạo nhãn mới
            </p>

            {/* Label name input */}
            <div>
              <input
                type="text"
                placeholder="Tên nhãn, ví dụ: Bug, Feature..."
                value={labelName}
                onChange={(e) => {
                  setLabelName(e.target.value);
                  if (e.target.value.trim()) setNameError("");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                disabled={isCreating}
                className={`w-full bg-white text-slate-900 px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${
                  nameError
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#28B8FA]"
                }`}
              />
              {nameError && (
                <p className="text-xs text-red-400 font-medium mt-1 ml-1">{nameError}</p>
              )}
            </div>

            {/* Color preview */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Màu nhãn</p>

              {/* Preset colors */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      setCustomColor(color);
                    }}
                    className={`w-7 h-7 rounded-full transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}

                {/* Custom color picker */}
                <label
                  className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center border-2 border-dashed transition-all hover:scale-110 ${
                    !PRESET_COLORS.includes(selectedColor)
                      ? "ring-2 ring-offset-2 ring-slate-400 scale-110 border-transparent"
                      : "border-slate-300"
                  }`}
                  style={{
                    backgroundColor: !PRESET_COLORS.includes(selectedColor)
                      ? selectedColor
                      : "transparent",
                  }}
                  title="Chọn màu tuỳ chỉnh"
                >
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedColor(e.target.value);
                    }}
                    className="sr-only"
                  />
                  {PRESET_COLORS.includes(selectedColor) && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                    </svg>
                  )}
                </label>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="h-[7px] w-16 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-slate-900"
                  style={{ backgroundColor: selectedColor }}
                >
                  {labelName || "Preview"}
                </span>
                <span className="text-xs text-slate-400 font-mono">{selectedColor}</span>
              </div>
            </div>

            {/* Create button */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating || !labelName.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white text-sm font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tạo nhãn
                </>
              )}
            </button>
          </div>

          {/* ── Existing labels list ── */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
              Nhãn hiện có ({boardLabels.length})
            </p>

            {boardLabels.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">
                Chưa có nhãn nào. Hãy tạo nhãn đầu tiên!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {boardLabels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl"
                  >
                    {/* Color stripe preview */}
                    <div
                      className="w-8 h-[7px] rounded-full shrink-0"
                      style={{ backgroundColor: label.color_hex }}
                    />
                    {/* Label name badge */}
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-slate-900 shrink-0"
                      style={{ backgroundColor: label.color_hex }}
                    >
                      {label.name}
                    </span>
                    {/* Hex code */}
                    <span className="text-xs text-slate-400 font-mono flex-1">
                      {label.color_hex}
                    </span>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      disabled={deletingId === label.id}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                      title="Xóa nhãn"
                    >
                      {deletingId === label.id ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
                      ) : (
                        <TrashIcon />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
