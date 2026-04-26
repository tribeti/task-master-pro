import { XIcon } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import {
  getBarColor,
  TimelineTask,
  getPriorityLabel,
  getPriorityBadgeStyle,
} from "./helper";

export function TaskPreviewModal({
  task,
  onClose,
}: {
  task: TimelineTask;
  task: TimelineTask;
  onClose: () => void;
}) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const hasDeadline = !!task.deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysLeft: number | null = null;
  if (hasDeadline) {
    const deadlineDate = new Date(task.deadline!);
    deadlineDate.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  const assignees = task.assignees || [];

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200 ${
        isCozy ? "bg-slate-950/60" : "bg-slate-900/40"
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-[2.5rem] shadow-2xl w-full max-w-lg relative mx-4 animate-in zoom-in-95 duration-200 overflow-hidden transition-colors duration-500 ${
          isCozy ? "bg-[#0F172A] border border-slate-800" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 transition-colors z-10 p-1 rounded-full backdrop-blur-md ${
            isCozy ? "bg-slate-800 text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600 bg-white/80"
          }`}
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
              {hasDeadline &&
                daysLeft !== null &&
                daysLeft >= 0 &&
                daysLeft <= 3 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-white animate-pulse">
                    ⚠ Còn {daysLeft} ngày
                  </span>
                )}
            </div>
            <h2 className={`text-2xl font-bold mt-3 ${isCozy ? "text-white" : "text-slate-900"}`}>
              {task.title}
            </h2>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Mô tả
              </label>
              <p className={`text-sm leading-relaxed rounded-2xl p-4 border ${
                isCozy ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 text-slate-600 border-slate-100"
              }`}>
                {task.description}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl p-4 border ${isCozy ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Ngày tạo
              </label>
              <p className={`text-sm font-semibold ${isCozy ? "text-slate-300" : "text-slate-700"}`}>
                {task.created_at
                  ? new Date(task.created_at).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className={`rounded-2xl p-4 border ${isCozy ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Hạn chót
              </label>
              <p
                className={`text-sm font-semibold ${
                  daysLeft !== null && daysLeft < 0
                    ? "text-red-500"
                    : daysLeft !== null && daysLeft <= 3
                      ? "text-amber-500"
                      : (isCozy ? "text-slate-300" : "text-slate-700")
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
                    className={`flex items-center gap-2 rounded-full pr-4 pl-1 py-1 border transition-colors ${
                      isCozy ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <UserAvatar
                      avatarUrl={a.avatar_url}
                      displayName={a.display_name}
                      className="w-8 h-8"
                      fallbackClassName={isCozy ? "bg-slate-800 text-slate-400" : "bg-[#EAF7FF] text-[#0284C7]"}
                    />
                    <span className={`text-sm font-semibold ${isCozy ? "text-slate-300" : "text-slate-700"}`}>
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
