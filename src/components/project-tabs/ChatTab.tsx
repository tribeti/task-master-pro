import React, { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { useDashboardUser } from "@/app/(dashboard)/provider";
import { ChatInput } from "../chat/ChatInput";
import { ChatMessageBubble } from "../chat/ChatMessageBubble";
import { DeleteMessageModal } from "../chat/DeleteMessageModal";
import { useState } from "react";

export function ChatTab({ projectId }: { projectId: number }) {
  const { user, profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);
  const {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
    onlineUsers,
    updateTypingStatus,
  } = useChat(projectId, user?.id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track the id of the last message so we only scroll when a new one is appended
  const prevLastMessageIdRef = useRef<string | undefined>(undefined);

  // Auto-scroll to bottom only when a new message is appended at the end.
  // Skips scrolling when loadMore() prepends older messages at the top.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage?.id;
    if (lastId && lastId !== prevLastMessageIdRef.current) {
      prevLastMessageIdRef.current = lastId;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle scroll to top for pagination
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMore && !loadingMore) {
      // Capture the current scrollHeight before loadMore prepends messages
      const prevScrollHeight = container.scrollHeight;

      loadMore().then(() => {
        // After React re-renders with the prepended messages, restore the
        // reading position so the viewport doesn't jump to the top.
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        });
      });
    }
  };

  const typingUsers = Object.values(onlineUsers).filter(
    (u) => u.is_typing && u.user_id !== user?.id,
  );

  return (
    <div className={`flex flex-col h-full rounded-3xl border overflow-hidden shadow-sm transition-colors duration-500 ${
      isCozy ? "bg-[#0F172A] border-slate-700/50" : "bg-[#F8FAFC] border-slate-200"
    }`}>
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-6 flex flex-col"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {loading && messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
              isCozy ? "border-slate-800 border-t-[#FF8B5E]" : "border-slate-200 border-t-[#28B8FA]"
            }`}></div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={`px-4 py-1.5 border text-xs font-bold rounded-full transition-colors disabled:opacity-50 ${
                    isCozy 
                      ? "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {loadingMore ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
                </button>
              </div>
            )}

            {messages.map((msg, index) => {
              const isMine = msg.sender_id === user?.id;
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];
              
              // Show avatar if it's the first message in a block from this user
              const showAvatar =
                !prevMsg || prevMsg.sender_id !== msg.sender_id;

              // Show time if it's the last message in a block, or if the next message is > 5 mins away
              let showTime = false;
              if (!nextMsg) {
                showTime = true; // Very last message
              } else if (nextMsg.sender_id !== msg.sender_id) {
                showTime = true; // Last message from this user before someone else
              } else {
                const diffMs = new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime();
                if (diffMs > 5 * 60 * 1000) showTime = true; // > 5 mins gap
              }

              return (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  showTime={showTime}
                  onDelete={(id) => setMessageIdToDelete(id)}
                  onEdit={editMessage}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      <div className={`h-6 px-6 flex items-center shrink-0 transition-colors duration-500 ${isCozy ? "bg-[#0F172A]" : "bg-[#F8FAFC]"}`}>
        {typingUsers.length > 0 && (
          <p className={`text-xs font-medium animate-pulse ${isCozy ? "text-slate-500" : "text-slate-400"}`}>
            {typingUsers.map((u) => u.display_name || "Ai đó").join(", ")}{" "}
            {typingUsers.length > 1 ? "đang gõ..." : "đang gõ..."}
          </p>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} onTyping={updateTypingStatus} />

      {/* Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={messageIdToDelete !== null}
        onClose={() => setMessageIdToDelete(null)}
        onConfirm={() => {
          if (messageIdToDelete) {
            deleteMessage(messageIdToDelete);
          }
        }}
      />
    </div>
  );
}
