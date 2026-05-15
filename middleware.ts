import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-roles";

const publicAdminPaths = new Set([
  "/admin/login",
  "/admin/access-denied",
  "/admin/logout"
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicAdminPaths.has(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse("Supabase Auth is not configured.", {
      status: 503,
      headers: {
        "cache-control": "private, no-store",
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  let response = NextResponse.next({
    request
  });
  let cookiesToApply: Array<{
    name: string;
    value: string;
    options: Parameters<typeof response.cookies.set>[2];
  }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToApply = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return applySupabaseCookies(NextResponse.redirect(loginUrl), cookiesToApply);
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !isAdminRole(profile?.role)) {
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = "/admin/access-denied";
    deniedUrl.search = "";
    return applySupabaseCookies(NextResponse.redirect(deniedUrl), cookiesToApply);
  }

  response.headers.set("cache-control", "private, no-store");
  response.headers.set("x-robots-tag", "noindex");
  return response;
}

function applySupabaseCookies(
  response: NextResponse,
  cookiesToApply: Array<{
    name: string;
    value: string;
    options: Parameters<typeof response.cookies.set>[2];
  }>
) {
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set("cache-control", "private, no-store");
  response.headers.set("x-robots-tag", "noindex");
  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login|logout|access-denied|_next/static|_next/image|favicon.ico).*)"
  ]
};
