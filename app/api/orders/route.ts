import { NextRequest, NextResponse } from "next/server";
import {
  createPickTicketForOrder,
  reserveInventoryForOrder
} from "@/lib/inventory-repository";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { FulfillmentMethod, OrderStatus, PaymentStatus } from "@/lib/platform-backend";
import type { CustomerDrawing } from "@/lib/order-store";

type OrderPayload = {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    sku: string;
    image?: string;
    price: number;
    quantity: number;
    options?: Record<string, string | undefined>;
  }>;
  fulfillmentMethod: FulfillmentMethod;
  requestedDate: string;
  requestedWindow: string;
  jobName: string;
  jobsiteAddress: Record<string, string>;
  drawings?: CustomerDrawing[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isQuoteRequest: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  site_user_id: string | null;
  customer_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  fulfillment_method: FulfillmentMethod;
  requested_date: string | null;
  requested_window: string | null;
  job_name: string | null;
  jobsite_address: Record<string, string> | null;
  subtotal: number | string;
  tax_total: number | string;
  delivery_fee: number | string;
  total: number | string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  is_quote_request: boolean;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
  customer_drawing_uploads?: CustomerDrawingRow[];
};

type OrderItemRow = {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  quantity_needed?: number | string | null;
  quantity_pulled?: number | string | null;
  pulled?: boolean | null;
  pulled_at?: string | null;
  pulled_by?: string | null;
  pick_notes?: string | null;
  unit_price: number | string;
  line_total: number | string;
  item_payload: {
    productId?: string;
    variantId?: string;
    title?: string;
    image?: string;
    options?: Record<string, string | undefined>;
  } | null;
};

type CustomerDrawingRow = {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string | null;
  public_url: string | null;
  created_at: string;
};

type PatchOrderPayload = {
  orderId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  convertToOrder?: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value: string) {
  return uuidPattern.test(value) ? value : null;
}

