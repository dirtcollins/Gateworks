"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GripVertical,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Send,
  FileText,
  Receipt,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

type QuoteStatus = "draft" | "sent" | "approved" | "invoiced";

interface LineItem {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customer: string;
  company: string;
  status: QuoteStatus;
  createdAt: string; // ISO date string
  expiresAt: string;
  lineItems: LineItem[];
}

function subtotal(q: Quote): number {
  return q.lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);
}

function ageDays(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(iso).getTime()) / 86_400_000
  );
}

function daysUntil(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / 86_400_000
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const QUOTES: Quote[] = [
  {
    id: "q1",
    quoteNumber: "Q-2025-041",
    customer: "Marcus Webb",
    company: "Premier Fencing Co.",
    status: "draft",
    createdAt: "2025-05-10",
    expiresAt: "2025-06-10",
    lineItems: [
      { name: "Ornamental Iron Panel 48\"", sku: "ORN-PANEL-48-BLK", qty: 24, unitPrice: 87.50 },
      { name: "Post Cap Finial – Spear", sku: "CAP-FINIAL-SP", qty: 48, unitPrice: 12.00 },
    ],
  },
  {
    id: "q2",
    quoteNumber: "Q-2025-040",
    customer: "Sandra Lim",
    company: "Lim Landscaping & Design",
    status: "draft",
    createdAt: "2025-05-12",
    expiresAt: "2025-06-12",
    lineItems: [
      { name: "Aluminum Picket 1\" x 72\"", sku: "AL-PICK-72-WHT", qty: 120, unitPrice: 9.80 },
      { name: "Gate Latch Heavy Duty", sku: "LCH-HD-BLK", qty: 6, unitPrice: 28.00 },
      { name: "Concrete Anchor Kit", sku: "ANC-KIT-4PK", qty: 10, unitPrice: 18.50 },
    ],
  },
  {
    id: "q3",
    quoteNumber: "Q-2025-038",
    customer: "Ray Thornton",
    company: "Thornton Steel Works",
    status: "sent",
    createdAt: "2025-05-05",
    expiresAt: "2025-06-05",
    lineItems: [
      { name: "Sliding Gate Hardware Kit 16ft", sku: "SLD-HW-KIT-16", qty: 3, unitPrice: 345.00 },
      { name: "V-Track Rail 10ft", sku: "V-TRACK-10", qty: 9, unitPrice: 64.00 },
    ],
  },
  {
    id: "q4",
    quoteNumber: "Q-2025-035",
    customer: "Jessica Morales",
    company: "Urban Edge Contractors",
    status: "sent",
    createdAt: "2025-04-28",
    expiresAt: "2025-05-28",
    lineItems: [
      { name: "Chain Link Fabric 4ft x 50ft", sku: "CL-FABRIC-4-50", qty: 8, unitPrice: 112.00 },
      { name: "Top Rail 1-3/8\" x 21ft", sku: "TOP-RAIL-138-21", qty: 12, unitPrice: 24.50 },
      { name: "Tension Bar 48\"", sku: "TENS-BAR-48", qty: 20, unitPrice: 8.75 },
    ],
  },
  {
    id: "q5",
    quoteNumber: "Q-2025-031",
    customer: "Damian Cross",
    company: "Cross Commercial Build",
    status: "approved",
    createdAt: "2025-04-18",
    expiresAt: "2025-05-18",
    lineItems: [
      { name: "Cantilever Gate Wheel Assembly", sku: "CANT-WHL-6IN", qty: 4, unitPrice: 89.00 },
      { name: "Latch Fork Bolt – Adjustable", sku: "LCH-FORK-ADJ", qty: 4, unitPrice: 34.00 },
      { name: "Post 4\" x 4\" x 8ft", sku: "POST-4-4-8-GRY", qty: 12, unitPrice: 42.00 },
      { name: "Hinge Heavy Commercial", sku: "HNG-HEAVY-COM", qty: 8, unitPrice: 55.00 },
    ],
  },
  {
    id: "q6",
    quoteNumber: "Q-2025-028",
    customer: "Priya Nair",
    company: "Nair Property Group",
    status: "approved",
    createdAt: "2025-04-10",
    expiresAt: "2025-05-10",
    lineItems: [
      { name: "Vinyl Privacy Panel 6ft", sku: "VNL-PRIV-6FT-WHT", qty: 36, unitPrice: 76.00 },
      { name: "Vinyl Post 5\" x 5\" x 8ft", sku: "VNL-POST-5-8-WHT", qty: 18, unitPrice: 54.00 },
    ],
  },
  {
    id: "q7",
    quoteNumber: "Q-2025-024",
    customer: "Kevin Osei",
    company: "Osei General Contracting",
    status: "invoiced",
    createdAt: "2025-03-29",
    expiresAt: "2025-04-29",
    lineItems: [
      { name: "Automatic Gate Opener Dual", sku: "AUTO-OPEN-DUAL-SWG", qty: 1, unitPrice: 1_290.00 },
      { name: "Safety Loop Detector Kit", sku: "LOOP-DET-KIT", qty: 2, unitPrice: 185.00 },
      { name: "Remote Transmitter 4-Btn", sku: "REMOTE-4BTN", qty: 5, unitPrice: 29.00 },
    ],
  },
  {
    id: "q8",
    quoteNumber: "Q-2025-020",
    customer: "Tina Schultz",
    company: "Schultz Residential Dev.",
    status: "invoiced",
    createdAt: "2025-03-20",
    expiresAt: "2025-04-20",
    lineItems: [
      { name: "Wood-Look Composite Board 6ft", sku: "COMP-BRD-6FT-CEP", qty: 60, unitPrice: 38.00 },
      { name: "Composite Post 4\" x 4\" x 8ft", sku: "COMP-POST-4-8", qty: 20, unitPrice: 47.00 },
      { name: "Post Cap Flat", sku: "CAP-FLAT-4IN", qty: 20, unitPrice: 6.50 },
    ],
  },
  {
    id: "q9",
    quoteNumber: "Q-2025-017",
    customer: "Leo Vargas",
    company: "Vargas Industrial Fence",
    status: "invoiced",
    createdAt: "2025-03-14",
    expiresAt: "2025-04-14",
    lineItems: [
      { name: "Welded Wire Panel 4ft x 16ft", sku: "WW-PANEL-4-16-GAL", qty: 15, unitPrice: 94.00 },
      { name: "T-Post Driver Clip", sku: "TPOST-CLIP-STL", qty: 60, unitPrice: 1.85 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Config per status column
// ---------------------------------------------------------------------------

interface ColumnConfig {
  label: string;
  status: QuoteStatus;
  icon: React.ReactNode;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  badgeTone: BadgeTone;
  pillBg: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    label: "Draft",
    status: "draft",
    icon: <FileText className="size-4" />,
    accentBg: "bg-industrial-paper",
    accentBorder: "border-industrial-rail",
    accentText: "text-industrial-steel",
    badgeTone: "neutral",
    pillBg: "bg-industrial-paper",
  },
  {
    label: "Sent",
    status: "sent",
    icon: <Send className="size-4" />,
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    accentText: "text-blue-700",
    badgeTone: "info",
    pillBg: "bg-blue-50",
  },
  {
    label: "Approved",
    status: "approved",
    icon: <CheckCircle2 className="size-4" />,
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-700",
    badgeTone: "success",
    pillBg: "bg-emerald-50",
  },
  {
    label: "Invoiced",
    status: "invoiced",
    icon: <Receipt className="size-4" />,
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-800",
    badgeTone: "warning",
    pillBg: "bg-amber-50",
  },
];

// ---------------------------------------------------------------------------
// QuoteCard
// ---------------------------------------------------------------------------

function QuoteCard({ quote, col }: { quote: Quote; col: ColumnConfig }) {
  const total = subtotal(quote);
  const age = ageDays(quote.createdAt);
  const expiry = daysUntil(quote.expiresAt);
  const isExpiringSoon = expiry >= 0 && expiry <= 5;
  const isExpired = expiry < 0;

  return (
    <Link
      href="/quote-lab/v3/editor"
      className="group block cursor-grab active:cursor-grabbing focus-visible:outline-none"
      aria-label={`Open quote ${quote.quoteNumber}`}
    >
      <div
        className={cn(
          "relative rounded-card border bg-white shadow-sm transition-all duration-150",
          "hover:-translate-y-0.5 hover:shadow-toolbar",
          "group-focus-visible:ring-2 group-focus-visible:ring-industrial-pine group-focus-visible:ring-offset-1",
          col.accentBorder
        )}
      >
        {/* Drag handle strip */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-card",
            col.status === "draft" && "bg-industrial-rail",
            col.status === "sent" && "bg-blue-400",
            col.status === "approved" && "bg-emerald-500",
            col.status === "invoiced" && "bg-amber-500"
          )}
        />

        <div className="pl-4 pr-3 pt-3 pb-2.5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-caption font-black uppercase tracking-[0.08em] text-industrial-muted">
                {quote.quoteNumber}
              </p>
              <p className="mt-0.5 truncate text-body font-semibold text-industrial-ink leading-tight">
                {quote.customer}
              </p>
              <p className="truncate text-caption text-industrial-steel">{quote.company}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <GripVertical className="size-4 text-industrial-rail opacity-0 transition-opacity group-hover:opacity-100" />
              <ChevronRight className="size-3.5 text-industrial-muted opacity-0 transition-opacity group-hover:opacity-100 mt-1" />
            </div>
          </div>

          {/* Total */}
          <p className="mt-2.5 text-heading font-black text-industrial-ink">{fmt(total)}</p>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-caption text-industrial-steel">
              <Clock className="size-3" />
              {age === 0 ? "Today" : `${age}d ago`}
            </span>
            <span className="flex items-center gap-1 text-caption text-industrial-steel">
              <Package className="size-3" />
              {quote.lineItems.length} item{quote.lineItems.length !== 1 ? "s" : ""}
            </span>
            {(isExpiringSoon || isExpired) && (
              <span
                className={cn(
                  "flex items-center gap-1 text-caption font-semibold",
                  isExpired ? "text-red-600" : "text-amber-700"
                )}
              >
                <AlertCircle className="size-3" />
                {isExpired ? `Expired ${Math.abs(expiry)}d ago` : `Exp. in ${expiry}d`}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={cn("flex items-center justify-between border-t px-4 py-1.5", col.accentBorder)}>
          <span className="text-caption text-industrial-muted">
            Exp {new Date(quote.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <button
            className="rounded p-0.5 text-industrial-muted opacity-0 transition-opacity hover:text-industrial-ink group-hover:opacity-100 focus-visible:opacity-100"
            onClick={(e) => e.preventDefault()}
            aria-label="More options"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function KanbanColumn({ col, quotes }: { col: ColumnConfig; quotes: Quote[] }) {
  const colTotal = quotes.reduce((s, q) => s + subtotal(q), 0);

  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-0">
      {/* Column header */}
      <div
        className={cn(
          "mb-3 rounded-card border px-3 py-2.5",
          col.accentBg,
          col.accentBorder
        )}
      >
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", col.accentText)}>
            {col.icon}
            <span className="text-label font-black uppercase tracking-[0.08em]">{col.label}</span>
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-black",
                col.pillBg,
                col.accentBorder,
                "border",
                col.accentText
              )}
            >
              {quotes.length}
            </span>
          </div>
        </div>
        {quotes.length > 0 && (
          <p className={cn("mt-1 text-label font-semibold", col.accentText)}>
            {fmt(colTotal)}
          </p>
        )}
        {quotes.length === 0 && (
          <p className="mt-1 text-caption text-industrial-muted italic">No quotes</p>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5">
        {quotes.map((q) => (
          <QuoteCard key={q.id} quote={q} col={col} />
        ))}

        {/* Drop zone hint */}
        <div
          className={cn(
            "rounded-card border-2 border-dashed py-5 text-center text-caption text-industrial-muted",
            "opacity-0 transition-opacity hover:opacity-100",
            col.accentBorder
          )}
        >
          Drop here
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteListV3() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? QUOTES.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
          q.customer.toLowerCase().includes(search.toLowerCase()) ||
          q.company.toLowerCase().includes(search.toLowerCase())
      )
    : QUOTES;

  const totalPipeline = QUOTES.reduce((s, q) => s + subtotal(q), 0);
  const approvedTotal = QUOTES.filter((q) => q.status === "approved").reduce(
    (s, q) => s + subtotal(q),
    0
  );

  return (
    <div className="min-h-screen bg-industrial-paper">
      {/* Page header */}
      <div className="border-b border-industrial-rail bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-display font-black text-industrial-ink">Quote Pipeline</h1>
              <p className="mt-0.5 text-body text-industrial-steel">
                {QUOTES.length} active quotes · {fmt(totalPipeline)} total pipeline value
              </p>
            </div>

            {/* KPI chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-card border border-emerald-200 bg-emerald-50 px-3 py-2">
                <TrendingUp className="size-4 text-emerald-600" />
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-emerald-700">
                    Ready to Invoice
                  </p>
                  <p className="text-label font-semibold text-emerald-900">{fmt(approvedTotal)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-card border border-industrial-rail bg-white px-3 py-2">
                <DollarSign className="size-4 text-industrial-steel" />
                <div>
                  <p className="text-caption font-black uppercase tracking-[0.08em] text-industrial-muted">
                    Total Pipeline
                  </p>
                  <p className="text-label font-semibold text-industrial-ink">{fmt(totalPipeline)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-industrial-muted">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search quotes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-industrial-rail bg-white pl-8 pr-3 text-body text-industrial-ink placeholder:text-industrial-muted focus:outline-none focus:ring-2 focus:ring-industrial-pine focus:ring-offset-1"
              />
            </div>
            <Badge tone="neutral">
              {filtered.length} of {QUOTES.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="mx-auto max-w-screen-2xl overflow-x-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-4" style={{ minWidth: "1040px" }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              col={col}
              quotes={filtered.filter((q) => q.status === col.status)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
