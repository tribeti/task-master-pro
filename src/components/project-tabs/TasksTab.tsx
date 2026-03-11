import React from "react";
import { BoardList } from "@/components/board/BoardList";
import { BoardCard } from "@/components/board/BoardCard";

export function TasksTab() {
    return (
        <div className="flex-1 overflow-x-auto mt-4">
            {/* Lưới Grid nền (Grid background Pattern) */}
            <div
                className="h-full w-max flex gap-6"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            >
                {/* Column 1: TO DO */}
                <BoardList title="To Do" count={4}>
                    <BoardCard
                        tagLabel="High Priority"
                        tagColorClass="text-[#FF8B5E]"
                        tagBgClass="bg-[#FFF2DE]"
                        title="User Onboarding Flow Sketches"
                        description="Initial wireframes for the new login sequence including social auth."
                    />
                </BoardList>

                {/* Column 2: IN PROGRESS */}
                <BoardList
                    title="In Progress"
                    count={2}
                    containerClass="border-l-2 border-[#28B8FA]"
                    titleClass="text-[#28B8FA]"
                    badgeClass="bg-[#EAF7FF] text-[#28B8FA]"
                    showDot={true}
                    dotClass="bg-[#28B8FA]"
                >
                    <BoardCard
                        tagLabel="Dev"
                        tagColorClass="text-[#34D399]"
                        tagBgClass="bg-[#D1FAE5]"
                        title="Home Screen React Components"
                        progressValue={60}
                        progressColorClass="bg-[#28B8FA]"
                        containerClass="border-t-4 border-t-[#28B8FA]"
                    />
                </BoardList>
            </div>
        </div>
    );
}
