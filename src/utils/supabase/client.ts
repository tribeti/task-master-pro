import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Return a placeholder during build/SSR if env vars are missing to prevent crash
        if (typeof window === 'undefined') {
            return {} as ReturnType<typeof createBrowserClient>;
        }
        throw new Error('Supabase URL and Key are required');
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}
