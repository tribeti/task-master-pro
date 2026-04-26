import React from "react";
import { MoreIcon } from "@/components/icons";
import { Board } from "@/lib/types/project";

const DEFAULT_COLORS = ["#FF8B5E", "#28B8FA", "#34D399", "#A78BFA", "#F472B6"];

import { useDashboardUser } from "@/app/(dashboard)/provider";

interface ProjectCardProps {
  proj: Board;
  index: number;
  openMenuProjectId: number | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  setOpenMenuProjectId: (id: number | null) => void;
  handleUpdateProject: (proj: Board) => void;
  handleDeleteProject: (id: number, title: string) => void;
  setSelectedProject: (proj: Board) => void;
  currentUserId?: string;
  memberRole?: string;
}

export default function ProjectCard({
  proj,
  index,
  openMenuProjectId,
  menuRef,
  setOpenMenuProjectId,
  handleUpdateProject,
  handleDeleteProject,
  setSelectedProject,
  currentUserId,
  memberRole,
}: ProjectCardProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const projColor = proj.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const projProgress = proj.progress ?? 0;
  const projTag = proj.tag || "Dự án";
  const projTeam = proj.team ?? 3;

  return (
    <div
      onClick={() => setSelectedProject(proj)}
      className={`rounded-4xl p-6 shadow-sm border transition-all cursor-pointer group flex flex-col h-full hover:-translate-y-1 ${
        isCozy 
          ? "bg-[#0F172A] border-slate-700 hover:shadow-orange-900/10 hover:border-slate-600" 
          : "bg-white border-slate-100 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold text-white px-3 py-1.5 rounded-full uppercase"
            style={{ backgroundColor: projColor }}
          >
            {projTag}
          </span>
          {memberRole && (
            <span
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase ${
                memberRole === "Owner"
                  ? (isCozy ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-700")
                  : (isCozy ? "bg-sky-900/30 text-sky-400" : "bg-sky-100 text-sky-700")
                }`}
            >
              {memberRole === "Owner" ? "Chủ sở hữu" : "Thành viên"}
            </span>
          )}
        </div>
        <div
          className="relative"
          ref={
            openMenuProjectId === proj.id
              ? (menuRef as React.RefObject<HTMLDivElement>)
              : null
          }
        >
          {proj.owner_id === currentUserId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuProjectId(
                  openMenuProjectId === proj.id ? null : proj.id,
                );
              }}
              className={`rounded-full p-2 transition-colors ${
                isCozy 
                  ? "text-slate-500 hover:text-[#FF8B5E] bg-slate-800 hover:bg-slate-700" 
                  : "text-slate-300 hover:text-[#28B8FA] bg-slate-50 hover:bg-[#EAF7FF]"
              }`}
            >
              <MoreIcon />
            </button>
          )}
          {openMenuProjectId === proj.id && proj.owner_id === currentUserId && (
            <div className={`absolute right-0 top-full mt-2 w-40 rounded-2xl shadow-lg border py-2 z-50 ${
              isCozy ? "bg-[#1E293B] border-slate-700" : "bg-white border-slate-100"
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateProject(proj);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isCozy 
                    ? "text-slate-300 hover:bg-slate-800 hover:text-[#FF8B5E]" 
                    : "text-slate-600 hover:bg-[#EAF7FF] hover:text-[#28B8FA]"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Cập nhật
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(proj.id, proj.title);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isCozy 
                    ? "text-red-400 hover:bg-red-900/20 hover:text-red-500" 
                    : "text-red-500 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className={`text-2xl font-black mb-3 transition-colors tracking-tight ${
        isCozy 
          ? "text-white group-hover:text-[#FF8B5E]" 
          : "text-slate-800 group-hover:text-[#28B8FA]"
      }`}>
        {proj.title}
      </h3>
      <p className={`text-sm font-medium mb-8 flex-1 leading-relaxed ${isCozy ? "text-slate-400" : "text-slate-500"}`}>
        {proj.description ||
          "A comprehensive sub-project focusing on delivering specific objectives for the next sprint iteration."}
      </p>

      <div className={`flex items-center justify-between border-t pt-6 ${isCozy ? "border-slate-800" : "border-slate-100"}`}>
        <div className="flex -space-x-2"></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
          isCozy 
            ? "bg-slate-800 text-slate-500 group-hover:bg-[#FF8B5E] group-hover:text-white" 
            : "bg-slate-50 text-slate-400 group-hover:bg-[#28B8FA] group-hover:text-white"
        }`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
}
