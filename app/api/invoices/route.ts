import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  DbInvoice,
  DbInvoiceItem,
  InvoiceInput,
  InvoiceItemInput,
  InvoicePaymentStatus,
  InvoiceStatus
} from "@/lib/invoices-data";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const invoiceNumberFloor = 10026;

function asUuid(value?: string | null) {
  return value && uuidPattern.test(value) ? value : null;
}

function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    /relation .* does not exist/i.test(error.message || "") ||
    /column .* does not exist/i.test(error.message || "")
  );
}

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  order_id: string | null;
  quote_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  billing_address: string | null;
  jobsite_address: string | null;
  status: string | null;
  payment_status: string | null;
  terms: string | null;
  notes: string | null;
  subtotal: number | string | null;
  tax_total: number | string | null;
  delivery_fee: number | string | null;
  total: number | string | null;
  amount_paid: number | string | null;
  due_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItemRow[];
};

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
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

const INVOICE_SELECT =
  "id, invoice_number, order_id, quote_id, customer_id, customer_name, " +
  "customer_email, billing_address, jobsite_address, status, payment_status, " +
  "terms, notes, subtotal, tax_total, delivery_fee, total, amount_paid, " +
  "due_at, sent_at, created_at, updated_at, " +
  "invoice_items ( id, invoice_id, product_id, variant_id, sku, title, " +
  "description, options, quantity, unit_price, line_total )";

function toClientItem(row: InvoiceItemRow): DbInvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
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

function toClientInvoice(row: InvoiceRow): DbInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number || "",
    orderId: row.order_id,
    quoteId: row.quote_id,
    customerId: row.customer_id || "",
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    billingAddress: row.billing_address || "",
    jobsiteAddress: row.jobsite_address || "",
    status: (row.status as InvoiceStatus) || "draft",
    paymentStatus: (row.payment_status as InvoicePaymentStatus) || "unpaid",
    terms: row.terms || "",
    notes: row.notes || "",
    subtotal: Number(row.subtotal ?? 0),
    tax: Number(row.tax_total ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    total: Number(row.total ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    dueAt: row.due_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.invoice_items || []).map(toClientItem)
  };
}

