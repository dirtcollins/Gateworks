"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  MailOpen,
  Package,
  Receipt,
  Send,
  Trash2,
  User,
  Building2,
  Phone,
  Mail,
  CalendarDays,
  AlertCircle,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sample data – one full quote
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  unit: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  time: string;
  actor: string;
  action: string;
  note?: string;
  type: "created" | "edited" | "sent" | "viewed" | "approved" | "invoiced" | "note";
}

const SAMPLE_QUOTE = {
  id: "q5",
  quoteNumber: "Q-2025-031",
  customer: "Damian Cross",
  company: "Cross Commercial Build",
  email: "d.cross@crosscommercialbuild.com",
  phone: "(555) 204-8817",
  status: "approved" as const,
  createdAt: "April 18, 2025",
  expiresAt: "May 18, 2025",
  notes:
    "Customer confirmed site ready for installation week of May 19. Verify load-bearing specs on the 4\" posts before shipping.",
  lineItems: [
    { id: "li1", name: "Cantilever Gate Wheel Assembly", sku: "CANT-WHL-6IN", qty: 4, unitPrice: 89.0, unit: "EA" },
    { id: "li2", name: "Latch Fork Bolt – Adjustable", sku: "LCH-FORK-ADJ", qty: 4, unitPrice: 34.0, unit: "EA" },
    { id: "li3", name: "Post 4\" × 4\" × 8ft", sku: "POST-4-4-8-GRY", qty: 12, unitPrice: 42.0, unit: "EA" },
    { id: "li4", name: "Hinge Heavy Commercial", sku: "HNG-HEAVY-COM", qty: 8, unitPrice: 55.0, unit: "EA" },
  ] as LineItem[],
  timeline: [
    {
      id: "t1",
      date: "Apr 18",
      time: "9:14 AM",
      actor: "You",
      action: "Created quote",
      type: "created",
    },
    {
      id: "t2",
      date: "Apr 18",
      time: "11:02 AM",
      actor: "You",
      action: "Added 4 line items",
      type: "edited",
    },
    {
      id: "t3",
      date: "Apr 19",
      time: "8:47 AM",
      actor: "You",
      action: "Sent to customer",
      note: "Emailed to d.cross@crosscommercialbuild.com",
      type: "sent",
    },
    {
      id: "t4",
      date: "Apr 21",
      time: "3:12 PM",
      actor: "Damian Cross",
      action: "Viewed quote",
      type: "viewed",
    },
    {
      id: "t5",
      date: "Apr 24",
      time: "10:30 AM",
      actor: "Damian Cross",
      action: "Approved quote",
      note: "\"Looks good — please proceed.\"",
      type: "approved",
    },
    {
      id: "t6",
      date: "Apr 25",
      time: "2:05 PM",
      actor: "You",
      action: "Added internal note",
      note: "Confirmed installation date with site manager.",
      type: "note",
    },
  ] as TimelineEvent[],
};

const TAX_RATE = 0.085;

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type QuoteStatus = "draft" | "sent" | "approved" | "invoiced";

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; icon: React.ReactNode; badgeTone: BadgeTone; accentText: string; accentBg: string; accentBorder: string }
> = {
  draft: {
    label: "Draft",
    icon: <FileText className="size-3.5" />,
    badgeTone: "neutral",
    accentText: "text-industrial-steel",
    accentBg: "bg-industrial-paper",
    accentBorder: "border-industrial-rail",
  },
  sent: {
    label: "Sent",
    icon: <Send className="size-3.5" />,
    badgeTone: "info",
    accentText: "text-blue-700",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="size-3.5" />,
    badgeTone: "success",
    accentText: "text-emerald-700",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
  },
  invoiced: {
    label: "Invoiced",
    icon: <Receipt className="size-3.5" />,
    badgeTone: "warning",
    accentText: "text-amber-800",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
  },
};

const PIPELINE_STEPS: QuoteStatus[] = ["draft", "sent", "approved", "invoiced"];

// ---------------------------------------------------------------------------
// Timeline icon
// ---------------------------------------------------------------------------

