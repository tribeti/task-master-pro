"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  PlusIcon,
  MoreIcon,
  XIcon,
  BriefcaseIcon,
  ZapIcon,
  UserIcon,
  ChatIcon,
  CheckIcon,
} from "@/components/icons";
import {
  TasksTab,
  TimelineTab,
  FilesTab,
  TeamTab,
} from "@/components/project-tabs";
import Image from "next/image";
import CreateProjectModal from "@/components/CreateProjectModal";
import { createClient } from "@/utils/supabase/client";
import { useDashboardUser } from "../provider";
import { toast } from "sonner";

interface Board {
  id: number;
  title: string;
  progress?: number;
  color?: string;
  tag?: string;
  team?: number;
  description?: string;
}

const DEFAULT_COLORS = ["#FF8B5E", "#28B8FA", "#34D399", "#A78BFA", "#F472B6"];

interface Project {
  id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  owner_id: string;
  color: string;
  tag: string | null;
}

export default function ProjectsPage() {
  const { user } = useDashboardUser();
  const supabase = useMemo(() => createClient(), []);

  // --- STATES ---
  const [projectTab, setProjectTab] = useState<
    "Tasks" | "Timeline" | "Files" | "Team"
  >("Timeline");
  const [selectedProject, setSelectedProject] = useState<Board | null>(null);

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Boards data
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
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

  // --- FETCH BOARDS ---
  const fetchBoards = useCallback(async () => {
    if (!user?.id) {
      setBoards([]);
      setBoardsLoading(false);
      return;
    }
    setBoardsLoading(true);
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Fetch boards error:", error);
      setBoards([]);
    } else {
      setBoards((data as Board[]) || []);
    }
    setBoardsLoading(false);
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

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

  const confirmDeleteProject = async () => {
    if (!deleteConfirm.projectId || !user?.id) return;
    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", deleteConfirm.projectId)
      .eq("owner_id", user.id);
    if (error) console.error("Delete board error:", error);
    else await fetchBoards();
    setDeleteConfirm({ isOpen: false, projectId: null, projectTitle: "" });
  };

  const handleUpdateProject = (proj: Board) => {
    setOpenMenuProjectId(null);
    setSelectedProject(proj);
  };

  const handleCreateProject = async (data: {
    title: string;
    description: string;
    is_private: boolean;
    color: string;
    tag: string;
    projectDeadline: string;
    selectedTeamMembers: string[];
  }) => {
    if (!user?.id) {
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    
    const { data: boardData, error } = await supabase
      .from("boards")
      .insert([
        {
          title: data.title,
          description: data.description || null,
          is_private: data.is_private,
          color: data.color,
          tag: data.tag,
          owner_id: user.id,
        },
      ])
      .select();

    if (error) {
      toast.error(`Failed to create project: ${error.message || "Unknown error"}`);
    } else if (boardData && boardData.length > 0) {
      toast.success("Project created successfully!");
      // Create default columns for the new project
      const boardId = boardData[0].id;
      await supabase.from("columns").insert([
        { title: "To Do", board_id: boardId, position: 0 },
        { title: "In Progress", board_id: boardId, position: 1 },
        { title: "Done", board_id: boardId, position: 2 },
      ]);

      await fetchBoards();
      setIsCreateProjectOpen(false);
    }
    setIsSubmitting(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // --- RENDER ---
  const renderAllProjects = () => (
    <div className="flex-1 px-10 pb-20 overflow-y-auto mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            const projColor =
              proj.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            const projProgress = proj.progress ?? 0;
            const projTag = proj.tag || "Project";
            const projTeam = proj.team ?? 3;

            return (
              <div
                key={proj.id}
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
                    ref={openMenuProjectId === proj.id ? menuRef : null}
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
          })}

        {/* Create New Project Card */}
        <div
          onClick={() => setIsCreateProjectOpen(true)}
          className="bg-transparent rounded-4xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors min-h-75 group h-full"
        >
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <PlusIcon />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">New Project</h3>
          <p className="text-sm text-slate-400 font-medium px-4">
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
              {projectTab === "Tasks" && <TasksTab projectId={selectedProject.id} />}
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
                placeholder="What's on your mind?"
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
                  {[
                    {
                      label: "Work",
                      icon: <BriefcaseIcon />,
                      active: "bg-[#EAF7FF] text-[#28B8FA]",
                    },
                    {
                      label: "Personal",
                      icon: <UserIcon />,
                      active: "bg-[#D1FAE5] text-[#34D399]",
                    },
                    {
                      label: "Urgent",
                      icon: <ZapIcon />,
                      active: "bg-[#FFF2DE] text-[#FF8B5E]",
                    },
                  ].map(({ label, icon, active }) => (
                    <button
                      key={label}
                      onClick={() => toggleTag(label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes(label) ? active : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
                <div className="ml-auto">
                  {selectedTags.length === 0 ? (
                    <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-4xl w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      Create Task
                    </button>
                  ) : (
                    <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">
                      Add Task{" "}
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

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md p-8 relative mx-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">
              Delete Project
            </h3>
            <p className="text-sm text-slate-500 text-center font-medium mb-8 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-700">
                &ldquo;{deleteConfirm.projectTitle}&rdquo;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    projectId: null,
                    projectTitle: "",
                  })
                }
                className="flex-1 py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-200 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
