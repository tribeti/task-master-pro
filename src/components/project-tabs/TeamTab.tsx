"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SearchIcon, PlusIcon, MoreIcon } from "@/components/icons";
import { BoardMember } from "@/lib/types/project";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

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

// ── Component for individual member avatar ──
interface MemberAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  className?: string;
  colors: { bg: string; text: string };
}

function TeamMemberAvatar({
  avatarUrl,
  displayName,
  className,
  colors,
}: MemberAvatarProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!avatarUrl) {
      setUrl(null);
      return;
    }

    if (avatarUrl.startsWith("http")) {
      setUrl(avatarUrl);
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.storage
          .from("avatar")
          .createSignedUrl(avatarUrl, 3600); // 1 hour

        if (error) {
          console.error("Error creating signed URL for member avatar:", error);
        } else if (data?.signedUrl) {
          setUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Failed to fetch signed URL:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [avatarUrl, supabase]);

  if (loading) {
    return (
      <div className={`rounded-full bg-slate-100 animate-pulse ${className}`} />
    );
  }

  if (url) {
    return (
      <img
        src={url}
        alt={displayName}
        className={`rounded-full border-4 border-white shadow-sm object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full ${colors.bg} border-4 border-white shadow-sm flex items-center justify-center font-black ${colors.text} ${className}`}
    >
      {getInitials(displayName)}
    </div>
  );
}

export function TeamTab({ boardId }: TeamTabProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { user, profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";

  // Add member modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Remove member state
  const [memberToRemove, setMemberToRemove] = useState<BoardMember | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const isCurrentUserOwner = useMemo(() => {
    return members.some((m) => m.role === "Owner" && m.user_id === user?.id);
  }, [members, user?.id]);

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
  /**
   * Sends an invitation to the user with the given email.
   * The POST endpoint no longer adds the user directly – it creates
   * a `board_invitations` record and sends an email.
   */
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

      // Success – invitation was created (user is NOT added yet)
      setSuccessMsg(`Lời mời đã được gửi đến ${email}!`);
      setEmail("");

      // Auto close after 2.5 seconds
      setTimeout(() => {
        setSuccessMsg(null);
        setIsAddOpen(false);
      }, 2500);
    } catch {
      setErrorMsg("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Remove member handler ──
  const executeRemoveMember = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/members/${memberToRemove.user_id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Xóa thành viên thất bại");
      } else {
        toast.success("Đã xóa thành viên khỏi dự án");
        setMembers((prev) =>
          prev.filter((m) => m.user_id !== memberToRemove.user_id),
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối khi xóa thành viên");
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
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
            className={`w-full border rounded-full py-2 pl-10 pr-4 text-sm font-medium focus:outline-none transition-all shadow-sm ${
              isCozy 
                ? "bg-slate-900 border-slate-800 text-white placeholder-slate-700 focus:border-[#FF8B5E]" 
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#28B8FA]"
            }`}
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
              className={`rounded-4xl p-6 border shadow-sm flex flex-col items-center animate-pulse ${
                isCozy ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100"
              }`}
            >
              <div className={`w-24 h-24 rounded-full mb-4 ${isCozy ? "bg-slate-800" : "bg-slate-200"}`}></div>
              <div className={`h-5 w-32 rounded mb-2 ${isCozy ? "bg-slate-800" : "bg-slate-200"}`}></div>
              <div className={`h-3 w-20 rounded mb-6 ${isCozy ? "bg-slate-700" : "bg-slate-100"}`}></div>
              <div className={`h-10 w-full rounded-xl ${isCozy ? "bg-slate-800" : "bg-slate-100"}`}></div>
            </div>
          ))
          : filteredMembers.map((member, index) => {
            const colors = getAvatarColor(index);
            return (
              <div
                key={member.user_id}
                className={`rounded-4xl p-6 border shadow-sm flex flex-col items-center relative hover:shadow-md transition-all ${
                  isCozy ? "bg-[#0F172A] border-slate-800 hover:border-slate-700" : "bg-white border-slate-100"
                }`}
              >
                {isCurrentUserOwner && member.role !== "Owner" && (
                  <button
                    onClick={() => setMemberToRemove(member)}
                    title="Xóa thành viên"
                    className={`absolute top-6 right-6 transition-colors rounded-full p-2 ${
                      isCozy ? "text-rose-500 hover:text-rose-400 bg-rose-950/20" : "text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                )}

                {/* Avatar */}
                <div className="relative mb-4">
                  <TeamMemberAvatar
                    avatarUrl={member.avatar_url}
                    displayName={member.display_name}
                    colors={colors}
                    className={`w-24 h-24 ${isCozy ? "border-slate-800" : "border-white"}`}
                  />
                </div>
                {/* Name & Role */}
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isCozy ? "text-white" : "text-slate-900"}`}>
                  {member.display_name}
                  {member.role === "Owner" && (
                    <span
                      title="Chủ dự án"
                      className="inline-flex items-center"
                    >
                      <svg
                        className="w-5 h-5 text-amber-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                      </svg>
                    </span>
                  )}
                </h3>
                <p
                  className={`text-[10px] font-bold tracking-widest uppercase mt-1 mb-6 ${member.role === "Owner"
                      ? "text-amber-500"
                      : (isCozy ? "text-slate-600" : "text-slate-400")
                    }`}
                >
                  {member.role === "Owner" ? "Chủ dự án" : member.role}
                </p>

                {/* Joined date */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isCozy ? "text-slate-600" : "text-slate-400"}>Joined</span>
                    <span className={isCozy ? "text-slate-400" : "text-slate-600"}>
                      {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>

                <button className={`w-full py-3 rounded-xl border-2 font-bold text-sm transition-colors ${
                  isCozy 
                    ? "border-slate-800 text-slate-600 hover:border-[#FF8B5E] hover:text-[#FF8B5E]" 
                    : "border-slate-100 text-slate-500 hover:border-[#28B8FA] hover:text-[#28B8FA]"
                }`}>
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
          className={`rounded-4xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all h-full min-h-100 ${
            isCozy ? "bg-transparent border-slate-800 hover:bg-slate-900/50" : "bg-transparent border-slate-200 hover:bg-slate-50"
          }`}
        >
          <div className={`w-16 h-16 rounded-full border flex items-center justify-center shadow-sm mb-4 ${
            isCozy ? "bg-slate-900 border-slate-800 text-[#FF8B5E]" : "bg-white border-slate-100 text-[#28B8FA]"
          }`}>
            <PlusIcon />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isCozy ? "text-white" : "text-slate-800"}`}>
            Mời thành viên
          </h3>
          <p className="text-sm text-slate-400 font-medium px-4">
            Gửi lời mời đến email để thêm thành viên mới.
          </p>
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className={`absolute inset-0 backdrop-blur-sm ${isCozy ? "bg-slate-950/60" : "bg-black/40"}`}
            onClick={() => setIsAddOpen(false)}
          ></div>

          {/* Modal */}
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-md p-8 mx-4 animate-in fade-in zoom-in-95 duration-200 transition-colors duration-500 border ${
            isCozy ? "bg-[#0F172A] border-slate-800" : "bg-white border-transparent"
          }`}>
            <h2 className={`text-2xl font-extrabold mb-2 ${isCozy ? "text-white" : "text-slate-900"}`}>
              Gửi lời mời
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Nhập email của người dùng. Họ sẽ nhận được lời mời qua email và
              cần chấp nhận để tham gia.
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
                  className={`w-full border rounded-xl py-3 px-4 text-sm font-medium focus:outline-none transition-all ${
                    isCozy 
                      ? "bg-slate-900 text-white border-slate-800 focus:border-[#FF8B5E]" 
                      : "bg-slate-50 text-black border-slate-200 focus:border-[#28B8FA] focus:ring-2 focus:ring-[#28B8FA]/20"
                  }`}
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
                  <span className={`text-sm font-semibold ${isCozy ? "text-emerald-400" : "text-emerald-600"}`}>
                    {successMsg}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-colors ${
                    isCozy 
                      ? "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800" 
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                    isCozy 
                      ? "bg-[#FF8B5E] text-white hover:bg-orange-600 shadow-orange-950/20" 
                      : "bg-[#28B8FA] text-white hover:bg-[#1DA1E0] shadow-cyan-200"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                      Đang gửi...
                    </span>
                  ) : (
                    "Gửi lời mời"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Member Modal ── */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm ${isCozy ? "bg-slate-950/60" : "bg-black/40"}`}
            onClick={() => !isRemoving && setMemberToRemove(null)}
          ></div>
          <div className={`relative rounded-3xl shadow-2xl w-full max-w-sm p-8 mx-4 animate-in fade-in zoom-in-95 duration-200 border ${
            isCozy ? "bg-[#0F172A] border-slate-800" : "bg-white border-transparent"
          }`}>
            <h2 className={`text-xl font-extrabold mb-2 ${isCozy ? "text-white" : "text-slate-900"}`}>
              Xóa thành viên
            </h2>
            <p className={`text-sm mb-6 leading-relaxed ${isCozy ? "text-slate-400" : "text-slate-500"}`}>
              Bạn có chắc chắn muốn xóa{" "}
              <strong className={isCozy ? "text-white" : "text-slate-800"}>
                {memberToRemove.display_name}
              </strong>{" "}
              khỏi dự án này? Người dùng sẽ ngay lập tức mất quyền truy cập và
              được gỡ khỏi tất cả công việc đang được giao.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className={`flex-[1] py-2.5 rounded-xl border font-bold text-sm transition-colors disabled:opacity-50 ${
                  isCozy 
                    ? "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={executeRemoveMember}
                disabled={isRemoving}
                className={`flex-[1] py-2.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md ${
                  isCozy ? "bg-rose-600 hover:bg-rose-700 shadow-rose-950/40" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                }`}
              >
                {isRemoving ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                ) : (
                  "Xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