async function generateInvoiceNumber(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>
) {
  const { data } = await admin
    .from("invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1000);

  const highest = (data || []).reduce((current, row) => {
    const value = Number(String(row.invoice_number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, invoiceNumberFloor);

  return `Invoice-${highest + 1}`;
}

function toInvoiceRow(input: InvoiceInput) {
  const row: Record<string, unknown> = {};
  if (input.invoiceNumber !== undefined) row.invoice_number = input.invoiceNumber;
  if (input.orderId !== undefined) row.order_id = asUuid(input.orderId);
  if (input.quoteId !== undefined) row.quote_id = asUuid(input.quoteId);
  if (input.customerId !== undefined) row.customer_id = input.customerId;
  if (input.customerName !== undefined) row.customer_name = input.customerName;
  if (input.customerEmail !== undefined) row.customer_email = input.customerEmail;
  if (input.billingAddress !== undefined) row.billing_address = input.billingAddress;
  if (input.jobsiteAddress !== undefined) row.jobsite_address = input.jobsiteAddress;
  if (input.status !== undefined) row.status = input.status;
  if (input.paymentStatus !== undefined) row.payment_status = input.paymentStatus;
  if (input.terms !== undefined) row.terms = input.terms;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.subtotal !== undefined) row.subtotal = input.subtotal;
  if (input.tax !== undefined) row.tax_total = input.tax;
  if (input.deliveryFee !== undefined) row.delivery_fee = input.deliveryFee;
  if (input.total !== undefined) row.total = input.total;
  if (input.amountPaid !== undefined) row.amount_paid = input.amountPaid;
  if (input.dueAt !== undefined) row.due_at = input.dueAt;
  if (input.sentAt !== undefined) row.sent_at = input.sentAt;
  return row;
}

function toItemRow(invoiceId: string, item: InvoiceItemInput) {
  const quantity = Number(item.quantity ?? 1) || 1;
  const unitPrice = Number(item.unitPrice ?? 0) || 0;
  const lineTotal =
    item.lineTotal !== undefined
      ? Number(item.lineTotal) || 0
      : Number((unitPrice * quantity).toFixed(2));
  const title = item.title || item.sku || "Invoice item";

  return {
    invoice_id: invoiceId,
    product_id: asUuid(item.productId),
    variant_id: asUuid(item.variantId),
    sku: item.sku || null,
    title,
    description: title,
    options: item.options || {},
    quantity,
    unit_price: unitPrice,
    line_total: lineTotal
  };
}

function validateInvoice(input: InvoiceInput) {
  if (!input.customerId || !input.customerName) {
    return "Select a customer before creating an invoice.";
  }
  if (!input.items?.length) {
    return "An invoice must have at least one line item.";
  }
  if (Number(input.total || 0) <= 0) {
    return "An invoice total must be greater than $0.";
  }
  return null;
}

async function fetchInvoiceById(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  id: string
) {
  const { data, error } = await admin
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toClientInvoice(data as unknown as InvoiceRow);
}

export async function GET(request: NextRequest) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, configured: false, invoices: [] });
  }

  const id = request.nextUrl.searchParams.get("id");

  let query = admin
    .from("invoices")
    .select(INVOICE_SELECT)
    .order("created_at", { ascending: false });

  if (id) query = query.eq("id", id);

  const { data, error } = await query;

  if (error) {
    if (isMissingSchema(error)) {
      return NextResponse.json({ ok: true, configured: false, invoices: [] });
    }
    return NextResponse.json(
      { ok: false, configured: true, invoices: [], reason: error.message },
      { status: 500 }
    );
  }

  const invoices = ((data || []) as unknown as InvoiceRow[]).map(toClientInvoice);
  return NextResponse.json({
    ok: true,
    configured: true,
    invoices,
    invoice: id ? invoices[0] ?? null : undefined
  });
}

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as InvoiceInput | null;
  if (!input) {
    return NextResponse.json({ ok: false, reason: "Invalid payload." }, { status: 400 });
  }

  const validationError = validateInvoice(input);
  if (validationError) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: validationError },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const invoiceRow = toInvoiceRow(input);
    invoiceRow.invoice_number =
      input.invoiceNumber || (await generateInvoiceNumber(admin));
    if (invoiceRow.status === undefined) invoiceRow.status = "sent";
    if (invoiceRow.payment_status === undefined) invoiceRow.payment_status = "unpaid";

    const { data: created, error: invoiceError } = await admin
      .from("invoices")
      .insert(invoiceRow)
      .select("id")
      .single();

    if (invoiceError) {
      if (isMissingSchema(invoiceError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw invoiceError;
    }

    const invoiceId = created.id as string;
    const { error: itemError } = await admin
      .from("invoice_items")
      .insert((input.items || []).map((item) => toItemRow(invoiceId, item)));

    if (itemError) throw itemError;

    const invoice = await fetchInvoiceById(admin, invoiceId);
    return NextResponse.json({ ok: true, persisted: true, invoice });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown invoice write error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as InvoiceInput | null;
  if (!input?.id) {
    return NextResponse.json(
      { ok: false, reason: "Invoice id is required." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const updates = toInvoiceRow(input);
    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await admin
      .from("invoices")
      .update(updates)
      .eq("id", input.id);

    if (updateError) {
      if (isMissingSchema(updateError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw updateError;
    }

    if (input.items) {
      const { error: deleteError } = await admin
        .from("invoice_items")
        .delete()
        .eq("invoice_id", input.id);
      if (deleteError) throw deleteError;

      if (input.items.length) {
        const { error: insertError } = await admin
          .from("invoice_items")
          .insert(input.items.map((item) => toItemRow(input.id as string, item)));
        if (insertError) throw insertError;
      }
    }

    const invoice = await fetchInvoiceById(admin, input.id);
    return NextResponse.json({ ok: true, persisted: true, invoice });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown invoice update error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}
