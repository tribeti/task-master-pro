import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardProvider } from "./provider";
import DashboardSidebar from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Await headers to read the pathname properly if needed or for client hints,
  // but typically we can pass path down directly or let the client handle active state
  // We will just let the client Sidebar determine the Active route cleanly

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch public profile for theme and other settings
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, theme")
    .eq("id", user.id)
    .single();

  const isCozy = profile?.theme === "cozy";

  return (
    <DashboardProvider initialUser={user} initialProfile={profile}>
      <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-500 ${isCozy ? "bg-[#1E293B]" : "bg-[#F8FAFC]"}`}>
        {/* ========== SIDEBAR (Client Component for interactive routing & logout) ========== */}
        <DashboardSidebar user={user} />

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 flex flex-col relative overflow-y-auto w-full max-w-full">
          <div className={`h-1.5 w-full absolute top-0 left-0 z-20 transition-all duration-500 ${isCozy ? "bg-[#FF8B5E]" : "bg-linear-to-r from-[#28B8FA] via-[#34D399] to-transparent"}`}></div>
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
