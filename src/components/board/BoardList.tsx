import React from 'react';

interface BoardListProps {
    title: string;
    count: number;
    containerClass?: string;
    titleClass?: string;
    badgeClass?: string;
    showDot?: boolean;
    dotClass?: string;
    children?: React.ReactNode;
}

export const BoardList: React.FC<BoardListProps> = ({
    title,
    count,
    containerClass = '',
    titleClass = 'text-slate-400',
    badgeClass = 'bg-slate-200 text-slate-600',
    showDot = false,
    dotClass = '',
    children
}) => {
    return (
        <div className={`w-80 flex flex-col gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl ${containerClass}`}>
            <h3 className={`font-bold text-xs tracking-widest uppercase flex items-center justify-between px-2 ${titleClass}`}>
                {showDot ? (
                    <span className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${dotClass}`}></div>
                        {title}
                    </span>
                ) : (
                    title
                )}
                <span className={`px-2 rounded-md ${badgeClass}`}>{count}</span>
            </h3>
            {children}
        </div>
    );
};
