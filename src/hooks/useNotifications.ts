import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Notification } from "@/types/project";
import { toast } from "sonner";

export function useNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            setIsLoading(true);
            
            // --- LAZY GENERATE DEADLINE NOTIFICATIONS ---
            // Fetch user's tasks that have a deadline
            const { data: tasks } = await supabase
                .from("tasks")
                .select("id, title, deadline")
                .eq("assignee_id", userId)
                .not("deadline", "is", null);

            if (tasks && tasks.length > 0) {
                const now = new Date();
                const nowTime = now.getTime();
                const threeDaysFromNow = new Date(nowTime + 3 * 24 * 60 * 60 * 1000);

                const urgentTasks = tasks.filter((t: any) => {
                    const deadline = new Date(t.deadline);
                    return deadline <= threeDaysFromNow;
                });

                if (urgentTasks.length > 0) {
                    const { data: existingNotifs } = await supabase
                        .from("notifications")
                        .select("content")
                        .eq("user_id", userId);
                        
                    // Deduplicate by checking if content already contains the task title
                    const existingContents = existingNotifs?.map((n: any) => n.content) || [];

                    const newNotificationsToInsert = urgentTasks
                        .filter((t: any) => !existingContents.some((c: string) => c.includes(t.title)))
                        .map((t: any) => {
                            const deadlineDate = new Date(t.deadline);
                            let urgencyStr = "IN 3 DAYS";
                            if (deadlineDate < now) urgencyStr = "OVERDUE";
                            else if (deadlineDate.toDateString() === now.toDateString()) urgencyStr = "DUE TODAY";
                            else urgencyStr = "DUE TOMORROW";

                            // Include project ID inside content implicitly if we had it, but for now we just store title
                            // To navigate, we could store: "DEADLINE WARNING|project_id|Task Title is OVERDUE" but let's stick to simple text
                            return {
                                user_id: userId,
                                type: "deadline",
                                content: `DEADLINE WARNING\n${t.title} is ${urgencyStr}`,
                                is_read: false
                            };
                        });

                    if (newNotificationsToInsert.length > 0) {
                         await supabase.from("notifications").insert(newNotificationsToInsert);
                    }
                }
            }
            // --- END LAZY GENERATE ---

            const { data, error } = await supabase
                .from("notifications")
                .select("*")
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
                    fetchNotifications();
                    if (payload.eventType === "INSERT") {
                        const newNotification = payload.new as Notification;
                        toast("New Notification", {
                            description: newNotification.content,
                            action: {
                                label: "View",
                                onClick: async () => {
                                    await supabase.from("notifications").update({ is_read: true }).eq("id", newNotification.id);
                                    
                                    if (newNotification.project_id) {
                                        window.location.href = `/projects/${newNotification.project_id}`;
                                    } else {
                                        window.location.href = `/notifications`;
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
