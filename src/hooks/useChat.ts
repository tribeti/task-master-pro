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

  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>(
    {},
  );
  const channelRef = useRef<RealtimeChannel | null>(null);
  const requestSeqRef = useRef(0);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!boardId) return;
    // Grab the sequence number for THIS fetch before any await.
    const seq = ++requestSeqRef.current;

    setMessages([]);
    setHasMore(false);
    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*, users!messages_sender_id_fkey(display_name, avatar_url)")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (seq !== requestSeqRef.current) return;

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages((data || []).reverse() as ChatMessage[]);
      setHasMore(data?.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [boardId, supabase]);

  // Load more messages (older)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    // Grab the sequence number for THIS fetch before any await.
    const seq = ++requestSeqRef.current;
    setLoadingMore(true);

    const oldestMessageDate = messages[0].created_at;

    const { data, error } = await supabase
      .from("messages")
      .select("*, users!messages_sender_id_fkey(display_name, avatar_url)")
      .eq("board_id", boardId)
      .lt("created_at", oldestMessageDate)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    // If boardId changed while we were awaiting, discard this response.
    if (seq !== requestSeqRef.current) {
      setLoadingMore(false);
      return;
    }

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

    const tempId =
      typeof crypto !== "undefined" && crypto.randomUUID
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
      _tempId: tempId,
      users: {
        display_name: currentUser.display_name || "Tôi",
        avatar_url: null,
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        board_id: boardId,
        sender_id: currentUserId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      // Replace the optimistic placeholder with the canonical DB row,
      // preserving the _tempId marker so the upcoming realtime INSERT event
      // (which carries data.id) can be deduplicated correctly.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? ({ ...m, ...data, _tempId: tempId } as ChatMessage)
            : m,
        ),
      );
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentUserId) return;

    // Optimistic delete: find the message first so we can re-insert on failure
    let deletedMsg: ChatMessage | undefined;
    setMessages((prev) => {
      deletedMsg = prev.find((m) => m.id === messageId);
      return prev.filter((m) => m.id !== messageId);
    });

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);
    if (error) {
      console.error("Error deleting message, re-inserting locally:", error);
      // Targeted inverse patch: re-insert only the deleted message in sorted
      // position by created_at so we don't overwrite any realtime updates.
      if (deletedMsg) {
        const msg = deletedMsg;
        setMessages((prev) => {
          const insertIdx = prev.findIndex(
            (m) => m.created_at > msg.created_at,
          );
          if (insertIdx === -1) return [...prev, msg];
          const next = [...prev];
          next.splice(insertIdx, 0, msg);
          return next;
        });
      }
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!currentUserId || !newContent.trim()) return;

    // Snapshot only the target message so a rollback never clobbers
    // concurrent realtime updates to unrelated messages.
    const prevMessage = messages.find((m) => m.id === messageId);
    if (!prevMessage) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: newContent.trim(),
              is_edited: true,
              updated_at: new Date().toISOString(),
            }
          : m,
      ),
    );

    const { error } = await supabase
      .from("messages")
      .update({
        content: newContent.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("Error editing message, rolling back:", error);
      // Revert only the message that failed — leave all other messages intact.
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? prevMessage : m)),
      );
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!channelRef.current || !currentUserId) return;
    const currentUserPresence = onlineUsers[currentUserId];
    await channelRef.current.track({
      user_id: currentUserId,
      display_name: currentUserPresence?.display_name ?? null,
      is_typing: isTyping,
      last_typed: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!boardId || !currentUserId) return;

    // Invalidate any in-flight fetches from the previous boardId immediately.
    requestSeqRef.current++;

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
            users: userData || null,
          } as ChatMessage;

          setMessages((prev) => {
            // Deduplicate: ignore if the real id already exists OR if any
            // message in state carries this id as its _tempId (i.e. the
            // optimistic message was already promoted to the real id before
            // the realtime event arrived).
            const alreadyPresent = prev.some(
              (m) => m.id === msgWithUser.id || m._tempId === msgWithUser.id,
            );
            if (alreadyPresent) return prev;
            return [...prev, msgWithUser];
          });
        },
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m,
            ),
          );
        },
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
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        },
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
      // Bump the sequence counter so any in-flight loadMessages / loadMore
      // calls from this boardId are silently discarded when they resolve.
      requestSeqRef.current++;
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
    updateTypingStatus,
  };
}
