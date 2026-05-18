import { NextRequest, NextResponse } from "next/server";
import { emailEnabled, sendEmail } from "@/lib/email";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { formatCurrency } from "@/lib/utils";

type QuoteItemRow = {
  description: string | null;
  sku: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  line_total: number | string | null;
};

type QuoteRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  company_name: string | null;
  email: string | null;
  job_name: string | null;
  subtotal: number | string | null;
  tax_total: number | string | null;
  total: number | string | null;
  order_items: QuoteItemRow[] | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildQuoteEmail(quote: QuoteRow) {
  const greeting = quote.company_name || quote.customer_name || "there";
  const items = quote.order_items || [];

  const rows = items
    .map((item) => {
      const quantity = Number(item.quantity || 0);
      const lineTotal = Number(item.line_total || 0);
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e2dc;">${escapeHtml(
          item.description || item.sku || "Item"
        )}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e2dc;text-align:right;">${quantity}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e2dc;text-align:right;">${formatCurrency(
          lineTotal
        )}</td>
      </tr>`;
    })
    .join("");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#171717;max-width:560px;">
    <h2 style="margin:0 0 4px;">Quote ${escapeHtml(quote.order_number)}</h2>
    <p style="margin:0 0 16px;color:#5c5a54;">Project: ${escapeHtml(
      quote.job_name || "Material quote"
    )}</p>
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}, your quote is ready for review.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="text-align:left;color:#7c786f;">
          <th style="padding:6px 10px;">Item</th>
          <th style="padding:6px 10px;text-align:right;">Qty</th>
          <th style="padding:6px 10px;text-align:right;">Line total</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td style="padding:6px 10px;">No line items.</td></tr>`}</tbody>
    </table>
    <p style="margin:16px 0 0;font-size:15px;">
      <strong>Subtotal:</strong> ${formatCurrency(Number(quote.subtotal || 0))}<br/>
      <strong>Tax:</strong> ${formatCurrency(Number(quote.tax_total || 0))}<br/>
      <strong>Total:</strong> ${formatCurrency(Number(quote.total || 0))}
    </p>
    <p style="margin:20px 0 0;color:#5c5a54;">Reply to this email to confirm or adjust the order.</p>
  </div>`;

  const text = [
    `Quote ${quote.order_number}`,
    `Project: ${quote.job_name || "Material quote"}`,
    "",
    `${greeting}, your quote is ready for review.`,
    "",
    ...items.map(
      (item) =>
        `- ${item.description || item.sku || "Item"} x${Number(item.quantity || 0)} — ${formatCurrency(
          Number(item.line_total || 0)
        )}`
    ),
    "",
    `Subtotal: ${formatCurrency(Number(quote.subtotal || 0))}`,
    `Tax: ${formatCurrency(Number(quote.tax_total || 0))}`,
    `Total: ${formatCurrency(Number(quote.total || 0))}`
  ].join("\n");

  return { html, text };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { quoteId?: string } | null;
  const quoteId = body?.quoteId?.trim();

  if (!quoteId) {
    return NextResponse.json({ ok: false, reason: "Quote ID is required." }, { status: 400 });
  }

  if (!emailEnabled) {
    return NextResponse.json(
      { ok: false, reason: "Email is not configured. Set RESEND_API_KEY." },
      { status: 503 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, reason: "Supabase is not configured." },
      { status: 503 }
    );
  }

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, customer_name, company_name, email, job_name, subtotal, tax_total, total, order_items (description, sku, quantity, unit_price, line_total)"
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, reason: "Quote not found." }, { status: 404 });
  }

  const quote = data as unknown as QuoteRow;
  if (!quote.email) {
    return NextResponse.json(
      { ok: false, reason: "This quote has no customer email address." },
      { status: 400 }
    );
  }

  const { html, text } = buildQuoteEmail(quote);
  const result = await sendEmail({
    to: quote.email,
    subject: `Quote ${quote.order_number} from Gateworks`,
    html,
    text
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
