"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterIcon, CalendarIcon } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { toast } from "sonner";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { TaskPreviewModal } from "../timeline/TaskPreviewModal";
import {
  getBarColor,
  TimelineTask,
  getPriorityLabel,
  getPriorityBarColor,
  getPriorityColor,
} from "../timeline/helper";

// ─── Main component ───
export function TimelineTab({ projectId }: { projectId?: number }) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTask, setPreviewTask] = useState<TimelineTask | null>(null);
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";

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
    const controller = new AbortController();
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/boards/" + projectId + "/kanban", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch kanban data");
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Failed to fetch tasks for timeline:", error);
        toast.error("Tải dữ liệu lịch trình thất bại");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    return () => controller.abort();
  }, [projectId]);

  const days = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [startDate],
  );

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
    <div className={`flex-1 flex flex-col overflow-hidden rounded-4xl border shadow-sm mt-4 transition-colors duration-500 ${
      isCozy ? "bg-[#0F172A] border-slate-700/50" : "bg-white border-slate-100"
    }`}>
      {/* ─── Header ─── */}
      <div className={`flex items-center justify-between p-6 border-b ${isCozy ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            {(() => {
              const unique = [];
              const seen = new Set();
              for (const t of tasks) {
                if (t.assignee && !seen.has(t.assignee.user_id)) {
                  seen.add(t.assignee.user_id);
                  unique.push(t.assignee);
                  if (unique.length === 3) break;
                }
              }
              return unique.map((assignee) => (
                  <div
                    key={assignee.user_id}
                    className={`ring-2 rounded-full ${isCozy ? "ring-slate-900" : "ring-white"}`}
                  >
                    <UserAvatar
                      avatarUrl={assignee.avatar_url}
                      displayName={assignee.display_name}
                      className="w-8 h-8"
                      fallbackClassName={isCozy ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-600"}
                    />
                  </div>
              ));
            })()}
          </div>
          <div className={`w-px h-6 ${isCozy ? "bg-slate-800" : "bg-slate-200"}`}></div>
          <button className={`flex items-center gap-2 text-sm font-bold transition-colors ${isCozy ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>
            <FilterIcon /> Lọc
          </button>
          <button
            onClick={goToToday}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${isCozy ? "text-slate-400 hover:text-[#FF8B5E]" : "text-slate-500 hover:text-slate-800"}`}
          >
            <CalendarIcon /> Hôm nay
          </button>
        </div>
        <div className={`flex items-center gap-4 px-4 py-2 rounded-full border ${
          isCozy ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
        }`}>
          <button
            onClick={() => shiftDays(-7)}
            className={`p-1 transition-colors ${isCozy ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
          >
            &lt;
          </button>
          <span className={`font-bold text-sm capitalize min-w-30 text-center transition-colors ${isCozy ? "text-slate-300" : "text-slate-800"}`}>
            {monthLabel}
          </span>
          <button
            onClick={() => shiftDays(7)}
            className={`p-1 transition-colors ${isCozy ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-auto flex relative">
        {loading && (
          <div className={`absolute inset-0 flex items-center justify-center z-50 ${isCozy ? "bg-[#0F172A]/50" : "bg-white/50"}`}>
            <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
              isCozy ? "border-slate-800 border-t-[#FF8B5E]" : "border-slate-200 border-t-[#28B8FA]"
            }`}></div>
          </div>
        )}

        {/* ─── Left sidebar: task list ─── */}
        <div className={`w-64 shrink-0 z-20 sticky left-0 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.1)] border-r ${
          isCozy ? "border-slate-800 bg-[#0F172A]" : "border-slate-100 bg-white"
        }`}>
          <div className={`h-14 flex items-center px-6 text-[10px] font-bold tracking-widest uppercase border-b ${
            isCozy ? "bg-[#0F172A] border-slate-800 text-slate-500" : "bg-white border-slate-100 text-slate-400"
          }`}>
            Nhiệm Vụ ({tasks.length})
          </div>
          <div className="flex flex-col pb-10">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`h-20 flex flex-col justify-center px-6 border-b relative cursor-pointer transition-colors ${
                  isCozy 
                    ? "border-slate-800/50 bg-[#0F172A] hover:bg-slate-800/40" 
                    : "border-slate-50 bg-white hover:bg-slate-50/50"
                }`}
                onClick={() => setPreviewTask(task)}
              >
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${getPriorityBarColor(task.priority)}`}
                ></div>
                <h4
                  className={`font-bold text-sm truncate ${isCozy ? "text-slate-300" : getPriorityColor(task.priority)}`}
                  title={task.title}
                >
                  {task.title}
                </h4>
                <p className={`text-xs truncate ${isCozy ? "text-slate-500" : "text-slate-400"}`}>
                  {getPriorityLabel(task.priority)}
                  {task.deadline &&
                    ` · Hạn: ${new Date(task.deadline).toLocaleDateString("vi-VN")}`}
                </p>
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <div className={`p-6 text-sm text-center ${isCozy ? "text-slate-600" : "text-slate-500"}`}>
                Không có nhiệm vụ nào
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Gantt area ─── */}
        <div className={`flex-1 min-w-200 relative ${
          isCozy 
            ? "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-slate-900/50" 
            : "bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-white"
        }`}>
          {/* Day headers */}
          <div className={`h-14 flex border-b sticky top-0 z-30 backdrop-blur-sm ${
            isCozy ? "bg-slate-900/90 border-slate-800" : "bg-white/90 border-slate-100"
          }`}>
            {days.map((day, i) => {
              const isToday = day.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`flex-1 flex flex-col items-center justify-center border-r transition-colors ${
                    isCozy ? "border-slate-800" : "border-slate-100"
                  } ${isToday ? (isCozy ? "bg-orange-500/10" : "bg-[#28B8FA]/10") : ""}`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? (isCozy ? "text-[#FF8B5E]" : "text-[#28B8FA]") : "text-slate-400"}`}
                  >
                    {getDayName(day)}
                  </span>
                  <span
                    className={`text-sm font-black ${isToday ? (isCozy ? "text-[#FF8B5E]" : "text-[#28B8FA]") : (isCozy ? "text-slate-300" : "text-slate-800")}`}
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
                className={`absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none ${isCozy ? "bg-[#FF8B5E]/50" : "bg-[#28B8FA]/50"}`}
                style={{
                  left: `calc(${((today.getTime() - startDate.getTime()) / totalMs) * 100}% + (100% / 28))`,
                }}
              >
                <div className={`w-2.5 h-2.5 rounded-full absolute -top-1 -left-1 ${isCozy ? "bg-[#FF8B5E]" : "bg-[#28B8FA]"}`}></div>
              </div>
            )}

            {tasks.map((task, idx) => {
              // ── created_at → deadline range ──
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
              const renderEnd =
                endD > timelineWindowEnd ? timelineWindowEnd : endD;

              const leftOffset =
                ((renderStart.getTime() - startDate.getTime()) / totalMs) * 100;
              const widthPerc = Math.max(
                ((renderEnd.getTime() - renderStart.getTime()) / totalMs) * 100,
                1.5,
              );

              const topOffset = idx * 80 + 20;

              // Random color per task
              const barColor = getBarColor(task.id);

              // "còn X ngày" warning if ≤ 3 days left
              let daysLeft: number | null = null;
              if (hasDeadline) {
                const deadlineDate = new Date(task.deadline!);
                deadlineDate.setHours(0, 0, 0, 0);
                daysLeft = Math.ceil(
                  (deadlineDate.getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
              }
              const isNearDeadline =
                daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
              const isOverdue = daysLeft !== null && daysLeft < 0;

              // Assignees for avatar display
              const assignees = task.assignees || [];

              return (
                <div
                  key={task.id}
                  onClick={() => setPreviewTask(task)}
                  className={`absolute h-10 ${barColor.bg} ${barColor.shadow} rounded-full shadow-md flex items-center px-1 z-20 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer overflow-hidden gap-1 ${isOverdue ? "opacity-60" : ""}`}
                  style={{
                    top: `${topOffset}px`,
                    left: `${leftOffset}%`,
                    width: `${widthPerc}%`,
                    minWidth: "40px",
                  }}
                  title={`${task.title}${hasDeadline ? ` · Hạn: ${new Date(task.deadline!).toLocaleDateString("vi-VN")}` : " · Không có hạn"}`}
                >
                  {/* Assignee avatars (stacked) */}
                  {assignees.length > 0 && (
                    <div className="flex -space-x-1.5 shrink-0 pl-0.5">
                      {assignees.slice(0, 2).map((a) => (
                        <div
                          key={a.user_id}
                          className="ring-2 ring-white/30 rounded-full"
                        >
                          <UserAvatar
                            avatarUrl={a.avatar_url}
                            displayName={a.display_name}
                            className="w-7 h-7"
                            fallbackClassName="bg-white/20 text-white"
                          />
                        </div>
                      ))}
                      {assignees.length > 2 && (
                        <div className="w-7 h-7 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-[9px] font-bold text-white">
                          +{assignees.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task title */}
                  <span className="text-white text-xs font-bold truncate whitespace-nowrap ml-1">
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

      {/* ─── Task Preview Modal ─── */}
      {previewTask && (
        <TaskPreviewModal
          task={previewTask}
          onClose={() => setPreviewTask(null)}
        />
      )}
    </div>
  );
}
