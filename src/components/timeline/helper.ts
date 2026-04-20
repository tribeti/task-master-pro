import { KanbanTask as Task } from "@/types/project";

export type TimelineTask = Task & { created_at?: string };

export const BAR_COLORS = [
  {
    bg: "bg-gradient-to-r from-violet-500 to-purple-500",
    shadow: "shadow-violet-200",
  },
  {
    bg: "bg-gradient-to-r from-pink-500 to-rose-500",
    shadow: "shadow-pink-200",
  },
  {
    bg: "bg-gradient-to-r from-cyan-500 to-teal-500",
    shadow: "shadow-cyan-200",
  },
  {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    shadow: "shadow-amber-200",
  },
  {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    shadow: "shadow-blue-200",
  },
  {
    bg: "bg-gradient-to-r from-emerald-500 to-green-500",
    shadow: "shadow-emerald-200",
  },
  {
    bg: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
    shadow: "shadow-fuchsia-200",
  },
  { bg: "bg-gradient-to-r from-sky-500 to-blue-500", shadow: "shadow-sky-200" },
  {
    bg: "bg-gradient-to-r from-lime-500 to-emerald-500",
    shadow: "shadow-lime-200",
  },
  {
    bg: "bg-gradient-to-r from-red-400 to-orange-400",
    shadow: "shadow-red-200",
  },
];

export function getPriorityBadgeStyle(priority: string) {
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

export function getPriorityLabel(priority: string) {
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

export function getBarColor(taskId: number) {
  return BAR_COLORS[taskId % BAR_COLORS.length];
}

export function getPriorityBarColor(priority: string) {
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

export function getPriorityColor(priority: string) {
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
