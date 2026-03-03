"use client";

import React, { useState } from 'react';

// --- SVGs & ICONS ---
const BoltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 3.82-13.04l.33-.46c.11-.15.35-.15.46 0l.33.46A22 22 0 0 1 18 12l-3-3"></path><path d="m9 18 3 3a22 22 0 0 0 13.04-3.82l.46-.33c.15-.11.15-.35 0-.46l-.46-.33A22 22 0 0 0 12 9l3 3"></path></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const MoreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const ChevronUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>;

// --- MOCK DATA ---
const TASKS = [
  { id: 1, title: 'Refine User Interface System', tag: 'Product Design', color: 'text-[#28B8FA]', status: 'todo' },
  { id: 2, title: 'Morning Calibration', tag: 'Routine', color: 'text-slate-400', status: 'done', xp: '+50 XP' },
  { id: 3, title: 'Launch Beta Program', tag: 'Urgent', color: 'text-[#FF8B5E]', status: 'todo', avatars: ['B', 'C'] },
  { id: 4, title: 'Update Client Documentation', tag: 'Writing', color: 'text-slate-500', status: 'todo' },
  { id: 5, title: 'Weekly Metrics Review', tag: 'Analytics', color: 'text-[#34D399]', status: 'todo', avatars: ['JM'] },
];

