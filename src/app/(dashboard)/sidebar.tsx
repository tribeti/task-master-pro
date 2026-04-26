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
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useDashboardUser } from "./provider";

const NAV_ITEMS = [
  { href: "/command", label: "Bảng điều khiển", icon: GridIcon },
  { href: "/insights", label: "Thống kê", icon: ChartIcon },
  { href: "/projects", label: "Dự án", icon: RocketIcon },
];

export default function DashboardSidebar({ user }: { user: User }) {
  const { profile } = useDashboardUser();
  const isCozy = profile?.theme === "cozy";
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const fallbackAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.email || "User")}`;
  const [sidebarAvatar, setSidebarAvatar] = useState(fallbackAvatar);
  const { unreadCount } = useNotifications(user?.id);
  const [sidebarName, setSidebarName] = useState(
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
  );

  useEffect(() => {
    const fetchSidebarProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (data?.display_name) setSidebarName(data.display_name);

      if (data?.avatar_url) {
        if (data.avatar_url.startsWith("http")) {
          setSidebarAvatar(data.avatar_url);
        } else {
          const { data: signedData } = await supabase.storage
            .from("avatar")
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
    <aside className={`w-auto flex flex-col justify-between md:flex z-10 transition-colors duration-500 border-r ${
      isCozy 
        ? "bg-[#0F172A] border-slate-800" 
        : "bg-white border-slate-100"
    }`}>
      <div>
        {/* Logo */}
        <Link
          href="/command"
          className="w-full h-24 flex items-center px-8 gap-3 cursor-pointer"
        >
          <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-md transition-colors ${
            isCozy ? "bg-[#FF8B5E] shadow-orange-900/20" : "bg-[#28B8FA] shadow-cyan-200"
          }`}>
            <BoltIcon />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-xl tracking-tight italic transition-colors ${isCozy ? "text-white" : "text-slate-900"}`}>
              TASKMASTER
            </span>
            <span className={`font-bold italic text-[10px] tracking-widest px-1.5 py-0.5 rounded-md transition-colors ${
              isCozy ? "bg-[#FF8B5E] text-white" : "bg-linear-to-br from-cyan-400 to-cyan-600 text-black"
            }`}>
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
                    ? (isCozy ? "bg-slate-800 text-[#FF8B5E]" : "bg-[#EAF7FF] text-[#28B8FA]")
                    : (isCozy ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50")
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
              ? (isCozy ? "bg-slate-800 text-[#FF8B5E]" : "bg-[#EAF7FF] text-[#28B8FA]")
              : (isCozy ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-800 hover:bg-slate-50")
            }`}
        >
          <div className="relative">
            <BellIcon />
            {unreadCount > 0 && (
              <div className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 bg-[#FF5722] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>
          Thông báo
        </Link>

        <Link
          href="/profile"
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${pathname === "/profile"
              ? (isCozy ? "bg-slate-800 text-[#FF8B5E]" : "bg-[#EAF7FF] text-[#28B8FA]")
              : (isCozy ? "text-slate-500 hover:text-slate-300 hover:bg-slate-800" : "text-slate-400 hover:text-slate-800 hover:bg-slate-50")
            }`}
        >
          <SettingsIcon /> Cài đặt
        </Link>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${
            isCozy 
              ? "text-slate-500 hover:text-red-400 hover:bg-red-900/10" 
              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <LogOutIcon /> Đăng xuất
        </button>

        {/* User Info */}
        <div className={`flex items-center gap-3 px-4 pt-4 mt-2 border-t transition-colors ${isCozy ? "border-slate-800" : "border-slate-100"}`}>
          <img
            src={sidebarAvatar}
            onError={(e) => {
              e.currentTarget.src = fallbackAvatar;
            }}
            alt={sidebarName}
            className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white shadow-sm object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate transition-colors ${isCozy ? "text-white" : "text-slate-800"}`}>
              {sidebarName}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isCozy ? "text-[#FF8B5E]" : "text-[#34D399]"}`}>
              Peak Flow
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
