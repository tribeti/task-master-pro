import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protect private routes
    const privateRoutes = ['/command', '/insights', '/projects', '/profile'];
    const isPrivateRoute = privateRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (isPrivateRoute && !user) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const response = NextResponse.redirect(url);
        // Copy cookies from supabaseResponse to preserve session refresh
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie);
        });
        return response;
    }

    // Redirect signed-in users away from auth pages
    const authRoutes = ['/login'];
    const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/command';
        const response = NextResponse.redirect(url);
        // Copy cookies from supabaseResponse to preserve session refresh
        supabaseResponse.cookies.getAll().forEach(cookie => {
            response.cookies.set(cookie.name, cookie.value, cookie);
        });
        return response;
    }

    return supabaseResponse;
}
