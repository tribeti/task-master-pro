"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // Lắng nghe sự kiện xác thực từ Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                router.push('/');
            }
        });

        // Supabase-js client sẽ tự động đọc tham số trên URL (?code=...)
        // và xử lý đăng nhập dưới nền khi trang này được load.
        // Fallback dự phòng: Nới lỏng thời gian đẩy về trang chủ để Supabase kịp xử lý session.
        const timeout = setTimeout(() => {
            router.push('/');
        }, 2000);

        return () => {
            authListener.subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#28B8FA] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xác thực...</h2>
                <p className="text-slate-500 font-medium">Vui lòng chờ trong giây lát để hệ thống tự động đăng nhập.</p>
            </div>
        </div>
    );
}
