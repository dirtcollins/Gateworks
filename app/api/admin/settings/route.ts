import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const allowedSettings = new Set(["steel_cwt_price"]);

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Supabase service role is not configured. Setting was saved locally only."
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    key?: string;
    value?: number;
    label?: string;
  };

  if (!body.key || !allowedSettings.has(body.key) || !Number.isFinite(body.value)) {
    return NextResponse.json(
      { ok: false, reason: "Invalid admin setting." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("admin_settings").upsert(
    {
      key: body.key,
      value: body.value,
      label: body.label || body.key
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  await admin.from("admin_audit_logs").insert({
    actor_id: auth.actorId,
    action: "update_setting",
    entity_type: "setting",
    entity_id: body.key,
    changes: { value: body.value }
  });

  return NextResponse.json({ ok: true });
}
