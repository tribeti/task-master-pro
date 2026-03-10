"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TASKS, TEAM_MEMBERS, FILES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { useDashboardUser } from "../layout";
import { BoardList } from "@/components/board/BoardList";
import { BoardCard } from "@/components/board/BoardCard";
import {
  PlusIcon,
  MoreIcon,
  XIcon,
  BriefcaseIcon,
  ZapIcon,
  UserIcon,
  FilterIcon,
  CalendarIcon,
  UploadCloudIcon,
  SearchIcon,
  SortIcon,
  ChatIcon,
  CheckIcon,
} from "@/components/icons";
import Image from "next/image";
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
}

export default function ProjectsPage() {
  const { user } = useDashboardUser();

  // --- STATES ---
  const [projectTab, setProjectTab] = useState<
    "Tasks" | "Timeline" | "Files" | "Team"
  >("Timeline");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Projects data
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // --- FETCH PROJECTS ---
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

  // --- CREATE PROJECT ---
  const handleCreateProject = async (data: {
    title: string;
    color: string;
    tag: string;
    deadline: string;
  }) => {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('boards').insert([{
      title: data.title,
      color: data.color,
      tag: data.tag,
      description: '',
      is_private: false,
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

  // Toggle Tag in Modal
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // --- RENDER PROJECT TABS ---
  const renderTasksBoard = () => (
    <div className="flex-1 overflow-x-auto mt-4">
      {/* Lưới Grid nền (Grid background Pattern) */}
      <div
        className="h-full w-max flex gap-6"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Column 1: TO DO */}
        <BoardList title="To Do" count={4}>
          <BoardCard
            tagLabel="High Priority"
            tagColorClass="text-[#FF8B5E]"
            tagBgClass="bg-[#FFF2DE]"
            title="User Onboarding Flow Sketches"
            description="Initial wireframes for the new login sequence including social auth."
          />
        </BoardList>

        {/* Column 2: IN PROGRESS */}
        <BoardList
          title="In Progress"
          count={2}
          containerClass="border-l-2 border-[#28B8FA]"
          titleClass="text-[#28B8FA]"
          badgeClass="bg-[#EAF7FF] text-[#28B8FA]"
          showDot={true}
          dotClass="bg-[#28B8FA]"
        >
          <BoardCard
            tagLabel="Dev"
            tagColorClass="text-[#34D399]"
            tagBgClass="bg-[#D1FAE5]"
            title="Home Screen React Components"
            progressValue={60}
            progressColorClass="bg-[#28B8FA]"
            containerClass="border-t-4 border-t-[#28B8FA]"
          />
        </BoardList>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-4xl border border-slate-100 shadow-sm mt-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=A"
              alt="U"
              className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"
            />
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=B"
              alt="U"
              className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white"
            />
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=C"
              alt="U"
              className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white opacity-50"
            />
            <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
              +4
            </div>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <FilterIcon /> Filter
          </button>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800">
            <CalendarIcon /> Month
          </button>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <button className="text-slate-400 hover:text-slate-800">&lt;</button>
          <span className="font-bold text-sm text-slate-800">October 2023</span>
          <button className="text-slate-400 hover:text-slate-800">&gt;</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex">
        <div className="w-64 shrink-0 border-r border-slate-100 bg-white z-10">
          <div className="h-14 flex items-center px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b border-slate-100">
            Task Name
          </div>
          <div className="flex flex-col">
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FF8B5E] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">
                UI High Fidelity
              </h4>
              <p className="text-xs text-slate-400">Design System</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#28B8FA] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">
                API Integration
              </h4>
              <p className="text-xs text-slate-400">Backend</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#34D399] rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">User Testing</h4>
              <p className="text-xs text-slate-400">QA Phase</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-400 rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">Final Review</h4>
              <p className="text-xs text-slate-400">Stakeholders</p>
            </div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-300 rounded-r-full"></div>
              <h4 className="font-bold text-sm text-slate-800">Asset Prep</h4>
              <p className="text-xs text-slate-400">Marketing</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-200 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] relative">
          <div className="h-14 flex border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            {[
              "MON 16",
              "TUE 17",
              "WED 18",
              "THU 19",
              "FRI 20",
              "SAT 21",
              "SUN 22",
            ].map((day, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-center border-r border-slate-100"
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${i === 1 ? "text-[#28B8FA]" : "text-slate-400"}`}
                >
                  {day.split(" ")[0]}
                </span>
                <span
                  className={`text-sm font-black ${i === 1 ? "text-[#28B8FA]" : "text-slate-800"}`}
                >
                  {day.split(" ")[1]}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-[15%] w-px bg-[#28B8FA] z-20">
            <div className="w-2 h-2 bg-[#28B8FA] rounded-full absolute -top-1 -left-[3.5px]"></div>
          </div>

          <div className="relative h-100">
            <div className="absolute top-5 left-[5%] w-[25%] h-10 bg-linear-to-r from-[#FF8B5E] to-[#FF6B3E] rounded-full shadow-md shadow-orange-200 flex items-center px-1 z-10">
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=A"
                alt=""
                className="w-8 h-8 rounded-full bg-white/20"
              />
              <span className="text-white text-xs font-bold ml-2">
                3 days left
              </span>
            </div>
            <div className="absolute top-25 left-[15%] w-[40%] h-10 bg-[#28B8FA] rounded-full shadow-md shadow-cyan-200 flex items-center justify-between px-4 z-10">
              <span className="text-white text-xs font-bold flex items-center gap-1">
                <span className="opacity-50">&lt;&gt;</span> In Progress
              </span>
              <span className="text-white/80 text-[10px] font-bold">45%</span>
            </div>
            <div className="absolute top-45 left-[45%] w-[25%] h-10 bg-[#34D399] rounded-full shadow-md shadow-emerald-200 flex items-center px-1 z-10">
              <div className="flex -space-x-2">
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=X"
                  alt=""
                  className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]"
                />
                <img
                  src="https://api.dicebear.com/7.x/notionists/svg?seed=Y"
                  alt=""
                  className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]"
                />
              </div>
            </div>
            <div className="absolute top-[260px] left-[60%] w-[12%] h-10 bg-indigo-300 rounded-full flex items-center justify-center z-10 opacity-70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="absolute top-85 left-[5%] w-[15%] h-10 bg-slate-200 rounded-full flex items-center justify-center z-10">
              <span className="text-slate-500 text-xs font-bold flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>{" "}
                Done
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="flex-1 flex flex-col mt-4">
      <div className="w-full bg-white border-2 border-dashed border-[#28B8FA]/30 rounded-[2rem] h-40 flex flex-col items-center justify-center mb-8 cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-[#EAF7FF] flex items-center justify-center mb-2">
          <UploadCloudIcon />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          Drop files here to upload
        </h3>
        <p className="text-sm text-slate-400 font-medium">
          or{" "}
          <span className="text-[#28B8FA] underline decoration-dashed">
            browse files
          </span>{" "}
          from your computer
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm"
          />
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm">
            <FilterIcon /> Filter
          </button>
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm">
            <SortIcon /> Sort
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20 overflow-y-auto">
        {FILES.map((file) => (
          <div key={file.id} className="group cursor-pointer">
            <div
              className={`aspect-square rounded-3xl ${file.color} flex items-center justify-center mb-3 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all relative overflow-hidden`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={file.iconColor || "text-white"}
              >
                <path d={file.icon}></path>
              </svg>
            </div>
            <h4 className="font-bold text-sm text-slate-800 truncate">
              {file.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase mt-1">
              <span>{file.size}</span>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span>{file.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="flex-1 mt-6">
      <div className="flex justify-end mb-6">
        <div className="relative w-64">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Find teammate..."
            className="w-full bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 overflow-y-auto">
        {TEAM_MEMBERS.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-4xl p-6 border border-slate-100 shadow-sm flex flex-col items-center relative hover:shadow-md transition-shadow"
          >
            <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-full p-1">
              <MoreIcon />
            </button>
            <div className="relative mb-4">
              {member.avatar.includes("Alex") ? (
                <Image
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=Alex`}
                  width={96}
                  height={96}
                  alt={member.name}
                  className="w-24 h-24 rounded-full bg-slate-800 border-4 border-white shadow-sm"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full ${member.bg} border-4 border-white shadow-sm flex items-center justify-center text-3xl font-black ${member.color}`}
                >
                  {member.avatar.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div
                className={`absolute bottom-1 right-1 w-5 h-5 border-2 border-white rounded-full ${member.status} flex items-center justify-center`}
              >
                {member.status.includes("FF8B5E") && (
                  <div className="w-2 h-0.5 bg-white"></div>
                )}
                {member.status.includes("slate") && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 mb-6">
              {member.role}
            </p>

            <div className="w-full mb-6">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500">Current Load</span>
                <span className={member.color}>{member.load}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${member.color.replace("text-", "bg-")}`}
                  style={{ width: `${member.load}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-3 w-full mb-6">
              <div className="flex-1 bg-slate-50 rounded-2xl py-3 flex flex-col items-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Tasks
                </span>
                <span className="text-lg font-black text-slate-800">
                  {member.tasks}
                </span>
              </div>
              <div className="flex-1 bg-slate-50 rounded-2xl py-3 flex flex-col items-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {member.revLabel || "Review"}
                </span>
                <span className="text-lg font-black text-slate-800">
                  {member.rev}
                </span>
              </div>
            </div>
            <button className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-[#28B8FA] hover:text-[#28B8FA] transition-colors">
              View Profile
            </button>
          </div>
        ))}
        <div className="bg-transparent rounded-4xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-full min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4">
            <PlusIcon />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Add Member</h3>
          <p className="text-sm text-slate-400 font-medium px-4">
            Invite a new collaborator to join the Orbital Launch System team.
          </p>
        </div>
      </div>
    </div>
  );

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
          <h3 className="text-xl font-bold text-slate-700 mb-2">No projects yet</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Create your first project to get started.</p>
          <button onClick={() => setIsCreateProjectOpen(true)} className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-colors shadow-lg">
            <PlusIcon /> New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-1">
          {projects.map((proj) => {
            const accentColor = proj.color || '#94a3b8';
            // Placeholder progress data (will be replaced when tasks are linked)
            const progress = 0;
            const completedTasks = 0;
            const totalTasks = 0;
            // SVG ring calculations
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
                {/* Tag + Menu */}
                <div className="flex items-center justify-between mb-4">
                  {proj.tag && (
                    <span
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider"
                      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                    >
                      {proj.tag}
                    </span>
                  )}
                  <div className="relative ml-auto">
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

                {/* Title */}
                <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                  {proj.title}
                </h3>

                {/* Progress Ring + Task Count */}
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

                {/* Bottom Row: Avatars + Date */}
                <div className="flex items-center justify-between mt-auto pt-4">
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
                  <span className="text-xs font-semibold text-slate-400">
                    {new Date(proj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Create New Project Card */}
          <div
            onClick={() => setIsCreateProjectOpen(true)}
            className="bg-transparent rounded-3xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white hover:border-[#28B8FA] hover:shadow-lg transition-all min-h-[280px] group h-full"
          >
            <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-[#EAF7FF] flex items-center justify-center text-slate-300 group-hover:text-[#28B8FA] mb-4 group-hover:scale-110 transition-all">
              <PlusIcon />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-1 group-hover:text-slate-800 transition-colors">
              New Project
            </h3>
            <p className="text-xs text-slate-400 font-medium px-4">
              Start a fresh workspace
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>

      {/* DYNAMIC HEADER */}
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

      {/* CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedProject ? (
          renderAllProjects()
        ) : (
          <>
            {/* Project Sub-Tabs */}
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

            {/* Project Dynamic View */}
            <div className="flex-1 px-10 flex flex-col overflow-hidden pb-10">
              {projectTab === "Tasks" && renderTasksBoard()}
              {projectTab === "Timeline" && renderTimeline()}
              {projectTab === "Files" && renderFiles()}
              {projectTab === "Team" && renderTeam()}
            </div>
          </>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
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


      {/* 3. QUICK ENTRY MODAL OVERLAY */}
      {isQuickEntryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* Modal Container */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-2 relative mx-4 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
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
              {/* Input Area */}
              <input
                type="text"
                placeholder="What's on your mind?"
                className="text-3xl md:text-4xl font-extrabold text-slate-800 placeholder-slate-300 bg-transparent border-none outline-none w-[90%]"
                autoFocus
                required
                maxLength={200}
              />

              {/* Dynamic Bottom Section based on Selected Tags */}
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

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
        isSubmitting={isSubmitting}
      />

      {/* Global Style for dropdown animation */}
    </>
  );
}
