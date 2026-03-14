"use client";

import React, { useState, useEffect } from "react";
import { XIcon, TrashIcon } from "@/components/icons";

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        description: string;
        priority: "Low" | "Medium" | "High";
        deadline: string;
    }) => void;
    onDelete?: () => void;
    initialData?: {
        title: string;
        description: string | null;
        priority: "Low" | "Medium" | "High";
        deadline: string | null;
    } | null;
    isSubmitting?: boolean;
}

export function TaskDetailsModal({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    isSubmitting = false,
}: TaskDetailsModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
    const [deadline, setDeadline] = useState("");
    const [nameError, setNameError] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTitle(initialData.title);
                setDescription(initialData.description || "");
                setPriority(initialData.priority);
                setDeadline(initialData.deadline ? initialData.deadline.split("T")[0] : "");
            } else {
                setTitle("");
                setDescription("");
                setPriority("Medium");
                setDeadline("");
            }
            setNameError(false);
        }
    }, [isOpen, initialData]);

    const handleSubmit = () => {
        if (!title.trim()) {
            setNameError(true);
            return;
        }
        onSubmit({
            title,
            description,
            priority,
            deadline,
        });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
                >
                    <XIcon />
                </button>

                <div className="p-8 flex flex-col gap-5 overflow-y-auto w-full">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {initialData ? "Edit Task" : "Create Task"}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">
                            {initialData ? "Update task details." : "Add a new task to the board."}
                        </p>
                    </div>

                    {/* Task Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Task Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Design wireframes"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (e.target.value.trim()) setNameError(false);
                            }}
                            className={`w-full text-black px-4 py-3 border rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none transition-colors ${nameError ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#28B8FA]"
                                }`}
                            required
                            autoFocus
                            disabled={isSubmitting}
                        />
                        {nameError && (
                            <p className="text-xs font-medium text-red-400 mt-2 ml-1">
                                Task name is required.
                            </p>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            {(["Low", "Medium", "High"] as const).map((p) => {
                                const colors = {
                                    Low: "text-[#34D399] bg-[#D1FAE5]",
                                    Medium: "text-[#28B8FA] bg-[#EAF7FF]",
                                    High: "text-[#FF8B5E] bg-[#FFF2DE]",
                                };
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPriority(p)}
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${priority === p
                                            ? `${colors[p]} ring-2 ring-offset-1 ring-${p === 'High' ? 'orange' : p === 'Medium' ? 'cyan' : 'emerald'}-200`
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Task details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            disabled={isSubmitting}
                            className="w-full text-black px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#28B8FA] transition-colors resize-none"
                        />
                    </div>

                    {/* Deadline */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Deadline
                        </label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full text-black px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#28B8FA] transition-colors"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex gap-3 mt-4">
                        {initialData && onDelete && (
                            <button
                                onClick={onDelete}
                                disabled={isSubmitting}
                                className="p-3 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Delete Task"
                            >
                                <TrashIcon />
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim()}
                            className="flex-1 py-3 rounded-full bg-linear-to-r from-[#28B8FA] to-[#0EA5E9] text-white font-bold text-base hover:shadow-lg hover:shadow-cyan-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                initialData ? "Save Changes" : "Create Task"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
