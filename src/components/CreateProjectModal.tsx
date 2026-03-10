"use client";

import React, { useState } from "react";
import { XIcon } from "@/components/icons";

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (data: {
        title: string;
        description: string;
        is_private: boolean;
        color: string;
        tag: string;
        projectDeadline: string;
        selectedTeamMembers: string[];
    }) => void;
}

export default function CreateProjectModal({
    isOpen,
    onClose,
    onSubmit,
}: CreateProjectModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#FF8B5E');
    const [tag, setTag] = useState('');
    const [projectDeadline, setProjectDeadline] = useState('');
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

    const resetAndClose = () => {
        setTitle('');
        setDescription('');
        setIsPrivate(false);
        setSelectedColor('#FF8B5E');
        setTag('');
        setProjectDeadline('');
        setSelectedTeamMembers([]);
        onClose();
    };

    const handleCreateProject = () => {
        if (!title.trim()) return;
        onSubmit?.({
            title,
            description,
            is_private: isPrivate,
            color: selectedColor,
            tag,
            projectDeadline,
            selectedTeamMembers,
        });
        resetAndClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-2 relative mx-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={resetAndClose}
                    className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <XIcon />
                </button>

                <div className="p-8 flex flex-col gap-5">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Create New Project</h2>
                        <p className="text-sm text-slate-400 font-medium">Let&apos;s set up your next win.</p>
                    </div>

                    {/* Project Name → maps to title */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Project Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Q4 Brand Sprint"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#FF8B5E] transition-colors"
                        />
                    </div>

                    {/* Description → maps to description */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Description</label>
                        <textarea
                            placeholder="Brief description of the project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#FF8B5E] transition-colors resize-none"
                        />
                    </div>

                    {/* Tag → maps to tag */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Tag</label>
                        <input
                            type="text"
                            placeholder="e.g. Design, Dev, Marketing"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium placeholder-slate-300 focus:outline-none focus:border-[#FF8B5E] transition-colors"
                        />
                    </div>

                    {/* Accent Color → maps to color */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Accent Color</label>
                        <div className="flex gap-3">
                            {['#FF8B5E', '#28B8FA', '#34D399', '#FBBF24'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-10 h-10 rounded-full transition-transform ${selectedColor === color ? 'scale-110 ring-2 ring-offset-2' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Private toggle → maps to is_private */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Private Project</label>
                            <p className="text-xs text-slate-400 mt-0.5">Only visible to you and invited members</p>
                        </div>
                        <button
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={`relative w-12 h-7 rounded-full transition-colors ${isPrivate ? 'bg-[#FF8B5E]' : 'bg-slate-200'}`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    {/* Set Deadline (giữ lại) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Set Deadline</label>
                        <input
                            type="date"
                            value={projectDeadline}
                            onChange={(e) => setProjectDeadline(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#FF8B5E] transition-colors"
                        />
                    </div>

                    {/* Team Members (giữ lại) */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Assign Team Members</label>
                        <div className="flex items-center gap-2">
                            {selectedTeamMembers.map((member, idx) => (
                                <img
                                    key={idx}
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member}`}
                                    alt="Team member"
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                />
                            ))}
                            <button
                                onClick={() => setSelectedTeamMembers([...selectedTeamMembers, `member${Date.now()}`])}
                                className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-[#FF8B5E] hover:text-[#FF8B5E] transition-colors"
                                title="Add team member"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleCreateProject}
                        disabled={!title.trim()}
                        className="w-full py-3 rounded-full bg-linear-to-r from-[#FF8B5E] to-[#FFB088] text-white font-bold text-base hover:shadow-lg hover:shadow-orange-200 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Launch Project
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
