"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Send,
  Receipt,
  X,
  Calendar,
  User,
  Building2,
  Hash,
  DollarSign,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sample data
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
  items: LineItem[];
  notes?: string;
}

const SAMPLE_QUOTES: Quote[] = [
  {
    id: "q1",
    number: "QTE-2024-0041",
    customer: "Marcus Webb",
    company: "Webb Steel Fabrication",
    status: "approved",
    created: "2024-10-14",
    expiry: "2024-11-14",
    items: [
      { id: "i1", product: "Bi-Fold Driveway Gate – 16 ft", sku: "GW-BF-16", qty: 1, unitPrice: 2850 },
      { id: "i2", product: "Automatic Gate Opener – Dual Swing", sku: "GW-OP-DS", qty: 1, unitPrice: 1240 },
      { id: "i3", product: "Keypad Entry System", sku: "GW-KPD-01", qty: 2, unitPrice: 320 },
    ],
    notes: "Customer approved via email on 10/16. Deposit collected.",
  },
  {
    id: "q2",
    number: "QTE-2024-0042",
    customer: "Sandra Liu",
    company: "Pacific Coast Properties",
    status: "sent",
    created: "2024-10-17",
    expiry: "2024-11-17",
    items: [
      { id: "i4", product: "Ornamental Swing Gate – 6 ft", sku: "GW-OS-6", qty: 2, unitPrice: 1100 },
      { id: "i5", product: "Gate Post – 4×4 Steel", sku: "GW-PST-44", qty: 4, unitPrice: 95 },
      { id: "i6", product: "Weld-on Hinge Set", sku: "GW-HNG-W2", qty: 2, unitPrice: 68 },
    ],
  },
  {
    id: "q3",
    number: "QTE-2024-0043",
    customer: "Derek Okafor",
    company: "Okafor Custom Homes",
    status: "draft",
    created: "2024-10-19",
    expiry: "2024-11-19",
    items: [
      { id: "i7", product: "Sliding Gate – 20 ft Industrial", sku: "GW-SLD-20I", qty: 1, unitPrice: 4200 },
      { id: "i8", product: "V-Track Rail Kit", sku: "GW-VTK-20", qty: 1, unitPrice: 540 },
    ],
  },
  {
    id: "q4",
    number: "QTE-2024-0044",
    customer: "Priya Mehta",
    company: "Mehta Group Development",
    status: "invoiced",
    created: "2024-09-28",
    expiry: "2024-10-28",
    items: [
      { id: "i9", product: "Chain Link Fence Panel – 6×10", sku: "GW-CLF-610", qty: 24, unitPrice: 88 },
      { id: "i10", product: "Corner Post – 2.5 in Galvanized", sku: "GW-CLP-25G", qty: 6, unitPrice: 45 },
      { id: "i11", product: "Tension Band Set", sku: "GW-TBS-01", qty: 24, unitPrice: 12 },
    ],
  },
  {
    id: "q5",
    number: "QTE-2024-0045",
    customer: "Tom Harrington",
    company: "Harrington Ranch Supply",
    status: "sent",
    created: "2024-10-20",
    expiry: "2024-11-20",
    items: [
      { id: "i12", product: "Ranch Pipe Gate – 16 ft", sku: "GW-RPG-16", qty: 3, unitPrice: 760 },
      { id: "i13", product: "Cattle Guard – 8×8", sku: "GW-CG-88", qty: 1, unitPrice: 1850 },
    ],
  },
  {
    id: "q6",
    number: "QTE-2024-0046",
    customer: "Angela Torres",
    company: "Torres Commercial RE",
    status: "approved",
    created: "2024-10-08",
    expiry: "2024-11-08",
    items: [
      { id: "i14", product: "Cantilever Slide Gate – 30 ft", sku: "GW-CSG-30", qty: 1, unitPrice: 5900 },
      { id: "i15", product: "RFID Card Reader", sku: "GW-RFID-01", qty: 1, unitPrice: 495 },
      { id: "i16", product: "Intercom Unit – Video", sku: "GW-ICM-V1", qty: 1, unitPrice: 820 },
      { id: "i17", product: "Ground Mount Pedestal", sku: "GW-GMP-01", qty: 2, unitPrice: 175 },
    ],
  },
  {
    id: "q7",
    number: "QTE-2024-0047",
    customer: "Jason Buell",
    company: "Buell Landscaping & Fencing",
    status: "draft",
    created: "2024-10-21",
    expiry: "2024-11-21",
    items: [
      { id: "i18", product: "Aluminum Privacy Fence – 4 ft", sku: "GW-APF-4", qty: 40, unitPrice: 58 },
      { id: "i19", product: "Post Cap – Aluminum Pyramid", sku: "GW-PCA-01", qty: 42, unitPrice: 8 },
    ],
  },
  {
    id: "q8",
    number: "QTE-2024-0048",
    customer: "Keisha Washington",
    company: "Washington Industrial Parks",
    status: "invoiced",
    created: "2024-09-15",
    expiry: "2024-10-15",
    items: [
      { id: "i20", product: "Security Crash Barrier – K4", sku: "GW-SCB-K4", qty: 2, unitPrice: 8400 },
      { id: "i21", product: "Traffic Control Cabinet", sku: "GW-TCC-01", qty: 1, unitPrice: 2100 },
      { id: "i22", product: "Loop Detector Kit", sku: "GW-LDK-01", qty: 2, unitPrice: 340 },
    ],
  },
  {
    id: "q9",
    number: "QTE-2024-0049",
    customer: "Nate Gallagher",
    company: "Gallagher Build Co.",
    status: "draft",
    created: "2024-10-22",
    expiry: "2024-11-22",
    items: [
      { id: "i23", product: "Wood Grain Steel Gate – 8 ft", sku: "GW-WGS-8", qty: 1, unitPrice: 1680 },
    ],
  },
  {
    id: "q10",
    number: "QTE-2024-0050",
    customer: "Celeste Ramos",
    company: "Ramos Civil Engineering",
    status: "sent",
    created: "2024-10-18",
    expiry: "2024-11-18",
    items: [
      { id: "i24", product: "Hydraulic Barrier – Medium Duty", sku: "GW-HBM-01", qty: 3, unitPrice: 3200 },
      { id: "i25", product: "Installation Anchor Kit", sku: "GW-IAK-03", qty: 3, unitPrice: 220 },
      { id: "i26", product: "Remote Control Fob – 4-button", sku: "GW-RCF-4", qty: 6, unitPrice: 42 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function quoteTotal(quote: Quote) {
  return quote.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: Send,
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  invoiced: {
    label: "Invoiced",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    icon: Receipt,
  },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Slide-in detail panel
// ---------------------------------------------------------------------------

function DetailPanel({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  const total = quoteTotal(quote);
  const subtotal = total;
  const tax = Math.round(subtotal * 0.085);
  const grandTotal = subtotal + tax;
  const cfg = STATUS_CONFIG[quote.status];
  const Icon = cfg.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[480px] flex-col bg-white shadow-2xl">
        {/* Panel header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">{quote.number}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{quote.company}</h2>
            <p className="text-sm text-slate-500">{quote.customer}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          <div className="bg-white px-6 py-4">
            <p className="text-xs font-medium text-slate-400">Status</p>
            <div className="mt-1.5">
              <StatusBadge status={quote.status} />
            </div>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-xs font-medium text-slate-400">Total</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{fmt(grandTotal)}</p>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-xs font-medium text-slate-400">Created</p>
            <p className="mt-1 text-sm text-slate-700">{fmtDate(quote.created)}</p>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-xs font-medium text-slate-400">Expires</p>
            <p className="mt-1 text-sm text-slate-700">{fmtDate(quote.expiry)}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-400">
            Line Items
          </p>
          <div className="divide-y divide-slate-100">
            {quote.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-snug">{item.product}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-400">{item.sku}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-slate-800">{fmt(item.qty * item.unitPrice)}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.qty} × {fmt(item.unitPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>Tax (8.5%)</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>{fmt(grandTotal)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mt-4 rounded-xl border border-slate-100 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Notes</p>
              <p className="mt-1.5 text-sm text-slate-600">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex gap-2">
            <Link
              href="/quote-lab/v4/editor"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Open Editor
              <ChevronRight size={14} />
            </Link>
            <button className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <Icon size={14} />
              {quote.status === "draft"
                ? "Send"
                : quote.status === "sent"
                ? "Mark Approved"
                : quote.status === "approved"
                ? "Invoice"
                : "View Invoice"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ quotes }: { quotes: Quote[] }) {
  const counts = {
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    invoiced: quotes.filter((q) => q.status === "invoiced").length,
  };
  const totalValue = quotes
    .filter((q) => q.status === "approved" || q.status === "sent")
    .reduce((s, q) => s + quoteTotal(q), 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {(["draft", "sent", "approved", "invoiced"] as const).map((s) => {
        const cfg = STATUS_CONFIG[s];
        const Icon = cfg.icon;
        return (
          <div
            key={s}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
          >
            <span className={`grid size-8 place-items-center rounded-lg ${cfg.bg}`}>
              <Icon size={15} className={cfg.text} />
            </span>
            <div>
              <p className="text-xl font-semibold text-slate-900">{counts[s]}</p>
              <p className="text-xs text-slate-400">{cfg.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { label: string; value: QuoteStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Approved", value: "approved" },
  { label: "Invoiced", value: "invoiced" },
];

export function QuoteListV4() {
  const [selected, setSelected] = useState<Quote | null>(null);
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_QUOTES.filter((q) => {
    const matchStatus = filter === "all" || q.status === filter;
    const q2 = search.toLowerCase();
    const matchSearch =
      !q2 ||
      q.number.toLowerCase().includes(q2) ||
      q.customer.toLowerCase().includes(q2) ||
      q.company.toLowerCase().includes(q2);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Gateworks</p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900">Quotes</h1>
          </div>
          <Link
            href="/quote-lab/v4/editor"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus size={14} />
            New Quote
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* Stats */}
        <StatsBar quotes={SAMPLE_QUOTES} />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === f.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none sm:w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_120px_110px_100px_40px] items-center gap-3 border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Quote / Company</p>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Customer</p>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Created</p>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Status</p>
            <p className="text-right text-xs font-medium uppercase tracking-widest text-slate-400">Total</p>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <FileText size={32} className="text-slate-200" />
                <p className="text-sm text-slate-400">No quotes match your filter.</p>
              </div>
            )}
            {filtered.map((quote) => {
              const total = quoteTotal(quote);
              const tax = Math.round(total * 0.085);
              const isSelected = selected?.id === quote.id;
              return (
                <button
                  key={quote.id}
                  onClick={() => setSelected(isSelected ? null : quote)}
                  className={`grid w-full grid-cols-[1fr_1fr_120px_110px_100px_40px] items-center gap-3 px-5 py-3.5 text-left transition ${
                    isSelected ? "bg-slate-50" : "hover:bg-slate-50/60"
                  }`}
                >
                  {/* Quote / company */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{quote.company}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{quote.number}</p>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {quote.customer
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <p className="truncate text-sm text-slate-600">{quote.customer}</p>
                  </div>

                  {/* Date */}
                  <p className="text-sm text-slate-500">{fmtDate(quote.created)}</p>

                  {/* Status */}
                  <StatusBadge status={quote.status} />

                  {/* Total */}
                  <p className="text-right text-sm font-medium text-slate-800">{fmt(total + tax)}</p>

                  {/* Arrow */}
                  <ChevronRight
                    size={14}
                    className={`ml-auto text-slate-300 transition ${isSelected ? "text-slate-600" : ""}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              {filtered.length} quote{filtered.length !== 1 ? "s" : ""}
              {filter !== "all" ? ` · ${STATUS_CONFIG[filter].label}` : ""}
            </p>
          </div>
        </div>
      </main>

      {/* Detail panel */}
      {selected && <DetailPanel quote={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
