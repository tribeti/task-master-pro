import { BoltIconLogin as BoltIcon } from "@/components/icons";

interface LogoProps {
  isDarkTheme?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { icon: "w-8 h-8", brand: "text-lg", badge: "text-[8px]" },
  md: { icon: "w-10 h-10", brand: "text-xl", badge: "text-[10px]" },
  lg: { icon: "w-12 h-12", brand: "text-2xl", badge: "text-[10px]" },
};

// --- COMPONENT LOGO THÔNG MINH ---
// isDarkTheme = true -> Chữ trắng (dùng cho Desktop bên trái)
// isDarkTheme = false -> Chữ đen (dùng cho Mobile nền sáng)
export default function Logo({
  isDarkTheme = false,
  onClick,
  size = "md",
}: LogoProps) {
  const s = sizeConfig[size];

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={`${s.icon} shrink-0 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform group-hover:scale-105`}
      >
        <BoltIcon />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`font-black tracking-tight italic ${s.brand} ${
            isDarkTheme ? "text-slate-100" : "text-slate-900"
          }`}
        >
          TASKMASTER
        </span>
        <span
          className={`font-bold italic ${s.badge} tracking-widest bg-linear-to-br from-cyan-300 to-[#28B8FA] text-slate-900 px-1.5 py-0.5 rounded-md shadow-sm`}
        >
          PRO
        </span>
      </div>
    </div>
  );
}
