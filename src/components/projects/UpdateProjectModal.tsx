"use client";

import React, { useState, useEffect } from "react";
import { XIcon } from "@/components/icons";
import { Board } from "@/types/project";

const TAG_PRESETS = ["Core", "Marketing", "Design", "Dev", "QA"];

interface UpdateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: Board | null;
    onSubmit?: (
        projectId: number,
        data: Partial<Board>
    ) => void;
    isSubmitting?: boolean;
}

export default function UpdateProjectModal({
    isOpen,
    onClose,
    initialData,
    onSubmit,
    isSubmitting = false,
}: UpdateProjectModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedColor, setSelectedColor] = useState("#FF8B5E");
    const [tag, setTag] = useState("");
    const [selectedTag, setSelectedTag] = useState("Core");
    const [nameError, setNameError] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);

    // const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || "");
            setDescription(initialData.description || "");
            setSelectedColor(initialData.color || "#FF8B5E");
            setTag(initialData.tag || "");
            setSelectedTag(TAG_PRESETS.includes(initialData.tag || "") ? (initialData.tag || "Core") : "");
            setNameError(false);
            setIsPrivate(initialData.is_private || false);
        }
    }, [isOpen, initialData]);

    const resetAndClose = () => {
        onClose();
    };

    const handleUpdateProject = () => {
        if (!title.trim()) {
            setNameError(true);
            return;
        }
        if (!initialData) return;

        onSubmit?.(initialData.id, {
            title,
            description,
            color: selectedColor,
            tag: selectedTag || tag,
            is_private: isPrivate,
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
            onClick={resetAndClose}
        >
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={resetAndClose}
                    disabled={isSubmitting}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
                >
                    <XIcon />
                </button>

                <div className="p-8 flex flex-col gap-5 overflow-y-auto w-full">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Cập nhật dự án
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">
                            Thay đổi thông tin {initialData?.title}
                        </p>
                    </div>

                    {/* Project Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Tên dự án <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Q4 Brand Sprint"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (e.target.value.trim()) setNameError(false);
                            }}
                            className={`w-full text-slate-900 px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${nameError ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#28B8FA]"}`}
                            required
                            maxLength={100}
                            autoFocus
                            disabled={isSubmitting}
                        />
                        {nameError && (
                            <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                                Tên dự án không được để trống.
                            </p>
                        )}
                    </div>

                    {/* Tag Presets */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Tag
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TAG_PRESETS.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedTag(t)}
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTag === t
                                        ? "bg-[#28B8FA] text-white shadow-md shadow-cyan-200"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Mô tả
                        </label>
                        <textarea
                            placeholder="Brief description of the project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                            className="w-full text-slate-900 px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors resize-none"
                        />
                    </div>

                    {/* Accent Color */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Màu sắc
                        </label>
                        <div className="flex gap-3">
                            {["#FF8B5E", "#28B8FA", "#34D399", "#A78BFA", "#F472B6"].map(
                                (color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        disabled={isSubmitting}
                                        className={`w-10 h-10 rounded-full transition-transform ${selectedColor === color ? "scale-110 ring-2 ring-offset-2" : "hover:scale-105"}`}
                                        style={
                                            {
                                                backgroundColor: color,
                                                ringColor: color,
                                            } as React.CSSProperties
                                        }
                                    />
                                ),
                            )}
                        </div>
                    </div>

                    {/* Private toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                Dự án riêng tư
                            </label>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Chỉ hiển thị với bạn và các thành viên được mời
                            </p>
                        </div>
                        <button
                            onClick={() => setIsPrivate(!isPrivate)}
                            disabled={isSubmitting}
                            className={`relative w-12 h-7 rounded-full transition-colors ${isPrivate ? "bg-[#28B8FA]" : "bg-slate-200"}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${isPrivate ? "translate-x-5" : "translate-x-0"}`}
                            />
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleUpdateProject}
                        disabled={isSubmitting || !title.trim()}
                        className="w-full py-3 rounded-full bg-linear-to-r from-[#28B8FA] to-[#60C9FA] text-white font-bold text-base hover:shadow-lg hover:shadow-cyan-200 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Đang cập nhật...
                            </>
                        ) : (
                            <>
                                Cập nhật dự án
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
