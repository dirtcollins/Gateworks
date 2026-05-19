import { NextRequest, NextResponse } from "next/server";
import {
  createPickTicketForOrder,
  reserveInventoryForOrder
} from "@/lib/inventory-repository";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  applyTierDiscount,
  resolveLineDiscountPct,
  type PriceTierRule
} from "@/lib/pricing-tiers";
import { calculateTax } from "@/lib/tax";
import type {
  DeliveryStatus,
  FulfillmentMethod,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus
} from "@/lib/platform-backend";
import type { CustomerDrawing, OrderPayment } from "@/lib/order-store";

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
    weightLbs?: number;
    cwtPrice?: number;
    pricingMethod?: "manual" | "cwt_calculated";
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
  fulfillmentStatus?: FulfillmentStatus;
  deliveryStatus?: DeliveryStatus;
  isQuoteRequest: boolean;
  poNumber?: string;
  poStatus?: string;
  sourceQuoteId?: string;
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
  notes: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status?: FulfillmentStatus | null;
  delivery_status?: DeliveryStatus | null;
  is_quote_request: boolean;
  po_number?: string | null;
  po_status?: string | null;
  source_quote_id?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
  customer_drawing_uploads?: CustomerDrawingRow[];
  order_payments?: OrderPaymentRow[];
};

type OrderPaymentRow = {
  id: string;
  payment_date: string;
  payment_method: string;
  amount: number | string;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
    weightLbs?: number;
    cwtPrice?: number;
    pricingMethod?: "manual" | "cwt_calculated";
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
  poNumber?: string;
  poStatus?: string;
  sourceQuoteId?: string;
  payment?: {
    amount?: number;
    method?: string;
    paidAt?: string;
    reference?: string;
    note?: string;
    createdBy?: string;
  };
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const orderNumberFloor = 10026;
const documentSequenceMin = 10000;
const documentSequenceMax = 99999;
const validPaymentMethods = new Set([
  "Cash",
  "Check",
  "Credit Card",
  "Debit Card",
  "ACH",
  "Wire Transfer",
  "Financing",
  "Other"
]);

const allowedOrderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  draft: ["submitted", "confirmed", "cancelled"],
  submitted: ["confirmed", "cancelled"],
  confirmed: ["picking", "cancelled"],
  picking: ["ready_for_pickup", "out_for_delivery", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: ["confirmed"]
};

function inferFulfillmentStatus(status: OrderStatus): FulfillmentStatus {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "fulfilled";
  if (status === "ready_for_pickup" || status === "out_for_delivery") return "ready";
  if (status === "picking") return "picking";
  return "queued";
}

function inferDeliveryStatus(
  fulfillmentMethod: FulfillmentMethod,
  status: OrderStatus
): DeliveryStatus {
  if (fulfillmentMethod !== "delivery") return "none";
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "delivered";
  if (status === "out_for_delivery") return "out_for_delivery";
  if (status === "picking") return "loaded";
  if (status === "confirmed") return "assigned";
  return "scheduled";
}

function dbDeliveryStatus(status: DeliveryStatus): Exclude<DeliveryStatus, "none"> {
  return status === "none" ? "scheduled" : status;
}

function canTransitionOrderStatus(current: OrderStatus, next: OrderStatus) {
  if (current === next) return true;
  return allowedOrderStatusTransitions[current]?.includes(next) || false;
}

async function logOrderActivity(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  input: {
    orderId: string;
    type: string;
    label: string;
    detail: string;
    createdBy?: string;
    payload?: Record<string, unknown>;
  }
) {
  await admin.from("order_activity_logs").insert({
    order_id: input.orderId,
    activity_type: input.type,
    label: input.label,
    detail: input.detail,
    created_by: input.createdBy || "Admin",
    payload: input.payload || {}
  });
}

function parseOrderSequence(orderNumber: string | null | undefined) {
  const value = Number(String(orderNumber || "").replace(/\D/g, ""));
  if (!Number.isFinite(value) || value <= 0) return 0;

  return value > documentSequenceMax ? value % 100000 : value;
}

function formatDocumentSequence(sequence: number) {
  const boundedSequence =
    sequence > documentSequenceMax
      ? documentSequenceMin
      : sequence;

  return String(boundedSequence).padStart(5, "0");
}

function normalizeDocumentNumber(orderNumber: string, isQuoteRequest: boolean) {
  const sequence = parseOrderSequence(orderNumber);
  if (!sequence) return orderNumber;
  return `${isQuoteRequest ? "Quote" : "ORD"}-${formatDocumentSequence(sequence)}`;
}

async function getNextDocumentNumber(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  prefix: "ORD" | "Quote",
  isQuoteRequest: boolean
) {
  const { data, error } = await admin
    .from("orders")
    .select("order_number,is_quote_request")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;

  const highest = (data || []).reduce((currentHighest, row) => {
    if (Boolean(row.is_quote_request) !== isQuoteRequest) return currentHighest;
    return Math.max(currentHighest, parseOrderSequence(row.order_number));
  }, orderNumberFloor);

  const nextSequence = highest >= documentSequenceMax ? documentSequenceMin : highest + 1;
  return `${prefix}-${formatDocumentSequence(nextSequence)}`;
}

function asUuid(value: string) {
  return uuidPattern.test(value) ? value : null;
}

function getPaymentStatusForPaidAmount(totalPaid: number, totalAmount: number): PaymentStatus {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid > totalAmount) return "overpaid";
  if (totalPaid === totalAmount) return "paid";
  return "partial";
}

