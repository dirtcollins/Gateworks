import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  DbQuote,
  DbQuoteItem,
  QuoteInput,
  QuoteItemInput,
  QuoteStatus
} from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

// A Postgres error that means the table or a column does not exist yet. When
// we see this we degrade gracefully instead of returning a 500.
function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  // 42P01 = undefined_table, 42703 = undefined_column.
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    /relation .* does not exist/i.test(error.message || "") ||
    /column .* does not exist/i.test(error.message || "")
  );
}

type QuoteRow = {
  id: string;
  quote_number: string | null;
  status: string | null;
  is_template: boolean | null;
  template_name: string | null;
  site_user_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  billing_address: string | null;
  jobsite_address: string | null;
  terms: string | null;
  notes: string | null;
  subtotal: number | string | null;
  tax: number | string | null;
  total: number | string | null;
  created_by: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
  quote_items?: QuoteItemRow[];
};

type QuoteItemRow = {
  id: string;
  quote_id: string;
  product_id: string | null;
  variant_id: string | null;
  sku: string | null;
  title: string | null;
  description: string | null;
  options: Record<string, string | undefined> | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  line_total: number | string | null;
};

const QUOTE_SELECT =
  "id, quote_number, status, is_template, template_name, site_user_id, " +
  "customer_id, customer_name, customer_email, billing_address, jobsite_address, " +
  "terms, notes, subtotal, tax, total, created_by, converted_order_id, " +
  "created_at, updated_at, " +
  "quote_items ( id, quote_id, product_id, variant_id, sku, title, description, " +
  "options, quantity, unit_price, line_total )";

function toClientItem(row: QuoteItemRow): DbQuoteItem {
  return {
    id: row.id,
    quoteId: row.quote_id,
    productId: row.product_id || "",
    variantId: row.variant_id || "",
    sku: row.sku || "",
    title: row.title || row.description || "",
    options: row.options || {},
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    lineTotal: Number(row.line_total ?? 0)
  };
}

function toClientQuote(row: QuoteRow): DbQuote {
  return {
    id: row.id,
    quoteNumber: row.quote_number || "",
    status: (row.status as QuoteStatus) || "draft",
    isTemplate: Boolean(row.is_template),
    templateName: row.template_name || "",
    siteUserId: row.site_user_id || null,
    customerId: row.customer_id || "",
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    billingAddress: row.billing_address || "",
    jobsiteAddress: row.jobsite_address || "",
    terms: row.terms || "",
    notes: row.notes || "",
    subtotal: Number(row.subtotal ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    createdBy: row.created_by || "",
    convertedOrderId: row.converted_order_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.quote_items || []).map(toClientItem)
  };
}

const quoteNumberFloor = 1050;