export default function TaskFlowDashboard() {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState<'Command' | 'Projects'>('Command');
  
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

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between hidden md:flex z-10">
        <div>
          <div className="h-24 flex items-center px-8 gap-3 cursor-pointer" onClick={() => setActiveTab('Command')}>
            <div className="w-10 h-10 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-md shadow-cyan-200">
              <BoltIcon />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 italic">TASKFLOW</span>
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
        <div className="h-1.5 w-full bg-gradient-to-r from-[#28B8FA] via-[#34D399] to-transparent absolute top-0 left-0"></div>

        {/* HEADER */}
        <header className="px-10 py-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'Command' ? 'Command Center' : 'Mobile App Beta'}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              {activeTab === 'Command' 
                ? <span className="text-slate-500">Daily productivity is at <span className="text-[#34D399] font-bold">84%</span>. You&apos;re crushing it!</span>
                : <span className="text-slate-400">V2.0 Launch Sequence • <span className="text-[#34D399] font-bold">On Track</span></span>
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab === 'Command' && (
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-slate-100 shadow-sm shadow-slate-200/50">
                <SunIcon />
                <span className="text-xs font-bold text-slate-800 tracking-wider">MORNING SESSION</span>
              </div>
            )}
            <button 
              onClick={() => setIsQuickEntryOpen(true)}
              className="flex items-center gap-2 bg-[#1E293B] hover:bg-slate-800 transition-colors text-white px-5 py-2.5 rounded-full shadow-md shadow-slate-300"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><PlusIcon /></div>
              <span className="text-sm font-semibold">{activeTab === 'Command' ? 'Quick Entry' : 'Add Task'}</span>
            </button>
          </div>
        </header>

        {/* CONTENT SWITCHER */}
        {activeTab === 'Command' ? (
          
          /* --- DASHBOARD TAB --- */
          <div className="px-10 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT WIDGETS */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Deep Focus Timer (Interactive) */}
              <div className={`rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden transition-colors duration-500 ${isTimerRunning ? 'bg-blue-50/50' : 'bg-white'}`}>
                {isTimerRunning && <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#28B8FA] rounded-full animate-pulse"></div>}
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10"></div>
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Deep Focus</h3>
                <div className={`text-5xl font-black tracking-tighter mb-6 transition-colors ${isTimerRunning ? 'text-[#28B8FA]' : 'text-slate-800'}`}>
                  {isTimerRunning ? '23:59' : '24:00'}
                </div>
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`w-full font-bold py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${isTimerRunning ? 'bg-[#FFF2DE] text-[#FF8B5E] shadow-orange-100 hover:bg-orange-100' : 'bg-[#28B8FA] text-white shadow-cyan-200 hover:bg-cyan-400'}`}
                >
                  {isTimerRunning ? <><PauseIcon /> Pause Sprint</> : 'Start Sprint'}
                </button>
              </div>

              {/* Energy Sync */}
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

            {/* CENTER WIDGET - Primary Objectives (Interactive) */}
            <div className="lg:col-span-6 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">Primary Objectives</h2>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#FF8B5E]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#28B8FA]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#34D399]"></div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {visibleTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-4 group p-2 rounded-2xl transition-colors relative ${openDropdownId === task.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                    
                    {/* Checkbox / Done Icon */}
                    {task.status === 'done' ? (
                      <div className="w-10 h-10 rounded-full bg-[#34D399] flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200">
                        <CheckIcon />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex-shrink-0 group-hover:border-cyan-400 transition-colors cursor-pointer flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      </div>
                    )}

                    {/* Task Info */}
                    <div className={`flex-1 ${task.status === 'done' ? 'opacity-60' : ''}`}>
                      <h4 className={`text-lg font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-[10px] font-bold tracking-wider uppercase ${task.color}`}>{task.tag}</p>
                        
                        {/* Avatars tiny */}
                        {task.avatars && (
                          <div className="flex -space-x-1.5">
                            {task.avatars.map((av, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${av}`} alt="U" className="w-4 h-4 rounded-full bg-slate-200 border border-white" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* XP Badge or Menu */}
                    {task.xp ? (
                      <div className="px-3 py-1 rounded-full bg-[#D1FAE5] text-[#10B981] text-xs font-bold opacity-60">
                        {task.xp}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === task.id ? null : task.id)}
                        className={`p-2 rounded-full transition-colors ${openDropdownId === task.id ? 'bg-slate-200 text-slate-700' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-200'}`}
                      >
                        <MoreIcon />
                      </button>
                    )}

                    {/* Dropdown Menu Overlay */}
                    {openDropdownId === task.id && (
                      <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 py-2 z-20 animate-float-up" style={{ animation: 'floatUp 0.2s ease-out forwards' }}>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                          <EditIcon /> Edit Task
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                          <AlertIcon /> Change Priority
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left">
                          <TrashIcon /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expand/Collapse Button */}
              <button 
                onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                className="w-full mt-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
              >
                {isQueueExpanded ? <><ChevronUp /> Collapse Queue</> : <><PlusIcon /> Expand Queue</>}
              </button>
            </div>

            {/* RIGHT WIDGETS */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-[#FF8B5E] to-[#FF6B3E] rounded-[2rem] p-6 shadow-md shadow-orange-200 text-white">
                <h3 className="text-xs font-bold text-white/80 tracking-widest uppercase mb-4">Coming Up</h3>
                <h2 className="text-2xl font-bold tracking-tight mb-1">Design Sync</h2>
                <p className="text-sm text-white/80 font-medium mb-6">11:00 AM — Main Lounge</p>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <LinkIcon /> meet.taskflow.co...
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 mb-1">Streak</span>
                  <span className="text-3xl font-black text-[#FF8B5E]">12</span>
                </div>
                <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 mb-1">Tasks</span>
                  <span className="text-3xl font-black text-[#28B8FA]">48</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">Calendar</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-stretch gap-3">
                    <div className="w-1 bg-[#34D399] rounded-full"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Project Launch</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Oct 26 • 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex items-stretch gap-3">
                    <div className="w-1 bg-[#28B8FA] rounded-full"></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Feedback Loop</h4>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Oct 27 • 10:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          
          /* --- PROJECTS (KANBAN MOCKUP) TAB --- */
          <div className="flex-1 px-10 pb-10 flex flex-col overflow-hidden">
            <div className="flex items-center gap-8 border-b border-slate-200 mb-6">
              <button className="pb-4 font-bold text-[#28B8FA] border-b-2 border-[#28B8FA]">Tasks <span className="ml-2 bg-[#28B8FA] text-white text-xs px-2 py-0.5 rounded-full">12</span></button>
              <button className="pb-4 font-bold text-slate-400 hover:text-slate-600">Timeline</button>
              <button className="pb-4 font-bold text-slate-400 hover:text-slate-600">Files</button>
              <button className="pb-4 font-bold text-slate-400 hover:text-slate-600">Team</button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
               {/* Lưới Grid nền (Grid background Pattern) */}
               <div className="h-full w-max flex gap-6" style={{ backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                  
                  {/* Column 1 */}
                  <div className="w-80 flex flex-col gap-4 mt-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl">
                    <h3 className="font-bold text-xs tracking-widest text-slate-400 uppercase flex items-center justify-between px-2">
                      To Do <span className="bg-slate-200 text-slate-600 px-2 rounded-md">4</span>
                    </h3>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-[#FF8B5E] bg-[#FFF2DE] w-max px-2 py-1 rounded-md uppercase">High Priority</span>
                      <h4 className="font-bold text-slate-800">User Onboarding Flow Sketches</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">Initial wireframes for the new login sequence including social auth.</p>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="w-80 flex flex-col gap-4 mt-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border-l-2 border-[#28B8FA]">
                    <h3 className="font-bold text-xs tracking-widest text-[#28B8FA] uppercase flex items-center justify-between px-2">
                      <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#28B8FA] rounded-full"></div> In Progress</span>
                      <span className="bg-[#EAF7FF] text-[#28B8FA] px-2 rounded-md">2</span>
                    </h3>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 border-t-4 border-t-[#28B8FA]">
                      <span className="text-[10px] font-bold text-[#34D399] bg-[#D1FAE5] w-max px-2 py-1 rounded-md uppercase">Dev</span>
                      <h4 className="font-bold text-slate-800">Home Screen React Components</h4>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#28B8FA] w-[60%] h-full"></div>
                      </div>
                    </div>
                  </div>

               </div>
            </div>
          </div>
        )}

        {/* FAB Button */}
        {activeTab === 'Command' && (
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
            <button 
              onClick={() => { setIsQuickEntryOpen(false); setSelectedTags([]); }}
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
              />

              {/* Dynamic Bottom Section based on Selected Tags */}
              <div className="flex items-center justify-between mt-4 h-24">
                
                {/* Tags Section */}
                <div className="flex items-center gap-3">
                  {selectedTags.length > 0 && <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mr-2">Quick Tag:</span>}
                  
                  <button onClick={() => toggleTag('Work')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Work') ? 'bg-[#EAF7FF] text-[#28B8FA]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    <BriefcaseIcon /> Work
                  </button>
                  <button onClick={() => toggleTag('Personal')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Personal') ? 'bg-[#D1FAE5] text-[#34D399]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    <UserIcon /> Personal
                  </button>
                  <button onClick={() => toggleTag('Urgent')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedTags.includes('Urgent') ? 'bg-[#FFF2DE] text-[#FF8B5E]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    <ZapIcon /> Urgent
                  </button>
                </div>

                {/* Submit Button (Changes shape based on selection) */}
                <div className="ml-auto">
                  {selectedTags.length === 0 ? (
                    // Big Green Square Button (Hình 5)
                    <button className="bg-[#34D399] hover:bg-emerald-500 transition-colors text-white font-bold rounded-[2rem] w-32 h-32 flex flex-col items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                      <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckIcon />
                      </div>
                      Create Task
                    </button>
                  ) : (
                    // Smaller Orange Pill Button (Hình 6)
                    <button className="bg-[#FF8B5E] hover:bg-orange-500 transition-all text-white font-bold rounded-2xl px-6 py-4 flex items-center justify-center gap-3 shadow-lg shadow-orange-200 animate-in slide-in-from-right-4">
                      Add Task <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Style for dropdown animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}