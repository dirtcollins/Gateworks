"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Send,
  Sparkles,
  TrendingUp
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sample data — fully self-contained, no external store
// ---------------------------------------------------------------------------

type QuoteStatus = "draft" | "sent" | "approved" | "invoiced";

interface LineItem {
  id: string;
  product: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  number: string;
  customer: string;
  company: string;
  status: QuoteStatus;
  created: string;
  expiry: string;
  lineItems: LineItem[];
}

const SAMPLE_QUOTES: Quote[] = [
  {
    id: "q-10042",
    number: "Q-10042",
    customer: "Manny Ortega",
    company: "Anderson Fabrication",
    status: "draft",
    created: "2026-05-14",
    expiry: "2026-06-14",
    lineItems: [
      { id: "li-1", product: "Ornamental Iron Panel 48 in", sku: "ORN-PANEL-48-BLK", qty: 8, unitPrice: 420 },
      { id: "li-2", product: "Heavy Duty Weld-On Hinge Set", sku: "GATE-HINGE-HD-ZN", qty: 12, unitPrice: 64 },
      { id: "li-3", product: "Commercial Gate Latch Kit", sku: "GATE-LATCH-COM-BLK", qty: 4, unitPrice: 185 }
    ]
  },
  {
    id: "q-10041",
    number: "Q-10041",
    customer: "Dana Price",
    company: "Valley Gate Co.",
    status: "draft",
    created: "2026-05-13",
    expiry: "2026-06-13",
    lineItems: [
      { id: "li-4", product: "2 in Square Tubing 11 GA", sku: "TUBE-SQ-2-11GA", qty: 24, unitPrice: 52 },
      { id: "li-5", product: "2 in Flat Bar", sku: "BAR-FLAT-2-14", qty: 16, unitPrice: 31 }
    ]
  },
  {
    id: "q-10040",
    number: "Q-10040",
    customer: "Rosa Kim",
    company: "Sunrise Security",
    status: "sent",
    created: "2026-05-10",
    expiry: "2026-06-10",
    lineItems: [
      { id: "li-6", product: "Slide Gate Operator 1 HP", sku: "GATE-OP-SLD-1HP", qty: 2, unitPrice: 1250 },
      { id: "li-7", product: "Loop Detector Kit", sku: "LOOP-DET-KIT", qty: 4, unitPrice: 195 }
    ]
  },
  {
    id: "q-10039",
    number: "Q-10039",
    customer: "Carlos Weston",
    company: "Premier Fence Solutions",
    status: "sent",
    created: "2026-05-08",
    expiry: "2026-06-08",
    lineItems: [
      { id: "li-8", product: "Chain Link Fabric 6 ft x 50 ft", sku: "CL-FAB-6-50-11GA", qty: 6, unitPrice: 178 },
      { id: "li-9", product: "Tension Bar Set", sku: "TENS-BAR-SET", qty: 12, unitPrice: 22 },
      { id: "li-10", product: "Top Rail 1-5/8 in x 21 ft", sku: "RAIL-TOP-158-21", qty: 18, unitPrice: 31 }
    ]
  },
  {
    id: "q-10038",
    number: "Q-10038",
    customer: "Jill Hartman",
    company: "Hartman Construction",
    status: "approved",
    created: "2026-05-05",
    expiry: "2026-06-05",
    lineItems: [
      { id: "li-11", product: "Cantilever Gate Roller Set", sku: "CANT-ROLL-SET-HD", qty: 2, unitPrice: 340 },
      { id: "li-12", product: "Weld-On Frame Bracket", sku: "BRKT-WELD-FRAME", qty: 8, unitPrice: 47 }
    ]
  },
  {
    id: "q-10037",
    number: "Q-10037",
    customer: "Tom Navarro",
    company: "Navarro Iron Works",
    status: "approved",
    created: "2026-05-02",
    expiry: "2026-06-02",
    lineItems: [
      { id: "li-13", product: "Wrought Iron Picket 1 in x 36 in", sku: "PICT-WI-1-36", qty: 120, unitPrice: 8.5 },
      { id: "li-14", product: "Flat Bar 1 x 3/16 in x 20 ft", sku: "BAR-FLAT-1-316-20", qty: 30, unitPrice: 19 }
    ]
  },
  {
    id: "q-10036",
    number: "Q-10036",
    customer: "Angela Brooks",
    company: "Brooks Property Mgmt",
    status: "invoiced",
    created: "2026-04-28",
    expiry: "2026-05-28",
    lineItems: [
      { id: "li-15", product: "Swing Gate Kit 12 ft", sku: "SWING-KIT-12FT", qty: 1, unitPrice: 890 },
      { id: "li-16", product: "Drop Rod Assembly", sku: "DROP-ROD-ASSY", qty: 1, unitPrice: 72 }
    ]
  },
  {
    id: "q-10035",
    number: "Q-10035",
    customer: "Marcus Elliot",
    company: "City Steel Fabricators",
    status: "invoiced",
    created: "2026-04-22",
    expiry: "2026-05-22",
    lineItems: [
      { id: "li-17", product: "Rectangle Tube 2x3 in 11 GA x 24 ft", sku: "TUBE-RECT-2X3-11GA", qty: 20, unitPrice: 74 },
      { id: "li-18", product: "Weld Plate 3 in x 3 in x 1/4 in", sku: "PLATE-3X3-14", qty: 40, unitPrice: 7.5 },
      { id: "li-19", product: "Angle Iron 2x2 in x 1/4 in x 20 ft", sku: "ANG-2X2-14-20", qty: 15, unitPrice: 38 }
    ]
  },
  {
    id: "q-10034",
    number: "Q-10034",
    customer: "Priya Singh",
    company: "Singh Hardware Supply",
    status: "sent",
    created: "2026-05-09",
    expiry: "2026-06-09",
    lineItems: [
      { id: "li-20", product: "Gate Post Cap 2 in Square", sku: "CAP-POST-2SQ", qty: 50, unitPrice: 4.25 },
      { id: "li-21", product: "Stainless Lag Bolt M10 x 60mm", sku: "BOLT-LAG-SS-M10", qty: 200, unitPrice: 0.85 }
    ]
  },
  {
    id: "q-10033",
    number: "Q-10033",
    customer: "Derek Choi",
    company: "Pacific Coast Fencing",
    status: "draft",
    created: "2026-05-15",
    expiry: "2026-06-15",
    lineItems: [
      { id: "li-22", product: "Vinyl Privacy Slat 6 ft", sku: "SLAT-VNL-6FT-WHT", qty: 300, unitPrice: 1.95 }
    ]
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function quoteTotal(q: Quote) {
  return q.lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${dateStr}T12:00:00`));
}

function daysUntil(dateStr: string) {
  const ms = new Date(`${dateStr}T12:00:00`).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; icon: React.ReactNode; pill: string }
> = {
  draft: {
    label: "Draft",
    icon: <Clock size={13} />,
    pill: "bg-amber-100 text-amber-800"
  },
  sent: {
    label: "Sent",
    icon: <Send size={13} />,
    pill: "bg-blue-100 text-blue-800"
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 size={13} />,
    pill: "bg-emerald-100 text-emerald-800"
  },
  invoiced: {
    label: "Invoiced",
    icon: <FileText size={13} />,
    pill: "bg-slate-100 text-slate-700"
  }
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: QuoteStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.pill}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function QuoteCard({ quote }: { quote: Quote }) {
  const total = quoteTotal(quote);
  const expires = daysUntil(quote.expiry);

  return (
    <Link
      href="/quote-lab/v5/editor"
      className="group flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {/* Icon badge */}
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-500 transition group-hover:bg-amber-100 group-hover:text-amber-700">
          <FileText size={18} />
        </span>
        {/* Details */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-stone-800">{quote.number}</span>
            <StatusPill status={quote.status} />
          </div>
          <p className="mt-0.5 truncate text-sm font-semibold text-stone-700">
            {quote.company}
          </p>
          <p className="mt-0.5 truncate text-xs text-stone-400">
            {quote.customer} &middot; {quote.lineItems.length}{" "}
            {quote.lineItems.length === 1 ? "item" : "items"} &middot; Created{" "}
            {formatDate(quote.created)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 sm:justify-end">
        <div className="text-right">
          <p className="text-base font-bold text-stone-800">{formatCurrency(total)}</p>
          <p
            className={`text-xs ${expires < 7 && quote.status !== "invoiced" ? "font-semibold text-amber-600" : "text-stone-400"}`}
          >
            {quote.status === "invoiced"
              ? "Closed"
              : expires < 0
                ? "Expired"
                : `Expires in ${expires}d`}
          </p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-400 transition group-hover:bg-amber-500 group-hover:text-white">
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  quotes: Quote[];
  accentClass: string;
};

function QuoteSection({ icon, title, subtitle, quotes, accentClass }: SectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (quotes.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 flex w-full items-center gap-3 text-left"
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${accentClass} transition-opacity`}
        >
          {icon}
        </span>
        <div className="flex-1">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <p className="text-xs text-stone-400">{subtitle}</p>
        </div>
        <span className="text-xs font-semibold text-stone-400">
          {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
        </span>
        <span
          className={`ml-1 text-stone-300 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        >
          <ArrowRight size={16} />
        </span>
      </button>
      {expanded && (
        <div className="grid gap-2">
          {quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteListV5() {
  const drafts = SAMPLE_QUOTES.filter((q) => q.status === "draft");
  const sent = SAMPLE_QUOTES.filter((q) => q.status === "sent");
  const approved = SAMPLE_QUOTES.filter((q) => q.status === "approved");
  const done = SAMPLE_QUOTES.filter((q) => q.status === "invoiced");

  const needsAttention = [...drafts, ...approved];
  const inProgress = sent;
  const sentAndDone = done;

  const pipelineValue = SAMPLE_QUOTES.filter(
    (q) => q.status !== "invoiced"
  ).reduce((sum, q) => sum + quoteTotal(q), 0);

  const invoicedValue = done.reduce((sum, q) => sum + quoteTotal(q), 0);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header bar */}
      <header className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Gateworks
            </p>
            <h1 className="text-xl font-bold text-stone-800">Your Quotes</h1>
          </div>
          <Link
            href="/quote-lab/v5/editor"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <Plus size={16} />
            New Quote
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Big CTA card */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20">
                <Sparkles size={24} />
              </span>
              <div>
                <h2 className="text-xl font-bold">Start a new quote</h2>
                <p className="mt-1 max-w-sm text-sm text-amber-100">
                  It only takes a few minutes — we&apos;ll walk you through it step by step.
                </p>
              </div>
            </div>
            <Link
              href="/quote-lab/v5/editor"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-amber-700 shadow transition hover:bg-amber-50"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open quotes", value: String(drafts.length + sent.length + approved.length), icon: <FileText size={16} /> },
            { label: "Awaiting response", value: String(sent.length), icon: <Send size={16} /> },
            { label: "Pipeline value", value: formatCurrency(pipelineValue), icon: <TrendingUp size={16} /> },
            { label: "Invoiced (30 d)", value: formatCurrency(invoicedValue), icon: <CheckCircle2 size={16} /> }
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <span className="text-stone-400">{stat.icon}</span>
              <p className="text-lg font-bold text-stone-800">{stat.value}</p>
              <p className="text-xs text-stone-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quote sections */}
        <div className="grid gap-8">
          <QuoteSection
            icon={<AlertCircle size={18} className="text-amber-600" />}
            title="Needs attention"
            subtitle="Drafts waiting to be sent, and approved quotes ready to invoice."
            quotes={needsAttention}
            accentClass="bg-amber-100 text-amber-600"
          />
          <QuoteSection
            icon={<Send size={18} className="text-blue-600" />}
            title="In progress"
            subtitle="Quotes you&apos;ve sent — waiting on customer approval."
            quotes={inProgress}
            accentClass="bg-blue-100 text-blue-600"
          />
          <QuoteSection
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            title="Sent &amp; done"
            subtitle="Invoiced quotes — closed and on the books."
            quotes={sentAndDone}
            accentClass="bg-emerald-100 text-emerald-600"
          />
        </div>

        {SAMPLE_QUOTES.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <span className="grid size-16 place-items-center rounded-2xl bg-stone-100 text-stone-300">
              <FileText size={32} />
            </span>
            <p className="text-base font-semibold text-stone-500">
              No quotes yet — start by creating your first one above.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
