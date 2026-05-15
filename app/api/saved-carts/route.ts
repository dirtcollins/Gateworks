import { NextRequest, NextResponse } from "next/server";
import {
  adminAuthRequiredInThisEnvironment,
  authorizeAdminRequest
} from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { CartItem } from "@/lib/types";

type SavedCartPayload = {
  id?: string;
  userId: string;
  name: string;
  jobName: string;
  items: CartItem[];
};

type SavedCartRow = {
  id: string;
  name: string;
  job_name: string | null;
  created_at: string;
  updated_at: string;
  saved_cart_items?: Array<{
    id: string;
    sku: string;
    title: string;
    image_url: string | null;
    quantity: number;
    unit_price: number | string;
    item_options: Record<string, string | undefined> | null;
    item_payload: Partial<CartItem> | null;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value: string) {
  return uuidPattern.test(value) ? value : null;
}

function toClientCart(row: SavedCartRow) {
  return {
    id: row.id,
    name: row.name,
    jobName: row.job_name || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.saved_cart_items || []).map((item) => ({
      productId: item.item_payload?.productId || "",
      variantId: item.item_payload?.variantId || item.id,
      title: item.item_payload?.title || item.title,
      sku: item.sku,
      image: item.item_payload?.image || item.image_url || "/assets/logo.svg",
      price: Number(item.unit_price),
      quantity: item.quantity,
      options: item.item_payload?.options || item.item_options || {}
    }))
  };
}

export async function GET(request: NextRequest) {
  if (adminAuthRequiredInThisEnvironment()) {
    const auth = await authorizeAdminRequest(request);
    if (!auth.ok) return auth.response;
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      carts: [],
      persisted: false,
      reason: "Supabase service role is not configured."
    });
  }

  const userId = request.nextUrl.searchParams.get("userId") || "guest";

  const { data, error } = await admin
    .from("saved_carts")
    .select(
      `
      id,
      name,
      job_name,
      created_at,
      updated_at,
      saved_cart_items (
        id,
        sku,
        title,
        image_url,
        quantity,
        unit_price,
        item_options,
        item_payload
      )
    `
    )
    .eq("site_user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { carts: [], persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    carts: ((data || []) as unknown as SavedCartRow[]).map(toClientCart),
    persisted: true
  });
}

export async function POST(request: NextRequest) {
  if (adminAuthRequiredInThisEnvironment()) {
    const auth = await authorizeAdminRequest(request);
    if (!auth.ok) return auth.response;
  }

  const payload = (await request.json()) as SavedCartPayload;
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Supabase service role is not configured. Saved cart was not saved."
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 }
    );
  }

  try {
    await admin.from("site_users").upsert(
      {
        id: payload.userId || "guest",
        display_name: payload.userId || "Guest",
        normalized_name: (payload.userId || "guest").toLowerCase(),
        last_used_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    const { data: savedCart, error: cartError } = await admin
      .from("saved_carts")
      .insert({
        site_user_id: payload.userId || "guest",
        name: payload.name || "Saved cart",
        job_name: payload.jobName || null
      })
      .select("id")
      .single();

    if (cartError) throw cartError;

    if (savedCart?.id && payload.items.length) {
      const { error: itemError } = await admin.from("saved_cart_items").insert(
        payload.items.map((item) => ({
          saved_cart_id: savedCart.id,
          product_id: asUuid(item.productId),
          variant_id: asUuid(item.variantId),
          sku: item.sku,
          title: item.title,
          image_url: item.image,
          quantity: item.quantity,
          unit_price: item.price,
          item_options: item.options,
          item_payload: item
        }))
      );

      if (itemError) throw itemError;
    }

    return NextResponse.json({ ok: true, persisted: true, cartId: savedCart?.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: error instanceof Error ? error.message : "Unknown saved cart write error."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (adminAuthRequiredInThisEnvironment()) {
    const auth = await authorizeAdminRequest(request);
    if (!auth.ok) return auth.response;
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const cartId = request.nextUrl.searchParams.get("cartId");
  if (!cartId) {
    return NextResponse.json(
      { ok: false, reason: "cartId is required." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("saved_carts").delete().eq("id", cartId);

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
