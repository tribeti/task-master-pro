"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, UserIcon, ChatIcon } from "@/components/icons";
import {
  TasksTab,
  TimelineTab,
  FilesTab,
  TeamTab,
} from "@/components/project-tabs";
import ProjectCard from "@/components/projects/ProjectCard";
import QuickEntryModal from "@/components/projects/QuickEntryModal";
import DeleteConfirmModal from "@/components/projects/DeleteConfirmModal";
import CreateProjectModal from "@/components/CreateProjectModal";
import { useDashboardUser } from "../provider";
import { useProjects } from "@/hooks/useProjects";
import { Board } from "@/types/project";

export default function ProjectsPage() {
  const { user } = useDashboardUser();
  const userId = user?.id;

  const {
    boards,
    boardsLoading,
    isSubmitting,
    confirmDeleteProject,
    handleCreateProject,
  } = useProjects(userId);

  // --- STATES ---
  const [projectTab, setProjectTab] = useState<
    "Tasks" | "Timeline" | "Files" | "Team"
  >("Timeline");
  const [selectedProject, setSelectedProject] = useState<Board | null>(null);

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const [openMenuProjectId, setOpenMenuProjectId] = useState<number | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    projectId: number | null;
    projectTitle: string;
  }>({ isOpen: false, projectId: null, projectTitle: "" });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuProjectId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleDeleteProject = (projectId: number, projectTitle: string) => {
    setOpenMenuProjectId(null);
    setDeleteConfirm({ isOpen: true, projectId, projectTitle });
  };

  const onConfirmDelete = async () => {
    if (!deleteConfirm.projectId) return;
    const success = await confirmDeleteProject(deleteConfirm.projectId);
    if (success) {
      setDeleteConfirm({ isOpen: false, projectId: null, projectTitle: "" });
      if (selectedProject?.id === deleteConfirm.projectId) {
        setSelectedProject(null);
      }
    }
  };

  const handleUpdateProject = (proj: Board) => {
    setOpenMenuProjectId(null);
    setSelectedProject(proj);
  };

  const onCreateProject = async (data: {
    title: string;
    description: string;
    is_private: boolean;
    color: string;
    tag: string;
    projectDeadline: string;
    selectedTeamMembers: string[];
  }) => {
    const success = await handleCreateProject(data);
    if (success) {
      setIsCreateProjectOpen(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // --- RENDER ---
  const renderAllProjects = () => (
    <div className="flex-1 px-10 pb-20 overflow-y-auto mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {boardsLoading
          ? Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 flex flex-col h-full animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
              </div>
              <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-3"></div>
              <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-slate-100 rounded mb-8"></div>
              <div className="w-full mb-8">
                <div className="h-2.5 bg-slate-100 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="flex -space-x-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={j}
                      className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ))
          : boards.map((proj, index) => {
            return (
              <ProjectCard
                key={proj.id}
                proj={proj}
                index={index}
                openMenuProjectId={openMenuProjectId}
                setOpenMenuProjectId={setOpenMenuProjectId}
                menuRef={menuRef}
                handleUpdateProject={handleUpdateProject}
                handleDeleteProject={handleDeleteProject}
                setSelectedProject={setSelectedProject}
              />
            );
          })}

        {/* Create New Project Card */}
        <div
          onClick={() => setIsCreateProjectOpen(true)}
          className="bg-slate-50 rounded-[40px] p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 transition-all min-h-[320px] group h-full hover:border-[#28B8FA]"
        >
          <div className="w-20 h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-6 group-hover:scale-110 transition-transform">
            <PlusIcon />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">New Project</h3>
          <p className="text-sm text-slate-400 font-bold px-4">
            Start tracking a new initiative.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 pt-10 pb-6">
        <div>
          {selectedProject ? (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span className="text-[#28B8FA]">ACTIVE SPRINT</span>{" "}
                <span className="mx-2 text-slate-300">&gt;</span> Q4 INITIATIVES
              </p>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-slate-700 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center -ml-1 mr-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                {selectedProject.title}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Active Projects
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                You have{" "}
                <span className="text-[#34D399] font-bold">
                  {boards.length} active
                </span>{" "}
                projects pushing forward.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {selectedProject ? (
            <>
              {projectTab === "Files" && (
                <div className="flex -space-x-2 mr-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                    AM
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#FF8B5E] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                    JD
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#34D399] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                    KL
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    +2
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsQuickEntryOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md transition-transform hover:scale-105 text-sm font-semibold text-white ${projectTab === "Team" ? "bg-[#1E293B] shadow-slate-300" : "bg-[#28B8FA] shadow-cyan-200"}`}
              >
                {projectTab === "Team" ? (
                  <>
                    <UserIcon /> Invite Member
                  </>
                ) : (
                  <>
                    <PlusIcon /> Add Task
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-slate-300 hover:scale-105"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <PlusIcon />
              </div>
              New Project
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedProject ? (
          renderAllProjects()
        ) : (
          <>
            <div className="px-10 border-b border-slate-200 flex gap-8 shrink-0">
              {["Tasks", "Timeline", "Files", "Team"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectTab(tab as any)}
                  className={`pb-4 font-bold text-sm transition-colors relative ${projectTab === tab ? "text-[#28B8FA]" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {tab}
                  {projectTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#28B8FA] rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 px-10 flex flex-col overflow-hidden pb-10">
              {projectTab === "Tasks" && (
                <TasksTab projectId={selectedProject.id} />
              )}
              {projectTab === "Timeline" && <TimelineTab />}
              {projectTab === "Files" && <FilesTab />}
              {projectTab === "Team" && <TeamTab />}
            </div>
          </>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {selectedProject ? (
        <button
          className={`absolute bottom-8 right-8 w-14 h-14 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg text-white z-20 ${projectTab === "Timeline"
            ? "bg-[#1E293B] shadow-slate-400"
            : "bg-[#34D399] shadow-emerald-200"
            }`}
        >
          {projectTab === "Timeline" ? (
            <ChatIcon />
          ) : projectTab === "Files" ? (
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          ) : (
            <PlusIcon />
          )}
        </button>
      ) : (
        <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#34D399] hover:bg-emerald-500 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-white z-10">
          <PlusIcon />
        </button>
      )}

      {/* QUICK ENTRY MODAL */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            projectId: null,
            projectTitle: "",
          })
        }
        onConfirm={onConfirmDelete}
        projectTitle={deleteConfirm.projectTitle}
      />

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={onCreateProject}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
