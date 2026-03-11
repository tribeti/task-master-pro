"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TASKS } from "@/lib/constants";
import {
    SunIcon,
    PlusIcon,
    CheckIcon,
    MoreIcon,
    PauseIcon,
    EditIcon,
    AlertIcon,
    TrashIcon,
    XIcon,
    BriefcaseIcon,
    ZapIcon,
    ChevronUp,
    UserIcon,
    LinkIcon,
} from "@/components/icons";
import CreateProjectModal from "@/components/CreateProjectModal";

export default function CommandPage() {
    // --- STATES ---
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isQueueExpanded, setIsQueueExpanded] = useState(false);
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    // Modal states
    const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // Toggle Tag in Modal
    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
    };

    const visibleTasks = isQueueExpanded ? TASKS : TASKS.slice(0, 3);

    return (
        <>
            {/* HEADER */}
            <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 py-10">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Command Center
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Daily productivity is at{" "}
                        <span className="text-[#34D399] font-bold">84%</span>.
                        You&apos;re crushing it!
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-100 shadow-sm shadow-slate-200/50">
                        <SunIcon />
                        <span className="text-xs font-bold text-slate-800 tracking-wider">
                            MORNING SESSION
                        </span>
                    </div>
                    <button
                        onClick={() => setIsQuickEntryOpen(true)}
                        className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 transition-colors text-white px-5 py-2.5 rounded-full shadow-md shadow-slate-300"
                    >
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                            <PlusIcon />
                        </div>
                        <span className="text-sm font-semibold">Quick Entry</span>
                    </button>
                </div>
            </header>

            {/* COMMAND TAB CONTENT */}
            <div className="px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT WIDGETS */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div
                        className={`rounded-4xl p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-colors duration-500 ${isTimerRunning ? "bg-blue-50/50" : "bg-white"}`}
                    >
                        {isTimerRunning && (
                            <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#28B8FA] rounded-full animate-pulse"></div>
                        )}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10"></div>
                        <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
                            Deep Focus
                        </h3>
                        <div
                            className={`text-5xl font-black tracking-tighter mb-6 transition-colors ${isTimerRunning ? "text-[#28B8FA]" : "text-slate-800"}`}
                        >
                            {isTimerRunning ? "23:59" : "24:00"}
                        </div>
                        <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`w-full font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isTimerRunning ? "bg-[#FFF2DE] text-[#FF8B5E] shadow-orange-100 hover:bg-orange-100" : "bg-[#28B8FA] text-white shadow-cyan-200 hover:bg-cyan-400"}`}
                        >
                            {isTimerRunning ? (
                                <>
                                    <PauseIcon /> Pause Sprint
                                </>
                            ) : (
                                "Start Sprint"
                            )}
                        </button>
                    </div>

                    <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                        <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6 w-full text-left">
                            Energy Sync
                        </h3>
                        <div className="flex items-end gap-2 h-20 mb-4">
                            <div className="w-6 h-8 bg-[#D1FAE5] rounded-t-md"></div>
                            <div className="w-6 h-12 bg-[#D1FAE5] rounded-t-md"></div>
                            <div className="w-6 h-20 bg-[#34D399] rounded-t-md shadow-sm shadow-emerald-200"></div>
                            <div className="w-6 h-10 bg-[#D1FAE5] rounded-t-md"></div>
                            <div className="w-6 h-6 bg-[#D1FAE5] rounded-t-md"></div>
                        </div>
                        <span className="text-xs font-bold text-[#34D399]">
                            Peak state reached
                        </span>
                    </div>
                </div>

                {/* CENTER WIDGET */}
                <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900">
                            Primary Objectives
                        </h2>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#FF8B5E]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#28B8FA]"></div>
                            <div className="w-2 h-2 rounded-full bg-[#34D399]"></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {visibleTasks.map((task) => (
                            <div
                                key={task.id}
                                className={`flex items-center gap-4 group p-2 rounded-2xl transition-colors relative ${openDropdownId === task.id ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                            >
                                {task.status === "done" ? (
                                    <div className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                                        <CheckIcon />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 shrink-0 group-hover:border-cyan-400 transition-colors cursor-pointer flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                    </div>
                                )}
                                <div
                                    className={`flex-1 ${task.status === "done" ? "opacity-60" : ""}`}
                                >
                                    <h4
                                        className={`text-lg font-bold ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-800"}`}
                                    >
                                        {task.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p
                                            className={`text-[10px] font-bold tracking-wider uppercase ${task.color}`}
                                        >
                                            {task.tag}
                                        </p>
                                        {task.avatars && (
                                            <div className="flex -space-x-1.5">
                                                {task.avatars.map((av, i) => (
                                                    <img
                                                        key={av}
                                                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${av}`}
                                                        alt="U"
                                                        className="w-4 h-4 rounded-full bg-slate-200 border border-white"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {task.xp ? (
                                    <div className="px-3 py-1 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-bold opacity-60">
                                        {task.xp}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() =>
                                            setOpenDropdownId(
                                                openDropdownId === task.id ? null : task.id,
                                            )
                                        }
                                        className={`p-2 rounded-full transition-colors ${openDropdownId === task.id ? "bg-slate-200 text-slate-700" : "text-slate-300 hover:text-slate-600 hover:bg-slate-200"}`}
                                    >
                                        <MoreIcon />
                                    </button>
                                )}
                                {openDropdownId === task.id && (
                                    <div
                                        className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 py-2 z-20 animate-float-up"
                                        style={{ animation: "floatUp 0.2s ease-out forwards" }}
                                    >
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                                            <EditIcon /> Edit Task
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                                            <AlertIcon /> Change Priority
                                        </button>
                                        <hr className="my-1 border-slate-100" />
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left">
                                            <TrashIcon /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                        className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                    >
                        {isQueueExpanded ? (
                            <>
                                <ChevronUp /> Collapse Queue
                            </>
                        ) : (
                            <>
                                <PlusIcon /> Expand Queue
                            </>
                        )}
                    </button>
                </div>

                {/* RIGHT WIDGETS */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-linear-to-br from-[#FF8B5E] to-[#FF6B3E] rounded-4xl p-6 shadow-md shadow-orange-200 text-white">
                        <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase mb-4">
                            Coming Up
                        </h3>
                        <h2 className="text-2xl font-bold tracking-tight mb-1">
                            Design Sync
                        </h2>
                        <p className="text-sm text-white/80 font-medium mb-6">
                            11:00 AM — Main Lounge
                        </p>
                        <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <LinkIcon /> meet.taskmasterpro.co...
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 mb-1">
                                Streak
                            </span>
                            <span className="text-3xl font-black text-[#FF8B5E]">12</span>
                        </div>
                        <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                            <span className="text-xs font-bold text-slate-400 mb-1">
                                Tasks
                            </span>
                            <span className="text-3xl font-black text-[#28B8FA]">48</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
                            Calendar
                        </h3>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-stretch gap-3">
                                <div className="w-1 bg-[#34D399] rounded-full"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">
                                        Project Launch
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                        Oct 26 • 2:00 PM
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-stretch gap-3">
                                <div className="w-1 bg-[#28B8FA] rounded-full"></div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">
                                        Feedback Loop
                                    </h4>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                        Oct 27 • 10:00 AM
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION BUTTON */}
            <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#34D399] hover:bg-emerald-500 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-white z-10">
                <PlusIcon />
            </button>

            {/* 3. QUICK ENTRY MODAL OVERLAY */}
            {isQuickEntryOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-2 relative mx-4 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => {
                                setIsQuickEntryOpen(false);
                                setSelectedTags([]);
                            }}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <XIcon />
                        </button>

                        <div className="p-8 flex flex-col gap-8">
                            <input
                                type="text"
                                placeholder="What's on your mind?"
                                className="text-3xl md:text-4xl font-extrabold text-slate-800 placeholder-slate-300 bg-transparent border-none outline-none w-[90%]"
                                autoFocus
                                required
                                maxLength={200}
                            />

                            <div className="flex items-center justify-between mt-4 h-24">
                                <div className="flex items-center gap-3">
                                    {selectedTags.length > 0 && (
                                        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mr-2">
                                            Quick Tag:
                                        </span>
                                    )}
                                    <button
                                        onClick={() => toggleTag("Work")}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Work") ? "bg-[#EAF7FF] text-[#28B8FA]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                                    >
                                        <BriefcaseIcon /> Work
                                    </button>
                                    <button
                                        onClick={() => toggleTag("Personal")}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Personal") ? "bg-[#D1FAE5] text-[#34D399]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                                    >
                                        <UserIcon /> Personal
                                    </button>
                                    <button
                                        onClick={() => toggleTag("Urgent")}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Urgent") ? "bg-[#FFF2DE] text-[#FF8B5E]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                                    >
                                        <ZapIcon /> Urgent
                                    </button>
                                </div>
                                <div className="ml-auto">
                                    {selectedTags.length === 0 ? (
                                        <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-[2rem] w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                                            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                                                <CheckIcon />
                                            </div>
                                            Create Task
                                        </button>
                                    ) : (
                                        <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">
                                            Add Task{" "}
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
            )}

            {/* CREATE PROJECT MODAL */}
            <CreateProjectModal
                isOpen={isCreateProjectOpen}
                onClose={() => setIsCreateProjectOpen(false)}
            />

            {/* Global Style for dropdown animation */}
        </>
    );
}
