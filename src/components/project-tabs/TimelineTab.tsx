"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterIcon, CalendarIcon, XIcon } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
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

function getPriorityBadgeStyle(priority: string) {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-600";
    case "Medium":
      return "bg-amber-100 text-amber-600";
    case "Low":
      return "bg-emerald-100 text-emerald-600";
    default:
      return "bg-slate-100 text-slate-600";
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

// ─── Read-Only Task Preview Modal ───
type TimelineTask = Task & { created_at?: string };

function TaskPreviewModal({
  task,
  onClose,
}: {
  task: TimelineTask;
  onClose: () => void;
}) {
  const hasDeadline = !!task.deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysLeft: number | null = null;
  if (hasDeadline) {
    const deadlineDate = new Date(task.deadline!);
    deadlineDate.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const assignees = task.assignees || [];

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors z-10 bg-white/80 p-1 rounded-full backdrop-blur-md"
        >
          <XIcon />
        </button>

        {/* Color accent header */}
        <div className={`h-2 w-full ${getBarColor(task.id).bg}`} />

        <div className="p-8 flex flex-col gap-5">
          {/* Title & Priority */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getPriorityBadgeStyle(task.priority)}`}
              >
                {getPriorityLabel(task.priority)}
              </span>
              {hasDeadline && daysLeft !== null && daysLeft < 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500 text-white">
                  Quá hạn
                </span>
              )}
              {hasDeadline && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-white animate-pulse">
                  ⚠ Còn {daysLeft} ngày
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">
              {task.title}
            </h2>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Mô tả
              </label>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {task.description}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Ngày tạo
              </label>
              <p className="text-sm font-semibold text-slate-700">
                {task.created_at
                  ? new Date(task.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Hạn chót
              </label>
              <p
                className={`text-sm font-semibold ${
                  daysLeft !== null && daysLeft < 0
                    ? "text-red-500"
                    : daysLeft !== null && daysLeft <= 3
                      ? "text-amber-500"
                      : "text-slate-700"
                }`}
              >
                {hasDeadline
                  ? new Date(task.deadline!).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Không có hạn"}
              </p>
              {hasDeadline && daysLeft !== null && daysLeft >= 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Còn {daysLeft} ngày
                </p>
              )}
            </div>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Nhãn
              </label>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-sm"
                    style={{ backgroundColor: label.color_hex || "#E2E8F0" }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assignees */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Người thực hiện
            </label>
            {assignees.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {assignees.map((a) => (
                  <div
                    key={a.user_id}
                    className="flex items-center gap-2 bg-slate-50 rounded-full pr-4 pl-1 py-1 border border-slate-100"
                  >
                    <UserAvatar
                      avatarUrl={a.avatar_url}
                      displayName={a.display_name}
                      className="w-8 h-8"
                      fallbackClassName="bg-[#EAF7FF] text-[#0284C7]"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {a.display_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Chưa có người thực hiện</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───
export function TimelineTab({ projectId }: { projectId?: number }) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTask, setPreviewTask] = useState<TimelineTask | null>(null);

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

  const days = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [startDate]
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
                  <div key={userId} className="ring-2 ring-white rounded-full">
                    <UserAvatar
                      avatarUrl={assignee.avatar_url}
                      displayName={assignee.display_name}
                      className="w-8 h-8"
                      fallbackClassName="bg-slate-200 text-slate-600"
                    />
                  </div>
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
                className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative bg-white cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setPreviewTask(task)}
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
                1.5
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
                    (1000 * 60 * 60 * 24)
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
