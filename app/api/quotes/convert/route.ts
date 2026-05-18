import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const orderNumberFloor = 10026;
const documentSequenceMin = 10000;
const documentSequenceMax = 99999;

function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    /relation .* does not exist/i.test(error.message || "") ||
    /column .* does not exist/i.test(error.message || "")
  );
}

function asUuid(value: string | null | undefined) {
  return value && uuidPattern.test(value) ? value : null;
}

function parseOrderSequence(orderNumber: string | null | undefined) {
  const value = Number(String(orderNumber || "").replace(/\D/g, ""));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > documentSequenceMax ? value % 100000 : value;
}

function formatDocumentSequence(sequence: number) {
  const bounded = sequence > documentSequenceMax ? documentSequenceMin : sequence;
  return String(bounded).padStart(5, "0");
}

async function getNextOrderNumber(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>
): Promise<string> {
  const { data, error } = await admin
    .from("orders")
    .select("order_number,is_quote_request")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;

  const highest = (data || []).reduce((current, row) => {
    if (row.is_quote_request) return current;
    return Math.max(current, parseOrderSequence(row.order_number));
  }, orderNumberFloor);

  const next = highest >= documentSequenceMax ? documentSequenceMin : highest + 1;
  return `Order-${formatDocumentSequence(next)}`;
}

type QuoteItemRow = {
  product_id: string | null;
  variant_id: string | null;
  sku: string | null;
  title: string | null;
  description: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  line_total: number | string | null;
};

type QuoteRow = {
  id: string;
  status: string | null;
  site_user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  jobsite_address: string | null;
  notes: string | null;
  subtotal: number | string | null;
  tax: number | string | null;
  total: number | string | null;
  quote_items?: QuoteItemRow[];
};

// Convert a database quote into a real order, link the two records, and mark
// the quote `converted`. Customer POs use the same flow with a `poNumber`.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    poNumber?: string;
    poStatus?: string;
  } | null;

  if (!body?.id) {
    return NextResponse.json(
      { ok: false, reason: "Quote id is required." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const { data: quoteData, error: quoteError } = await admin
      .from("quotes")
      .select(
        "id, status, site_user_id, customer_name, customer_email, jobsite_address, " +
          "notes, subtotal, tax, total, " +
          "quote_items ( product_id, variant_id, sku, title, description, quantity, " +
          "unit_price, line_total )"
      )
      .eq("id", body.id)
      .maybeSingle();

    if (quoteError) {
      if (isMissingSchema(quoteError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw quoteError;
    }

    if (!quoteData) {
      return NextResponse.json(
        { ok: false, reason: "Quote not found." },
        { status: 404 }
      );
    }

    const quote = quoteData as unknown as QuoteRow;
    const items = quote.quote_items || [];
    const orderNumber = await getNextOrderNumber(admin);

    // Resolve variant ids by SKU when the quote item does not carry a uuid,
    // mirroring the variant resolution in /api/orders.
    const skusToResolve = Array.from(
      new Set(
        items
          .filter((item) => !asUuid(item.variant_id))
          .map((item) => item.sku)
          .filter((sku): sku is string => Boolean(sku))
      )
    );

    const variantBySku = new Map<string, string>();
    if (skusToResolve.length) {
      const { data: variants } = await admin
        .from("product_variants")
        .select("id, sku")
        .in("sku", skusToResolve);
      (variants || []).forEach((row) => {
        const record = row as { id?: string; sku?: string };
        if (record.id && record.sku) variantBySku.set(record.sku, record.id);
      });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        site_user_id: quote.site_user_id || "guest",
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        email: quote.customer_email,
        fulfillment_method: "pickup",
        jobsite_address: quote.jobsite_address
          ? { line1: quote.jobsite_address }
          : {},
        subtotal: Number(quote.subtotal ?? 0),
        tax_total: Number(quote.tax ?? 0),
        delivery_fee: 0,
        total: Number(quote.total ?? 0),
        status: "submitted",
        payment_status: "unpaid",
        is_quote_request: false,
        notes: quote.notes || null,
        source_quote_id: quote.id,
        po_number: body.poNumber || null,
        po_status: body.poNumber ? body.poStatus || "submitted" : "none"
      })
      .select("id, order_number")
      .single();

    if (orderError) throw orderError;

    const orderId = order.id as string;

    const insertableItems = items
      .map((item) => {
        const variantId = asUuid(item.variant_id) || variantBySku.get(item.sku || "");
        if (!variantId) return null;
        const quantity = Number(item.quantity ?? 1) || 1;
        const unitPrice = Number(item.unit_price ?? 0) || 0;
        return {
          order_id: orderId,
          product_id: asUuid(item.product_id),
          variant_id: variantId,
          sku: item.sku || "",
          description: item.title || item.description || item.sku || "Item",
          quantity,
          quantity_needed: quantity,
          quantity_pulled: 0,
          pulled: false,
          unit_price: unitPrice,
          unit_cost: 0,
          line_total:
            Number(item.line_total ?? 0) || Number((unitPrice * quantity).toFixed(2)),
          item_payload: {
            productId: item.product_id || "",
            variantId,
            title: item.title || item.description || "",
            sku: item.sku || ""
          }
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (insertableItems.length) {
      const { error: itemsError } = await admin
        .from("order_items")
        .insert(insertableItems);
      if (itemsError) throw itemsError;
    }

    const { error: quoteUpdateError } = await admin
      .from("quotes")
      .update({
        status: "converted",
        converted_order_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq("id", quote.id);

    if (quoteUpdateError) {
      // Roll the new order back so a failed status update leaves no orphan.
      await admin.from("order_items").delete().eq("order_id", orderId);
      await admin.from("orders").delete().eq("id", orderId);
      throw quoteUpdateError;
    }

    return NextResponse.json({
      ok: true,
      persisted: true,
      orderId,
      orderNumber: order.order_number
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown quote conversion error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}
