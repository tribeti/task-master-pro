"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
    BoltIcon,
    GridIcon,
    ChartIcon,
    RocketIcon,
    SettingsIcon,
    LogOutIcon,
    BellIcon,
} from "@/components/icons";
import { useNotifications } from "@/hooks/useNotifications";

const NAV_ITEMS = [
    { href: "/command", label: "Bảng điều khiển", icon: GridIcon },
    { href: "/insights", label: "Thống kê", icon: ChartIcon },
    { href: "/projects", label: "Dự án", icon: RocketIcon },
];

export default function DashboardSidebar({ user }: { user: User }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const fallbackAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.email || "User")}`;
    const [sidebarAvatar, setSidebarAvatar] = useState(fallbackAvatar);
    const { unreadCount } = useNotifications(user?.id);
    const [sidebarName, setSidebarName] = useState(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
    );

    useEffect(() => {
        const fetchSidebarProfile = async () => {
            if (!user?.id) return;
            const { data } = await supabase
                .from('users')
                .select('display_name, avatar_url')
                .eq('id', user.id)
                .single();

            if (data?.display_name) setSidebarName(data.display_name);

            if (data?.avatar_url) {
                if (data.avatar_url.startsWith('http')) {
                    setSidebarAvatar(data.avatar_url);
                } else {
                    const { data: signedData } = await supabase.storage
                        .from('avatar')
                        .createSignedUrl(data.avatar_url, 60 * 60);
                    if (signedData?.signedUrl) {
                        setSidebarAvatar(signedData.signedUrl);
                    }
                }
            }
        };

        fetchSidebarProfile();
    }, [user?.id, supabase]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <aside className="w-auto bg-white border-r border-slate-100 flex flex-col justify-between md:flex z-10">
            <div>
                {/* Logo */}
                <Link
                    href="/command"
                    className="w-full h-24 flex items-center px-8 gap-3 cursor-pointer"
                >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-md shadow-cyan-200">
                        <BoltIcon />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xl tracking-tight text-slate-900 italic">
                            TASKMASTER
                        </span>
                        <span className="font-bold text-black italic text-[10px] tracking-widest bg-linear-to-br from-cyan-400 to-cyan-600 px-1.5 py-0.5 rounded-md">
                            PRO
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="px-4 flex flex-col gap-2 mt-4">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${isActive
                                    ? "bg-[#EAF7FF] text-[#28B8FA]"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                <Icon /> {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom section */}
            <div className="px-4 pb-6 flex flex-col gap-2 border-t border-slate-100 pt-5">
                <Link
                    href="/notifications"
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors relative ${pathname === "/notifications"
                        ? "bg-[#EAF7FF] text-[#28B8FA]"
                        : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                >
                    <div className="relative">
                        <BellIcon />
                        {unreadCount > 0 && (
                            <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#FF5722] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        )}
                    </div>
                    Thông báo
                </Link>

                <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${pathname === "/profile"
                        ? "bg-[#EAF7FF] text-[#28B8FA]"
                        : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                >
                    <SettingsIcon /> Cài đặt
                </Link>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                    <LogOutIcon /> Đăng xuất
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 px-4 pt-4 mt-2 border-t border-slate-100">
                    <img
                        src={sidebarAvatar}
                        onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                        alt={sidebarName}
                        className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white shadow-sm object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                            {sidebarName}
                        </p>
                        <p className="text-[10px] font-bold text-[#34D399] uppercase tracking-widest">
                            Peak Flow
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
