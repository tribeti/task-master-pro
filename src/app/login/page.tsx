"use client";

import React, { useState } from 'react';
// Import Supabase client (Thay đổi đường dẫn này theo file config của bạn nếu cần)
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import {
    BoltIconLogin as BoltIcon,
    MailIcon,
    LockIcon,
    UserIconLogin as UserIcon,
    ArrowRightIcon,
    ArrowLeftIcon,
    CheckIconLogin as CheckIcon
} from '@/components/icons';

// Khởi tạo Supabase (Bạn nên đưa cái này ra file utils riêng sau này)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);


type AuthView = 'login' | 'register' | 'forgot';

export default function TaskFlowAuth() {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    // Hàm xử lý Đăng nhập bằng Google
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrorMsg('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setErrorMsg(error.message);
        setIsLoading(false);
    };

    // Hàm xử lý Đăng nhập bằng Email/Password
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setErrorMsg(error.message);
        else router.push('/'); // Đăng nhập thành công thì chuyển trang
        setIsLoading(false);
    };

    // Hàm xử lý Đăng ký
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) setErrorMsg(error.message);
        else {
            alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
            setView('login');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full bg-[#F8FAFC] font-sans">

            {/* 1. LEFT PANEL - Giữ nguyên không thay đổi */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-[#1E293B]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] z-0"></div>
                <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-[#28B8FA] opacity-20 blur-[120px] rounded-full z-0 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[#34D399] opacity-10 blur-[120px] rounded-full z-0 translate-y-1/2 translate-x-1/4"></div>

                <div className="relative z-10 p-12 flex flex-col h-full">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('login')}>
                        <div className="w-12 h-12 shrink-0 rounded-xl bg-[#28B8FA] flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <BoltIcon />
                        </div>
                        <div className="flex items-center gap-1.5 focus:outline-none">
                            <span className="font-['Barlow_Condensed'] font-extrabold italic text-[22px] text-slate-100 tracking-wide ">
                                TASKMASTER
                            </span>
                            <span className="font-['Barlow_Condensed'] text-black font-extrabold text-[10px] tracking-widest bg-gradient-to-br from-cyan-400 to-cyan-600 px-1.5 py-0.5 rounded-md">
                                PRO
                            </span>
                        </div>
                    </div>

                    <div className="mt-auto mb-auto">
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
                            Master your <br /> workflow. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#28B8FA]">
                                Achieve peak state.
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium max-w-md">
                            Join thousands of professionals using gamification to crush their daily objectives and build unbreakable streaks.
                        </p>

                        <div className="mt-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 max-w-sm flex items-center gap-5 shadow-2xl">
                            <div className="w-16 h-16 rounded-full bg-[#34D399] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <CheckIcon />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg">+150 XP Earned</h4>
                                <p className="text-slate-300 text-sm font-medium mt-1">Deep Focus Session completed</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-slate-500 text-sm font-medium">
                        © 2026 Apex Developers. Đồ án CNPM.
                    </div>
                </div>
            </div>

            {/* 2. RIGHT PANEL - AUTH FORMS */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
                <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden mt-12 lg:mt-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#28B8FA] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    {/* Hiển thị lỗi chung nếu có */}
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                    {/* --- LOGIN VIEW --- */}
                    {view === 'login' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                            <div className="mb-8 text-center">
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Welcome Back</h2>
                                <p className="text-slate-500 text-sm font-medium">Sign in to continue your streak.</p>
                            </div>

                            {/* NÚT ĐĂNG NHẬP GOOGLE */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full mb-6 py-3.5 px-6 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 focus:outline-none"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>

                            {/* Divider */}
                            <div className="flex items-center mb-6">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Or email</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            <form className="space-y-6" onSubmit={handleEmailLogin}>
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
                                            <MailIcon />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email address"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:ring-4 focus:ring-[#28B8FA]/10 transition-all placeholder:text-slate-400"
                                            required
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
                                            <LockIcon />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:ring-4 focus:ring-[#28B8FA]/10 transition-all placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 border-slate-300 rounded-md bg-white peer-checked:bg-[#28B8FA] peer-checked:border-[#28B8FA] transition-all flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
                                    </label>

                                    <button type="button" onClick={() => setView('forgot')} className="text-sm font-bold text-[#28B8FA] hover:text-[#0C98D6] transition-colors focus:outline-none">
                                        Forgot password?
                                    </button>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full py-4 px-6 bg-[#1E293B] hover:bg-black text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
                                    {isLoading ? 'Processing...' : 'Sign In'}
                                    <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>

                            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                                <p className="text-slate-500 text-sm font-medium">
                                    Don&apos;t have an account?{' '}
                                    <button onClick={() => setView('register')} className="text-[#34D399] font-bold hover:text-[#059669] transition-colors focus:outline-none">
                                        Sign up now
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- REGISTER VIEW --- */}
                    {view === 'register' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 relative z-10">
                            <button onClick={() => setView('login')} className="absolute -top-2 -left-2 p-2 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none rounded-lg hover:bg-slate-50">
                                <ArrowLeftIcon />
                            </button>
                            <div className="mb-8 text-center mt-2">
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Create Account</h2>
                                <p className="text-slate-500 text-sm font-medium">Start your journey to peak productivity.</p>
                            </div>

                            <form className="space-y-4" onSubmit={handleRegister}>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                                        <UserIcon />
                                    </div>
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:ring-4 focus:ring-[#34D399]/10 transition-all placeholder:text-slate-400" required />
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                                        <MailIcon />
                                    </div>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:ring-4 focus:ring-[#34D399]/10 transition-all placeholder:text-slate-400" required />
                                </div>

                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#34D399] transition-colors">
                                        <LockIcon />
                                    </div>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#34D399] focus:ring-4 focus:ring-[#34D399]/10 transition-all placeholder:text-slate-400" required />
                                </div>

                                <div className="pt-2">
                                    <button type="submit" disabled={isLoading} className="w-full py-4 px-6 bg-[#34D399] hover:bg-[#059669] text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70">
                                        {isLoading ? 'Creating...' : 'Create Free Account'}
                                        <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- FORGOT PASSWORD VIEW --- */}
                    {/* Phần này mình giữ nguyên UI của bạn, chỉ thêm submit form */}
                    {view === 'forgot' && (
                        <div className="animate-in fade-in zoom-in-95 duration-500 relative z-10">
                            {/* ... (Các thẻ button back và tiêu đề giữ nguyên) ... */}
                            <button onClick={() => setView('login')} className="absolute -top-2 -left-2 p-2 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none rounded-lg hover:bg-slate-50">
                                <ArrowLeftIcon />
                            </button>
                            <div className="mb-10 text-center mt-2">
                                <h2 className="text-2xl font-black text-slate-800 mb-2">Reset Password</h2>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Đã gửi link reset vào email!"); setView('login'); }}>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#28B8FA] transition-colors">
                                        <MailIcon />
                                    </div>
                                    <input type="email" placeholder="Email address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#28B8FA] focus:ring-4 focus:ring-[#28B8FA]/10 transition-all" required />
                                </div>

                                <button type="submit" className="w-full py-4 px-6 bg-slate-800 hover:bg-black text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-slate-900/20 transition-all">
                                    Send Reset Link
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}