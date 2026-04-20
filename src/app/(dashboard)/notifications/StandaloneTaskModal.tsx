"use client";

import React, { useState, useEffect } from "react";
import { XIcon, BriefcaseIcon } from "@/components/icons";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getDeadlineStatus } from "@/utils/deadline";

interface StandaloneTaskModalProps {
  taskId: number | null;
  onClose: () => void;
}

export function StandaloneTaskModal({ taskId, onClose }: StandaloneTaskModalProps) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setError(null);
      return;
    }

    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*, column:columns(board_id, title), assignee:users!assignee_id(display_name)")
          .eq("id", taskId)
          .single();

        if (error) throw error;
        setTask(data);
      } catch (err: any) {
        console.error(err);
        setError("Không thể tải thông tin nhiệm vụ.");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, supabase]);

  const toggleComplete = async () => {
    if (!task) return;
    const previousCompleteState = task.is_completed;
    const newCompleteState = !task.is_completed;
    
    // Optimistic Update
    setTask({ ...task, is_completed: newCompleteState });

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: newCompleteState })
        .eq("id", task.id);

      if (error) throw error;
      toast.success(newCompleteState ? "Đã đánh dấu hoàn thành" : "Đã bỏ đánh dấu hoàn thành");
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật trạng thái thất bại");
      // Revert Optimistic Update
      setTask({ ...task, is_completed: previousCompleteState });
    }
  };

  if (!taskId) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-20 bg-slate-100 p-2 rounded-full"
        >
          <XIcon />
        </button>

        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 font-bold min-h-[300px] flex items-center justify-center">
            {error}
          </div>
        ) : task ? (
          <div className="p-6 md:p-8 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <BriefcaseIcon />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[#28B8FA] uppercase tracking-widest truncate">
                  {task.column?.title ? `CỘT: ${task.column.title}` : "THÔNG TIN NHIỆM VỤ"}
                </p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2">
                  {task.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Độ ưu tiên
                </p>
                <div
                  className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold leading-none ${
                    task.priority === "High"
                      ? "bg-red-50 text-red-500"
                      : task.priority === "Medium"
                        ? "bg-orange-50 text-orange-500"
                        : "bg-emerald-50 text-emerald-500"
                  }`}
                >
                  {task.priority || "Low"}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Hạn chót
                </p>
                {task.deadline ? (
                  <div
                    className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold leading-none ${
                        getDeadlineStatus(task.deadline).color === 'red' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {new Date(task.deadline).toLocaleDateString("vi-VN")}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500">
                    Không có
                  </p>
                )}
              </div>
            </div>

            {task.description && (
              <div className="mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Mô tả
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </div>
              </div>
            )}

            <button
              onClick={toggleComplete}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors ${
                task.is_completed
                  ? "bg-emerald-50 text-emerald-500 hover:bg-emerald-100 border border-emerald-100"
                  : "bg-white text-slate-500 border-2 border-slate-200 hover:border-[#28B8FA] hover:text-[#28B8FA]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.is_completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300"
                }`}
              >
                {task.is_completed && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              {task.is_completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
               Để chỉnh sửa chi tiết hơn, hãy truy cập vào dự án gốc.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
