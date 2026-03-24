"use client";

import { useState, useEffect } from 'react';
import { useDashboardUser } from "../provider";
import {
    EditIcon,
    TrashIcon,
} from "@/components/icons";
import Toggle from "@/components/Toggle";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user } = useDashboardUser();
    const router = useRouter();
    const supabase = createClient();

    const fallbackAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.email || "User")}`;

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [displayName, setDisplayName] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                setIsLoadingProfile(true);
                const { data, error } = await supabase
                    .from('users')
                    .select('display_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                    toast.error('Không thể tải thông tin profile.');
                }

                if (!avatarFile) {
                    setDisplayName(data?.display_name || user.email?.split("@")[0] || "New User");

                    // Tạo signed URL cho bucket private
                    const resolveAvatar = async (path?: string) => {
                        if (!path) return fallbackAvatar;
                        if (path.startsWith('http')) return path;
                        const { data: signedData, error: signedError } = await supabase.storage
                            .from('avatar')
                            .createSignedUrl(path, 60 * 60); // 1 giờ
                        if (signedError || !signedData?.signedUrl) return fallbackAvatar;
                        return signedData.signedUrl;
                    };

                    const resolvedUrl = await resolveAvatar(data?.avatar_url);
                    setAvatarUrl(resolvedUrl);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, supabase]);

    const [fanfareAlert, setFanfareAlert] = useState(true);
    const [visualRewards, setVisualRewards] = useState(true);
    const [dailyDigest, setDailyDigest] = useState(false);
    const [themeSetting, setThemeSetting] = useState<"energetic" | "cozy">("energetic");

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            let finalAvatarUrl = avatarUrl; // Hiện tại

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
                const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

                // Xóa ảnh cũ trước khi upload ảnh mới
                const { data: oldData } = await supabase
                    .from('users')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single();

                if (oldData?.avatar_url && !oldData.avatar_url.startsWith('http')) {
                    // avatar_url là file path → xóa trực tiếp
                    await supabase.storage.from('avatar').remove([oldData.avatar_url]);
                }

                const { error: uploadError } = await supabase.storage
                    .from('avatar')
                    .upload(fileName, avatarFile);

                if (uploadError) throw uploadError;

                // Lưu file path vào DB, tạo signed URL để hiển thị ngay
                finalAvatarUrl = fileName;
                const { data: signedData } = await supabase.storage
                    .from('avatar')
                    .createSignedUrl(fileName, 60 * 60);
                if (signedData?.signedUrl) {
                    setAvatarUrl(signedData.signedUrl);
                }
            }

            // Ghi file path vào bảng users (không lưu full URL)
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    display_name: displayName,
                    ...(avatarFile ? { avatar_url: finalAvatarUrl } : {})
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            if (avatarFile) {
                setAvatarFile(null); // Reset lại file
            }

            toast.success('Cập nhật thông tin thành công!');
            router.refresh();
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Có lỗi server! Không thể lưu thông tin.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];

        if (!fileExt || !allowedTypes.includes(fileExt)) {
            toast.error('Chỉ cho phép định dạng ảnh .jpg, .png, .webp');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Kích thước file tối đa là 2MB');
            return;
        }

        // Preview local text ngay lập tức
        setAvatarFile(file);
        setAvatarUrl(URL.createObjectURL(file));
    };

    return (
        <>
            {/* HEADER */}
            <header className="px-10 flex items-end justify-between shrink-0 bg-[#F8FAFC] z-10 pt-10 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Configuration &amp; Settings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">
                        Customize your{" "}
                        <span className="text-[#28B8FA] font-bold">
                            Energetic Command Center
                        </span>{" "}
                        experience.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`bg-[#FF8B5E] hover:bg-orange-500 transition-colors text-white px-6 py-3.5 rounded-xl font-bold text-[15px] shadow-lg shadow-orange-300/30 flex items-center gap-2.5 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </header>

            {/* CONFIG CONTENT */}
            <div className="flex-1 overflow-y-auto px-10 pb-20 mt-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Profile Info */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-slate-50 border-b border-slate-100/50"></div>

                            {/* Avatar Section */}
                            <div className="relative mb-5 mt-8 z-10 w-28 h-28">
                                {isLoadingProfile ? (
                                    <div className="w-full h-full rounded-4xl bg-slate-200 animate-pulse border-[6px] border-white shadow-xl shadow-slate-200/50 flex items-center justify-center overflow-hidden"></div>
                                ) : (
                                    <label className={`w-full h-full rounded-4xl bg-slate-900 border-[6px] border-white shadow-xl shadow-slate-200/50 flex items-center justify-center overflow-hidden cursor-pointer group`}>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                        <img
                                            src={avatarUrl || fallbackAvatar}
                                            onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
                                            alt="Avatar"
                                            className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ">
                                            <span className="text-white text-xs font-bold drop-shadow-md">Thay đổi</span>
                                        </div>
                                    </label>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 text-[#28B8FA] pointer-events-none z-20">
                                    <EditIcon className="w-4 h-4 text-[#28B8FA]" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 tracking-tight z-10 mb-8 mt-2">
                                {isLoadingProfile ? (
                                    <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg"></div>
                                ) : (
                                    displayName
                                )}
                            </h2>

                            <div className="w-full space-y-4 z-10">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">
                                        Display Name
                                    </label>
                                    {isLoadingProfile ? (
                                        <div className="w-full h-[52px] bg-slate-100 animate-pulse rounded-2xl"></div>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:bg-white transition-colors"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            required
                                            maxLength={20}
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:bg-white transition-colors"
                                        defaultValue={user?.email || "alex@taskflow.com"}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:bg-red-50/50 hover:border-red-100 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                                    <TrashIcon />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        Danger Zone
                                    </h3>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                                        Delete account
                                    </p>
                                </div>
                            </div>
                            <div className="text-slate-300 group-hover:text-red-400 transition-colors">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Notification Vibes & Theme Settings */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-[#D1FAE5] flex items-center justify-center text-[#34D399]">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Notification Vibes
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                                        Control your dopamine hits
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">
                                            Completion Fanfare
                                        </h4>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            Play a satisfying sound when a task is checked.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={fanfareAlert}
                                        onChange={() => setFanfareAlert(!fanfareAlert)}
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">
                                            Visual Rewards
                                        </h4>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            Show confetti and starbursts for major milestones.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={visualRewards}
                                        onChange={() => setVisualRewards(!visualRewards)}
                                    />
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">
                                            Daily Digest
                                        </h4>
                                        <p className="text-sm font-medium text-slate-500 mt-1">
                                            Receive a morning summary of your goals.
                                        </p>
                                    </div>
                                    <Toggle
                                        checked={dailyDigest}
                                        onChange={() => setDailyDigest(!dailyDigest)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 flex-1">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-14 h-14 rounded-[1.25rem] bg-[#FFF2DE] flex items-center justify-center text-[#FF8B5E]">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                                        <line x1="2" y1="12" x2="22" y2="12"></line>
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Theme Sync
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                                        Match the interface to your mental state
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Theme 1: Energetic Flow */}
                                <div
                                    onClick={() => setThemeSetting("energetic")}
                                    className={`border-[3px] rounded-4xl p-6 cursor-pointer transition-all flex flex-col items-center justify-between h-56 ${themeSetting === "energetic"
                                        ? "border-[#28B8FA] shadow-xl shadow-cyan-100/50"
                                        : "border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <div className="w-full h-24 rounded-[1.25rem] bg-white border-[3px] border-slate-100 shadow-sm relative overflow-hidden mb-5 flex flex-col p-3.5">
                                        <div className="w-full flex items-center justify-between mb-2.5">
                                            <div className="w-16 h-2.5 bg-[#28B8FA] rounded-full opacity-80"></div>
                                            <div className="px-2 py-0.5 bg-[#28B8FA] text-white text-[7px] font-black tracking-widest uppercase rounded">
                                                ACTIVE
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center mt-auto pb-1 px-1">
                                            <div className="w-7 h-7 rounded-full bg-[#34D399]"></div>
                                            <div className="flex-1 h-5 bg-slate-50 border-[1.5px] border-slate-100 rounded-lg"></div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-0 w-full flex justify-center opacity-40">
                                            <span className="text-[7px] font-black text-slate-400 tracking-[0.2em]">
                                                ENERGETIC
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full mt-auto">
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 text-base">
                                                Energetic Flow
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                                High contrast, vibrant
                                            </p>
                                        </div>
                                        <div
                                            className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center transition-colors ${themeSetting === "energetic"
                                                ? "border-[#28B8FA]"
                                                : "border-slate-200"
                                                }`}
                                        >
                                            {themeSetting === "energetic" && (
                                                <div className="w-2.5 h-2.5 bg-[#28B8FA] rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Theme 2: Cozy Focus */}
                                <div
                                    onClick={() => setThemeSetting("cozy")}
                                    className={`border-[3px] rounded-4xl p-6 cursor-pointer transition-all flex flex-col items-center justify-between h-56 ${themeSetting === "cozy"
                                        ? "border-[#FF8B5E] shadow-xl shadow-orange-100/50 bg-[#1E293B]"
                                        : "border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <div className="w-full h-24 rounded-[1.25rem] bg-[#0F172A] border-[3px] border-slate-700 shadow-inner relative overflow-hidden mb-5 flex flex-col p-3.5">
                                        <div className="w-full flex items-center justify-between mb-2">
                                            <div className="w-16 h-2.5 bg-slate-600 rounded-full opacity-60"></div>
                                        </div>
                                        <div className="flex gap-3 items-center mt-auto pb-1 px-1">
                                            <div className="w-7 h-7 rounded-full bg-[#FF8B5E]"></div>
                                            <div className="flex-1 h-5 bg-[#0F172A] rounded-lg"></div>
                                        </div>
                                        <div className="absolute bottom-1.5 left-0 w-full flex justify-center opacity-40">
                                            <span className="text-[7px] font-black text-slate-500 tracking-[0.2em]">
                                                COZY MODE
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full mt-auto">
                                        <div>
                                            <h4
                                                className={`font-extrabold text-base ${themeSetting === "cozy"
                                                    ? "text-white"
                                                    : "text-slate-900"
                                                    }`}
                                            >
                                                Cozy Focus
                                            </h4>
                                            <p
                                                className={`text-[10px] font-bold mt-0.5 ${themeSetting === "cozy"
                                                    ? "text-slate-400"
                                                    : "text-slate-500"
                                                    }`}
                                            >
                                                Dark mode, warmer tones
                                            </p>
                                        </div>
                                        <div
                                            className={`w-6 h-6 rounded-full border-[3px] flex items-center justify-center transition-colors ${themeSetting === "cozy"
                                                ? "border-[#FF8B5E]"
                                                : "border-slate-200"
                                                }`}
                                        >
                                            {themeSetting === "cozy" && (
                                                <div className="w-2.5 h-2.5 bg-[#FF8B5E] rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
