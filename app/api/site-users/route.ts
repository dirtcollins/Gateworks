import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

type SiteUserRow = {
  id: string;
  display_name: string;
  last_used_at: string;
};

function makeUserId(name: string) {
  const userId = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return userId || "guest";
}

function formatDisplayName(name: string) {
  return name.trim();
}

function toClientUser(user: SiteUserRow) {
  return {
    id: user.id,
    displayName: user.display_name,
    lastUsedAt: user.last_used_at
  };
}

export async function GET() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ users: [] });
  }

  const { data, error } = await supabase
    .from("site_users")
    .select("id, display_name, last_used_at")
    .order("last_used_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { users: [], reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    users: (data || []).map((user) => toClientUser(user as SiteUserRow))
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { name?: string };
  const displayName = formatDisplayName(body.name || "");

  if (!displayName) {
    return NextResponse.json(
      { ok: false, reason: "A name is required." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const siteUser = {
    id: makeUserId(displayName),
    display_name: displayName,
    normalized_name: displayName.toLowerCase(),
    last_used_at: now
  };

  const { data, error } = await supabase
    .from("site_users")
    .upsert(siteUser, { onConflict: "id" })
    .select("id, display_name, last_used_at")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: toClientUser(data as SiteUserRow)
  });
}
