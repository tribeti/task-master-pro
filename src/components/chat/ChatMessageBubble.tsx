import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { UserAvatar } from "@/components/UserAvatar";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  showTime: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
}

export function ChatMessageBubble({
  message,
  isMine,
  showAvatar,
  showTime,
  onDelete,
  onEdit,
}: ChatMessageBubbleProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(message.content);
    }
  }, [message.id, message.content, isEditing]);

  const displayName = message.users?.display_name || "Thành viên";

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Handle click outside context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isMine) return;
    e.preventDefault();
    setShowMenu(true);
  };

  const handleMenuTriggerKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowMenu((prev) => !prev);
    } else if (e.key === "Escape") {
      setShowMenu(false);
    }
  };

  const submitEdit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit?.(message.id, editContent.trim());
    } else {
      setEditContent(message.content); // reset if empty or unchanged
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`flex w-full mt-0.5 mb-0.5 ${isMine ? "justify-end" : "justify-start"} ${showTime ? "mb-2" : ""}`}
    >
      <div
        className={`flex max-w-[70%] gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div className="w-8 shrink-0 flex flex-col justify-end pb-1">
          {showAvatar && !isMine && (
            <UserAvatar
              avatarUrl={message.users?.avatar_url || null}
              displayName={displayName}
              className="w-8 h-8"
              fallbackClassName={isCozy ? "bg-slate-800 text-slate-400" : "bg-slate-200 text-slate-700"}
            />
          )}
        </div>

        {/* Bubble Area */}
        <div
          className={`flex flex-col relative ${isMine ? "items-end" : "items-start"}`}
        >
          {showAvatar && !isMine && (
            <span className={`text-xs mb-1 ml-1 ${isCozy ? "text-slate-500" : "text-slate-400"}`}>
              {displayName}
            </span>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 w-full min-w-50">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitEdit();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }
                }}
                className={`w-full text-[15px] p-2 rounded-xl border focus:outline-none resize-none transition-colors ${
                  isCozy 
                    ? "bg-slate-800 border-slate-700 text-white focus:border-[#FF8B5E]" 
                    : "bg-white border-slate-300 focus:border-[#28B8FA]"
                }`}
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
                <button
                  onClick={submitEdit}
                  className={`text-xs text-white px-2 py-1 rounded transition-colors ${
                    isCozy ? "bg-[#FF8B5E] hover:bg-orange-600" : "bg-[#28B8FA] hover:bg-[#0EA5E9]"
                  }`}
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center group gap-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                onContextMenu={handleContextMenu}
                className={`px-4 py-2.5 rounded-2xl relative cursor-pointer ${
                  isMine
                    ? (isCozy ? "bg-[#FF8B5E] text-white rounded-br-sm shadow-md shadow-orange-950/20" : "bg-[#28B8FA] text-white rounded-br-sm")
                    : (isCozy ? "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm")
                }`}
              >
                <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                  {message.content}
                  {message.is_edited && (
                    <span className="text-[10px] opacity-70 ml-2 italic">
                      (đã chỉnh sửa)
                    </span>
                  )}
                </p>
              </div>

              {/* Visible accessible menu trigger — shown only for own messages */}
              {isMine && (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={menuTriggerRef}
                    aria-haspopup="true"
                    aria-expanded={showMenu}
                    aria-label="Tùy chọn tin nhắn"
                    onClick={() => setShowMenu((prev) => !prev)}
                    onKeyDown={handleMenuTriggerKeyDown}
                    className={`w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all ${
                      isCozy ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>

                  {/* Context Menu */}
                  {showMenu && (
                    <div className={`absolute top-full right-0 mt-1 w-32 rounded-xl shadow-lg border py-1 z-50 transition-colors ${
                      isCozy ? "bg-slate-900 border-slate-700" : "bg-white border-slate-100"
                    }`}>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isCozy ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          onDelete?.(message.id);
                          setShowMenu(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isCozy ? "text-red-400 hover:bg-red-950/30" : "text-red-600 hover:bg-red-50"
                        }`}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Time display: only show if explicitly asked (e.g. last in cluster) */}
          {showTime && (
            <span className={`text-[10px] mt-1 mx-1 ${isCozy ? "text-slate-600" : "text-slate-300"}`}>{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}
