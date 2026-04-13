"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterIcon, CalendarIcon } from "@/components/icons";
import { KanbanTask as Task } from "@/types/project";
import { toast } from "sonner";

// Pool of vibrant bar colors – each task picks one at random (seeded by id)
const BAR_COLORS = [
  { bg: "bg-gradient-to-r from-violet-500 to-purple-500", shadow: "shadow-violet-200" },
  { bg: "bg-gradient-to-r from-pink-500 to-rose-500", shadow: "shadow-pink-200" },
  { bg: "bg-gradient-to-r from-cyan-500 to-teal-500", shadow: "shadow-cyan-200" },
  { bg: "bg-gradient-to-r from-amber-500 to-orange-500", shadow: "shadow-amber-200" },
  { bg: "bg-gradient-to-r from-blue-500 to-indigo-500", shadow: "shadow-blue-200" },
  { bg: "bg-gradient-to-r from-emerald-500 to-green-500", shadow: "shadow-emerald-200" },
  { bg: "bg-gradient-to-r from-fuchsia-500 to-pink-500", shadow: "shadow-fuchsia-200" },
  { bg: "bg-gradient-to-r from-sky-500 to-blue-500", shadow: "shadow-sky-200" },
  { bg: "bg-gradient-to-r from-lime-500 to-emerald-500", shadow: "shadow-lime-200" },
  { bg: "bg-gradient-to-r from-red-400 to-orange-400", shadow: "shadow-red-200" },
];

function getBarColor(taskId: number) {
  return BAR_COLORS[taskId % BAR_COLORS.length];
}

// Priority → left-sidebar text color
function getPriorityColor(priority: string) {
  switch (priority) {
    case "High":
      return "text-red-500";
    case "Medium":
      return "text-amber-500";
    case "Low":
      return "text-emerald-500";
    default:
      return "text-slate-500";
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case "High":
      return "Cao";
    case "Medium":
      return "Trung bình";
    case "Low":
      return "Thấp";
    default:
      return priority;
  }
}

// Sidebar accent bar color still follows priority for a subtle indicator
function getPriorityBarColor(priority: string) {
  switch (priority) {
    case "High":
      return "bg-red-500";
    case "Medium":
      return "bg-amber-400";
    case "Low":
      return "bg-emerald-400";
    default:
      return "bg-slate-300";
  }
}

