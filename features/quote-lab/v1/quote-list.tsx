"use client";

import Link from "next/link";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  DollarSign,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Percent,
  Plus,
  Search,
  Send,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

// ─── Sample Data ────────────────────────────────────────────────────────────

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
    id: "q1",
    number: "Q-2025-0148",
    customer: "Marcus Webb",
    company: "Webb Construction LLC",
    status: "approved",
    created: "2025-05-01",
    expiry: "2025-05-31",
    lineItems: [
      { id: "l1", product: "Slide Gate Frame 16ft", sku: "SGF-16-GRY", qty: 2, unitPrice: 1240.0 },
      { id: "l2", product: "Gate Opener V-Series", sku: "GTO-V500", qty: 2, unitPrice: 895.0 },
      { id: "l3", product: "Safety Edge Kit", sku: "SEK-UNIV", qty: 2, unitPrice: 145.0 },
    ],
  },
  {
    id: "q2",
    number: "Q-2025-0147",
    customer: "Diana Okafor",
    company: "Okafor Steel & Fabrication",
    status: "sent",
    created: "2025-05-03",
    expiry: "2025-06-03",
    lineItems: [
      { id: "l4", product: "Cantilever Gate Frame 20ft", sku: "CGF-20-BLK", qty: 1, unitPrice: 2180.0 },
      { id: "l5", product: "Cantilever Gate Wheels (Set of 4)", sku: "CGW-4SET", qty: 1, unitPrice: 320.0 },
      { id: "l6", product: "Chain Link Fabric 9ga 6ft", sku: "CLF-9-6H", qty: 60, unitPrice: 4.85 },
    ],
  },
  {
    id: "q3",
    number: "Q-2025-0146",
    customer: "Brett Halverson",
    company: "Halverson Commercial",
    status: "draft",
    created: "2025-05-05",
    expiry: "2025-06-04",
    lineItems: [
      { id: "l7", product: "Ornamental Iron Panel 4ft", sku: "OIP-4-BLK", qty: 12, unitPrice: 189.0 },
      { id: "l8", product: "Ornamental Post 2x2 8ft", sku: "OPT-2X2-8", qty: 14, unitPrice: 54.0 },
    ],
  },
  {
    id: "q4",
    number: "Q-2025-0145",
    customer: "Stephanie Nguyen",
    company: "Pacific Ridge Contractors",
    status: "invoiced",
    created: "2025-04-22",
    expiry: "2025-05-22",
    lineItems: [
      { id: "l9", product: "Swing Gate Frame 12ft", sku: "SWG-12-GRY", qty: 1, unitPrice: 890.0 },
      { id: "l10", product: "Automatic Gate Opener", sku: "AGO-LUX400", qty: 1, unitPrice: 1350.0 },
      { id: "l11", product: "Keypad Entry System", sku: "KPS-4DIGIT", qty: 1, unitPrice: 245.0 },
      { id: "l12", product: "Loop Detector Kit", sku: "LDK-PRO", qty: 2, unitPrice: 178.0 },
    ],
  },
  {
    id: "q5",
    number: "Q-2025-0144",
    customer: "Carlos Mendez",
    company: "Mendez & Sons Fencing",
    status: "sent",
    created: "2025-04-28",
    expiry: "2025-05-28",
    lineItems: [
      { id: "l13", product: "Chain Link Fabric 11ga 4ft", sku: "CLF-11-4H", qty: 200, unitPrice: 3.2 },
      { id: "l14", product: "Terminal Post 2.5in 8ft", sku: "TRM-25-8", qty: 20, unitPrice: 28.5 },
      { id: "l15", product: "Line Post 1.875in 8ft", sku: "LNP-187-8", qty: 40, unitPrice: 21.0 },
    ],
  },
  {
    id: "q6",
    number: "Q-2025-0143",
    customer: "Alicia Fontaine",
    company: "Fontaine Properties Group",
    status: "approved",
    created: "2025-04-20",
    expiry: "2025-05-20",
    lineItems: [
      { id: "l16", product: "Aluminum Fence Panel 6ft", sku: "AFP-6-BRZ", qty: 30, unitPrice: 112.0 },
      { id: "l17", product: "Aluminum Post 3x3 6ft", sku: "APT-3X3-6", qty: 33, unitPrice: 38.0 },
      { id: "l18", product: "Post Cap Pyramid", sku: "PCP-3X3", qty: 33, unitPrice: 6.5 },
    ],
  },
  {
    id: "q7",
    number: "Q-2025-0142",
    customer: "James Tremblay",
    company: "Tremblay Industrial",
    status: "draft",
    created: "2025-05-07",
    expiry: "2025-06-06",
    lineItems: [
      { id: "l19", product: "Chain Link Fabric 6ga 8ft", sku: "CLF-6-8H", qty: 150, unitPrice: 7.9 },
      { id: "l20", product: "Barbed Wire 5pt 2-strand", sku: "BWR-5PT-2S", qty: 20, unitPrice: 89.0 },
    ],
  },
  {
    id: "q8",
    number: "Q-2025-0141",
    customer: "Priya Anand",
    company: "Anand Development Corp",
    status: "invoiced",
    created: "2025-04-10",
    expiry: "2025-05-10",
    lineItems: [
      { id: "l21", product: "Vinyl Privacy Panel 6ft", sku: "VPP-6-WHT", qty: 25, unitPrice: 95.0 },
      { id: "l22", product: "Vinyl Post 4x4 8ft", sku: "VPT-4X4-8", qty: 28, unitPrice: 44.0 },
      { id: "l23", product: "Vinyl Rail 2x4 8ft", sku: "VRL-2X4-8", qty: 56, unitPrice: 22.0 },
    ],
  },
  {
    id: "q9",
    number: "Q-2025-0140",
    customer: "Nathan Park",
    company: "Park Commercial Build",
    status: "sent",
    created: "2025-05-09",
    expiry: "2025-05-24",
    lineItems: [
      { id: "l24", product: "Slide Gate Frame 24ft", sku: "SGF-24-GRY", qty: 1, unitPrice: 1890.0 },
      { id: "l25", product: "High-Security Padlock Hasp", sku: "PLH-HS-STL", qty: 2, unitPrice: 68.0 },
    ],
  },
  {
    id: "q10",
    number: "Q-2025-0139",
    customer: "Bridget Cassidy",
    company: "Cassidy Landscape & Fence",
    status: "approved",
    created: "2025-04-30",
    expiry: "2025-05-30",
    lineItems: [
      { id: "l26", product: "Cedar Split Rail 2-Board", sku: "CSR-2B-8FT", qty: 80, unitPrice: 19.5 },
      { id: "l27", product: "Cedar Corner Post 8ft", sku: "CCP-8FT", qty: 10, unitPrice: 42.0 },
      { id: "l28", product: "Cedar Line Post 8ft", sku: "CLP-8FT", qty: 30, unitPrice: 31.0 },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function quoteTotal(q: Quote): number {
  return q.lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string): number {
  const today = new Date("2025-05-17");
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - today.getTime()) / 86_400_000);
}

