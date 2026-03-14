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
  const projTeam = proj.team ?? 3;

  return (
    <div
      onClick={() => setSelectedProject(proj)}
      className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-bold text-white px-3 py-1.5 rounded-full uppercase"
          style={{ backgroundColor: projColor }}
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
            className="text-slate-300 hover:text-[#28B8FA] bg-slate-50 hover:bg-[#EAF7FF] rounded-full p-2 transition-colors"
          >
            <MoreIcon />
          </button>
          {openMenuProjectId === proj.id && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateProject(proj);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-[#EAF7FF] hover:text-[#28B8FA] transition-colors"
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
                Update
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(proj.id, proj.title);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-[#28B8FA] transition-colors tracking-tight">
        {proj.title}
      </h3>
      <p className="text-sm text-slate-500 font-medium mb-8 flex-1 leading-relaxed">
        {proj.description ||
          "A comprehensive sub-project focusing on delivering specific objectives for the next sprint iteration."}
      </p>

      <div className="w-full mb-8">
        <div className="flex justify-between text-xs font-bold mb-3">
          <span className="text-slate-500">Progress</span>
          <span style={{ color: projColor }}>{projProgress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${projProgress}%`,
              backgroundColor: projColor,
            }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-6">
        <div className="flex -space-x-2">
          {Array.from({ length: projTeam }).map((_, i) => (
            <img
              key={i}
              src={`https://api.dicebear.com/7.x/notionists/svg?seed=P${proj.id}${i}`}
              className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm"
              alt="Team"
            />
          ))}
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#28B8FA] group-hover:text-white transition-colors shadow-sm">
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
