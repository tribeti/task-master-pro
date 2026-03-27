"use client";

import React, { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";

interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; colorHex: string }) => Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_COLORS = [
  "#28B8FA",
  "#34D399",
  "#FF8B5E",
  "#A78BFA",
  "#F43F5E",
  "#F59E0B",
  "#10B981",
  "#6366F1",
];

export function CreateLabelModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateLabelModalProps) {
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState("#28B8FA");
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setColorHex("#28B8FA");
      setNameError(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }

    await onSubmit({
      name: name.trim(),
      colorHex,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          <XIcon />
        </button>

        <div className="p-7 flex flex-col gap-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Create Label</h3>
            <p className="text-sm text-slate-400 mt-1">
              Create a new color label for this board.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Label Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Design"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError(false);
              }}
              disabled={isSubmitting}
              className={`w-full bg-white text-slate-900 px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${
                nameError
                  ? "border-red-400 focus:border-red-400"
                  : "border-slate-200 focus:border-[#28B8FA]"
              }`}
            />
            {nameError && (
              <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                Label name is required.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Color
            </label>

            <div className="flex flex-wrap gap-3 mb-4">
              {PRESET_COLORS.map((color) => {
                const active = colorHex === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColorHex(color)}
                    className={`w-9 h-9 rounded-full border-4 transition-all ${
                      active ? "border-slate-900 scale-105" : "border-white"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-14 h-11 rounded-xl border border-slate-200 bg-white cursor-pointer"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="flex-1 bg-white text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#28B8FA]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#28B8FA] to-[#0EA5E9] text-white font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Label"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}