export function TimelineTab({ projectId }: { projectId?: number }) {
  const [tasks, setTasks] = useState<(Task & { created_at?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // 14-day window starting from current week's Monday
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/boards/${projectId}/kanban`);
        if (!res.ok) throw new Error("Failed to fetch kanban data");
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error("Failed to fetch tasks for timeline:", error);
        toast.error("Tải dữ liệu lịch trình thất bại");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  const days = useMemo(() =>
    Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    }), [startDate]);

  const getDayName = (date: Date) =>
    date.toLocaleDateString("vi-VN", { weekday: "short" }).toUpperCase();

  const getDayLabel = (date: Date) => date.getDate().toString();

  const monthLabel = startDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const shiftDays = (diff: number) => {
    setStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + diff);
      return next;
    });
  };

  const goToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setStartDate(new Date(d.setDate(diff)));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timelineWindowEnd = new Date(days[13]);
  timelineWindowEnd.setHours(23, 59, 59, 999);

  const totalMs = 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-4xl border border-slate-100 shadow-sm mt-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {Array.from(
              new Set(tasks.map((t) => t.assignee?.user_id).filter(Boolean))
            )
              .slice(0, 3)
              .map((userId, idx) => {
                const assignee = tasks.find(
                  (t) => t.assignee?.user_id === userId
                )?.assignee;
                if (!assignee) return null;
                return (
                  <img
                    key={userId}
                    src={
                      assignee.avatar_url ||
                      `https://api.dicebear.com/7.x/notionists/svg?seed=${idx}`
                    }
                    title={assignee.display_name}
                    alt={assignee.display_name}
                    className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white object-cover"
                  />
                );
              })}
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <FilterIcon /> Lọc
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            <CalendarIcon /> Hôm nay
          </button>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <button
            onClick={() => shiftDays(-7)}
            className="text-slate-400 hover:text-slate-800 p-1"
          >
            &lt;
          </button>
          <span className="font-bold text-sm text-slate-800 capitalize min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => shiftDays(7)}
            className="text-slate-400 hover:text-slate-800 p-1"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-auto flex relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
          </div>
        )}

        {/* ─── Left sidebar: task list ─── */}
        <div className="w-64 shrink-0 border-r border-slate-100 bg-white z-20 sticky left-0 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)]">
          <div className="h-14 flex items-center px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b border-slate-100 bg-white">
            Nhiệm Vụ ({tasks.length})
          </div>
          <div className="flex flex-col pb-10">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative bg-white"
              >
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${getPriorityBarColor(task.priority)}`}
                ></div>
                <h4
                  className={`font-bold text-sm truncate ${getPriorityColor(task.priority)}`}
                  title={task.title}
                >
                  {task.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {getPriorityLabel(task.priority)}
                  {task.deadline &&
                    ` · Hạn: ${new Date(task.deadline).toLocaleDateString("vi-VN")}`}
                </p>
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <div className="p-6 text-sm text-slate-500 text-center">
                Không có nhiệm vụ nào
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Gantt area ─── */}
        <div className="flex-1 min-w-[800px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] relative">
          {/* Day headers */}
          <div className="h-14 flex border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
            {days.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`flex-1 flex flex-col items-center justify-center border-r border-slate-100 ${isToday ? "bg-[#28B8FA]/10" : ""}`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-[#28B8FA]" : "text-slate-400"}`}
                  >
                    {getDayName(day)}
                  </span>
                  <span
                    className={`text-sm font-black ${isToday ? "text-[#28B8FA]" : "text-slate-800"}`}
                  >
                    {getDayLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Task bars */}
          <div
            className="relative pb-10"
            style={{ height: `${Math.max(tasks.length * 80, 100)}px` }}
          >
            {/* Today marker */}
            {today >= startDate && today <= timelineWindowEnd && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[#28B8FA]/50 z-10 pointer-events-none"
                style={{
                  left: `calc(${((today.getTime() - startDate.getTime()) / totalMs) * 100}% + (100% / 28))`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-[#28B8FA] rounded-full absolute -top-1 -left-[4px]"></div>
              </div>
            )}

            {tasks.map((task, idx) => {
              // ── 1. created_at → deadline range ──
              const hasDeadline = !!task.deadline;
              const createdAt = task.created_at
                ? new Date(task.created_at)
                : new Date();
              const startD = new Date(createdAt);
              startD.setHours(0, 0, 0, 0);

              let endD: Date;
              if (hasDeadline) {
                endD = new Date(task.deadline!);
                endD.setHours(23, 59, 59, 999);
              } else {
                // No deadline → show a 1-day marker at creation
                endD = new Date(startD);
                endD.setHours(23, 59, 59, 999);
              }

              // Skip if entirely outside the 14-day window
              if (endD < startDate || startD > timelineWindowEnd) return null;

              const renderStart = startD < startDate ? startDate : startD;
              const renderEnd = endD > timelineWindowEnd ? timelineWindowEnd : endD;

              const leftOffset =
                ((renderStart.getTime() - startDate.getTime()) / totalMs) * 100;
              const widthPerc = Math.max(
                ((renderEnd.getTime() - renderStart.getTime()) / totalMs) * 100,
                1.5
              );

              const topOffset = idx * 80 + 20;

              // ── 3. Random color per task ──
              const barColor = getBarColor(task.id);

              // ── 2. "còn X ngày" warning if ≤ 3 days left ──
              let daysLeft: number | null = null;
              if (hasDeadline) {
                const deadlineDate = new Date(task.deadline!);
                deadlineDate.setHours(0, 0, 0, 0);
                daysLeft = Math.ceil(
                  (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
              }
              const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
              const isOverdue = daysLeft !== null && daysLeft < 0;

              return (
                <div
                  key={task.id}
                  className={`absolute h-10 ${barColor.bg} ${barColor.shadow} rounded-full shadow-md flex items-center px-3 z-20 transition-all hover:scale-[1.02] cursor-pointer overflow-hidden gap-2 ${isOverdue ? "opacity-60" : ""}`}
                  style={{
                    top: `${topOffset}px`,
                    left: `${leftOffset}%`,
                    width: `${widthPerc}%`,
                    minWidth: "40px",
                  }}
                  title={`${task.title}${hasDeadline ? ` · Hạn: ${new Date(task.deadline!).toLocaleDateString("vi-VN")}` : " · Không có hạn"}`}
                >
                  {/* Task title */}
                  <span className="text-white text-xs font-bold truncate whitespace-nowrap">
                    {task.title}
                  </span>

                  {/* Near-deadline warning badge */}
                  {isNearDeadline && (
                    <span className="shrink-0 bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm animate-pulse">
                      ⚠ còn {daysLeft} ngày
                    </span>
                  )}
                  {isOverdue && (
                    <span className="shrink-0 bg-red-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      Quá hạn
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
