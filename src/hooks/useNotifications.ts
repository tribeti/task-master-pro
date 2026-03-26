import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Notification } from "@/types/project";
import { toast } from "sonner";

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
                console.error("Error fetching notifications:", error);
            } else if (data) {
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
            setIsLoading(false);
        };

        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`public:notifications:user_id=eq.${userId}`)
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
                        setNotifications(prev => [newNotification, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        toast("New Notification", {
                            description: newNotification.content,
                            action: {
                                label: "View",
                                onClick: async () => {
                                    await supabase.from("notifications").update({ is_read: true }).eq("id", newNotification.id);
                                    
                                    if (newNotification.project_id) {
                                        router.push(`/projects/${newNotification.project_id}`);
                                    } else {
                                        router.push(`/notifications`);
                                    }
                                }
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const markAsRead = async (notificationId: number) => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId);

        if (error) {
            console.error("Error marking as read:", error);
        } else {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) {
            console.error("Error marking all as read:", error);
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}
