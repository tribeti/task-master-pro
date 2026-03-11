"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useDashboardUser } from "../layout";
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
import { TasksTab, TimelineTab, FilesTab, TeamTab } from "@/components/project-tabs";
import CreateProjectModal from "@/components/CreateProjectModal";

interface Project {
  id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  owner_id: string;
  color: string;
  tag: string | null;
  deadline: string | null;
}

export default function ProjectsPage() {
  const { user } = useDashboardUser();

  const [projectTab, setProjectTab] = useState<"Tasks" | "Timeline" | "Files" | "Team">("Timeline");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setIsLoadingProjects(true);
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setIsLoadingProjects(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateProject = async (data: {
    title: string;
    description: string | null;
    is_private: boolean;
    color: string;
    tag: string | null;
    deadline: string | null;
  }) => {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('boards').insert([{
      title: data.title,
      description: data.description,
      is_private: data.is_private,
      color: data.color,
      tag: data.tag,
      deadline: data.deadline,
      owner_id: user.id,
    }]);
    if (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project: ' + error.message);
    } else {
      setIsCreateProjectOpen(false);
      await fetchProjects();
    }
    setIsSubmitting(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const renderAllProjects = () => (
    <div className="flex-1 px-10 pb-20 overflow-y-auto mt-6">
      {isLoadingProjects ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No projects yet</h3>
          <p className="text-sm text-slate-400 font-medium px-4 mb-6">
            Create your first project to start organizing tasks and timelines.
          </p>
          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="bg-[#28B8FA] hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-cyan-200 transition-all hover:scale-105"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-1">
          {projects.map((proj) => {
            const accentColor = proj.color || '#94a3b8';
            const progress = 0;
            const completedTasks = 0;
            const totalTasks = 0;
            const radius = 22;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (progress / 100) * circumference;

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj.title)}
                className="relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full hover:-translate-y-1"
                style={{ border: `2px solid ${accentColor}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  {proj.tag && (
                    <span
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      {proj.tag}
                    </span>
                  )}
                  <div className="relative ml-auto" ref={openMenuId === proj.id ? menuRef : null}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === proj.id ? null : proj.id); }}
                      className="text-slate-300 hover:text-slate-500 rounded-full p-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <MoreIcon />
                    </button>
                    {openMenuId === proj.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 w-48 z-30 animate-in fade-in zoom-in-95 duration-150">
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                          Project Settings
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                          Duplicate
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" /><path d="M1 4h22" /><path d="M10 4V2h4v2" /></svg>
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                  {proj.title}
                </h3>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="5" />
                      <circle
                        cx="28" cy="28" r={radius} fill="none"
                        stroke={accentColor} strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-600">
                      {progress}%
                    </span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-black text-slate-800">{completedTasks}</span>
                      <span className="text-lg font-bold text-slate-300">/{totalTasks}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks Complete</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <div className="flex -space-x-2">
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${proj.id}a`}
                      className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"
                      alt="Team"
                    />
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${proj.id}b`}
                      className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm"
                      alt="Team"
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 text-right">
                    {proj.deadline ? `Due ${new Date(proj.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : `Started ${new Date(proj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </span>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => setIsCreateProjectOpen(true)}
            className="bg-transparent rounded-[2rem] p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-full min-h-[250px]"
          >
            <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4">
              <PlusIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">New Project</h3>
          </div>
        </div>
      )}
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
                  title="Back to all projects"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                {selectedProject}
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Active Projects</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                You have <span className="text-[#34D399] font-bold">{projects.length} active</span> projects pushing forward.
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

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedProject ? (
          renderAllProjects()
        ) : (
          <>
            <div className="px-10 border-b border-slate-200 flex gap-8 shrink-0 mt-4">
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
              {projectTab === "Tasks" && <TasksTab />}
              {projectTab === "Timeline" && <TimelineTab />}
              {projectTab === "Files" && <FilesTab />}
              {projectTab === "Team" && <TeamTab />}
            </div>
          </>
        )}
      </div>

      {selectedProject ? (
        <button
          className={`absolute bottom-8 right-8 w-14 h-14 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg text-white z-20 ${projectTab === "Timeline"
            ? "bg-[#1E293B] shadow-slate-400"
            : projectTab === "Files"
              ? "bg-[#34D399] shadow-emerald-200"
              : "bg-[#34D399] shadow-emerald-200"
            }`}
        >
          {projectTab === "Timeline" ? (
            <ChatIcon />
          ) : projectTab === "Files" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                  <button
                    onClick={() => toggleTag("Work")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Work") ? "bg-[#EAF7FF] text-[#28B8FA]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                  >
                    <BriefcaseIcon /> Work
                  </button>
                  <button
                    onClick={() => toggleTag("Personal")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Personal") ? "bg-[#D1FAE5] text-[#34D399]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                  >
                    <UserIcon /> Personal
                  </button>
                  <button
                    onClick={() => toggleTag("Urgent")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes("Urgent") ? "bg-[#FFF2DE] text-[#FF8B5E]" : "bg-slate-50 text-slate-500 hover:bg-slate-100"} `}
                  >
                    <ZapIcon /> Urgent
                  </button>
                </div>
                <div className="ml-auto">
                  {selectedTags.length === 0 ? (
                    <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-[2rem] w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      Create Task
                    </button>
                  ) : (
                    <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">
                      Add Task{" "}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
