import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import Image from "next/image";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl =
    message.users?.avatar_url ||
    "https://ui-avatars.com/api/?name=" + (message.users?.display_name || "U");
  const displayName = message.users?.display_name || "Thành viên";

  // Format time (e.g. 10:30)
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
      <div className={`flex max-w-[70%] gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className="w-8 shrink-0 flex flex-col justify-end pb-1">
          {showAvatar && !isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-200">
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            </div>
          )}
        </div>

        {/* Bubble Area */}
        <div className={`flex flex-col relative ${isMine ? "items-end" : "items-start"}`}>
          {showAvatar && !isMine && (
            <span className="text-xs text-slate-400 mb-1 ml-1">{displayName}</span>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 w-full min-w-[200px]">
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
                className="w-full text-[15px] p-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#28B8FA] bg-white resize-none"
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
                  className="text-xs text-white bg-[#28B8FA] px-2 py-1 rounded hover:bg-[#0EA5E9]"
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <div
              onContextMenu={handleContextMenu}
              className={`px-4 py-2.5 rounded-2xl relative group cursor-pointer ${
                isMine
                  ? "bg-[#28B8FA] text-white rounded-br-sm"
                  : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"
              }`}
            >
              <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                {message.content}
                {message.is_edited && (
                  <span className="text-[10px] opacity-70 ml-2 italic">(đã chỉnh sửa)</span>
                )}
              </p>

              {/* Context Menu */}
              {showMenu && isMine && (
                <div
                  ref={menuRef}
                  className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50"
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Time display: only show if explicitly asked (e.g. last in cluster) */}
          {showTime && (
            <span className="text-[10px] text-slate-300 mt-1 mx-1">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}