function toClientOrder(row: OrderRow) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.site_user_id || "guest",
    customerName: row.customer_name || "",
    companyName: row.company_name || "",
    email: row.email || "",
    phone: row.phone || "",
    items: (row.order_items || []).map((item) => ({
      orderItemId: item.id,
      productId: item.item_payload?.productId || "",
      variantId: item.item_payload?.variantId || item.id,
      title: item.item_payload?.title || item.description,
      sku: item.sku,
      image: item.item_payload?.image || "/assets/logo.svg",
      price: Number(item.unit_price),
      quantity: item.quantity,
      quantityNeeded: Number(item.quantity_needed ?? item.quantity),
      quantityPulled: Number(item.quantity_pulled ?? 0),
      pulled: Boolean(item.pulled),
      pulledAt: item.pulled_at || undefined,
      pulledBy: item.pulled_by || undefined,
      pickNotes: item.pick_notes || "",
      options: item.item_payload?.options || {}
    })),
    fulfillmentMethod: row.fulfillment_method,
    requestedDate: row.requested_date || "",
    requestedWindow: row.requested_window || "",
    jobName: row.job_name || "",
    jobsiteAddress: row.jobsite_address || {},
    drawings: (row.customer_drawing_uploads || []).map((drawing) => ({
      id: drawing.id,
      fileName: drawing.file_name,
      fileSize: drawing.file_size,
      fileType: drawing.file_type,
      storagePath: drawing.storage_path || undefined,
      publicUrl: drawing.public_url || undefined,
      uploadedAt: drawing.created_at
    })),
    pickupContact: row.customer_name || "",
    subtotal: Number(row.subtotal),
    tax: Number(row.tax_total),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    isQuoteRequest: row.is_quote_request,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activity: [
      {
        id: `${row.id}-loaded`,
        label: row.is_quote_request ? "Quote request loaded" : "Order loaded",
        detail: "Loaded from Supabase.",
        createdAt: row.updated_at
      }
    ]
  };
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json({
      orders: [],
      persisted: false,
      reason: "Supabase service role is not configured."
    });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  const limit = Number(request.nextUrl.searchParams.get("limit") || 100);

  let query = admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      site_user_id,
      customer_name,
      company_name,
      email,
      phone,
      fulfillment_method,
      requested_date,
      requested_window,
      job_name,
      jobsite_address,
      subtotal,
      tax_total,
      delivery_fee,
      total,
      status,
      payment_status,
      is_quote_request,
      created_at,
      updated_at,
      order_items (
        id,
        sku,
        description,
        quantity,
        quantity_needed,
        quantity_pulled,
        pulled,
        pulled_at,
        pulled_by,
        pick_notes,
        unit_price,
        line_total,
        item_payload
      ),
      customer_drawing_uploads (
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        public_url,
        created_at
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 250));

  if (userId) {
    query = query.eq("site_user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { orders: [], persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    orders: ((data || []) as unknown as OrderRow[]).map(toClientOrder),
    persisted: true
  });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as OrderPayload;
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Supabase service role is not configured. Order was not saved."
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 }
    );
  }

  try {
    if (payload.userId) {
      await admin.from("site_users").upsert(
        {
          id: payload.userId,
          display_name: payload.customerName || payload.userId,
          normalized_name: (payload.customerName || payload.userId).toLowerCase(),
          last_used_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: payload.orderNumber,
        site_user_id: payload.userId || "guest",
        customer_name: payload.customerName,
        company_name: payload.companyName,
        customer_email: payload.email,
        email: payload.email,
        phone: payload.phone,
        fulfillment_method: payload.fulfillmentMethod,
        requested_date: payload.requestedDate || null,
        requested_window: payload.requestedWindow,
        job_name: payload.jobName,
        jobsite_address: payload.jobsiteAddress,
        subtotal: payload.subtotal,
        tax_total: payload.tax,
        delivery_fee: payload.deliveryFee,
        total: payload.total,
        status: payload.status,
        payment_status: payload.paymentStatus,
        is_quote_request: payload.isQuoteRequest,
        notes: payload.jobsiteAddress?.notes || null
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    if (payload.items.length && order?.id) {
      const { error: itemsError } = await admin.from("order_items").insert(
        payload.items.map((item) => ({
          order_id: order.id,
          product_id: asUuid(item.productId),
          variant_id: asUuid(item.variantId),
          sku: item.sku,
          description: item.title,
          quantity: item.quantity,
          quantity_needed: item.quantity,
          quantity_pulled: 0,
          pulled: false,
          unit_price: item.price,
          line_total: item.price * item.quantity,
          item_payload: item
        }))
      );

      if (itemsError) throw itemsError;
    }

    return NextResponse.json({ ok: true, persisted: true, orderId: order?.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: error instanceof Error ? error.message : "Unknown order write error."
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const payload = (await request.json()) as PatchOrderPayload;
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Supabase service role is not configured. Order status was not saved."
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 }
    );
  }

  if (!payload.orderId) {
    return NextResponse.json(
      { ok: false, reason: "orderId is required." },
      { status: 400 }
    );
  }

  const updates: Record<string, string | boolean> = {};
  if (payload.status) updates.status = payload.status;
  if (payload.paymentStatus) updates.payment_status = payload.paymentStatus;
  if (payload.convertToOrder) {
    updates.is_quote_request = false;
    updates.status = payload.status || "submitted";
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { ok: false, reason: "No order fields were provided." },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("orders")
    .update(updates)
    .eq("id", payload.orderId);

  if (error) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  const workflow: Record<string, unknown> = {};

  try {
    if (updates.status === "confirmed") {
      const reservationResults = await reserveInventoryForOrder(admin, payload.orderId);
      workflow.inventoryReserved = reservationResults.every((result) => result.ok);
      workflow.inventoryResults = reservationResults;
    }

    if (updates.status === "picking") {
      workflow.pickTicketId = await createPickTicketForOrder(admin, payload.orderId);
    }
  } catch (workflowError) {
    workflow.warning =
      workflowError instanceof Error
        ? workflowError.message
        : "Order status changed, but the operations handoff did not complete.";
  }

  return NextResponse.json({ ok: true, persisted: true, workflow });
}
