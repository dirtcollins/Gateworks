import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const emailInput =
    body && typeof body === "object" && "email" in body ? body.email : undefined;
  const sourceInput =
    body && typeof body === "object" && "source" in body ? body.source : undefined;

  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !emailPattern.test(email)) {
    return NextResponse.json(
      { ok: false, reason: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const source =
    typeof sourceInput === "string" && sourceInput.trim()
      ? sourceInput.trim().slice(0, 60)
      : "footer";
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Email subscriptions are not configured."
      },
      { status: 503 }
    );
  }

  const { error } = await admin
    .from("marketing_subscribers")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("Marketing subscription failed", error);
    return NextResponse.json(
      { ok: false, reason: "Subscription could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
