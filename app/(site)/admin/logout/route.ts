// Wayfinder admin — sign-out route handler. Clears the Supabase session
// cookies server-side and redirects to the admin login page. Public route
// (in the middleware's public-admin set), so it works even mid-session.
// Linkable from the admin shell (GET) or callable as a form action (POST).
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOut(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore — redirect to login regardless so the user is not stuck.
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  const response = NextResponse.redirect(loginUrl);
  response.headers.set("cache-control", "private, no-store");
  return response;
}

export async function GET(request: NextRequest) {
  return signOut(request);
}

export async function POST(request: NextRequest) {
  return signOut(request);
}
