"use client";

import React, { useState } from "react";
import {
    PlusIcon,
    MoreIcon,
} from "@/components/icons";
import Link from "next/link";

// --- DATA ---
const ACTIVITY_DATA = [
    { label: "Deep Work", color: "#34D399", hours: 23.4, percent: 55 },
    { label: "Meetings", color: "#28B8FA", hours: 12.8, percent: 30 },
    { label: "Admin", color: "#FF8B5E", hours: 6.3, percent: 15 },
];

const HEATMAP_DATA = [
    { time: "09:00", value: 65, color: "#28B8FA" },
    { time: "10:00", value: 95, color: "#34D399" },
    { time: "11:00", value: 40, color: "#28B8FA" },
    { time: "12:00", value: 20, color: "#CBD5E1" },
    { time: "13:00", value: 55, color: "#28B8FA" },
    { time: "14:00", value: 85, color: "#34D399" },
    { time: "15:00", value: 45, color: "#FF8B5E" },
];

const TOP_PROJECTS = [
    {
        id: 1,
        name: "Website Redesign",
        team: "Q3 Marketing",
        category: "Deep Work",
        categoryColor: "#34D399",
        progress: 75,
        hours: 12.5,
        icon: "🖥",
        iconBg: "bg-[#EAF7FF]",
    },
    {
        id: 2,
        name: "Client Onboarding",
        team: "Sales & Success",
        category: "Meetings",
        categoryColor: "#28B8FA",
        progress: 40,
        hours: 8.2,
        icon: "👥",
        iconBg: "bg-[#D1FAE5]",
    },
    {
        id: 3,
        name: "Inbox Zero",
        team: "Daily Ops",
        category: "Admin",
        categoryColor: "#FF8B5E",
        progress: 90,
        hours: 4.1,
        icon: "📬",
        iconBg: "bg-[#FFF2DE]",
    },
];

export default function InsightsPage() {
    const [timePeriod, setTimePeriod] = useState<"Daily" | "Weekly">("Weekly");

    const totalHours = 42.5;

    // SVG Donut chart angles
    const donutSegments = (() => {
        let cumulative = 0;
        return ACTIVITY_DATA.map((item) => {
            const startAngle = cumulative * 3.6;
            cumulative += item.percent;
            const endAngle = cumulative * 3.6;
            return { ...item, startAngle, endAngle };
        });
    })();

    const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(cx, cy, r, endAngle - 0.5);
        const end = polarToCartesian(cx, cy, r, startAngle + 0.5);
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    };

    const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: cx + r * Math.cos(angleInRadians),
            y: cy + r * Math.sin(angleInRadians),
        };
    };

    return (
        <>
            {/* HEADER */}
            <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 pt-10 pb-6">
                <div>
                    <p className="text-[10px] font-bold text-[#28B8FA] uppercase tracking-widest mb-2">
                        Analysis
                    </p>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Time Distribution
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Breakdown of your <span className="font-bold text-slate-800">42.5 hours</span> this week.
                    </p>
                </div>

                {/* Daily / Weekly Toggle */}
                <div className="flex items-center bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                    <button
                        onClick={() => setTimePeriod("Daily")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${timePeriod === "Daily"
                                ? "bg-[#1E293B] text-white shadow-md"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setTimePeriod("Weekly")}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${timePeriod === "Weekly"
                                ? "bg-[#1E293B] text-white shadow-md"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Weekly
                    </button>
                </div>
            </header>

            {/* CONTENT */}
            <div className="px-10 pb-20 flex flex-col gap-6">

                {/* TOP ROW: Activity Breakdown + Focus Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Activity Breakdown Card */}
                    <div className="lg:col-span-8 bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Activity Breakdown</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Allocation by Category
                                </p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-50">
                                <MoreIcon />
                            </button>
                        </div>

                        <div className="flex items-center gap-12 mt-6">
                            {/* Donut Chart */}
                            <div className="relative w-56 h-56 shrink-0">
                                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                                    {donutSegments.map((seg, i) => (
                                        <path
                                            key={i}
                                            d={describeArc(100, 100, 75, seg.startAngle, seg.endAngle)}
                                            fill="none"
                                            stroke={seg.color}
                                            strokeWidth="28"
                                            strokeLinecap="round"
                                        />
                                    ))}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900 tracking-tight">{totalHours}h</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-col gap-6 flex-1">
                                {ACTIVITY_DATA.map((item) => (
                                    <div key={item.label} className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-sm font-bold text-slate-800 w-24">{item.label}</span>
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold ml-3 whitespace-nowrap" style={{ color: item.color }}>
                                            {item.hours}h ({item.percent}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Focus Heatmap Card */}
                    <div className="lg:col-span-4 bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Focus Heatmap</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Peak Hours
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-6">
                            {HEATMAP_DATA.map((item) => (
                                <div key={item.time} className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-400 w-10 text-right">{item.time}</span>
                                    <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden">
                                        <div
                                            className="h-full rounded-lg transition-all"
                                            style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW: Top Projects */}
                <div className="bg-white rounded-4xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Top Projects</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Where Your Energy Flows
                            </p>
                        </div>
                        <Link
                            href="/projects"
                            className="text-sm font-bold text-[#28B8FA] hover:underline"
                        >
                            View All Projects
                        </Link>
                    </div>

                    <div className="flex flex-col mt-6">
                        {TOP_PROJECTS.map((project, idx) => (
                            <div
                                key={project.id}
                                className={`flex items-center gap-6 py-5 ${idx > 0 ? "border-t border-slate-100" : ""}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl ${project.iconBg} flex items-center justify-center text-xl shrink-0`}>
                                    {project.icon}
                                </div>
                                <div className="w-40">
                                    <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{project.team}</p>
                                </div>
                                <div
                                    className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
                                    style={{ backgroundColor: project.categoryColor }}
                                >
                                    {project.category}
                                </div>
                                <div className="flex-1 flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 w-16">Progress</span>
                                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${project.progress}%`, backgroundColor: project.categoryColor }}
                                        ></div>
                                    </div>
                                    <span
                                        className="text-xs font-bold w-8"
                                        style={{ color: project.categoryColor }}
                                    >
                                        {project.progress}%
                                    </span>
                                </div>
                                <span className="text-2xl font-black text-slate-800 w-20 text-right tracking-tight">
                                    {project.hours}h
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FLOATING ACTION BUTTON */}
            <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#34D399] hover:bg-emerald-500 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-white z-10">
                <PlusIcon />
            </button>
        </>
    );
}
