import React from "react";
import Image from "next/image";
import { TEAM_MEMBERS } from "@/lib/constants";
import { SearchIcon, PlusIcon, MoreIcon } from "@/components/icons";

export function TeamTab() {
  return (
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
        <div className="bg-transparent rounded-4xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-full min-h-100">
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
}
