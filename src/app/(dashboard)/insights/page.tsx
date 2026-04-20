"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Task } from "@/types/project";

interface InsightsTask extends Task {
  columns: { title: string } | { title: string }[];
}

const PIE_COLORS = [
  "#34D399",
  "#28B8FA",
  "#FF8B5E",
  "#A78BFA",
  "#FBBF24",
  "#F472B6",
];

export default function InsightsPage() {
  const [data, setData] = useState<InsightsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      try {
        const supabase = createClient();

        // 1. Get the authenticated user
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw authErr || new Error("Unauthorized");

        // 2. Fetch boards user has access to (owned or as member)
        const [ownedRes, memberRes] = await Promise.all([
          supabase.from("boards").select("id").eq("owner_id", user.id),
          supabase.from("board_members").select("board_id").eq("user_id", user.id),
        ]);

        if (ownedRes.error) throw ownedRes.error;
        if (memberRes.error) throw memberRes.error;

        const accessibleBoardIds = [
          ...(ownedRes.data?.map((b) => b.id) || []),
          ...(memberRes.data?.map((m) => m.board_id) || []),
        ];

        // 3. If no boards, set empty data
        if (accessibleBoardIds.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // 4. Fetch tasks and join with columns to get the status title
        // We use columns!inner to filter by the board_id from the accessible list
        const { data: tasks, error: supabaseError } = await supabase
          .from("tasks")
          .select("*, columns!inner(title, board_id)")
          .in("columns.board_id", accessibleBoardIds);

        if (supabaseError) throw supabaseError;
        setData(tasks || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="px-10 pt-10 pb-20 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-100 bg-slate-100 rounded-xl" />
          <div className="h-100 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-10 py-10">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100">
          <h2 className="font-bold text-lg mb-2">
            Không thể tải dữ liệu phân tích
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // --- CALCULATIONS ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalTasks = data.length;
  let completedTasks = 0;
  let overdueTasks = 0;

  const priorityCount = {
    High: 0,
    Medium: 0,
    Low: 0,
  };

  const statusCount: Record<string, number> = {};

  data.forEach((task) => {
    const colInfo = Array.isArray(task.columns)
      ? task.columns[0]
      : task.columns;
    const columnTitle = colInfo?.title || "Unknown";
    const columnTitleLower = columnTitle.toLowerCase();

    // 1. Completed
    if (task.is_completed) {
      completedTasks++;
    }

    // 2. Overdue (only if NOT completed)
    if (!task.is_completed && task.deadline) {
      const [year, month, day] = String(task.deadline)
        .slice(0, 10)
        .split("-")
        .map(Number);
      const dueDate = new Date(year, month - 1, day);
      if (dueDate < today) {
        overdueTasks++;
      }
    }

    // 3. Priorities
    const priority = task.priority || "Low";
    const p = priority.toLowerCase();
    if (p === "high") priorityCount.High++;
    else if (p === "medium") priorityCount.Medium++;
    else priorityCount.Low++;

    // 4. Status distribution
    let statusLabel = columnTitle;
    if (columnTitleLower === "to do") statusLabel = "Cần làm";
    else if (columnTitleLower === "in progress") statusLabel = "Đang làm";

    else if (["done", "hoàn thành", "completed"].includes(columnTitleLower)) {
      statusLabel = "Chưa hoàn thành";
    }

    if (task.is_completed) {
      statusLabel = "Hoàn thành";
    }

    statusCount[statusLabel] = (statusCount[statusLabel] || 0) + 1;
  });

  const completionRate =
    totalTasks === 0 ? 0 : ((completedTasks / totalTasks) * 100).toFixed(1);

  const pieChartData = Object.keys(statusCount).map((key) => ({
    name: key,
    value: statusCount[key],
  }));

  const barChartData = [
    { name: "Cao", value: priorityCount.High, fill: "#ef4444" },
    { name: "Trung bình", value: priorityCount.Medium, fill: "#f59e0b" },
    { name: "Thấp", value: priorityCount.Low, fill: "#10b981" },
  ];

  return (
    <>
      {/* HEADER */}
      <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 pt-10 pb-6">
        <div>
          <p className="text-[10px] font-bold text-[#28B8FA] uppercase tracking-widest mb-2">
            Tổng quan Phân tích
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Phân tích Dự án
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Chỉ số theo thời gian thực và phân tích phân bổ công việc.
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <div className="px-10 pb-20 flex flex-col gap-6">
        {/* 1. KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tasks Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Tổng số công việc
              </h3>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800">{totalTasks}</p>
          </div>

          {/* Completed Tasks Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Hoàn thành
              </h3>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800">
              {completedTasks}
            </p>
          </div>

          {/* Completion Rate Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Tỷ lệ hoàn thành
              </h3>
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="5" x2="5" y2="19" />
                  <circle cx="6.5" cy="6.5" r="2.5" />
                  <circle cx="17.5" cy="17.5" r="2.5" />
                </svg>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-slate-800">
                {completionRate}
                <span className="text-2xl text-slate-400">%</span>
              </p>
            </div>
          </div>

          {/* Overdue Tasks Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Quá hạn
              </h3>
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-black text-slate-800">{overdueTasks}</p>
          </div>
        </div>

        {/* 2. CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Pie Chart: Status Distribution */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow min-w-0">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Phân bố Trạng thái Công việc
            </h2>
            <div className="w-full h-75">
              {mounted && pieChartData.length > 0 ? (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  minWidth={0}
                  minHeight={0}
                  debounce={1}
                >
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", fontWeight: "500" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                  Không có dữ liệu trạng thái
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart: Priority Analysis */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow min-w-0">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              Phân tích Mức độ Ưu tiên
            </h2>
            <div className="w-full h-75">
              {mounted && (
                <ResponsiveContainer
                  width="100%"
                  height={300}
                  minWidth={0}
                  minHeight={0}
                  debounce={1}
                >
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 13, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 13 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
