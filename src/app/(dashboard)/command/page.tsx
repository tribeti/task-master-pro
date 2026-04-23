"use client";

import React, { useState, useEffect } from "react";
import { TASKS } from "@/lib/constants";
import {
  PlusIcon,
  CheckIcon,
  XIcon,
  BriefcaseIcon,
  ZapIcon,
  UserIcon,
} from "@/components/icons";
import CreateProjectModal from "@/components/CreateProjectModal";
import { createClient } from "@/utils/supabase/client";

interface RealTask {
  id: number;
  title: string;
  deadline: string | null;
  project_title: string;
}

const supabase = createClient();
export default function CommandCenter() {
  // --- STATES ---
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<RealTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  // Fetch real schedule data (Next 6 days & Filtered by User)
  useEffect(() => {
    let cancelled = false;

    async function fetchSchedule() {
      if (!cancelled) {
        setLoading(true);
        setFetchError(null);
      }

      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authErr || !user) {
          if (!cancelled) setLoading(false);
          return;
        }

        const today = new Date().toISOString();
        const windowEnd = new Date();
        windowEnd.setDate(windowEnd.getDate() + 6);

        // Step 1: Get boards user has access to
        const [ownedRes, memberRes] = await Promise.all([
          supabase.from("boards").select("id").eq("owner_id", user.id),
          supabase
            .from("board_members")
            .select("board_id")
            .eq("user_id", user.id),
        ]);

        const { data: ownedBoards, error: ownedErr } = ownedRes;
        const { data: memberBoards, error: memberErr } = memberRes;

        if (cancelled) return;
        if (ownedErr || memberErr) {
          console.error("Board fetch error:", ownedErr || memberErr);
          if (!cancelled) {
            setFetchError("Không thể tải danh sách dự án.");
            setLoading(false);
          }
          return;
        }

        const accessibleBoardIds = [
          ...(ownedBoards?.map((b) => b.id) || []),
          ...(memberBoards?.map((m) => m.board_id) || []),
        ];

        if (accessibleBoardIds.length === 0) {
          if (!cancelled) {
            setUpcomingTasks([]);
            setLoading(false);
          }
          return;
        }

        // Step 2: Get tasks for those boards within 6 days
        const { data: taskData, error: taskErr } = await supabase
          .from("tasks")
          .select(
            `
            id,
            title,
            deadline,
            column:columns!inner (
              board_id,
              board:boards (title)
            )
          `,
          )
          .in("column.board_id", accessibleBoardIds)
          .gte("deadline", today)
          .lte("deadline", windowEnd.toISOString())
          .order("deadline", { ascending: true });

        if (cancelled) return;
        if (taskErr) {
          console.error("Task fetch error:", taskErr);
          if (!cancelled) {
            setFetchError("Không thể tải lịch trình nhiệm vụ.");
            setLoading(false);
          }
          return;
        }

        if (taskData && !cancelled) {
          const formatted = taskData.map((t: any) => {
            // Xử lý cardinality: PostgREST có thể trả về object hoặc array tùy theo định nghĩa quan hệ
            const colInfo = Array.isArray(t.column) ? t.column[0] : t.column;
            const boardInfo = Array.isArray(colInfo?.board)
              ? colInfo.board[0]
              : colInfo?.board;

            return {
              id: t.id,
              title: t.title,
              deadline: t.deadline,
              project_title: boardInfo?.title || "Dự án",
            };
          });
          setUpcomingTasks(formatted);
        }
      } catch (err) {
        console.error("Unexpected fetch error:", err);
        if (!cancelled) setFetchError("Đã xảy ra lỗi không xác định.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSchedule();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
            Trung tâm điều khiển
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Năng suất hàng ngày là{" "}
            <span className="text-[#34D399] font-bold">84%</span>. Bạn đang làm
            rất tốt!
          </p>
        </div>
      </header>

      {/* COMMAND TAB CONTENT */}
      <div className="px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT WIDGETS */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* DEEP FOCUS WIDGET */}
          <div
            className={`rounded-4xl p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-colors duration-500 group/pro ${isTimerRunning ? "bg-blue-50/50" : "bg-white"}`}
          >
            {/* Blurred Content */}
            <div className="filter blur-md opacity-40 pointer-events-none select-none transition-all duration-700">
              {isTimerRunning && (
                <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#28B8FA] rounded-full animate-pulse"></div>
              )}
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10"></div>
              <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
                Tập trung sâu
              </h3>
              <div
                className={`text-5xl font-black tracking-tighter mb-6 transition-colors ${isTimerRunning ? "text-[#28B8FA]" : "text-slate-800"}`}
              >
                {isTimerRunning ? "23:59" : "24:00"}
              </div>
              <button
                className={`w-full font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isTimerRunning ? "bg-[#FFF2DE] text-[#FF8B5E] shadow-orange-100 hover:bg-orange-100" : "bg-[#28B8FA] text-white shadow-cyan-200 hover:bg-cyan-400"}`}
              >
                Bắt đầu Sprint
              </button>
            </div>

            {/* Pro Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
              <div className="relative z-30 flex flex-col items-center text-center">
                <div className="mb-3 p-3  bg-gradient-to-tr from-[#28B8FA] to-[#34D399] rounded-xl shadow-lg shadow-slate-200">
                  <ZapIcon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  Sprint Pro
                </h4>
                <p className="text-[10px] font-bold text-[#FF8B5E] mt-1 bg-orange-50 px-2 py-0.5 rounded-md">
                  Premium Feature
                </p>
              </div>
            </div>
          </div>

          {/* ENERGY SYNC WIDGET */}
          <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden group/pro">
            {/* Blurred Content */}
            <div className="filter blur-md opacity-30 pointer-events-none select-none transition-all duration-700 w-full flex flex-col items-center">
              <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6 w-full text-left">
                Đồng bộ năng lượng
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

            {/* Pro Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
              <div className="relative z-30 flex flex-col items-center">
                <div className="p-2.5 bg-gradient-to-tr from-[#34D399] to-[#28B8FA] rounded-full shadow-lg shadow-emerald-100 mb-2">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER WIDGET */}
        <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group/pro">
          {/* Blurred Content Container */}
          <div className="filter blur-md opacity-50 pointer-events-none select-none transition-all duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                Nhiệm vụ thăng cấp hằng ngày
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
                  className={`flex items-center gap-4 p-2 rounded-2xl transition-colors relative ${openDropdownId === task.id ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                >
                  {task.status === "done" ? (
                    <div className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                      <CheckIcon />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 shrink-0 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-cyan-400 opacity-20"></div>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2">
              <PlusIcon /> Mở rộng hàng đợi
            </button>
          </div>

          {/* Pro Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
            <div className="relative z-30 flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="mb-6 w-20 h-20 bg-gradient-to-tr from-[#28B8FA] to-[#34D399] rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-cyan-200 relative group-hover/pro:rotate-0 transition-transform duration-500">
                <ZapIcon className="w-10 h-10 text-white" />
                <div className="absolute -top-3 -right-3 bg-[#FF8B5E] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                  PRO
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                Nâng cấp TaskMaster <span className="text-[#28B8FA]">Pro</span>
              </h3>
              <p className="text-slate-500 text-sm font-medium text-center px-12 leading-relaxed mb-8">
                Mở khóa tính năng nhiệm vụ thăng cấp hằng ngày và nhận x2 EXP
                khi hoàn thành.
              </p>
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group">
                Mở khóa ngay
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/40 transition-colors">
                  <PlusIcon className="w-3 h-3 rotate-45" />
                </div>
              </button>
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Chỉ từ 9.000đ / tháng
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT WIDGETS */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">
              Lịch trình sắp tới
            </h3>
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-stretch gap-3">
                      <div className="w-1 bg-slate-100 rounded-full h-10"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : fetchError ? (
                <p className="text-[10px] text-red-400 font-bold bg-red-50 p-2 rounded-lg">
                  {fetchError}
                </p>
              ) : upcomingTasks.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Tuyệt vời!
                    <br />
                    Không có deadline nào trong 6 ngày tới.
                  </p>
                </div>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-stretch gap-2 group cursor-default"
                  >
                    <div className="w-1 bg-[#34D399] rounded-full shrink-0 group-hover:bg-[#28B8FA] transition-colors"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-slate-900 transition-colors">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-black text-[#28B8FA] bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter truncate max-w-[120px]">
                          {task.project_title}
                        </p>
                        <span className="text-[10px] text-slate-300">•</span>
                        <p className="text-[10px] font-bold text-slate-400">
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString(
                                "vi-VN",
                                { day: "numeric", month: "numeric" },
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Bạn đang nghĩ gì?"
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
                    <BriefcaseIcon /> Công việc
                  </button>
                  <button
                    onClick={() => toggleTag("Personal")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Personal") ? "bg-[#D1FAE5] text-[#34D399]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                  >
                    <UserIcon /> Cá nhân
                  </button>
                  <button
                    onClick={() => toggleTag("Urgent")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Urgent") ? "bg-[#FFF2DE] text-[#FF8B5E]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                  >
                    <ZapIcon /> Khẩn cấp
                  </button>
                </div>
                <div className="ml-auto">
                  {selectedTags.length === 0 ? (
                    <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-4xl w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      Tạo nhiệm vụ
                    </button>
                  ) : (
                    <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">
                      Thêm nhiệm vụ{" "}
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
    </>
  );
}
