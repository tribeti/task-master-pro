"use client";

import React, { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

const DashboardContext = createContext<{
    user: User | null;
    profile: { display_name: string | null; avatar_url: string | null; theme: string } | null;
}>({ user: null, profile: null });

export const useDashboardUser = () => useContext(DashboardContext);

export function DashboardProvider({
    children,
    initialUser,
    initialProfile
}: {
    children: React.ReactNode;
    initialUser: User | null;
    initialProfile: any;
}) {
    return (
        <DashboardContext.Provider value={{ user: initialUser, profile: initialProfile }}>
            {children}
        </DashboardContext.Provider>
    );
}
