"use client";

import React, { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

export type DashboardProfile = {
    display_name: string | null;
    avatar_url: string | null;
    theme: string | null;
};

const DashboardContext = createContext<{
    user: User | null;
    profile: DashboardProfile | null;
}>({ user: null, profile: null });

export const useDashboardUser = () => useContext(DashboardContext);

export function DashboardProvider({
    children,
    initialUser,
    initialProfile
}: {
    children: React.ReactNode;
    initialUser: User | null;
    initialProfile: DashboardProfile | null;
}) {
    return (
        <DashboardContext.Provider value={{ user: initialUser, profile: initialProfile }}>
            {children}
        </DashboardContext.Provider>
    );
}
