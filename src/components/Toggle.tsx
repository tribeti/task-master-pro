import React from "react";

interface ToggleProps {
    checked: boolean;
    onChange: () => void;
}

const Toggle = ({ checked, onChange }: ToggleProps) => (
    <button
        type="button"
        onClick={onChange}
        className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${checked ? "bg-[#34D399]" : "bg-slate-200"
            }`}
    >
        <div
            className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-0"
                }`}
        ></div>
    </button>
);

export default Toggle;
