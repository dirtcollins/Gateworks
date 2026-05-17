import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    source?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();

  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json(
      { ok: false, reason: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const source = body?.source?.trim().slice(0, 60) || "footer";
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: true,
        persisted: false,
        reason: "Subscription noted; storage is not configured."
      },
      { status: 200 }
    );
  }

  const { error } = await admin
    .from("marketing_subscribers")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
