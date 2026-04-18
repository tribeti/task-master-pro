"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/types/project";

const INLINE_LABEL_PRESET_COLORS = [
  "#FF8B5E",
  "#FF6B6B",
  "#FFC300",
  "#34D399",
  "#28B8FA",
  "#818CF8",
];

interface TaskLabelsProps {
  taskId: number;
  taskLabels: Label[];
  availableLabels: Label[];
  isSubmitting: boolean;
  onAddLabel: (taskId: number, labelId: number) => Promise<void>;
  onRemoveLabel: (taskId: number, labelId: number) => Promise<void>;
  onCreateAndAssignLabel: (
    taskId: number,
    name: string,
    color: string,
  ) => Promise<Label>;
}

export function TaskLabels({
  taskId,
  taskLabels,
  availableLabels,
  isSubmitting,
  onAddLabel,
  onRemoveLabel,
  onCreateAndAssignLabel,
}: TaskLabelsProps) {
  const [selectedLabelId, setSelectedLabelId] = useState<number | "">("");
  const [labelSubmitting, setLabelSubmitting] = useState(false);
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [customLabelName, setCustomLabelName] = useState("");
  const [customLabelColor, setCustomLabelColor] = useState(
    INLINE_LABEL_PRESET_COLORS[0],
  );
  const [customLabelError, setCustomLabelError] = useState("");

  // Reset local state when taskId changes (modal opened for different task)
  useEffect(() => {
    setSelectedLabelId("");
    setShowCreateLabelForm(false);
    setCustomLabelName("");
    setCustomLabelColor(INLINE_LABEL_PRESET_COLORS[0]);
    setCustomLabelError("");
  }, [taskId]);

  const handleAddLabelClick = async () => {
    if (!selectedLabelId) return;

    try {
      setLabelSubmitting(true);
      await onAddLabel(taskId, Number(selectedLabelId));
      setSelectedLabelId("");
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleRemoveLabelClick = async (labelId: number) => {
    try {
      setLabelSubmitting(true);
      await onRemoveLabel(taskId, labelId);
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleCreateCustomLabelClick = async () => {
    if (labelSubmitting) return;

    const trimmedName = customLabelName.trim();
    if (!trimmedName) {
      setCustomLabelError("Label name is required.");
      return;
    }

    if (trimmedName.length > 50) {
      setCustomLabelError("Max 50 characters.");
      return;
    }

    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(customLabelColor)) {
      setCustomLabelError("Invalid color format.");
      return;
    }

    try {
      setLabelSubmitting(true);
      setCustomLabelError("");
      await onCreateAndAssignLabel(taskId, trimmedName, customLabelColor);
      setCustomLabelName("");
      setCustomLabelColor(INLINE_LABEL_PRESET_COLORS[0]);
      setShowCreateLabelForm(false);
    } catch (error) {
      console.error("Failed to create custom label:", error);
      setCustomLabelError("Failed to create label.");
    } finally {
      setLabelSubmitting(false);
    }
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
        Nhãn
      </label>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[1.75rem]">
        {taskLabels.length === 0 ? (
          <span className="text-sm text-slate-400 italic">Chưa có nhãn</span>
        ) : (
          taskLabels.map((label) => (
            <div
              key={label.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-sm"
              style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
            >
              <span>{label.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveLabelClick(label.id)}
                disabled={labelSubmitting || isSubmitting}
                className="text-slate-700 hover:text-red-500 font-bold disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <select
            value={selectedLabelId}
            onChange={(e) =>
              setSelectedLabelId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={labelSubmitting || isSubmitting}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-[#28B8FA] cursor-pointer disabled:opacity-50"
          >
            <option value="">Chọn nhãn có sẵn...</option>
            {availableLabels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddLabelClick}
          disabled={!selectedLabelId || labelSubmitting || isSubmitting}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {labelSubmitting ? "..." : "Thêm"}
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-800">Tạo nhãn mới</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreateLabelForm((prev) => !prev);
              setCustomLabelError("");
            }}
            disabled={labelSubmitting || isSubmitting}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-[#28B8FA] hover:text-[#28B8FA] transition-all disabled:opacity-50"
          >
            {showCreateLabelForm ? "Ẩn" : "Tùy chỉnh"}
          </button>
        </div>

        {showCreateLabelForm && (
          <div className="mt-4 space-y-3">
            <div>
              <input
                type="text"
                value={customLabelName}
                onChange={(e) => {
                  setCustomLabelName(e.target.value);
                  if (e.target.value.trim()) {
                    setCustomLabelError("");
                  }
                }}
                placeholder="e.g. Bug, Backend, QA"
                disabled={labelSubmitting || isSubmitting}
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors ${
                  customLabelError
                    ? "border-red-400 focus:border-red-400"
                    : "border-slate-200 focus:border-[#28B8FA]"
                }`}
              />
              {customLabelError && (
                <p className="mt-1 ml-1 text-xs font-medium text-red-500">
                  {customLabelError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {INLINE_LABEL_PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCustomLabelColor(color)}
                  disabled={labelSubmitting || isSubmitting}
                  className={`h-6 w-6 rounded-full transition-all hover:scale-110 ${
                    customLabelColor === color
                      ? "ring-2 ring-slate-400 ring-offset-2"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}

              <label
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
                title="Chọn màu tùy chỉnh"
              >
                <input
                  type="color"
                  value={customLabelColor}
                  onChange={(e) => setCustomLabelColor(e.target.value)}
                  disabled={labelSubmitting || isSubmitting}
                  className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                Khác
              </label>

              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase font-bold text-slate-900 ml-auto shadow-sm"
                style={{ backgroundColor: customLabelColor }}
              >
                {customLabelName.trim() || "Xem trước"}
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleCreateCustomLabelClick}
                disabled={
                  labelSubmitting || isSubmitting || !customLabelName.trim()
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {labelSubmitting ? "Đang tạo..." : "Tạo và gán nhãn"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
