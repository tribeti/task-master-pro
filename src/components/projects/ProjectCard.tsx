import React from "react";
import { MoreIcon } from "@/components/icons";
import { Board } from "@/types/project";

const DEFAULT_COLORS = ["#FF8B5E", "#28B8FA", "#34D399", "#A78BFA", "#F472B6"];

interface ProjectCardProps {
  proj: Board;
  index: number;
  openMenuProjectId: number | null;
  menuRef: React.RefObject<HTMLDivElement>;
  setOpenMenuProjectId: (id: number | null) => void;
  handleUpdateProject: (proj: Board) => void;
  handleDeleteProject: (id: number, title: string) => void;
  setSelectedProject: (proj: Board) => void;
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
}: ProjectCardProps) {
  const projColor = proj.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const projProgress = proj.progress ?? 0;
  const projTag = proj.tag || "Project";
  const projTeamCount = proj.team ?? 3;
  const projCreatedAt = proj.created_at?.split("T")[0];

  // Background color for the tag (lighter version of the main color)
  const tagBgColor = `${projColor}15`; // 15% opacity hex

  // Circular progress calculations
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (projProgress / 100) * circumference;

  return (
    <div
      onClick={() => setSelectedProject(proj)}
      className="bg-white mt-1 rounded-[40px] p-8 shadow-sm transition-all cursor-pointer group flex flex-col h-full hover:shadow-xl hover:-translate-y-1 relative border-2"
      style={{ borderColor: projColor }}
    >
      <div className="flex items-center justify-between mb-6">
        <span
          className="text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider"
          style={{ backgroundColor: tagBgColor, color: projColor }}
        >
          {projTag}
        </span>
        <div
          className="relative"
          ref={
            openMenuProjectId === proj.id
              ? (menuRef as React.RefObject<HTMLDivElement>)
              : null
          }
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuProjectId(
                openMenuProjectId === proj.id ? null : proj.id,
              );
            }}
            className="text-slate-300 hover:text-slate-500 p-1"
          >
            <MoreIcon />
          </button>

          {openMenuProjectId === proj.id && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateProject(proj);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(proj.id, proj.title);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Project
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-[28px] font-black text-slate-900 mb-8 leading-[1.1] tracking-tight hover:text-slate-700 transition-colors">
        {proj.title}
      </h3>

      <div className="flex items-center gap-8 mb-10">
        {/* CIRCULAR PROGRESS */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={projColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-sm font-black text-slate-800">
            {projProgress}%
          </span>
        </div>

        {/* TASK STATS */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{Math.round(projProgress * 0.3)}</span>
            <span className="text-xl font-bold text-slate-300">/40</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Tasks Complete
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        {/* TEAM AVATARS */}
        <div className="flex -space-x-3">
          {Array.from({ length: Math.min(projTeamCount, 3) }).map((_, i) => (
            <img
              key={i}
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=P${proj.id}${i}`}
              className="w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm ring-1 ring-slate-100"
              alt="Team"
            />
          ))}
          {projTeamCount > 3 && (
            <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[11px] font-black text-slate-400 shadow-sm ring-1 ring-slate-100">
              +{projTeamCount - 3}
            </div>
          )}
        </div>

        {/* STATUS LABEL */}
        <div className="px-5 py-2 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 tracking-wide">
            {projCreatedAt}
          </span>
        </div>
      </div>
    </div>
  );
}
