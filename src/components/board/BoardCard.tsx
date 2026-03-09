import React from 'react';

interface BoardCardProps {
    tagLabel: string;
    tagColorClass: string;
    tagBgClass: string;
    title: string;
    description?: string;
    progressValue?: number;
    progressColorClass?: string;
    containerClass?: string;
}

export const BoardCard: React.FC<BoardCardProps> = ({
    tagLabel,
    tagColorClass,
    tagBgClass,
    title,
    description,
    progressValue,
    progressColorClass = 'bg-[#28B8FA]',
    containerClass = ''
}) => {
    return (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow ${containerClass}`}>
            <span className={`text-[10px] font-bold w-max px-2 py-1 rounded-md uppercase ${tagColorClass} ${tagBgClass}`}>
                {tagLabel}
            </span>
            <h4 className="font-bold text-slate-800">{title}</h4>
            {description && <p className="text-xs text-slate-500 line-clamp-2">{description}</p>}
            {progressValue !== undefined && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${progressColorClass}`} style={{ width: `${progressValue}%` }}></div>
                </div>
            )}
        </div>
    );
};
