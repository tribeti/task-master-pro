"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

import { TASKS, TEAM_MEMBERS, FILES } from '@/lib/constants';
import { BoltIcon, GridIcon, ChartIcon, RocketIcon, SettingsIcon, SunIcon, PlusIcon, LinkIcon, CheckIcon, MoreIcon, PauseIcon, EditIcon, AlertIcon, TrashIcon, XIcon, BriefcaseIcon, ZapIcon, ChevronUp, UserIcon, FilterIcon, CalendarIcon, UploadCloudIcon, SearchIcon, SortIcon, ChatIcon } from '@/components/icons';

export default function TaskFlowDashboard() {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState<'Command' | 'Projects'>('Command');
  const [projectTab, setProjectTab] = useState<'Tasks' | 'Timeline' | 'Files' | 'Team'>('Timeline');

  // Dashboard states
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Modal states
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Toggle Tag in Modal
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const visibleTasks = isQueueExpanded ? TASKS : TASKS.slice(0, 3);

  // --- RENDER PROJECT TABS ---
  const renderTasksBoard = () => (
    <div className="flex-1 overflow-x-auto mt-4">
      {/* Lưới Grid nền (Grid background Pattern) */}
      <div className="h-full w-max flex gap-6" style={{ backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)', backgroundSize: '40px 40px' }}>

        {/* Column 1: TO DO */}
        <div className="w-80 flex flex-col gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl">
          <h3 className="font-bold text-xs tracking-widest text-slate-400 uppercase flex items-center justify-between px-2">
            To Do <span className="bg-slate-200 text-slate-600 px-2 rounded-md">4</span>
          </h3>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-[#FF8B5E] bg-[#FFF2DE] w-max px-2 py-1 rounded-md uppercase">High Priority</span>
            <h4 className="font-bold text-slate-800">User Onboarding Flow Sketches</h4>
            <p className="text-xs text-slate-500 line-clamp-2">Initial wireframes for the new login sequence including social auth.</p>
          </div>
        </div>

        {/* Column 2: IN PROGRESS */}
        <div className="w-80 flex flex-col gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border-l-2 border-[#28B8FA]">
          <h3 className="font-bold text-xs tracking-widest text-[#28B8FA] uppercase flex items-center justify-between px-2">
            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#28B8FA] rounded-full"></div> In Progress</span>
            <span className="bg-[#EAF7FF] text-[#28B8FA] px-2 rounded-md">2</span>
          </h3>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 border-t-4 border-t-[#28B8FA] cursor-pointer hover:shadow-md transition-shadow">
            <span className="text-[10px] font-bold text-[#34D399] bg-[#D1FAE5] w-max px-2 py-1 rounded-md uppercase">Dev</span>
            <h4 className="font-bold text-slate-800">Home Screen React Components</h4>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#28B8FA] w-[60%] h-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-4">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-2">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=A" alt="U" className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=B" alt="U" className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-white" />
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=C" alt="U" className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white opacity-50" />
            <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">+4</div>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"><FilterIcon /> Filter</button>
          <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"><CalendarIcon /> Month</button>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <button className="text-slate-400 hover:text-slate-800">&lt;</button>
          <span className="font-bold text-sm text-slate-800">October 2023</span>
          <button className="text-slate-400 hover:text-slate-800">&gt;</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex">
        <div className="w-64 flex-shrink-0 border-r border-slate-100 bg-white z-10">
          <div className="h-14 flex items-center px-6 text-[10px] font-bold text-slate-400 tracking-widest uppercase border-b border-slate-100">Task Name</div>
          <div className="flex flex-col">
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#FF8B5E] rounded-r-full"></div><h4 className="font-bold text-sm text-slate-800">UI High Fidelity</h4><p className="text-xs text-slate-400">Design System</p></div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#28B8FA] rounded-r-full"></div><h4 className="font-bold text-sm text-slate-800">API Integration</h4><p className="text-xs text-slate-400">Backend</p></div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#34D399] rounded-r-full"></div><h4 className="font-bold text-sm text-slate-800">User Testing</h4><p className="text-xs text-slate-400">QA Phase</p></div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-400 rounded-r-full"></div><h4 className="font-bold text-sm text-slate-800">Final Review</h4><p className="text-xs text-slate-400">Stakeholders</p></div>
            <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-50 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-slate-300 rounded-r-full"></div><h4 className="font-bold text-sm text-slate-800">Asset Prep</h4><p className="text-xs text-slate-400">Marketing</p></div>
          </div>
        </div>

        <div className="flex-1 min-w-[800px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iODAiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2YxZjVmOSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] relative">
          <div className="h-14 flex border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
            {['MON 16', 'TUE 17', 'WED 18', 'THU 19', 'FRI 20', 'SAT 21', 'SUN 22'].map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-center border-r border-slate-100">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${i === 1 ? 'text-[#28B8FA]' : 'text-slate-400'}`}>{day.split(' ')[0]}</span>
                <span className={`text-sm font-black ${i === 1 ? 'text-[#28B8FA]' : 'text-slate-800'}`}>{day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 bottom-0 left-[15%] w-px bg-[#28B8FA] z-20"><div className="w-2 h-2 bg-[#28B8FA] rounded-full absolute -top-1 -left-[3.5px]"></div></div>

          <div className="relative h-[400px]">
            <div className="absolute top-[20px] left-[5%] w-[25%] h-10 bg-gradient-to-r from-[#FF8B5E] to-[#FF6B3E] rounded-full shadow-md shadow-orange-200 flex items-center px-1 z-10">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=A" alt="" className="w-8 h-8 rounded-full bg-white/20" />
              <span className="text-white text-xs font-bold ml-2">3 days left</span>
            </div>
            <div className="absolute top-[100px] left-[15%] w-[40%] h-10 bg-[#28B8FA] rounded-full shadow-md shadow-cyan-200 flex items-center justify-between px-4 z-10">
              <span className="text-white text-xs font-bold flex items-center gap-1"><span className="opacity-50">&lt;&gt;</span> In Progress</span>
              <span className="text-white/80 text-[10px] font-bold">45%</span>
            </div>
            <div className="absolute top-[180px] left-[45%] w-[25%] h-10 bg-[#34D399] rounded-full shadow-md shadow-emerald-200 flex items-center px-1 z-10">
              <div className="flex -space-x-2"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=X" alt="" className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]" /><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Y" alt="" className="w-8 h-8 rounded-full bg-white/30 border-2 border-[#34D399]" /></div>
            </div>
            <div className="absolute top-[260px] left-[60%] w-[12%] h-10 bg-indigo-300 rounded-full flex items-center justify-center z-10 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <div className="absolute top-[340px] left-[5%] w-[15%] h-10 bg-slate-200 rounded-full flex items-center justify-center z-10">
              <span className="text-slate-500 text-xs font-bold flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Done</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="flex-1 flex flex-col mt-4">
      <div className="w-full bg-white border-2 border-dashed border-[#28B8FA]/30 rounded-[2rem] h-40 flex flex-col items-center justify-center mb-8 cursor-pointer hover:bg-slate-50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-[#EAF7FF] flex items-center justify-center mb-2"><UploadCloudIcon /></div>
        <h3 className="text-lg font-bold text-slate-800">Drop files here to upload</h3>
        <p className="text-sm text-slate-400 font-medium">or <span className="text-[#28B8FA] underline decoration-dashed">browse files</span> from your computer</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-72">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search files..." className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm" />
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm"><FilterIcon /> Filter</button>
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 shadow-sm"><SortIcon /> Sort</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20 overflow-y-auto">
        {FILES.map((file) => (
          <div key={file.id} className="group cursor-pointer">
            <div className={`aspect-square rounded-3xl ${file.color} flex items-center justify-center mb-3 shadow-sm group-hover:-translate-y-1 group-hover:shadow-md transition-all relative overflow-hidden`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={file.iconColor || 'text-white'}><path d={file.icon}></path></svg>
            </div>
            <h4 className="font-bold text-sm text-slate-800 truncate">{file.title}</h4>
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase mt-1"><span>{file.size}</span><div className="w-1 h-1 rounded-full bg-slate-300"></div><span>{file.date}</span></div>
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
          <input type="text" placeholder="Find teammate..." className="w-full bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 overflow-y-auto">
        {TEAM_MEMBERS.map((member) => (
          <div key={member.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col items-center relative hover:shadow-md transition-shadow">
            <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-full p-1"><MoreIcon /></button>
            <div className="relative mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {member.avatar.includes('Alex') ?
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Alex`} alt={member.name} className="w-24 h-24 rounded-full bg-slate-800 border-4 border-white shadow-sm" /> :
                <div className={`w-24 h-24 rounded-full ${member.bg} border-4 border-white shadow-sm flex items-center justify-center text-3xl font-black ${member.color}`}>{member.avatar.substring(0, 2).toUpperCase()}</div>
              }
              <div className={`absolute bottom-1 right-1 w-5 h-5 border-2 border-white rounded-full ${member.status} flex items-center justify-center`}>
                {member.status.includes('FF8B5E') && <div className="w-2 h-0.5 bg-white"></div>}
                {member.status.includes('slate') && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 mb-6">{member.role}</p>

            <div className="w-full mb-6">
              <div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-500">Current Load</span><span className={member.color}>{member.load}%</span></div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${member.color.replace('text-', 'bg-')}`} style={{ width: `${member.load}%` }}></div></div>
            </div>

            <div className="flex gap-3 w-full mb-6">
              <div className="flex-1 bg-slate-50 rounded-2xl py-3 flex flex-col items-center border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasks</span><span className="text-lg font-black text-slate-800">{member.tasks}</span></div>
              <div className="flex-1 bg-slate-50 rounded-2xl py-3 flex flex-col items-center border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{member.revLabel || 'Review'}</span><span className="text-lg font-black text-slate-800">{member.rev}</span></div>
            </div>
            <button className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-[#28B8FA] hover:text-[#28B8FA] transition-colors">View Profile</button>
          </div>
        ))}
        <div className="bg-transparent rounded-[2rem] p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-full min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4"><PlusIcon /></div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Add Member</h3>
          <p className="text-sm text-slate-400 font-medium px-4">Invite a new collaborator to join the Orbital Launch System team.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">

      {/* 1. SIDEBAR */}
      <aside className="w-auto bg-white border-r border-slate-100 flex flex-col justify-between hidden md:flex z-10">
        <div>
          <div className="w-full h-24 flex items-center px-8 gap-3 cursor-pointer" onClick={() => setActiveTab('Command')}>
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-md shadow-cyan-200">
              <BoltIcon />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Barlow_Condensed'] font-extrabold italic text-[22px] text-slate-900 tracking-wide ">
                TASKMASTER
              </span>
              <span className="font-['Barlow_Condensed'] text-black font-extrabold text-[10px] tracking-widest bg-gradient-to-br from-cyan-400 to-cyan-600 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
          </div>

          <nav className="px-4 flex flex-col gap-2 mt-4">
            <button
              onClick={() => setActiveTab('Command')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'Command' ? 'bg-[#EAF7FF] text-[#28B8FA]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <GridIcon /> Command
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors">
              <ChartIcon /> Insights
            </button>
            <button
              onClick={() => setActiveTab('Projects')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${activeTab === 'Projects' ? 'bg-[#EAF7FF] text-[#28B8FA]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <RocketIcon /> Projects
            </button>
          </nav>
        </div>

        <div className="px-4 pb-6 flex flex-col gap-4">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors text-left">
            <SettingsIcon /> Config
          </button>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Alex" alt="Avatar" className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-slate-800">Alex Morgan</span>
              <span className="text-[10px] font-bold text-[#34D399] tracking-wider uppercase">Peak Flow</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#28B8FA] via-[#34D399] to-transparent absolute top-0 left-0 z-20"></div>

        {/* DYNAMIC HEADER */}
        <header className={`px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 ${activeTab === 'Command' ? 'py-10' : 'pt-10 pb-6'}`}>
          <div>
            {activeTab === 'Command' ? (
              <>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Command Center</h1>
                <p className="text-slate-500 text-sm mt-1.5 font-medium">Daily productivity is at <span className="text-[#34D399] font-bold">84%</span>. You&apos;re crushing it!</p>
              </>
            ) : (
              <>
                {/* Project Context Breadcrumbs */}
                {projectTab === 'Timeline' && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"><span className="text-[#34D399] bg-[#D1FAE5] px-2 py-0.5 rounded-md mr-2">ON TRACK</span> Sprint 4 • Oct 15 - Nov 15</p>}
                {projectTab === 'Files' && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PROJECT <span className="text-[#28B8FA] mx-1">/</span> WEBSITE REDESIGN</p>}
                {(projectTab === 'Team' || projectTab === 'Tasks') && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"><span className="text-[#28B8FA]">ACTIVE SPRINT</span> <span className="mx-2 text-slate-300">&gt;</span> Q4 INITIATIVES</p>}

                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {projectTab === 'Timeline' ? 'Nebula Launch' : projectTab === 'Files' ? 'Q4 Website Redesign' : 'Orbital Launch System'}
                </h1>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Supabase Test Buttons (Only visible in Command Tab as per user setup) */}
            {activeTab === 'Command' && (
              <>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-100 shadow-sm shadow-slate-200/50">
                  <SunIcon />
                  <span className="text-xs font-bold text-slate-800 tracking-wider">MORNING SESSION</span>
                </div>
                <button
                  onClick={async () => {
                    const { data, error } = await supabase.from('tasks').insert([
                      { title: 'Test Task from Next.js', description: 'Mô tả test tự động', position: 1 }
                    ]).select();
                    if (error) { console.error("Insert error:", error); alert("Insert failed: " + error.message); }
                    else { console.log("Inserted data:", data); alert("Inserted successfully! Check console."); }
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2.5 rounded-full shadow-md shadow-slate-300"
                >
                  <span className="text-sm font-semibold">Test DB Insert</span>
                </button>
                <button
                  onClick={async () => {
                    const { data, error } = await supabase.from('tasks').select('*').limit(5);
                    if (error) { console.error("Fetch error:", error); alert("Fetch failed: " + error.message); }
                    else { console.log("Fetched data:", data); alert("Fetched " + (data?.length || 0) + " tasks. Check console."); }
                  }}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 transition-colors text-white px-4 py-2.5 rounded-full shadow-md shadow-slate-300"
                >
                  <span className="text-sm font-semibold">Test DB Fetch</span>
                </button>
                <button
                  onClick={() => setIsQuickEntryOpen(true)}
                  className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 transition-colors text-white px-5 py-2.5 rounded-full shadow-md shadow-slate-300"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><PlusIcon /></div>
                  <span className="text-sm font-semibold">Quick Entry</span>
                </button>
              </>
            )}

            {/* Project Buttons (Only visible in Projects Tab) */}
            {activeTab === 'Projects' && (
              <>
                {projectTab === 'Files' && (
                  <div className="flex -space-x-2 mr-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">AM</div>
                    <div className="w-8 h-8 rounded-full bg-[#FF8B5E] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                    <div className="w-8 h-8 rounded-full bg-[#34D399] border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">KL</div>
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">+2</div>
                  </div>
                )}

                <button
                  onClick={() => setIsQuickEntryOpen(true)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full shadow-md transition-transform hover:scale-105 text-sm font-semibold text-white ${projectTab === 'Team' ? 'bg-[#1E293B] shadow-slate-300' : 'bg-[#28B8FA] shadow-cyan-200'}`}
                >
                  {projectTab === 'Team' ? <><UserIcon /> Invite Member</> : <><PlusIcon /> Add Task</>}
                </button>
              </>
            )}
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        {activeTab === 'Command' ? (

          /* --- COMMAND TAB CONTENT --- */
          <div className="px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT WIDGETS */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className={`rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-colors duration-500 ${isTimerRunning ? 'bg-blue-50/50' : 'bg-white'}`}>
                {isTimerRunning && <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#28B8FA] rounded-full animate-pulse"></div>}
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10"></div>
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Deep Focus</h3>
                <div className={`text-5xl font-black tracking-tighter mb-6 transition-colors ${isTimerRunning ? 'text-[#28B8FA]' : 'text-slate-800'}`}>{isTimerRunning ? '23:59' : '24:00'}</div>
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-full font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isTimerRunning ? 'bg-[#FFF2DE] text-[#FF8B5E] shadow-orange-100 hover:bg-orange-100' : 'bg-[#28B8FA] text-white shadow-cyan-200 hover:bg-cyan-400'}`}>
                  {isTimerRunning ? <><PauseIcon /> Pause Sprint</> : 'Start Sprint'}
                </button>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center">
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6 w-full text-left">Energy Sync</h3>
                <div className="flex items-end gap-2 h-20 mb-4">
                  <div className="w-6 h-8 bg-[#D1FAE5] rounded-t-md"></div>
                  <div className="w-6 h-12 bg-[#D1FAE5] rounded-t-md"></div>
                  <div className="w-6 h-20 bg-[#34D399] rounded-t-md shadow-sm shadow-emerald-200"></div>
                  <div className="w-6 h-10 bg-[#D1FAE5] rounded-t-md"></div>
                  <div className="w-6 h-6 bg-[#D1FAE5] rounded-t-md"></div>
                </div>
                <span className="text-xs font-bold text-[#34D399]">Peak state reached</span>
              </div>
            </div>

            {/* CENTER WIDGET */}
            <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">Primary Objectives</h2>
                <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF8B5E]"></div><div className="w-2 h-2 rounded-full bg-[#28B8FA]"></div><div className="w-2 h-2 rounded-full bg-[#34D399]"></div></div>
              </div>

              <div className="flex flex-col gap-2">
                {visibleTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-4 group p-2 rounded-2xl transition-colors relative ${openDropdownId === task.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                    {task.status === 'done' ? (
                      <div className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200"><CheckIcon /></div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex-shrink-0 group-hover:border-cyan-400 transition-colors cursor-pointer flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div></div>
                    )}
                    <div className={`flex-1 ${task.status === 'done' ? 'opacity-60' : ''}`}>
                      <h4 className={`text-lg font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-[10px] font-bold tracking-wider uppercase ${task.color}`}>{task.tag}</p>
                        {task.avatars && (
                          <div className="flex -space-x-1.5">
                            {task.avatars.map((av, i) => (<img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${av}`} alt="U" className="w-4 h-4 rounded-full bg-slate-200 border border-white" />))}
                          </div>
                        )}
                      </div>
                    </div>
                    {task.xp ? (
                      <div className="px-3 py-1 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-bold opacity-60">{task.xp}</div>
                    ) : (
                      <button onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)} className={`p-2 rounded-full transition-colors ${openDropdownId === task.id ? 'bg-slate-200 text-slate-700' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200'}`}><MoreIcon /></button>
                    )}
                    {openDropdownId === task.id && (
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 py-2 z-20 animate-float-up" style={{ animation: 'floatUp 0.2s ease-out forwards' }}>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left"><EditIcon /> Edit Task</button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left"><AlertIcon /> Change Priority</button>
                        <hr className="my-1 border-slate-100" />
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"><TrashIcon /> Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setIsQueueExpanded(!isQueueExpanded)} className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                {isQueueExpanded ? <><ChevronUp /> Collapse Queue</> : <><PlusIcon /> Expand Queue</>}
              </button>
            </div>

            {/* RIGHT WIDGETS */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-[#FF8B5E] to-[#FF6B3E] rounded-[2rem] p-6 shadow-md shadow-orange-200 text-white">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase mb-4">Coming Up</h3>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Design Sync</h2>
                <p className="text-sm text-white/80 font-medium mb-6">11:00 AM — Main Lounge</p>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"><LinkIcon /> meet.taskmasterpro.co...</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm"><span className="text-xs font-bold text-slate-400 mb-1">Streak</span><span className="text-3xl font-black text-[#FF8B5E]">12</span></div>
                <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm"><span className="text-xs font-bold text-slate-400 mb-1">Tasks</span><span className="text-3xl font-black text-[#28B8FA]">48</span></div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Calendar</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-stretch gap-3"><div className="w-1 bg-[#34D399] rounded-full"></div><div><h4 className="text-sm font-bold text-slate-800">Project Launch</h4><p className="text-[10px] font-medium text-slate-400 mt-0.5">Oct 26 • 2:00 PM</p></div></div>
                  <div className="flex items-stretch gap-3"><div className="w-1 bg-[#28B8FA] rounded-full"></div><div><h4 className="text-sm font-bold text-slate-800">Feedback Loop</h4><p className="text-[10px] font-medium text-slate-400 mt-0.5">Oct 27 • 10:00 AM</p></div></div>
                </div>
              </div>
            </div>
          </div>
        ) : (

          /* --- PROJECTS TAB CONTENT --- */
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Project Sub-Tabs */}
            <div className="px-10 border-b border-slate-200 flex gap-8 shrink-0">
              {['Tasks', 'Timeline', 'Files', 'Team'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setProjectTab(tab as any)}
                  className={`pb-4 font-bold text-sm transition-colors relative ${projectTab === tab ? 'text-[#28B8FA]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {tab}
                  {projectTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#28B8FA] rounded-t-full"></div>}
                </button>
              ))}
            </div>

            {/* Project Dynamic View */}
            <div className="flex-1 px-10 flex flex-col overflow-hidden pb-10">
              {projectTab === 'Tasks' && renderTasksBoard()}
              {projectTab === 'Timeline' && renderTimeline()}
              {projectTab === 'Files' && renderFiles()}
              {projectTab === 'Team' && renderTeam()}
            </div>

          </div>
        )}

        {/* FLOATING ACTION BUTTON (DYNAMIC) */}
        {activeTab === 'Projects' ? (
          <button className={`absolute bottom-8 right-8 w-14 h-14 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg text-white z-20 ${projectTab === 'Timeline' ? 'bg-[#1E293B] shadow-slate-400' :
            projectTab === 'Files' ? 'bg-[#34D399] shadow-emerald-200' :
              'bg-[#34D399] shadow-emerald-200'
            }`}>
            {projectTab === 'Timeline' ? <ChatIcon /> :
              projectTab === 'Files' ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> :
                <PlusIcon />}
          </button>
        ) : (
          <button className="absolute bottom-8 right-8 w-14 h-14 bg-[#34D399] hover:bg-emerald-500 transition-transform hover:scale-105 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-white z-10">
            <PlusIcon />
          </button>
        )}
      </main>

      {/* 3. QUICK ENTRY MODAL OVERLAY */}
      {isQuickEntryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">

          {/* Modal Container */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-2 relative mx-4 animate-in zoom-in-95 duration-200">

            {/* Close Button */}
            <button onClick={() => { setIsQuickEntryOpen(false); setSelectedTags([]); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <XIcon />
            </button>

            <div className="p-8 flex flex-col gap-8">
              {/* Input Area */}
              <input type="text" placeholder="What's on your mind?" className="text-3xl md:text-4xl font-extrabold text-slate-800 placeholder-slate-300 bg-transparent border-none outline-none w-[90%]" autoFocus />

              {/* Dynamic Bottom Section based on Selected Tags */}
              <div className="flex items-center justify-between mt-4 h-24">
                <div className="flex items-center gap-3">
                  {selectedTags.length > 0 && <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mr-2">Quick Tag:</span>}
                  <button onClick={() => toggleTag('Work')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Work') ? 'bg-[#EAF7FF] text-[#28B8FA]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'} `}><BriefcaseIcon /> Work</button>
                  <button onClick={() => toggleTag('Personal')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Personal') ? 'bg-[#D1FAE5] text-[#34D399]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'} `}><UserIcon /> Personal</button>
                  <button onClick={() => toggleTag('Urgent')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Urgent') ? 'bg-[#FFF2DE] text-[#FF8B5E]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'} `}><ZapIcon /> Urgent</button>
                </div>
                <div className="ml-auto">
                  {selectedTags.length === 0 ? (
                    <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-[2rem] w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200"><div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"><CheckIcon /></div>Create Task</button>
                  ) : (
                    <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">Add Task <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Style for dropdown animation */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes floatUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
    </div>
  );
}