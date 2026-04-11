import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Notification } from "@/types/project";
import { toast } from "sonner";
import { triggerDeadlineNotifications } from "@/app/actions/notification.actions";

// Module-level flag: trigger deadline cron only once per browser session
let cronTriggered = false;

export function useNotifications(userId: string | undefined) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

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
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
            setIsLoading(false);
        };

        fetchNotifications();

        // Auto-trigger deadline check once per session when dashboard loads
        if (!cronTriggered) {
            cronTriggered = true;
            triggerDeadlineNotifications().catch(err =>
                console.error("Failed to trigger deadline check:", err)
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
                        const newNotification = payload.new as Notification;
                        setNotifications(prev => {
                            const exists = prev.find(n => n.id === newNotification.id);
                            if (exists) return prev;

                            const next = [newNotification, ...prev];
                            setUnreadCount(next.filter(n => !n.is_read).length);
                            return next;
                        });

                        toast("Thông báo mới", {
                            description: newNotification.content,
                            action: {
                                label: "Đã đọc",
                                onClick: async () => {
                                    await supabase.from("notifications").update({ is_read: true }).eq("id", newNotification.id);
                                }
                            }
                        });
                    } else if (payload.eventType === "UPDATE") {
                        const updated = payload.new as Notification;
                        setNotifications(prev => {
                            const next = prev.map(n => n.id === updated.id ? { ...n, ...updated } : n);
                            setUnreadCount(next.filter(n => !n.is_read).length);
                            return next;
                        });
                    } else if (payload.eventType === "DELETE") {
                        const oldId = payload.old?.id;
                        if (oldId) {
                            setNotifications(prev => {
                                const next = prev.filter(n => n.id !== oldId);
                                setUnreadCount(next.filter(n => !n.is_read).length);
                                return next;
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const markAsRead = async (notificationId: number) => {
        // Optimistic UI update
        setNotifications(prev => {
            const next = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
            setUnreadCount(next.filter(n => !n.is_read).length);
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
        setNotifications(prev => {
            const next = prev.map(n => ({ ...n, is_read: true }));
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

    return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}
