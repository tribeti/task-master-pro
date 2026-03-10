"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import {
    BoltIcon,
    GridIcon,
    ChartIcon,
    RocketIcon,
    SettingsIcon,
} from "@/components/icons";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

// --- Context to share user across child pages ---
const DashboardContext = createContext<{ user: User | null }>({ user: null });
export const useDashboardUser = () => useContext(DashboardContext);

// --- Logout Icon SVG ---
import { LogOutIcon } from "@/components/icons";


// --- NAV ITEMS ---
const NAV_ITEMS = [
    { href: "/command", label: "Command", icon: GridIcon },
    { href: "/insights", label: "Insights", icon: ChartIcon },
    { href: "/projects", label: "Projects", icon: RocketIcon },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                router.push("/login");
            } else {
                setUser(session.user);
            }
            setIsLoadingUser(false);
        };
        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    router.push("/login");
                } else {
                    setUser(session.user);
                }
            },
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (isLoadingUser || !user) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#28B8FA] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <DashboardContext.Provider value={{ user }}>
            <div className="flex h-screen w-full bg-[#F8FAFC] font-sans overflow-hidden">
                {/* ========== SIDEBAR ========== */}
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
                            href="/profile"
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${pathname === "/profile"
                                ? "bg-[#EAF7FF] text-[#28B8FA]"
                                : "text-slate-400 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                        >
                            <SettingsIcon /> Config
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-[15px] transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <LogOutIcon /> Log Out
                        </button>

                        {/* User Info */}
                        {user && (
                            <div className="flex items-center gap-3 px-4 pt-4 mt-2 border-t border-slate-100">
                                <img
                                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.email || "User"}`}
                                    alt={user.user_metadata?.full_name || user.email || 'User Avatar'}
                                    className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                        {user.user_metadata?.full_name ||
                                            user.email?.split("@")[0] ||
                                            "Alex Morgan"}
                                    </p>
                                    <p className="text-[10px] font-bold text-[#34D399] uppercase tracking-widest">
                                        Peak Flow
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ========== MAIN CONTENT ========== */}
                <main className="flex-1 flex flex-col relative overflow-y-auto">
                    <div className="h-1.5 w-full bg-linear-to-r from-[#28B8FA] via-[#34D399] to-transparent absolute top-0 left-0 z-20"></div>
                    {children}
                </main>
            </div>
        </DashboardContext.Provider>
    );
}
