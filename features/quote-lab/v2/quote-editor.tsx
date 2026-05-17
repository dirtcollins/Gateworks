"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  Download,
  MoreHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Inline sample data for the editor (full single quote)
// ---------------------------------------------------------------------------

interface LineItem {
  sku: string;
  product: string;
  description: string;
  qty: number;
  unitPrice: number;
}

const QUOTE = {
  quoteNumber: "GW-2026-0046",
  issueDate: "May 10, 2026",
  expiryDate: "June 9, 2026",
  status: "sent" as const,

  from: {
    company: "Gateworks Supply Co.",
    address: "4820 Industrial Pkwy, Suite 200",
    cityState: "Phoenix, AZ  85043",
    phone: "(602) 555-0178",
    email: "quotes@gateworkssupply.com",
    website: "www.gateworkssupply.com",
  },

  to: {
    customer: "Sofia Reyes",
    title: "Project Manager",
    company: "Reyes Commercial Builders",
    address: "1140 Commerce Drive",
    cityState: "Tempe, AZ  85281",
    phone: "(480) 555-0392",
    email: "s.reyes@reyescomm.com",
  },

  lineItems: [
    {
      sku: "SLG-6000-BLK",
      product: '60" Industrial Slide Gate Kit',
      description: "Heavy-duty black powder-coated steel, includes track, hardware & manual",
      qty: 1,
      unitPrice: 895.0,
    },
    {
      sku: "MTR-SLD-DC-SOL",
      product: "DC Solar Slide Motor",
      description: "24V DC motor with solar panel, battery backup, and mounting hardware",
      qty: 1,
      unitPrice: 1240.0,
    },
    {
      sku: "SENS-PHOTO-PR",
      product: "Photoelectric Sensor Pair",
      description: "Infrared safety beam sensors for auto-reverse, 30-ft range",
      qty: 2,
      unitPrice: 115.0,
    },
    {
      sku: "CTRL-KPD-BACK",
      product: "Backlit Keypad Controller",
      description: "Weatherproof surface-mount keypad, 4-digit code, 12–24V compatible",
      qty: 1,
      unitPrice: 195.0,
    },
  ] satisfies LineItem[],

  notes:
    "Installation labor not included. Lead time is approximately 7–10 business days from order confirmation. All hardware carries a 2-year manufacturer warranty. Payment terms: 50% deposit, balance due on delivery.",

  terms: [
    "Quote valid for 30 days from issue date.",
    "Prices subject to change if order not placed within validity period.",
    "Returns accepted within 30 days in original, unopened packaging.",
    "Freight charges added at time of invoicing based on ship-to address.",
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lineTotal(item: LineItem) {
  return item.qty * item.unitPrice;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const TAX_RATE = 0.085;

function calcTotals() {
  const subtotal = QUOTE.lineItems.reduce((s, i) => s + lineTotal(i), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function Toolbar() {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-200 sticky top-0 z-20 shadow-sm">
      <Link
        href="/quote-lab/v2"
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Quotes
      </Link>

      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors shadow-sm">
          <Send className="h-3.5 w-3.5" />
          Send to Client
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors shadow-sm">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark Approved
        </button>
        <button className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-50 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The document sheet
// ---------------------------------------------------------------------------

function DocumentSheet() {
  const { subtotal, tax, total } = calcTotals();

  return (
    <div
      className="bg-white shadow-2xl rounded-sm mx-auto"
      style={{ maxWidth: 820, minHeight: 1060 }}
    >
      {/* ── Letterhead ── */}
      <div className="border-b-4 border-zinc-900 px-12 pt-10 pb-7">
        <div className="flex items-start justify-between">
          {/* Company name + tagline */}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 leading-none">
              GATEWORKS
            </h1>
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-zinc-400 mt-0.5">
              Supply Co.
            </p>
            <div className="mt-3 space-y-0.5 text-[12px] text-zinc-500 leading-relaxed">
              <p>{QUOTE.from.address}</p>
              <p>{QUOTE.from.cityState}</p>
              <p>{QUOTE.from.phone}</p>
              <p className="text-emerald-700">{QUOTE.from.email}</p>
            </div>
          </div>

          {/* Quote meta block */}
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-1">
              Estimate
            </p>
            <p className="text-2xl font-bold font-mono text-zinc-900">{QUOTE.quoteNumber}</p>

            <div className="mt-3 space-y-1 text-[12px] text-zinc-600">
              <div className="flex items-center justify-end gap-3">
                <span className="text-zinc-400 uppercase tracking-wide text-[10px] font-semibold">
                  Issued
                </span>
                <span className="font-medium">{QUOTE.issueDate}</span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="text-zinc-400 uppercase tracking-wide text-[10px] font-semibold">
                  Expires
                </span>
                <span className="font-medium">{QUOTE.expiryDate}</span>
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Sent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bill-To ── */}
      <div className="px-12 py-7 border-b border-zinc-100">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-400 mb-2">
              Prepared For
            </p>
            <p className="text-[14px] font-bold text-zinc-900">{QUOTE.to.customer}</p>
            <p className="text-[12px] text-zinc-500">{QUOTE.to.title}</p>
            <p className="text-[13px] font-semibold text-zinc-700 mt-1">{QUOTE.to.company}</p>
            <div className="mt-1.5 space-y-0.5 text-[12px] text-zinc-500">
              <p>{QUOTE.to.address}</p>
              <p>{QUOTE.to.cityState}</p>
              <p>{QUOTE.to.phone}</p>
              <p className="text-emerald-700">{QUOTE.to.email}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-400 mb-2">
              Prepared By
            </p>
            <p className="text-[14px] font-bold text-zinc-900">Gateworks Supply Co.</p>
            <div className="mt-1.5 space-y-0.5 text-[12px] text-zinc-500">
              <p>{QUOTE.from.address}</p>
              <p>{QUOTE.from.cityState}</p>
              <p>{QUOTE.from.phone}</p>
              <p className="text-emerald-700">{QUOTE.from.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items Table ── */}
      <div className="px-12 py-7">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b-2 border-zinc-900">
              <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 w-16">
                SKU
              </th>
              <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Description
              </th>
              <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 w-14">
                Qty
              </th>
              <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 w-24">
                Unit Price
              </th>
              <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 w-24">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {QUOTE.lineItems.map((item, idx) => (
              <tr
                key={item.sku}
                className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-zinc-50/60"} border-zinc-100`}
              >
                <td className="py-3 pr-3 font-mono text-[11px] text-zinc-400 align-top">
                  {item.sku}
                </td>
                <td className="py-3 pr-4 align-top">
                  <p className="font-semibold text-zinc-900">{item.product}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </td>
                <td className="py-3 text-right align-top text-zinc-700 font-medium">{item.qty}</td>
                <td className="py-3 text-right align-top text-zinc-700 tabular-nums">
                  {fmt(item.unitPrice)}
                </td>
                <td className="py-3 text-right align-top font-semibold text-zinc-900 tabular-nums">
                  {fmt(lineTotal(item))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals block ── */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1.5 text-[13px]">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Tax (8.5%)</span>
              <span className="tabular-nums">{fmt(tax)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-zinc-900 pt-2 mt-2 font-bold text-zinc-900 text-[15px]">
              <span>Total</span>
              <span className="tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="px-12 pb-7 border-t border-zinc-100 pt-6">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 mb-2">
          Notes
        </p>
        <p className="text-[12px] text-zinc-600 leading-relaxed">{QUOTE.notes}</p>
      </div>

      {/* ── Terms ── */}
      <div className="px-12 pb-7 border-t border-zinc-100 pt-6">
        <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-zinc-400 mb-2">
          Terms &amp; Conditions
        </p>
        <ol className="list-decimal list-inside space-y-1">
          {QUOTE.terms.map((t, i) => (
            <li key={i} className="text-[12px] text-zinc-500 leading-relaxed">
              {t}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Signature area ── */}
      <div className="mx-12 mb-10 mt-2 grid grid-cols-2 gap-10 border-t border-zinc-200 pt-8">
        <div>
          <div className="h-10 border-b border-zinc-300" />
          <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
            <span>Client Signature</span>
            <span>Date</span>
          </div>
          <p className="mt-4 text-[11px] text-zinc-400">
            By signing above, client accepts this estimate and authorises Gateworks Supply Co. to
            proceed.
          </p>
        </div>
        <div>
          <div className="h-10 border-b border-zinc-300" />
          <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
            <span>Authorised — Gateworks Supply Co.</span>
            <span>Date</span>
          </div>
        </div>
      </div>

      {/* ── Footer strip ── */}
      <div className="bg-zinc-900 px-12 py-3 flex items-center justify-between rounded-b-sm">
        <p className="text-[10px] text-zinc-400">{QUOTE.from.website}</p>
        <p className="text-[10px] text-zinc-500">{QUOTE.quoteNumber}</p>
        <p className="text-[10px] text-zinc-400">Page 1 of 1</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteEditorV2() {
  return (
    <div className="min-h-screen bg-[#e8e6df]">
      <Toolbar />

      {/* Paper backdrop */}
      <div className="py-10 px-4">
        <DocumentSheet />
      </div>
    </div>
  );
}
