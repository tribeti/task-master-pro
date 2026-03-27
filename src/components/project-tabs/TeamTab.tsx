"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SearchIcon, PlusIcon, MoreIcon } from "@/components/icons";
import { BoardMember } from "@/types/project";

interface TeamTabProps {
  boardId: number;
}

// ── Color palette for member avatars ──
const AVATAR_COLORS = [
  { bg: "bg-[#D1FAE5]", text: "text-[#34D399]" },
  { bg: "bg-[#FFF2DE]", text: "text-[#FF8B5E]" },
  { bg: "bg-[#EAF7FF]", text: "text-[#28B8FA]" },
  { bg: "bg-[#F3E8FF]", text: "text-purple-500" },
  { bg: "bg-[#FFE4E6]", text: "text-rose-500" },
  { bg: "bg-slate-100", text: "text-slate-500" },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function TeamTab({ boardId }: TeamTabProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add member modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Fetch members ──
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/boards/${boardId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // ── Add member handler ──
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        return;
      }

      // AC1: Success – add member to local state and show feedback
      setMembers((prev) => [...prev, data]);
      setSuccessMsg(`Đã thêm ${data.display_name} thành công!`);
      setEmail("");

      // Auto close after 2 seconds
      setTimeout(() => {
        setSuccessMsg(null);
        setIsAddOpen(false);
      }, 2000);
    } catch {
      setErrorMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter by search ──
  const filteredMembers = members.filter((m) =>
    m.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex-1 mt-6">
      {/* Search bar */}
      <div className="flex justify-end mb-6">
        <div className="relative w-64">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Find teammate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] shadow-sm"
          />
        </div>
      </div>

      {/* Members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 overflow-y-auto">
        {loading
          ? // Skeleton loading cards
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-4xl p-6 border border-slate-100 shadow-sm flex flex-col items-center animate-pulse"
              >
                <div className="w-24 h-24 rounded-full bg-slate-200 mb-4"></div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 w-20 bg-slate-100 rounded mb-6"></div>
                <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
              </div>
            ))
          : filteredMembers.map((member, index) => {
              const colors = getAvatarColor(index);
              return (
                <div
                  key={member.user_id}
                  className="bg-white rounded-4xl p-6 border border-slate-100 shadow-sm flex flex-col items-center relative hover:shadow-md transition-shadow"
                >
                  <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-full p-1">
                    <MoreIcon />
                  </button>

                  {/* Avatar */}
                  <div className="relative mb-4">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        width={96}
                        height={96}
                        alt={member.display_name}
                        className="w-24 h-24 rounded-full border-4 border-white shadow-sm object-cover"
                      />
                    ) : (
                      <div
                        className={`w-24 h-24 rounded-full ${colors.bg} border-4 border-white shadow-sm flex items-center justify-center text-3xl font-black ${colors.text}`}
                      >
                        {getInitials(member.display_name)}
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 w-5 h-5 border-2 border-white rounded-full bg-[#34D399]"></div>
                  </div>

                  {/* Name & Role */}
                  <h3 className="text-xl font-bold text-slate-900">
                    {member.display_name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 mb-6">
                    {member.role}
                  </p>

                  {/* Joined date */}
                  <div className="w-full mb-6">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Joined</span>
                      <span className="text-slate-600">
                        {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <button className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-[#28B8FA] hover:text-[#28B8FA] transition-colors">
                    View Profile
                  </button>
                </div>
              );
            })}

        {/* Add Member Card */}
        <div
          onClick={() => {
            setIsAddOpen(true);
            setErrorMsg(null);
            setSuccessMsg(null);
            setEmail("");
          }}
          className="bg-transparent rounded-4xl p-6 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors h-full min-h-100"
        >
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[#28B8FA] shadow-sm mb-4">
            <PlusIcon />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Add Member</h3>
          <p className="text-sm text-slate-400 font-medium px-4">
            Invite a new collaborator to join this board.
          </p>
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAddOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Thêm thành viên
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Nhập email của người dùng bạn muốn mời vào board.
            </p>

            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-[#28B8FA] focus:ring-2 focus:ring-[#28B8FA]/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-rose-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span className="text-sm font-semibold text-rose-600">
                    {errorMsg}
                  </span>
                </div>
              )}

              {/* Success message */}
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-500 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="text-sm font-semibold text-emerald-600">
                    {successMsg}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="flex-1 py-3 rounded-xl bg-[#28B8FA] text-white font-bold text-sm hover:bg-[#1DA1E0] transition-colors shadow-md shadow-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Đang thêm...
                    </span>
                  ) : (
                    "Thêm thành viên"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