const STATUS_META: Record<QuoteStatus, { label: string; classes: string; dot: string }> = {
  draft:    { label: "Draft",    classes: "bg-industrial-amber text-industrial-steel border border-industrial-rail", dot: "bg-industrial-steel" },
  sent:     { label: "Sent",     classes: "bg-blue-50 text-blue-700 border border-blue-200",                         dot: "bg-blue-500" },
  approved: { label: "Approved", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",                dot: "bg-emerald-500" },
  invoiced: { label: "Invoiced", classes: "bg-violet-50 text-violet-700 border border-violet-200",                   dot: "bg-violet-500" },
};

type SortKey = "number" | "company" | "status" | "created" | "expiry" | "total";

// ─── KPI Strip ───────────────────────────────────────────────────────────────

function KpiStrip() {
  const all = SAMPLE_QUOTES;
  const openStatuses: QuoteStatus[] = ["draft", "sent", "approved"];
  const openValue = all.filter((q) => openStatuses.includes(q.status)).reduce((s, q) => s + quoteTotal(q), 0);
  const approved = all.filter((q) => q.status === "approved" || q.status === "invoiced").length;
  const winRate = Math.round((approved / all.length) * 100);
  const expiringSoon = all.filter((q) => {
    const d = daysUntil(q.expiry);
    return d >= 0 && d <= 7 && q.status !== "invoiced";
  }).length;
  const avgDeal = all.reduce((s, q) => s + quoteTotal(q), 0) / all.length;

  return (
    <div className="grid grid-cols-2 gap-px sm:grid-cols-4 bg-industrial-rail border border-industrial-rail rounded-card overflow-hidden mb-4">
      {[
        { icon: DollarSign,  label: "Open Value",     value: fmt(openValue),      sub: `${all.filter((q) => openStatuses.includes(q.status)).length} open quotes`, color: "text-industrial-pine" },
        { icon: Percent,     label: "Win Rate",       value: `${winRate}%`,        sub: "approved + invoiced",                                                      color: "text-emerald-600" },
        { icon: Clock,       label: "Expiring ≤7d",   value: String(expiringSoon), sub: "needs attention",                                                           color: expiringSoon > 0 ? "text-amber-600" : "text-industrial-steel" },
        { icon: TrendingUp,  label: "Avg Deal Size",  value: fmt(avgDeal),         sub: `across ${all.length} quotes`,                                              color: "text-blue-600" },
      ].map(({ icon: Icon, label, value, sub, color }) => (
        <div key={label} className="bg-white px-4 py-3 flex items-start gap-3">
          <span className={`mt-0.5 ${color}`}><Icon className="w-4 h-4" /></span>
          <div className="min-w-0">
            <p className="text-label text-industrial-muted uppercase tracking-wider truncate">{label}</p>
            <p className={`text-heading font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-caption text-industrial-muted truncate">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function RowActions({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-6 z-20 w-40 rounded-card border border-industrial-rail bg-white shadow-toolbar py-1" onMouseLeave={onClose}>
      {[
        { icon: Eye,    label: "View",      },
        { icon: Copy,   label: "Duplicate", },
        { icon: Send,   label: "Send",      },
        { icon: Trash2, label: "Delete",    danger: true },
      ].map(({ icon: Icon, label, danger }) => (
        <button
          key={label}
          onClick={onClose}
          className={`w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-industrial-paper transition-colors ${danger ? "text-industrial-red" : "text-industrial-ink"}`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuoteListV1() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = SAMPLE_QUOTES.filter((q) => {
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      q.number.toLowerCase().includes(s) ||
      q.customer.toLowerCase().includes(s) ||
      q.company.toLowerCase().includes(s);
    return matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (sortKey === "total")      { av = quoteTotal(a); bv = quoteTotal(b); }
    else if (sortKey === "number") { av = a.number; bv = b.number; }
    else if (sortKey === "company") { av = a.company; bv = b.company; }
    else if (sortKey === "status") { av = a.status; bv = b.status; }
    else if (sortKey === "created") { av = a.created; bv = b.created; }
    else { av = a.expiry; bv = b.expiry; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-industrial-pine" />
      : <ChevronDown className="w-3 h-3 text-industrial-pine" />;
  };

  return (
    <div className="min-h-screen bg-industrial-paper">
      {/* Top bar */}
      <header className="border-b border-industrial-rail bg-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-industrial-pine" />
            <span className="font-bold text-industrial-ink tracking-tight">Quotes</span>
            <span className="ml-1 px-1.5 py-0.5 rounded bg-industrial-rail text-caption text-industrial-steel font-mono">
              {SAMPLE_QUOTES.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/quote-lab/v1/editor"
              className="flex items-center gap-1.5 rounded-chip bg-industrial-pine px-3 py-1.5 text-label font-semibold text-white hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quote
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
        <KpiStrip />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-industrial-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search quotes, customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-chip border border-industrial-rail bg-white pl-8 pr-8 py-1.5 text-body text-industrial-ink placeholder-industrial-muted focus:outline-none focus:ring-1 focus:ring-industrial-pine"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-industrial-muted hover:text-industrial-ink">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1 bg-white border border-industrial-rail rounded-chip p-0.5">
            {(["all", "draft", "sent", "approved", "invoiced"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-sm text-label font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-industrial-ink text-white"
                    : "text-industrial-steel hover:text-industrial-ink"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 rounded-chip border border-industrial-rail bg-white px-3 py-1.5 text-label text-industrial-steel hover:border-industrial-steel transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-0 border-b border-industrial-rail bg-industrial-paper px-4 py-2">
            {(
              [
                { key: "number",  label: "Quote #"   },
                { key: "company", label: "Customer"  },
                { key: "status",  label: "Status"    },
                { key: "created", label: "Created"   },
                { key: "expiry",  label: "Expires"   },
                { key: "total",   label: "Total"     },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className="flex items-center gap-1 text-label font-semibold text-industrial-steel uppercase tracking-wider hover:text-industrial-ink transition-colors text-left"
              >
                {label}
                <SortIcon col={key} />
              </button>
            ))}
            <div className="w-8" />
          </div>

          {/* Rows */}
          {sorted.length === 0 ? (
            <div className="px-4 py-12 text-center text-industrial-muted text-body">No quotes match your search.</div>
          ) : (
            <div className="divide-y divide-industrial-rail">
              {sorted.map((q) => {
                const total = quoteTotal(q);
                const sm = STATUS_META[q.status];
                const days = daysUntil(q.expiry);
                const isExpiringSoon = days >= 0 && days <= 7 && q.status !== "invoiced";

                return (
                  <div
                    key={q.id}
                    className="group relative grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_auto] gap-1 md:gap-0 items-center px-4 py-3 hover:bg-industrial-paper/60 transition-colors"
                  >
                    {/* Quote # */}
                    <div className="flex items-center gap-2">
                      <Link
                        href="/quote-lab/v1/editor"
                        className="font-mono text-label font-semibold text-industrial-pine hover:underline"
                      >
                        {q.number}
                      </Link>
                    </div>

                    {/* Customer */}
                    <div className="min-w-0">
                      <p className="text-body font-medium text-industrial-ink truncate">{q.customer}</p>
                      <p className="text-caption text-industrial-muted truncate">{q.company}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-caption font-semibold ${sm.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                        {sm.label}
                      </span>
                    </div>

                    {/* Created */}
                    <div className="text-label text-industrial-steel tabular-nums hidden md:block">
                      {new Date(q.created).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>

                    {/* Expiry */}
                    <div className={`text-label tabular-nums hidden md:block ${isExpiringSoon ? "text-amber-600 font-semibold" : "text-industrial-steel"}`}>
                      {isExpiringSoon && <span className="mr-1">⚠</span>}
                      {new Date(q.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {isExpiringSoon && <span className="ml-1 text-caption">({days}d)</span>}
                    </div>

                    {/* Total */}
                    <div className="text-label font-bold text-industrial-ink tabular-nums hidden md:block">
                      {fmt(total)}
                    </div>

                    {/* Mobile total/expiry row */}
                    <div className="flex items-center justify-between md:hidden">
                      <span className="text-label text-industrial-steel">
                        {new Date(q.created).toLocaleDateString("en-US", { month: "short", day: "numeric" })} →{" "}
                        {new Date(q.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <span className="text-label font-bold text-industrial-ink">{fmt(total)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === q.id ? null : q.id)}
                        className="p-1.5 rounded hover:bg-industrial-rail transition-colors text-industrial-muted hover:text-industrial-ink opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === q.id && <RowActions onClose={() => setOpenMenu(null)} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-caption text-industrial-muted">
          <span>
            {sorted.length} of {SAMPLE_QUOTES.length} quotes
            {statusFilter !== "all" ? ` · filtered by ${statusFilter}` : ""}
          </span>
          <span>
            Showing{" "}
            <strong className="text-industrial-steel">{fmt(sorted.reduce((s, q) => s + quoteTotal(q), 0))}</strong>{" "}
            total value
          </span>
        </div>
      </main>
    </div>
  );
}
