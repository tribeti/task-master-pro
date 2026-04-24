import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatMessage, PresenceState } from "@/types/chat";
import { RealtimeChannel } from "@supabase/supabase-js";

const PAGE_SIZE = 50;

export function useChat(boardId: number, currentUserId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("messages")
      .select("*, users!messages_sender_id_fkey(display_name, avatar_url)")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      // Data is descending (newest first). Reverse it for UI so oldest is top.
      setMessages((data || []).reverse() as ChatMessage[]);
      setHasMore(data?.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [boardId, supabase]);

  // Load more messages (older)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);

    const oldestMessageDate = messages[0].created_at;

    const { data, error } = await supabase
      .from("messages")
      .select("*, users!messages_sender_id_fkey(display_name, avatar_url)")
      .eq("board_id", boardId)
      .lt("created_at", oldestMessageDate)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error loading more messages:", error);
    } else {
      if (data) {
        setMessages((prev) => [...data.reverse(), ...prev] as ChatMessage[]);
        setHasMore(data.length === PAGE_SIZE);
      }
    }
    setLoadingMore(false);
  }, [boardId, hasMore, loadingMore, messages, supabase]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentUserId) return;
    
    // OPTIMISTIC UPDATE: Hiển thị tin nhắn ngay lập tức trên UI
    // Fallback to Math.random if crypto is not available in non-secure contexts
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Fetch current user details for the optimistic bubble
    const currentUser = onlineUsers[currentUserId] || { display_name: "Tôi" };
    
    const optimisticMsg: ChatMessage = {
      id: tempId,
      board_id: boardId,
      sender_id: currentUserId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_edited: false,
      users: {
        display_name: currentUser.display_name || "Tôi",
        avatar_url: null
      }
    };

    setMessages(prev => [...prev, optimisticMsg]);

    const { data, error } = await supabase.from("messages").insert({
      board_id: boardId,
      sender_id: currentUserId,
      content: content.trim(),
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data) {
       // Cập nhật lại ID thật từ database (nếu cần thiết để tránh lỗi key/delete sau này)
       setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentUserId) return;
    
    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== messageId));
    
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      console.error("Error deleting message:", error);
      // Ideally we would rollback here, but for simplicity we assume success or let realtime resync
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!currentUserId || !newContent.trim()) return;

    // Optimistic edit
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, content: newContent.trim(), is_edited: true, updated_at: new Date().toISOString() } : m
    ));

    const { error } = await supabase.from("messages").update({
      content: newContent.trim(),
      is_edited: true,
      updated_at: new Date().toISOString()
    }).eq("id", messageId);

    if (error) {
      console.error("Error editing message:", error);
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!channelRef.current || !currentUserId) return;
    await channelRef.current.track({
      user_id: currentUserId,
      is_typing: isTyping,
      last_typed: new Date().toISOString()
    });
  };

  useEffect(() => {
    if (!boardId || !currentUserId) return;

    loadMessages();

    // Initialize Realtime Channel for messages and presence
    const channel = supabase.channel(`board_chat_${boardId}`, {
      config: {
        presence: { key: currentUserId },
      },
    });
    channelRef.current = channel;

    // Listen for new messages
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `board_id=eq.${boardId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch sender details because it's not in the insert payload
          const { data: userData } = await supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();
            
          const msgWithUser = {
            ...newMsg,
            users: userData || null
          } as ChatMessage;

          setMessages((prev) => {
            // Check if already exists (in case of optimistic update)
            if (prev.find((m) => m.id === msgWithUser.id)) return prev;
            return [...prev, msgWithUser];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter(m => m.id !== deletedId));
        }
      )
      // Listen for presence state
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const formattedState: Record<string, PresenceState> = {};
        
        for (const [key, presences] of Object.entries(state)) {
           // presences is an array of presence objects for the same key. Get the latest.
           if (presences.length > 0) {
              formattedState[key] = presences[presences.length - 1];
           }
        }
        setOnlineUsers(formattedState);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, currentUserId, loadMessages, supabase]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
    onlineUsers,
    updateTypingStatus
  };
}
