import React, { useRef, useEffect, useState } from "react";
import { useDashboardUser } from "@/app/(dashboard)/provider";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ onSendMessage, onTyping }: ChatInputProps) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Auto-resize logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing indicator: only emit start when transitioning from not-typing → typing
    if (!isTypingRef.current) {
      onTyping(true);
      isTypingRef.current = true;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      isTypingRef.current = false;
    }, 2000); // stop typing after 2 seconds of inactivity
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent new line
      submit();
    }
  };

  const submit = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        onTyping(false);
        isTypingRef.current = false;
      }
    }
  };

  return (
    <div className={`flex items-end gap-2 p-4 border-t transition-colors duration-500 ${
      isCozy ? "bg-[#0F172A] border-slate-800" : "bg-white border-slate-200"
    }`}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Nhập tin nhắn..."
        className={`flex-1 max-h-37.5 min-h-11 rounded-2xl py-3 px-4 focus:outline-none transition-all resize-none text-sm ${
          isCozy 
            ? "bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-[#FF8B5E]/50 focus:bg-slate-800" 
            : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-[#28B8FA] focus:bg-white"
        }`}
        rows={1}
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full transition-all ${
          text.trim()
            ? (isCozy ? "bg-[#FF8B5E] text-white hover:bg-orange-600 shadow-md hover:scale-105 shadow-orange-950/20" : "bg-[#28B8FA] text-white hover:bg-[#0EA5E9] shadow-md hover:scale-105")
            : (isCozy ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-slate-100 text-slate-400 cursor-not-allowed")
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 ml-1"
        >
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  );
}
