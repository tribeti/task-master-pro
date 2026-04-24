"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PlusIcon } from "@/components/icons";
import {
  TasksTab,
  ChatTab,
  TimelineTab,
  FilesTab,
  TeamTab,
} from "@/components/project-tabs";
import ProjectCard from "@/components/projects/ProjectCard";
import QuickEntryModal from "@/components/projects/QuickEntryModal";
import DeleteConfirmModal from "@/components/projects/DeleteConfirmModal";
import CreateProjectModal from "@/components/CreateProjectModal";
import UpdateProjectModal from "@/components/projects/UpdateProjectModal";
import { useDashboardUser } from "../provider";
import { useProjects } from "@/hooks/useProjects";
import { Board } from "@/types/project";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ProjectUrlHandler({
  ownedBoards,
  joinedBoards,
  boardsLoading,
  selectedProjectId,
  currentTab,
  onProjectFound,
}: {
  ownedBoards: Board[];
  joinedBoards: Board[];
  boardsLoading: boolean;
  selectedProjectId?: number;
  currentTab: string;
  onProjectFound: (project: Board, tab: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const urlProjectId = searchParams.get("projectId");
  const urlTab = searchParams.get("tab");
  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!boardsLoading && urlProjectId) {
      const currentKey = `${urlProjectId}-${urlTab || ""}`;
      
      // If we just applied this exact URL state, skip to prevent reopening if user manually closed it
      if (lastAppliedRef.current === currentKey) {
        return;
      }

      const id = parseInt(urlProjectId, 10);
      const isNewProject = selectedProjectId !== id;
      const isNewTab = urlTab && currentTab !== urlTab;

      if (isNewProject || isNewTab) {
        const found =
          ownedBoards.find((b) => b.id === id) ||
          joinedBoards.find((b) => b.id === id);
        if (found) {
          onProjectFound(found, urlTab);
          lastAppliedRef.current = currentKey;
        }
      }
    } else if (!urlProjectId) {
      // Clear the ref when url clears, so they can reopen it later
      lastAppliedRef.current = null;
    }
  }, [
    boardsLoading,
    urlProjectId,
    urlTab,
    ownedBoards,
    joinedBoards,
    selectedProjectId,
    currentTab,
    onProjectFound,
  ]);

  return null;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useDashboardUser();
  const userId = user?.id;

  const {
    ownedBoards,
    joinedBoards,
    boardsLoading,
    isSubmitting,
    fetchBoards,
    confirmDeleteProject,
    handleCreateProject,
    handleUpdateExistingProject,
  } = useProjects(userId);

  // --- STATES ---
  const [projectTab, setProjectTab] = useState<
    "Tasks" | "Chat" | "Timeline" | "Files" | "Team"
  >("Tasks");
  const [selectedProject, setSelectedProject] = useState<Board | null>(null);
  const selectedProjectRef = useRef<Board | null>(null);

  // Keep the ref in sync so the realtime callback always sees the latest value
  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
    router.replace("/projects", { scroll: false });
  }, [router]);

  const handleProjectFoundFromUrl = useCallback(
    (foundProject: Board, tab: string | null) => {
      setSelectedProject(foundProject);
      if (
        tab === "Tasks" ||
        tab === "Chat" ||
        tab === "Timeline" ||
        tab === "Files" ||
        tab === "Team"
      ) {
        setProjectTab(tab as any);
      }
    },
    [],
  );

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isUpdateProjectOpen, setIsUpdateProjectOpen] = useState(false);
  const [projectToUpdate, setProjectToUpdate] = useState<Board | null>(null);

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

  // ── Realtime: detect when current user is removed from ANY board ──
  // This runs always so the board list updates even on the Dashboard view.
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`board-members-kick-global-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "board_members",
        },
        (payload) => {
          const oldRow = payload.old as { user_id?: string; board_id?: number };
          if (oldRow?.user_id === userId) {
            // Read from ref to avoid stale closure
            const current = selectedProjectRef.current;
            if (current && oldRow.board_id === current.id) {
              toast.error("Bạn đã bị xóa khỏi dự án này.");
              handleCloseProject();
            }
            fetchBoards();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBoards]);

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
        handleCloseProject();
      }
    }
  };

  const handleUpdateProject = (proj: Board) => {
    setOpenMenuProjectId(null);
    setProjectToUpdate(proj);
    setIsUpdateProjectOpen(true);
  };

  const onUpdateProjectSubmit = async (
    projectId: number,
    data: Partial<Board>,
  ) => {
    const success = await handleUpdateExistingProject(projectId, data);
    if (success) {
      setIsUpdateProjectOpen(false);
      setProjectToUpdate(null);
    }
  };

  const onCreateProject = async (data: {
    title: string;
    description: string;
    is_private: boolean;
    color: string;
    tag: string;
    selectedTeamMembers: string[];
  }) => {
    const success = await handleCreateProject(data);
    if (success) {
      setIsCreateProjectOpen(false);
    }
  };

  const totalProjects = ownedBoards.length + joinedBoards.length;

  // --- Skeleton cards for loading state ---
  const renderSkeletonCards = () =>
    Array.from({ length: 3 }).map((_, i) => (
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
    ));

  // --- RENDER ---
  const renderAllProjects = () => (
    <div className="flex-1 px-10 pb-20 overflow-y-auto mt-6">
      {/* ── My Projects ── */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-slate-700 tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          Dự án của tôi
          <span className="text-sm font-semibold text-slate-400 ml-1">
            ({ownedBoards.length})
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {boardsLoading
          ? renderSkeletonCards()
          : ownedBoards.map((proj, index) => (
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
                currentUserId={userId}
                memberRole="Owner"
              />
            ))}

        {/* Create New Project Card */}
        <div
          onClick={() => setIsCreateProjectOpen(true)}
          className="bg-transparent rounded-4xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-75 group h-full"
        >
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <PlusIcon />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Dự án mới</h3>
          <p className="text-sm text-slate-400 font-medium px-4">
            Bắt đầu theo dõi một sáng kiến mới.
          </p>
        </div>
      </div>

      {/* ── Joined Projects ── */}
      {!boardsLoading && joinedBoards.length > 0 && (
        <>
          <div className="mt-12 mb-4">
            <h2 className="text-lg font-extrabold text-slate-700 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
              Dự án đã tham gia
              <span className="text-sm font-semibold text-slate-400 ml-1">
                ({joinedBoards.length})
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {joinedBoards.map((proj, index) => (
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
                currentUserId={userId}
                memberRole={proj.member_role || "Member"}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      className={
        selectedProject ? "flex flex-col h-screen overflow-hidden" : ""
      }
    >
      <Suspense fallback={null}>
        <ProjectUrlHandler
          ownedBoards={ownedBoards}
          joinedBoards={joinedBoards}
          boardsLoading={boardsLoading}
          selectedProjectId={selectedProject?.id}
          currentTab={projectTab}
          onProjectFound={handleProjectFoundFromUrl}
        />
      </Suspense>
      <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 pt-10 pb-6">
        <div>
          {selectedProject ? (
            <>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <button
                  onClick={handleCloseProject}
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
                Dự án hoạt động
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Bạn đang có{" "}
                <span className="text-[#34D399] font-bold">
                  {totalProjects} dự án
                </span>{" "}
                đang được triển khai.
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
            </>
          ) : (
            <button
              onClick={() => setIsCreateProjectOpen(true)}
              className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg shadow-slate-300 hover:scale-105"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <PlusIcon />
              </div>
              Dự án mới
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
              {[
                { id: "Tasks", label: "Nhiệm vụ" },
                { id: "Chat", label: "Trò chuyện" },
                { id: "Timeline", label: "Lịch trình" },
                { id: "Files", label: "Tệp tin" },
                { id: "Team", label: "Nhóm" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProjectTab(tab.id as any)}
                  className={`pb-4 font-bold text-sm transition-colors relative ${projectTab === tab.id ? "text-[#28B8FA]" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {tab.label}
                  {projectTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#28B8FA] rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 px-10 flex flex-col overflow-hidden pb-10 min-h-0">
              {projectTab === "Tasks" && (
                <TasksTab projectId={selectedProject.id} />
              )}
              {projectTab === "Chat" && (
                <ChatTab projectId={selectedProject.id} />
              )}
              {projectTab === "Timeline" && (
                <TimelineTab projectId={selectedProject.id} />
              )}
              {projectTab === "Files" && <FilesTab />}
              {projectTab === "Team" && (
                <TeamTab boardId={selectedProject.id} />
              )}
            </div>
          </>
        )}
      </div>

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

      {/* UPDATE PROJECT MODAL */}
      <UpdateProjectModal
        isOpen={isUpdateProjectOpen}
        onClose={() => {
          setIsUpdateProjectOpen(false);
          setProjectToUpdate(null);
        }}
        initialData={projectToUpdate}
        onSubmit={onUpdateProjectSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