function TimelineIcon({ type }: { type: TimelineEvent["type"] }) {
  const base = "flex size-7 shrink-0 items-center justify-center rounded-full border";
  switch (type) {
    case "created":
      return <span className={cn(base, "border-industrial-rail bg-industrial-paper text-industrial-steel")}><FileText className="size-3.5" /></span>;
    case "edited":
      return <span className={cn(base, "border-industrial-rail bg-industrial-paper text-industrial-steel")}><Edit3 className="size-3.5" /></span>;
    case "sent":
      return <span className={cn(base, "border-blue-200 bg-blue-50 text-blue-600")}><Send className="size-3.5" /></span>;
    case "viewed":
      return <span className={cn(base, "border-indigo-200 bg-indigo-50 text-indigo-600")}><MailOpen className="size-3.5" /></span>;
    case "approved":
      return <span className={cn(base, "border-emerald-200 bg-emerald-50 text-emerald-600")}><CheckCircle2 className="size-3.5" /></span>;
    case "invoiced":
      return <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-700")}><Receipt className="size-3.5" /></span>;
    case "note":
      return <span className={cn(base, "border-industrial-rail bg-white text-industrial-muted")}><Edit3 className="size-3.5" /></span>;
    default:
      return <span className={cn(base, "border-industrial-rail bg-white")} />;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteEditorV3() {
  const quote = SAMPLE_QUOTE;
  const cfg = STATUS_CONFIG[quote.status];

  const [noteText, setNoteText] = useState("");
  const [showNoteBox, setShowNoteBox] = useState(false);

  const subtotal = quote.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-industrial-paper">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-industrial-rail bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/quote-lab/v3"
            className="flex items-center gap-1.5 text-label font-semibold text-industrial-steel hover:text-industrial-ink transition-colors"
          >
            <ArrowLeft className="size-4" />
            Pipeline
          </Link>
          <span className="text-industrial-rail">/</span>
          <span className="text-label font-black text-industrial-ink">{quote.quoteNumber}</span>

          <div className="ml-auto flex items-center gap-2">
            <Badge tone={cfg.badgeTone}>
              <span className="flex items-center gap-1">
                {cfg.icon}
                {cfg.label}
              </span>
            </Badge>
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-industrial-rail bg-white px-2.5 text-caption font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink">
              Actions
              <ChevronDown className="size-3" />
            </button>
          </div>
        </div>

        {/* Pipeline progress bar */}
        <div className="border-t border-industrial-rail bg-industrial-paper">
          <div className="mx-auto flex max-w-4xl items-stretch px-4 sm:px-6">
            {PIPELINE_STEPS.map((step, idx) => {
              const stepCfg = STATUS_CONFIG[step];
              const isActive = step === quote.status;
              const isPast =
                PIPELINE_STEPS.indexOf(step) < PIPELINE_STEPS.indexOf(quote.status);
              return (
                <div
                  key={step}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-caption font-black uppercase tracking-[0.08em] transition-colors",
                    isActive
                      ? cn(stepCfg.accentText, "border-current")
                      : isPast
                      ? "border-transparent text-industrial-steel"
                      : "border-transparent text-industrial-rail"
                  )}
                >
                  {stepCfg.icon}
                  <span className="hidden sm:inline">{stepCfg.label}</span>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <span className={cn("ml-1 hidden text-[10px] sm:inline", isPast ? "text-industrial-muted" : "text-industrial-rail")}>›</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">

        {/* Approved callout */}
        <div className={cn("flex items-start gap-3 rounded-card border px-4 py-3", cfg.accentBg, cfg.accentBorder)}>
          <span className={cn("mt-0.5", cfg.accentText)}>{cfg.icon}</span>
          <div>
            <p className={cn("text-label font-black uppercase tracking-[0.08em]", cfg.accentText)}>
              {cfg.label}
            </p>
            <p className="text-caption text-industrial-steel">
              {quote.status === "approved"
                ? "Customer approved this quote on Apr 24. Ready to convert to an invoice."
                : quote.status === "sent"
                ? "Quote sent to customer. Awaiting review."
                : quote.status === "invoiced"
                ? "Invoice issued. Awaiting payment."
                : "This quote is still in draft. Send it to the customer when ready."}
            </p>
          </div>
          {quote.status === "approved" && (
            <button className="ml-auto shrink-0 flex h-8 items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-600 px-3 text-caption font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-700">
              <Receipt className="size-3.5" />
              Invoice
            </button>
          )}
        </div>

        {/* Customer + meta */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-industrial-rail bg-white p-4">
            <p className="mb-3 text-label font-black uppercase tracking-[0.08em] text-industrial-muted">
              Customer
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-body text-industrial-ink">
                <User className="size-4 shrink-0 text-industrial-muted" />
                <span className="font-semibold">{quote.customer}</span>
              </div>
              <div className="flex items-center gap-2 text-body text-industrial-steel">
                <Building2 className="size-4 shrink-0 text-industrial-muted" />
                {quote.company}
              </div>
              <div className="flex items-center gap-2 text-body text-industrial-steel">
                <Mail className="size-4 shrink-0 text-industrial-muted" />
                {quote.email}
              </div>
              <div className="flex items-center gap-2 text-body text-industrial-steel">
                <Phone className="size-4 shrink-0 text-industrial-muted" />
                {quote.phone}
              </div>
            </div>
          </div>

          <div className="rounded-card border border-industrial-rail bg-white p-4">
            <p className="mb-3 text-label font-black uppercase tracking-[0.08em] text-industrial-muted">
              Quote Details
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-body">
                <span className="flex items-center gap-2 text-industrial-steel">
                  <CalendarDays className="size-4 text-industrial-muted" />
                  Created
                </span>
                <span className="font-semibold text-industrial-ink">{quote.createdAt}</span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="flex items-center gap-2 text-industrial-steel">
                  <AlertCircle className="size-4 text-industrial-muted" />
                  Expires
                </span>
                <span className="font-semibold text-amber-700">{quote.expiresAt}</span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="flex items-center gap-2 text-industrial-steel">
                  <Package className="size-4 text-industrial-muted" />
                  Line items
                </span>
                <span className="font-semibold text-industrial-ink">{quote.lineItems.length}</span>
              </div>
              <div className="flex items-center justify-between text-body">
                <span className="flex items-center gap-2 text-industrial-steel">
                  <Clock className="size-4 text-industrial-muted" />
                  Quote #
                </span>
                <span className="font-black text-industrial-ink">{quote.quoteNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-industrial-rail px-4 py-3">
            <p className="text-label font-black uppercase tracking-[0.08em] text-industrial-ink">Line Items</p>
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-industrial-rail px-2.5 text-caption font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper">
              <Plus className="size-3.5" />
              Add
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-industrial-rail bg-industrial-paper text-caption font-black uppercase tracking-[0.08em] text-industrial-muted">
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-rail">
                {quote.lineItems.map((li) => (
                  <tr key={li.id} className="group hover:bg-industrial-paper/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-industrial-ink">{li.name}</td>
                    <td className="px-4 py-3 text-caption font-mono text-industrial-steel">{li.sku}</td>
                    <td className="px-4 py-3 text-right text-industrial-ink">
                      {li.qty} <span className="text-caption text-industrial-muted">{li.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-industrial-steel">{fmt(li.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-industrial-ink">
                      {fmt(li.qty * li.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-industrial-muted hover:text-red-600">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-industrial-rail px-4 py-4">
            <div className="ml-auto max-w-xs space-y-1.5">
              <div className="flex justify-between text-body text-industrial-steel">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-body text-industrial-steel">
                <span>Tax (8.5%)</span>
                <span>{fmt(tax)}</span>
              </div>
              <div className="flex justify-between border-t border-industrial-rail pt-2 text-heading font-black text-industrial-ink">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-card border border-industrial-rail bg-white p-4">
          <p className="mb-2 text-label font-black uppercase tracking-[0.08em] text-industrial-muted">Notes</p>
          <p className="text-body text-industrial-steel italic">{quote.notes}</p>
        </div>

        {/* Activity timeline */}
        <div className="rounded-card border border-industrial-rail bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-label font-black uppercase tracking-[0.08em] text-industrial-ink">Activity</p>
            <button
              onClick={() => setShowNoteBox((v) => !v)}
              className="flex h-8 items-center gap-1.5 rounded-md border border-industrial-rail px-2.5 text-caption font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
            >
              <Plus className="size-3.5" />
              Note
            </button>
          </div>

          {/* Note input */}
          {showNoteBox && (
            <div className="mb-5 rounded-card border border-industrial-rail bg-industrial-paper p-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add an internal note…"
                rows={3}
                className="w-full resize-none rounded-md border border-industrial-rail bg-white px-3 py-2 text-body text-industrial-ink placeholder:text-industrial-muted focus:outline-none focus:ring-2 focus:ring-industrial-pine focus:ring-offset-1"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => { setShowNoteBox(false); setNoteText(""); }}
                  className="h-8 rounded-md border border-industrial-rail px-3 text-caption font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                >
                  Cancel
                </button>
                <button
                  className="h-8 rounded-md border border-industrial-ink bg-industrial-ink px-3 text-caption font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine"
                  onClick={() => { setShowNoteBox(false); setNoteText(""); }}
                >
                  Save Note
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <ol className="relative space-y-0">
            {quote.timeline.map((event, idx) => (
              <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                {/* Connector line */}
                {idx < quote.timeline.length - 1 && (
                  <span className="absolute left-3.5 top-7 h-[calc(100%-1.75rem)] w-px bg-industrial-rail" />
                )}
                <TimelineIcon type={event.type} />
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                    <span className="text-label font-semibold text-industrial-ink">{event.actor}</span>
                    <span className="text-label text-industrial-steel">{event.action}</span>
                    <span className="ml-auto text-caption text-industrial-muted whitespace-nowrap">
                      {event.date} · {event.time}
                    </span>
                  </div>
                  {event.note && (
                    <p className="mt-1 rounded-chip border border-industrial-rail bg-industrial-paper px-2 py-1 text-caption text-industrial-steel">
                      {event.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Bottom action bar */}
        <div className="rounded-card border border-industrial-rail bg-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-caption text-industrial-muted">
              Last modified Apr 25, 2025 · Shared with customer
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="flex h-9 items-center gap-1.5 rounded-md border border-industrial-rail px-3 text-caption font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink">
                <Edit3 className="size-3.5" />
                Edit
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 text-caption font-black uppercase tracking-[0.08em] text-blue-700 transition hover:bg-blue-100">
                <Send className="size-3.5" />
                Resend
              </button>
              <button className="flex h-9 items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-600 px-3 text-caption font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-700">
                <Receipt className="size-3.5" />
                Create Invoice
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
