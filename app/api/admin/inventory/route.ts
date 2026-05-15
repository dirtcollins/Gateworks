import { NextRequest, NextResponse } from "next/server";
import {
  applyInventoryMutation,
  listInventoryRows,
  type InventoryMutationInput
} from "@/lib/inventory-repository";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      inventory: [],
      persisted: false,
      reason: "Supabase service role is not configured."
    });
  }

  try {
    return NextResponse.json({
      inventory: await listInventoryRows(admin),
      persisted: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        inventory: [],
        persisted: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unknown inventory read error."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Supabase service role is not configured. Inventory was not saved."
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 }
    );
  }

  const payload = (await request.json()) as InventoryMutationInput;

  try {
    const result = await applyInventoryMutation(admin, payload);
    return NextResponse.json({ ...result, persisted: true }, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unknown inventory write error."
      },
      { status: 500 }
    );
  }
}
