import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Notification } from "@/types/project";
import { toast } from "sonner";
import { triggerDeadlineNotifications } from "@/app/actions/notification.actions";

let cronTriggered = false;

export function resetCronTriggered() {
  cronTriggered = false;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const hideNotification = async (notificationId: number) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    setNotifications(prev => {
      const next = prev.filter(n => n.id !== notificationId);
      setUnreadCount(next.filter(n => !n.is_read).length);
      return next;
    });

    const newContent = notification.content.startsWith("[DELETED]")
      ? notification.content
      : `[DELETED]${notification.content}`;

    const { error } = await supabase
      .from("notifications")
      .update({ content: newContent })
      .eq("id", notificationId);

    if (error) {
      console.error("Failed to hide notification:", error);
      toast.error("Không thể xóa thông báo. Vui lòng thử lại.");
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  };

  const hideAllNotifications = async () => {
    const toHide = notifications.filter(n => !n.content.startsWith("[DELETED]"));
    
    const previousNotifications = [...notifications];
    const previousUnreadCount = unreadCount;

    setNotifications([]);
    setUnreadCount(0);

    if (toHide.length > 0) {
      const results = await Promise.all(
        toHide.map((n) =>
          supabase
            .from("notifications")
            .update({ content: `[DELETED]${n.content}` })
            .eq("id", n.id)
        )
      );

      const hasError = results.some(res => res.error);
      if (hasError) {
        console.error("Failed to hide all notifications");
        toast.error("Đã xảy ra lỗi khi xóa tất cả thông báo.");
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
      }
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*, task:tasks(title, deadline), project:boards(title)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error.message, error);
      } else if (data) {
        const visibleData = data
          .filter((n: Notification) => !n.content.startsWith("[DELETED]"))
          .map((n: Notification) => ({
            ...n,
            content: n.content.replace(/\[DEADLINE_ISO:.*?\]/, "")
          }));
        setNotifications(visibleData as Notification[]);
        setUnreadCount(visibleData.filter((n: Notification) => !n.is_read).length);
      }
      setIsLoading(false);
    };

    fetchNotifications();

    // Auto-trigger deadline check once per session when dashboard loads
    if (!cronTriggered) {
      cronTriggered = true;
      triggerDeadlineNotifications().catch((err) =>
        console.error("Failed to trigger deadline check:", err),
      );
    }

    // Use a unique channel topic so multiple instances of the hook don't conflict
    const channelName = `notifications-${userId}-${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const rawNotification = payload.new as Notification;
            if (rawNotification.content.startsWith("[DELETED]")) return;

            // Extract deadline ISO if embedded to synchronously render correct colors without fetching
            const deadlineMatch = rawNotification.content.match(/\[DEADLINE_ISO:(.*?)\]/);

            const finalNotification = { ...rawNotification } as Notification;
            finalNotification.content = rawNotification.content.replace(/\[DEADLINE_ISO:.*?\]/, "");
            if (deadlineMatch) {
              finalNotification.task = { title: "", deadline: deadlineMatch[1] };
            }

            setNotifications((prev) => {
              const exists = prev.find((n) => n.id === finalNotification.id);
              if (exists) return prev;

              const next = [finalNotification, ...prev];
              setUnreadCount(next.filter((n) => !n.is_read).length);
              return next;
            });

            toast("Thông báo mới", {
              description: finalNotification.content,
              action: {
                label: "Đã đọc",
                onClick: async () => {
                  await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("id", finalNotification.id);
                },
              },
            });
          } else if (payload.eventType === "UPDATE") {
            const rawUpdated = payload.new as Notification;

            setNotifications((prev) => {
              if (rawUpdated.content.startsWith("[DELETED]")) {
                const next = prev.filter(n => n.id !== rawUpdated.id);
                setUnreadCount(next.filter((n) => !n.is_read).length);
                return next;
              }

              const deadlineMatch = rawUpdated.content.match(/\[DEADLINE_ISO:(.*?)\]/);
              const updated = { ...rawUpdated, content: rawUpdated.content.replace(/\[DEADLINE_ISO:.*?\]/, "") };
              if (deadlineMatch) {
                updated.task = { title: "", deadline: deadlineMatch[1] };
              }

              const next = prev.map((n) =>
                n.id === updated.id ? { ...n, ...updated } : n,
              );
              if (!prev.some(n => n.id === updated.id)) {
                next.unshift(updated);
              }
              setUnreadCount(next.filter((n) => !n.is_read).length);
              return next;
            });
          } else if (payload.eventType === "DELETE") {
            const oldId = payload.old?.id;
            if (oldId) {
              setNotifications((prev) => {
                const next = prev.filter((n) => n.id !== oldId);
                setUnreadCount(next.filter((n) => !n.is_read).length);
                return next;
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const markAsRead = async (notificationId: number) => {
    // Optimistic UI update
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n,
      );
      setUnreadCount(next.filter((n) => !n.is_read).length);
      return next;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, is_read: true }));
      setUnreadCount(0);
      return next;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, hideNotification, hideAllNotifications };
}