function toClientOrder(row: OrderRow) {
  const resolvedNotes = typeof row.notes === "string" ? row.notes : row.jobsite_address?.notes;
  const mergedJobsiteAddress: Record<string, string> = {
    ...(row.jobsite_address || {}),
    notes: resolvedNotes || ""
  };

  return {
    id: row.id,
    orderNumber: normalizeDocumentNumber(row.order_number, row.is_quote_request),
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
      image: item.item_payload?.image === "/assets/logo.svg" ? "" : item.item_payload?.image || "",
      price: Number(item.unit_price),
      weightLbs:
        typeof item.item_payload?.weightLbs === "number"
          ? item.item_payload.weightLbs
          : undefined,
      cwtPrice:
        typeof item.item_payload?.cwtPrice === "number"
          ? item.item_payload.cwtPrice
          : undefined,
      pricingMethod: item.item_payload?.pricingMethod,
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
    jobsiteAddress: mergedJobsiteAddress,
    drawings: (row.customer_drawing_uploads || []).map((drawing) => ({
      id: drawing.id,
      fileName: drawing.file_name,
      fileSize: drawing.file_size,
      fileType: drawing.file_type,
      storagePath: drawing.storage_path || undefined,
      publicUrl: drawing.public_url || undefined,
      uploadedAt: drawing.created_at
    })),
    payments: (row.order_payments || []).map((payment): OrderPayment => ({
      id: payment.id,
      amount: Number(payment.amount),
      method: payment.payment_method,
      paidAt: payment.payment_date,
      reference: payment.reference_number || "",
      note: payment.notes || "",
      createdBy: payment.created_by || "Admin",
      createdAt: payment.created_at
    })),
    pickupContact: row.customer_name || "",
    subtotal: Number(row.subtotal),
    tax: Number(row.tax_total),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status || inferFulfillmentStatus(row.status),
    deliveryStatus:
      row.fulfillment_method === "pickup"
        ? "none"
        : row.delivery_status || inferDeliveryStatus(row.fulfillment_method, row.status),
    isQuoteRequest: row.is_quote_request,
    poNumber: row.po_number || "",
    poStatus: row.po_status || "none",
    sourceQuoteId: row.source_quote_id || null,
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

type ResolvedOrderItem = OrderPayload["items"][number] & {
  resolvedVariantId: string;
};

async function resolveOrderItemVariantIds(
  admin: NonNullable<Awaited<ReturnType<typeof getSupabaseAdminClient>>>,
  items: OrderPayload["items"]
) {
  const variantResolutions = new Map<string, string>();
  const skusNeedingResolution = Array.from(
    new Set(
      items
        .filter((item) => !asUuid(item.variantId))
        .map((item) => item.sku)
        .filter(Boolean)
    )
  );

  if (skusNeedingResolution.length) {
    const { data, error } = await admin
      .from("product_variants")
      .select("id, sku")
      .in("sku", skusNeedingResolution);

    if (error) {
      throw error;
    }

    (data || []).forEach((record) => {
      const row = record as { id?: string; sku?: string };

      if (row.sku && row.id) {
        variantResolutions.set(row.sku, row.id);
      }
    });
  }

  return items.map((item) => {
    const normalizedVariantId = asUuid(item.variantId);
    const fallbackVariantId = variantResolutions.get(item.sku);

    if (!normalizedVariantId && !fallbackVariantId) {
      throw new Error(
        `Order item variant could not be resolved for SKU ${item.sku}. Please sync catalog variants before checkout.`
      );
    }

    const resolvedVariantId = normalizedVariantId || fallbackVariantId;

    if (!resolvedVariantId) {
      throw new Error(`Order item variant could not be resolved for SKU ${item.sku}.`);
    }

    return { ...item, resolvedVariantId };
  }) as ResolvedOrderItem[];
}

async function fetchVariantCosts(
  admin: NonNullable<Awaited<ReturnType<typeof getSupabaseAdminClient>>>,
  variantIds: string[]
) {
  const costByVariant = new Map<string, number>();
  const uniqueIds = Array.from(new Set(variantIds.filter(Boolean)));

  if (!uniqueIds.length) {
    return costByVariant;
  }

  const { data, error } = await admin
    .from("product_variants")
    .select("id, cost")
    .in("id", uniqueIds);

  if (error) {
    throw error;
  }

  (data || []).forEach((record) => {
    const row = record as { id?: string; cost?: number | string | null };

    if (row.id) {
      costByVariant.set(row.id, Number(row.cost ?? 0));
    }
  });

  return costByVariant;
}

// Resolve the customer's B2B pricing tier and its discount rules. Fully
// defensive: a missing company link or pricing-tier table just yields no
// discount rather than failing order creation.
async function resolveTierPricing(
  admin: NonNullable<Awaited<ReturnType<typeof getSupabaseAdminClient>>>,
  email: string | undefined
): Promise<{ tier: string | null; rules: PriceTierRule[] }> {
  const empty = { tier: null as string | null, rules: [] as PriceTierRule[] };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return empty;

  try {
    const { data: companyUser, error: companyUserError } = await admin
      .from("company_users")
      .select("companies (pricing_tier)")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (companyUserError || !companyUser) return empty;

    const companyRecord = Array.isArray(companyUser.companies)
      ? companyUser.companies[0]
      : companyUser.companies;
    const tier = (companyRecord as { pricing_tier?: string } | null)?.pricing_tier;
    if (!tier) return empty;

    const { data: ruleData, error: ruleError } = await admin
      .from("price_tier_rules")
      .select("tier, category_slug, discount_pct, min_quantity")
      .eq("tier", tier);

    if (ruleError || !ruleData) return { tier, rules: [] };

    const rules: PriceTierRule[] = ruleData.map((row) => {
      const record = row as {
        tier: string;
        category_slug: string | null;
        discount_pct: number | string;
        min_quantity: number | string;
      };

      return {
        tier: record.tier,
        categorySlug: record.category_slug,
        discountPct: Number(record.discount_pct || 0),
        minQuantity: Number(record.min_quantity || 1)
      };
    });

    return { tier, rules };
  } catch {
    return empty;
  }
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
  const orderId = request.nextUrl.searchParams.get("orderId");
  const orderNumber = request.nextUrl.searchParams.get("orderNumber");
  const limit = Number(request.nextUrl.searchParams.get("limit") || 100);
  const includeItems = request.nextUrl.searchParams.get("includeItems") === "true";
  const includeDrawings = request.nextUrl.searchParams.get("includeDrawings") === "true";

  const selectFields = [
    "id",
    "order_number",
    "site_user_id",
    "customer_name",
    "company_name",
    "email",
    "phone",
    "fulfillment_method",
    "requested_date",
    "requested_window",
    "job_name",
    "jobsite_address",
    "subtotal",
    "tax_total",
    "delivery_fee",
    "total",
    "status",
    "payment_status",
    "fulfillment_status",
    "delivery_status",
    "is_quote_request",
    "po_number",
    "po_status",
    "source_quote_id",
    "notes",
    "created_at",
    "updated_at"
  ];

  if (includeItems) {
    selectFields.push(
      `order_items (
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
      )`
    );
  }

  if (includeDrawings) {
    selectFields.push(
      `customer_drawing_uploads (
        id,
        file_name,
        file_size,
        file_type,
        storage_path,
        public_url,
        created_at
      )`
    );
  }

  selectFields.push(
    `order_payments (
      id,
      payment_date,
      payment_method,
      amount,
      reference_number,
      notes,
      created_by,
      created_at,
      updated_at
    )`
  );

  let query = admin
    .from("orders")
    .select(selectFields.join(", "))
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 250));

  if (orderId) {
    query = query.eq("id", orderId);
  } else if (orderNumber) {
    query = query.eq("order_number", orderNumber);
  } else if (userId) {
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

  // An order with nothing in it (and no value) is junk — it surfaces later as
  // a 0/0 pick ticket. Block it at the source.
  if (!payload.items?.length) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "An order must have at least one line item."
      },
      { status: 400 }
    );
  }
  if (Number(payload.total) <= 0) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "An order total must be greater than $0."
      },
      { status: 400 }
    );
  }

  try {
    const safeUserId = (payload.userId || "guest").trim();

    if (safeUserId) {
      await admin.from("site_users").upsert(
        {
          id: safeUserId,
          display_name: payload.customerName || payload.userId,
          normalized_name: safeUserId.toLowerCase(),
          last_used_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    }

    const orderNumber = await getNextDocumentNumber(
      admin,
      payload.isQuoteRequest ? "Quote" : "ORD",
      payload.isQuoteRequest
    );

    // Resolve items, costs, and B2B tier pricing before creating the order so
    // discounted line prices and the order totals stay consistent.
    const resolvedItems = payload.items.length
      ? await resolveOrderItemVariantIds(admin, payload.items)
      : [];
    const variantCosts = resolvedItems.length
      ? await fetchVariantCosts(
          admin,
          resolvedItems.map((item) => item.resolvedVariantId)
        )
      : new Map<string, number>();
    const { tier, rules: tierRules } = await resolveTierPricing(admin, payload.email);

    const pricedItems = resolvedItems.map((item) => {
      const discountPct = tier
        ? resolveLineDiscountPct(tierRules, { tier, quantity: item.quantity })
        : 0;
      const unitPrice = applyTierDiscount(item.price, discountPct);
      return {
        item,
        unitPrice,
        lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
        discountPct
      };
    });

    const hasDiscount = pricedItems.some((priced) => priced.discountPct > 0);
    const discountedSubtotal = Number(
      pricedItems.reduce((sum, priced) => sum + priced.lineTotal, 0).toFixed(2)
    );
    const orderSubtotal = hasDiscount ? discountedSubtotal : payload.subtotal;
    const orderTax =
      hasDiscount && !payload.isQuoteRequest ? calculateTax(discountedSubtotal) : payload.tax;
    const orderTotal = hasDiscount
      ? Number((orderSubtotal + orderTax + (payload.deliveryFee || 0)).toFixed(2))
      : payload.total;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        site_user_id: safeUserId || "guest",
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
        subtotal: orderSubtotal,
        tax_total: orderTax,
        delivery_fee: payload.deliveryFee,
        total: orderTotal,
        status: payload.status,
        payment_status: payload.paymentStatus,
        fulfillment_status: payload.fulfillmentStatus || inferFulfillmentStatus(payload.status),
        delivery_status: dbDeliveryStatus(
          payload.deliveryStatus ||
            inferDeliveryStatus(payload.fulfillmentMethod, payload.status)
        ),
        is_quote_request: payload.isQuoteRequest,
        po_number: payload.poNumber || null,
        po_status: payload.poNumber ? payload.poStatus || "submitted" : "none",
        source_quote_id: payload.sourceQuoteId || null,
        notes: payload.jobsiteAddress?.notes || null
      })
      .select("id, order_number")
      .single();

    if (orderError) throw orderError;

    if (pricedItems.length && order?.id) {
      const { error: itemsError } = await admin.from("order_items").insert(
        pricedItems.map(({ item, unitPrice, lineTotal }) => ({
          order_id: order.id,
          product_id: asUuid(item.productId),
          variant_id: item.resolvedVariantId,
          sku: item.sku,
          description: item.title,
          quantity: item.quantity,
          quantity_needed: item.quantity,
          quantity_pulled: 0,
          pulled: false,
          unit_price: unitPrice,
          unit_cost: variantCosts.get(item.resolvedVariantId) ?? 0,
          line_total: lineTotal,
          item_payload: {
            ...item,
            variantId: item.resolvedVariantId
          }
        }))
      );

      if (itemsError) throw itemsError;
    }

    if (order?.id) {
      await logOrderActivity(admin, {
        orderId: order.id,
        type: "order_created",
        label: payload.isQuoteRequest ? "Quote request created" : "Order created",
        detail: `${payload.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"} order ${order.order_number} created.`,
        createdBy: "System",
        payload: { orderNumber: order.order_number, status: payload.status }
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      persisted: true,
      orderId: order?.id,
      orderNumber: order?.order_number
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "Unknown order write error.")
        : "Unknown order write error.";
    const details =
      error &&
      typeof error === "object" &&
      "details" in error &&
      typeof (error as { details?: unknown }).details === "string"
        ? String((error as { details?: unknown }).details)
        : null;
    const hint =
      error &&
      typeof error === "object" &&
      "hint" in error &&
      typeof (error as { hint?: unknown }).hint === "string"
        ? String((error as { hint?: unknown }).hint)
        : null;
    const code =
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? String((error as { code?: unknown }).code)
        : null;

    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: [message, details, hint, code]
          .filter(Boolean)
          .join(" | ")
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

  if (payload.payment) {
    const amount = Number(payload.payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, reason: "Payment amount must be greater than zero." },
        { status: 400 }
      );
    }
    const paymentMethod = payload.payment.method || "";
    if (!validPaymentMethods.has(paymentMethod)) {
      return NextResponse.json(
        { ok: false, reason: "Payment method is required." },
        { status: 400 }
      );
    }

    const { data: orderRow, error: orderReadError } = await admin
      .from("orders")
      .select("id,total")
      .eq("id", payload.orderId)
      .single();

    if (orderReadError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: orderReadError.message },
        { status: 500 }
      );
    }

    const { data: existingPayments, error: paymentReadError } = await admin
      .from("order_payments")
      .select("amount")
      .eq("order_id", payload.orderId);

    if (paymentReadError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: paymentReadError.message },
        { status: 500 }
      );
    }

    const paidBefore = (existingPayments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );
    const nextPaid = paidBefore + amount;
    const orderTotal = Number(orderRow?.total || 0);
    const nextPaymentStatus = getPaymentStatusForPaidAmount(nextPaid, orderTotal);

    const { data: paymentRow, error: paymentInsertError } = await admin
      .from("order_payments")
      .insert({
        order_id: payload.orderId,
        payment_date: payload.payment.paidAt || new Date().toISOString(),
        payment_method: paymentMethod,
        amount,
        reference_number: payload.payment.reference || null,
        notes: payload.payment.note || null,
        created_by: payload.payment.createdBy || "Admin"
      })
      .select("id,payment_date,payment_method,amount,reference_number,notes,created_by,created_at,updated_at")
      .single();

    if (paymentInsertError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: paymentInsertError.message },
        { status: 500 }
      );
    }

    const { error: statusUpdateError } = await admin
      .from("orders")
      .update({ payment_status: nextPaymentStatus })
      .eq("id", payload.orderId);

    if (statusUpdateError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: statusUpdateError.message },
        { status: 500 }
      );
    }

    await logOrderActivity(admin, {
      orderId: payload.orderId,
      type: "payment_created",
      label: "Payment recorded",
      detail: `${paymentMethod} payment of $${amount.toFixed(2)} recorded.`,
      createdBy: payload.payment.createdBy || "Admin",
      payload: { paymentId: paymentRow?.id, paymentStatus: nextPaymentStatus }
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      persisted: true,
      paymentStatus: nextPaymentStatus,
      payment: paymentRow
        ? {
            id: paymentRow.id,
            amount: Number(paymentRow.amount),
            method: paymentRow.payment_method,
            paidAt: paymentRow.payment_date,
            reference: paymentRow.reference_number || "",
            note: paymentRow.notes || "",
            createdBy: paymentRow.created_by || "Admin",
            createdAt: paymentRow.created_at
          }
        : null
    });
  }

  const updates: Record<string, string | boolean> = {};
  let previousStatus: OrderStatus | null = null;
  let fulfillmentMethod: FulfillmentMethod = "pickup";

  if (payload.status) {
    const { data: existingOrder, error: existingOrderError } = await admin
      .from("orders")
      .select("status, fulfillment_method")
      .eq("id", payload.orderId)
      .single();

    if (existingOrderError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: existingOrderError.message },
        { status: 500 }
      );
    }

    previousStatus = existingOrder.status as OrderStatus;
    fulfillmentMethod = existingOrder.fulfillment_method as FulfillmentMethod;

    if (!canTransitionOrderStatus(previousStatus, payload.status)) {
      return NextResponse.json(
        {
          ok: false,
          persisted: false,
          reason: `Order status cannot transition from ${previousStatus} to ${payload.status}.`
        },
        { status: 400 }
      );
    }

    updates.status = payload.status;
    updates.fulfillment_status = inferFulfillmentStatus(payload.status);
    updates.delivery_status = dbDeliveryStatus(
      inferDeliveryStatus(fulfillmentMethod, payload.status)
    );
  }
  if (payload.paymentStatus) updates.payment_status = payload.paymentStatus;
  if (payload.poNumber !== undefined) updates.po_number = payload.poNumber;
  if (payload.poStatus !== undefined) updates.po_status = payload.poStatus;
  if (payload.sourceQuoteId !== undefined) updates.source_quote_id = payload.sourceQuoteId;
  if (payload.convertToOrder) {
    updates.is_quote_request = false;
    updates.status = payload.status || "submitted";
    updates.fulfillment_status = inferFulfillmentStatus(updates.status as OrderStatus);
    updates.delivery_status = dbDeliveryStatus(
      inferDeliveryStatus(fulfillmentMethod, updates.status as OrderStatus)
    );
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

  if (payload.status && previousStatus) {
    await logOrderActivity(admin, {
      orderId: payload.orderId,
      type: "status_changed",
      label: "Order status changed",
      detail: `Status changed from ${previousStatus} to ${payload.status}.`,
      createdBy: "Admin",
      payload: { from: previousStatus, to: payload.status }
    }).catch(() => null);
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

// Delete orders — a single order by ?orderId (draft or cancelled only, so a
// live order can't be wiped), or every draft order via ?scope=drafts. Line
// items are removed first so the parent delete can't orphan them.
export async function DELETE(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const scope = searchParams.get("scope");

  try {
    let targetIds: string[] = [];

    if (orderId) {
      const { data: row, error } = await admin
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .maybeSingle();
      if (error) throw error;
      if (!row) {
        return NextResponse.json(
          { ok: false, reason: "Order not found." },
          { status: 404 }
        );
      }
      if (row.status !== "draft" && row.status !== "cancelled") {
        return NextResponse.json(
          { ok: false, reason: "Only draft or cancelled orders can be deleted." },
          { status: 400 }
        );
      }
      targetIds = [orderId];
    } else if (scope === "drafts") {
      const { data, error } = await admin
        .from("orders")
        .select("id")
        .eq("status", "draft")
        .eq("is_quote_request", false);
      if (error) throw error;
      targetIds = (data || []).map((entry) => entry.id as string);
    } else {
      return NextResponse.json(
        { ok: false, reason: "Provide an orderId, or scope=drafts." },
        { status: 400 }
      );
    }

    if (!targetIds.length) {
      return NextResponse.json({ ok: true, persisted: true, deleted: 0 });
    }

    const { error: itemsError } = await admin
      .from("order_items")
      .delete()
      .in("order_id", targetIds);
    if (itemsError) throw itemsError;

    const { error: ordersError } = await admin
      .from("orders")
      .delete()
      .in("id", targetIds);
    if (ordersError) throw ordersError;

    return NextResponse.json({
      ok: true,
      persisted: true,
      deleted: targetIds.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: error instanceof Error ? error.message : "Unknown order delete error."
      },
      { status: 500 }
    );
  }
}
