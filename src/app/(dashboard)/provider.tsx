"use client";

import React, { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

const DashboardContext = createContext<{ user: User | null }>({ user: null });

export const useDashboardUser = () => useContext(DashboardContext);

export function DashboardProvider({
    children,
    initialUser
}: {
    children: React.ReactNode;
    initialUser: User | null;
}) {
    // Because we fetch user on the server, we just seed it into context
    return (
        <DashboardContext.Provider value={{ user: initialUser }}>
            {children}
        </DashboardContext.Provider>
    );
}
