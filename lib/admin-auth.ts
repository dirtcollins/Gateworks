import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const adminRoles = new Set([
  "owner",
  "admin",
  "merchandiser",
  "inventory_manager",
  "content_editor"
]);

export type AdminAuthResult =
  | {
      ok: true;
      actorId: string | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function adminAuthRequiredInThisEnvironment() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.ADMIN_REQUIRE_AUTH === "true"
  );
}

export async function authorizeAdminRequest(
  request: NextRequest
): Promise<AdminAuthResult> {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          reason: "Supabase service role is not configured."
        },
        { status: 503 }
      )
    };
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_REQUIRE_AUTH !== "true"
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          reason: "Admin access requires Supabase Auth in production."
        },
        { status: 403 }
      )
    };
  }

  if (!adminAuthRequiredInThisEnvironment()) {
    return { ok: true, actorId: null };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, reason: "Admin login is required." },
        { status: 401 }
      )
    };
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, reason: "Invalid admin session." },
        { status: 401 }
      )
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile?.role ||
    !adminRoles.has(String(profile.role))
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, reason: "Admin permissions are required." },
        { status: 403 }
      )
    };
  }

  return { ok: true, actorId: userData.user.id };
}

