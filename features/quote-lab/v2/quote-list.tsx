"use client";

import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Send,
  Receipt,
  ChevronRight,
  Building2,
  CalendarDays,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

type QuoteStatus = "draft" | "sent" | "approved" | "invoiced";

interface LineItem {
  sku: string;
  product: string;
  qty: number;
  unitPrice: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customer: string;
  company: string;
  status: QuoteStatus;
  createdDate: string;
  expiryDate: string;
  lineItems: LineItem[];
}

const QUOTES: Quote[] = [
  {
    id: "q001",
    quoteNumber: "GW-2026-0041",
    customer: "Marcus Webb",
    company: "Summit Contracting LLC",
    status: "approved",
    createdDate: "2026-04-28",
    expiryDate: "2026-05-28",
    lineItems: [
      { sku: "SLG-3600-BLK", product: '36" Sliding Gate Hardware Kit', qty: 2, unitPrice: 418.5 },
      { sku: "WHL-6IN-HVY", product: "6-inch Heavy-Duty Rollers", qty: 8, unitPrice: 24.95 },
      { sku: "LCK-MAG-PRO", product: "Magnetic Latch Pro Series", qty: 2, unitPrice: 89.0 },
    ],
  },
  {
    id: "q002",
    quoteNumber: "GW-2026-0042",
    customer: "Diana Cho",
    company: "Ironclad Fencing Co.",
    status: "sent",
    createdDate: "2026-05-01",
    expiryDate: "2026-05-31",
    lineItems: [
      { sku: "HNG-STL-5IN", product: '5" Weld-On Steel Hinges', qty: 12, unitPrice: 18.75 },
      { sku: "POS-4X4-10FT", product: "4×4 Steel Post 10ft", qty: 6, unitPrice: 145.0 },
      { sku: "CAP-SQ-BLK", product: "Square Post Cap Black", qty: 6, unitPrice: 9.5 },
      { sku: "BRC-DIAG-KIT", product: "Diagonal Brace Kit", qty: 3, unitPrice: 54.0 },
    ],
  },
  {
    id: "q003",
    quoteNumber: "GW-2026-0043",
    customer: "Ryan Torres",
    company: "Torres Steel Fabrication",
    status: "draft",
    createdDate: "2026-05-05",
    expiryDate: "2026-06-04",
    lineItems: [
      { sku: "SLG-4800-GRY", product: '48" Sliding Gate Kit — Galvanized', qty: 1, unitPrice: 562.0 },
      { sku: "MTR-SLD-AC", product: "AC Slide Gate Motor", qty: 1, unitPrice: 740.0 },
    ],
  },
  {
    id: "q004",
    quoteNumber: "GW-2026-0044",
    customer: "Priya Nair",
    company: "Nair Property Group",
    status: "invoiced",
    createdDate: "2026-04-15",
    expiryDate: "2026-05-15",
    lineItems: [
      { sku: "SWG-2436-BLK", product: '24×36" Swing Gate Panel', qty: 4, unitPrice: 210.0 },
      { sku: "HNG-BB-3IN", product: "Ball-Bearing Hinge 3-in", qty: 8, unitPrice: 14.25 },
      { sku: "LCK-PDB-SS", product: "Padlock Drop Bar — Stainless", qty: 4, unitPrice: 38.0 },
    ],
  },
  {
    id: "q005",
    quoteNumber: "GW-2026-0045",
    customer: "Jake Holloway",
    company: "Holloway Ranch & Supply",
    status: "draft",
    createdDate: "2026-05-08",
    expiryDate: "2026-06-07",
    lineItems: [
      { sku: "FRM-TUBE-1.5", product: "1.5-in Square Tube Frame Stock (20ft)", qty: 10, unitPrice: 78.0 },
      { sku: "WLD-ROD-6013", product: "6013 Welding Rod 10lb", qty: 4, unitPrice: 32.5 },
      { sku: "PNT-BLKGLOSS-QT", product: "Black Gloss Gate Paint — Qt", qty: 6, unitPrice: 22.0 },
    ],
  },
  {
    id: "q006",
    quoteNumber: "GW-2026-0046",
    customer: "Sofia Reyes",
    company: "Reyes Commercial Builders",
    status: "sent",
    createdDate: "2026-05-10",
    expiryDate: "2026-06-09",
    lineItems: [
      { sku: "SLG-6000-BLK", product: '60" Industrial Slide Gate Kit', qty: 1, unitPrice: 895.0 },
      { sku: "MTR-SLD-DC-SOL", product: "DC Solar Slide Motor", qty: 1, unitPrice: 1240.0 },
      { sku: "SENS-PHOTO-PR", product: "Photoelectric Sensor Pair", qty: 2, unitPrice: 115.0 },
      { sku: "CTRL-KPD-BACK", product: "Backlit Keypad Controller", qty: 1, unitPrice: 195.0 },
    ],
  },
  {
    id: "q007",
    quoteNumber: "GW-2026-0047",
    customer: "Ethan Park",
    company: "Park Infrastructure Inc.",
    status: "approved",
    createdDate: "2026-05-12",
    expiryDate: "2026-06-11",
    lineItems: [
      { sku: "POS-RND-2IN-8FT", product: "2-in Round Post 8ft — Galv.", qty: 20, unitPrice: 58.0 },
      { sku: "RAIL-TOP-1X2", product: "Top Rail 1×2 Tube 21ft", qty: 10, unitPrice: 47.0 },
      { sku: "TIE-WIRE-20G", product: "Tie Wire 20 Gauge 5lb", qty: 6, unitPrice: 12.5 },
    ],
  },
  {
    id: "q008",
    quoteNumber: "GW-2026-0048",
    customer: "Lauren Moss",
    company: "Mossberg Developments",
    status: "sent",
    createdDate: "2026-05-14",
    expiryDate: "2026-06-13",
    lineItems: [
      { sku: "SWG-3660-DBL", product: '36×60" Double-Swing Gate', qty: 2, unitPrice: 485.0 },
      { sku: "HNG-WLD-5IN-ZP", product: "5-in Weld-On Hinge — Zinc Plated", qty: 8, unitPrice: 21.5 },
      { sku: "LCK-CANE-BLT", product: "Cane Bolt Set (pair)", qty: 2, unitPrice: 44.0 },
    ],
  },
  {
    id: "q009",
    quoteNumber: "GW-2026-0049",
    customer: "Carlos Mendez",
    company: "Mendez Structural Works",
    status: "invoiced",
    createdDate: "2026-04-20",
    expiryDate: "2026-05-20",
    lineItems: [
      { sku: "CNRT-POST-6X6", product: "6×6 Concrete Anchor Post", qty: 12, unitPrice: 185.0 },
      { sku: "GRT-NON-SHRINK", product: "Non-Shrink Grout 50lb", qty: 8, unitPrice: 28.0 },
      { sku: "ANK-J-BOLT-5-8", product: "J-Bolt Anchor 5/8-in (10-pk)", qty: 6, unitPrice: 16.5 },
    ],
  },
  {
    id: "q010",
    quoteNumber: "GW-2026-0050",
    customer: "Amber Sutton",
    company: "Sutton Landscape & Gate",
    status: "draft",
    createdDate: "2026-05-16",
    expiryDate: "2026-06-15",
    lineItems: [
      { sku: "ORN-SPEAR-3-4", product: "Ornamental Spear Finial 3/4-in", qty: 50, unitPrice: 6.75 },
      { sku: "ORN-PICKET-5FT", product: "Ornamental Picket 5ft", qty: 40, unitPrice: 14.0 },
      { sku: "ORN-RAIL-HRZ", product: "Horizontal Ornamental Rail 6ft", qty: 20, unitPrice: 31.0 },
      { sku: "PNT-HAMMERED-BLK", product: "Hammered Black Enamel — Qt", qty: 4, unitPrice: 26.5 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function subtotal(items: LineItem[]) {
  return items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_META: Record<
  QuoteStatus,
  { label: string; Icon: React.ElementType; bg: string; text: string; dot: string }
> = {
  draft: {
    label: "Draft",
    Icon: Clock,
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
  },
  sent: {
    label: "Sent",
    Icon: Send,
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  approved: {
    label: "Approved",
    Icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  invoiced: {
    label: "Invoiced",
    Icon: Receipt,
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${m.bg} ${m.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Document thumbnail card
// ---------------------------------------------------------------------------

function QuoteCard({ quote }: { quote: Quote }) {
  const total = subtotal(quote.lineItems);
  const topItems = quote.lineItems.slice(0, 3);

  return (
    <Link
      href="/quote-lab/v2/editor"
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
    >
      <div className="rounded-xl bg-white border border-zinc-200 shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden">
        {/* Letterhead strip */}
        <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] font-mono font-semibold tracking-widest text-zinc-300 uppercase">
              {quote.quoteNumber}
            </span>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        {/* Mini document body */}
        <div className="px-4 pt-3 pb-1">
          {/* Customer */}
          <div className="flex items-start gap-2 mb-3">
            <Building2 className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-zinc-900 truncate leading-tight">
                {quote.customer}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">{quote.company}</p>
            </div>
          </div>

          {/* Mini ruled lines representing line items */}
          <div className="border-t border-dashed border-zinc-200 pt-2 mb-2 space-y-1">
            {topItems.map((item) => (
              <div key={item.sku} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-zinc-500 truncate flex-1">{item.product}</span>
                <span className="text-[10px] font-medium text-zinc-700 shrink-0">
                  {fmt(item.qty * item.unitPrice)}
                </span>
              </div>
            ))}
            {quote.lineItems.length > 3 && (
              <p className="text-[10px] text-zinc-400 italic">
                +{quote.lineItems.length - 3} more items…
              </p>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-zinc-200 pt-2 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
              Subtotal
            </span>
            <span className="text-[14px] font-bold text-zinc-900">{fmt(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <CalendarDays className="h-3 w-3" />
            <span>Exp {fmtDate(quote.expiryDate)}</span>
          </div>
          <div className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-700 group-hover:gap-1.5 transition-all">
            <span>Open</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page header stats
// ---------------------------------------------------------------------------

function StatPill({
  label,
  count,
  status,
}: {
  label: string;
  count: number;
  status: QuoteStatus;
}) {
  const m = STATUS_META[status];
  return (
    <div className={`rounded-lg px-3 py-2 ${m.bg} flex items-center gap-2`}>
      <span className={`text-xl font-bold tabular-nums ${m.text}`}>{count}</span>
      <span className={`text-xs font-medium ${m.text}`}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteListV2() {
  const counts: Record<QuoteStatus, number> = {
    draft: 0,
    sent: 0,
    approved: 0,
    invoiced: 0,
  };
  QUOTES.forEach((q) => counts[q.status]++);

  return (
    <div className="min-h-screen bg-[#f0efe9]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-400 mb-1">
                Gateworks Supply Co.
              </p>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Estimates &amp; Quotes</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {QUOTES.length} quotes · fiscal year 2026
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatPill label="Draft" count={counts.draft} status="draft" />
              <StatPill label="Sent" count={counts.sent} status="sent" />
              <StatPill label="Approved" count={counts.approved} status="approved" />
              <StatPill label="Invoiced" count={counts.invoiced} status="invoiced" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Gallery grid ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {QUOTES.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
        </div>
      </main>
    </div>
  );
}