async function generateQuoteNumber(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>
): Promise<string> {
  const { data } = await admin
    .from("quotes")
    .select("quote_number")
    .order("created_at", { ascending: false })
    .limit(1000);

  const highest = (data || []).reduce((current, row) => {
    const value = Number(String(row.quote_number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, quoteNumberFloor - 1);

  return `Quote-${highest + 1}`;
}

// Map a client item payload to a quote_items insert row. We populate both
// `title` (new column) and `description` (legacy NOT NULL column) so the
// insert succeeds against both fresh and legacy schemas.
function toItemRow(quoteId: string, item: QuoteItemInput) {
  const quantity = Number(item.quantity ?? 1) || 1;
  const unitPrice = Number(item.unitPrice ?? 0) || 0;
  const lineTotal =
    item.lineTotal !== undefined
      ? Number(item.lineTotal) || 0
      : Number((unitPrice * quantity).toFixed(2));
  const title = item.title || item.sku || "Quote item";

  return {
    quote_id: quoteId,
    product_id: item.productId || null,
    variant_id: item.variantId || null,
    sku: item.sku || null,
    title,
    description: title,
    options: item.options || {},
    quantity,
    unit_price: unitPrice,
    line_total: lineTotal
  };
}

// Build the quote column updates from a client payload. Only defined fields
// are included so PATCH callers can send partial updates.
function toQuoteRow(input: QuoteInput) {
  const row: Record<string, unknown> = {};
  if (input.quoteNumber !== undefined) row.quote_number = input.quoteNumber;
  if (input.status !== undefined) row.status = input.status;
  if (input.isTemplate !== undefined) row.is_template = input.isTemplate;
  if (input.templateName !== undefined) row.template_name = input.templateName;
  if (input.siteUserId !== undefined) row.site_user_id = input.siteUserId || null;
  if (input.customerId !== undefined) row.customer_id = input.customerId;
  if (input.customerName !== undefined) row.customer_name = input.customerName;
  if (input.customerEmail !== undefined) row.customer_email = input.customerEmail;
  if (input.billingAddress !== undefined) row.billing_address = input.billingAddress;
  if (input.jobsiteAddress !== undefined) row.jobsite_address = input.jobsiteAddress;
  if (input.terms !== undefined) row.terms = input.terms;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.subtotal !== undefined) row.subtotal = input.subtotal;
  if (input.tax !== undefined) row.tax = input.tax;
  if (input.total !== undefined) row.total = input.total;
  if (input.createdBy !== undefined) row.created_by = input.createdBy;
  return row;
}

async function fetchQuoteById(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  id: string
): Promise<DbQuote | null> {
  const { data, error } = await admin
    .from("quotes")
    .select(QUOTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toClientQuote(data as unknown as QuoteRow);
}

export async function GET(request: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, configured: false, quotes: [] });
  }

  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  const siteUserId = params.get("siteUserId");
  const status = params.get("status");
  const templatesOnly = params.get("template") === "true";

  let query = admin
    .from("quotes")
    .select(QUOTE_SELECT)
    .order("created_at", { ascending: false });

  if (id) {
    query = query.eq("id", id);
  } else {
    if (siteUserId) query = query.eq("site_user_id", siteUserId);
    if (status) query = query.eq("status", status);
    // Templates are excluded from normal listings unless explicitly requested.
    query = query.eq("is_template", templatesOnly);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSchema(error)) {
      return NextResponse.json({ ok: true, configured: false, quotes: [] });
    }
    return NextResponse.json(
      { ok: false, configured: true, quotes: [], reason: error.message },
      { status: 500 }
    );
  }

  const quotes = ((data || []) as unknown as QuoteRow[]).map(toClientQuote);
  return NextResponse.json({
    ok: true,
    configured: true,
    quotes,
    quote: id ? quotes[0] ?? null : undefined
  });
}

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as QuoteInput | null;
  if (!input) {
    return NextResponse.json({ ok: false, reason: "Invalid payload." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const quoteRow = toQuoteRow(input);
    quoteRow.quote_number = input.quoteNumber || (await generateQuoteNumber(admin));
    if (quoteRow.status === undefined) quoteRow.status = "draft";

    const { data: created, error: quoteError } = await admin
      .from("quotes")
      .insert(quoteRow)
      .select("id")
      .single();

    if (quoteError) {
      if (isMissingSchema(quoteError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw quoteError;
    }

    const quoteId = created.id as string;
    const items = input.items || [];

    if (items.length) {
      const { error: itemsError } = await admin
        .from("quote_items")
        .insert(items.map((item) => toItemRow(quoteId, item)));
      if (itemsError) throw itemsError;
    }

    const quote = await fetchQuoteById(admin, quoteId);
    return NextResponse.json({ ok: true, persisted: true, quote });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown quote write error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as QuoteInput | null;
  if (!input || !input.id) {
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
    const updates = toQuoteRow(input);
    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await admin
      .from("quotes")
      .update(updates)
      .eq("id", input.id);

    if (updateError) {
      if (isMissingSchema(updateError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw updateError;
    }

    // When `items` is supplied we replace the full line-item set.
    if (input.items) {
      const { error: deleteError } = await admin
        .from("quote_items")
        .delete()
        .eq("quote_id", input.id);
      if (deleteError) throw deleteError;

      if (input.items.length) {
        const { error: itemsError } = await admin
          .from("quote_items")
          .insert(input.items.map((item) => toItemRow(input.id as string, item)));
        if (itemsError) throw itemsError;
      }
    }

    const quote = await fetchQuoteById(admin, input.id);
    return NextResponse.json({ ok: true, persisted: true, quote });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown quote write error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, reason: "Quote id is required." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await admin.from("quotes").delete().eq("id", id);

  if (error) {
    if (isMissingSchema(error)) {
      return NextResponse.json({ ok: true, persisted: false });
    }
    return NextResponse.json(
      { ok: false, persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
