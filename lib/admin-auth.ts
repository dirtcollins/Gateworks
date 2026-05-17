import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/admin-roles";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const bearerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const userId = bearerToken
    ? await getBearerUserId(supabaseAdmin, bearerToken)
    : await getCookieUserId();

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, reason: "A valid admin login is required." },
        { status: 401 }
      )
    };
  }

  return authorizeAdminUserId(userId);
}

async function getBearerUserId(
  supabaseAdmin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  token: string
) {
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return null;
  return userData.user.id;
}

async function getCookieUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function authorizeAdminUserId(
  userId: string
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile?.role ||
    !isAdminRole(profile.role)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, reason: "Admin permissions are required." },
        { status: 403 }
      )
    };
  }

  return { ok: true, actorId: userId };
}
