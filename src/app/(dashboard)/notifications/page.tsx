"use client";

import React, { useMemo } from "react";
import { useDashboardUser } from "../provider";
import { useNotifications } from "@/hooks/useNotifications";
import { AlertIcon, BriefcaseIcon, CheckCircleIcon } from "@/components/icons";
import Link from "next/link";
import { Notification } from "@/types/project";
import { getDeadlineStatus } from "@/utils/deadline";
import { formatRelativeTime } from "@/utils/time";

export default function NotificationsPage() {
    const { user } = useDashboardUser();
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications(user?.id);

    const getDisplayStatus = (notification: Notification) => {
        // If it's a deadline notification with an attached task, use the exact deadline of that task
        if (notification.type === "deadline" && notification.task) {
            // Note: the joined object could be an array due to Supabase typing, we handle both safely
            const taskObj = Array.isArray(notification.task) ? notification.task[0] : notification.task;
            if (taskObj?.deadline) {
                return getDeadlineStatus(taskObj.deadline);
            }
        }

        // Default style for general notifications
        return { label: "UPDATE", color: "blue" };
    };

    return (
        <div className="flex-1 overflow-y-auto px-10 pt-10 pb-20 bg-[#F8FAFC]">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-[2.5rem] font-black text-slate-900 tracking-tight leading-none mb-2">
                        Notifications
                    </h1>
                    <p className="text-slate-500 font-medium text-base">
                        Stay on top of your upcoming deadlines and project updates.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="bg-[#EAF7FF] text-[#28B8FA] hover:bg-[#D5EFFF] transition-colors px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest self-start md:self-auto shrink-0"
                    >
                        {unreadCount} UNREAD
                    </button>
                )}
            </header>

            {isLoading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-3xl h-32 w-full border border-slate-100"></div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircleIcon />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">You're all caught up!</h3>
                    <p className="text-slate-500 text-sm mt-1">No pending notifications at the moment.</p>
                </div>
            ) : (
                <div className="space-y-6 max-w-4xl">
                    {notifications.map((notification) => {
                        const status = getDisplayStatus(notification);
                        const isRead = notification.is_read;
                        const dateFormatted = formatRelativeTime(notification.created_at);

                        let Icon = BriefcaseIcon;
                        let iconBgStr = "bg-blue-50 text-blue-500";
                        let borderLeftColorStr = "border-l-blue-500";
                        let labelBgStr = "bg-blue-50 text-blue-500";

                        if (status.color === "red") {
                            Icon = AlertIcon;
                            iconBgStr = "bg-red-50 text-red-500";
                            borderLeftColorStr = "border-l-red-500";
                            labelBgStr = "bg-red-50 text-red-500";
                        } else if (status.color === "orange") {
                            iconBgStr = "bg-orange-50 text-orange-500";
                            borderLeftColorStr = "border-l-orange-500";
                            labelBgStr = "bg-orange-50 text-orange-500";
                        } else if (status.color === "yellow") {
                            iconBgStr = "bg-yellow-50 text-yellow-500";
                            borderLeftColorStr = "border-l-yellow-400";
                            labelBgStr = "bg-yellow-50 text-yellow-600";
                        }

                        // Robust structured metadata from Database Joined relationships
                        const projObj = Array.isArray(notification.project) ? notification.project[0] : notification.project;
                        const taskObj = Array.isArray(notification.task) ? notification.task[0] : notification.task;

                        let projectSubject = projObj?.title ? `PROJECT: ${projObj.title}` : "PROJECT UPDATE";
                        let taskTitle = taskObj?.title || notification.content;

                        return (
                            <Link
                                href={notification.project_id ? `/projects/${notification.project_id}` : "#"}
                                key={notification.id}
                                onClick={() => {
                                    if (!isRead) markAsRead(notification.id);
                                }}
                                className={`block relative bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer border-l-[6px] ${isRead ? 'border-l-slate-200 opacity-60' : borderLeftColorStr
                                    }`}
                            >
                                {!isRead && status.color === "red" && (
                                    <div className="absolute top-6 right-6 text-red-500 font-bold text-xl leading-none">
                                        !
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${isRead ? 'bg-slate-100 text-slate-400' : iconBgStr}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isRead ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {projectSubject}
                                        </p>
                                        <h3 className={`text-lg transition-colors truncate ${isRead ? 'font-semibold text-slate-600' : 'font-extrabold text-slate-900'}`}>
                                            {taskTitle}
                                        </h3>

                                        <div className="flex items-center justify-between mt-5">
                                            <div className={`px-2.5 py-1 rounded capitalize text-[10px] font-bold tracking-wider ${isRead ? 'bg-slate-100 text-slate-500' : labelBgStr}`}>
                                                {status.label}
                                            </div>
                                            <div className="text-xs font-medium text-slate-400">
                                                {isRead ? `Read • ${dateFormatted}` : dateFormatted}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
