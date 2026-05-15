import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type PatchPickTicketPayload = {
  orderItemId?: string;
  quantityNeeded?: number;
  quantityPulled?: number;
  pulled?: boolean;
  notes?: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value?: string) {
  return value && uuidPattern.test(value) ? value : null;
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const payload = (await request.json()) as PatchPickTicketPayload;
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "Supabase service role is not configured. Pick progress is saved in this browser only."
    });
  }

  const orderItemId = asUuid(payload.orderItemId);
  if (!orderItemId) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: "A persisted order item id is required." },
      { status: 400 }
    );
  }

  const quantityNeeded = Math.max(0, Number(payload.quantityNeeded || 0));
  const quantityPulled = Math.max(
    0,
    Math.min(quantityNeeded, Number(payload.quantityPulled || 0))
  );
  const pulled = payload.pulled ?? quantityPulled >= quantityNeeded;

  const { error } = await admin
    .from("order_items")
    .update({
      quantity_needed: quantityNeeded,
      quantity_pulled: quantityPulled,
      pulled,
      pulled_at: pulled ? new Date().toISOString() : null,
      pick_notes: payload.notes || null
    })
    .eq("id", orderItemId);

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  await admin
    .from("pick_ticket_items")
    .update({ quantity_picked: quantityPulled })
    .eq("order_item_id", orderItemId);

  return NextResponse.json({ ok: true, persisted: true });
}
