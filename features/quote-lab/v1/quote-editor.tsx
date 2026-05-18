"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Mail,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { useState } from "react";

// ─── Sample Data ─────────────────────────────────────────────────────────────

type QuoteStatus = "draft" | "sent" | "approved" | "invoiced";

interface LineItem {
  id: string;
  product: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface QuoteData {
  number: string;
  status: QuoteStatus;
  created: string;
  expiry: string;
  customer: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  taxRate: number;
  lineItems: LineItem[];
}

const INITIAL_QUOTE: QuoteData = {
  number: "Q-2025-0148",
  status: "approved",
  created: "2025-05-01",
  expiry: "2025-05-31",
  customer: "Marcus Webb",
  company: "Webb Construction LLC",
  email: "m.webb@webbconst.com",
  phone: "(503) 882-4412",
  address: "1482 Industrial Dr, Portland, OR 97201",
  notes: "Customer requested powder-coat black finish on frames. Delivery on-site by May 28.",
  taxRate: 0.085,
  lineItems: [
    { id: "li1", product: "Slide Gate Frame 16ft",   sku: "SGF-16-GRY",  qty: 2, unitPrice: 1240.00 },
    { id: "li2", product: "Gate Opener V-Series",    sku: "GTO-V500",    qty: 2, unitPrice:  895.00 },
    { id: "li3", product: "Safety Edge Kit",          sku: "SEK-UNIV",    qty: 2, unitPrice:  145.00 },
    { id: "li4", product: "Loop Detector Kit",        sku: "LDK-PRO",     qty: 1, unitPrice:  178.00 },
    { id: "li5", product: "Keypad Entry System",      sku: "KPS-4DIGIT",  qty: 1, unitPrice:  245.00 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

const STATUS_META: Record<QuoteStatus, { label: string; classes: string; dot: string }> = {
  draft:    { label: "Draft",    classes: "bg-industrial-amber text-industrial-steel border border-industrial-rail", dot: "bg-industrial-steel" },
  sent:     { label: "Sent",     classes: "bg-blue-50 text-blue-700 border border-blue-200",                         dot: "bg-blue-500" },
  approved: { label: "Approved", classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",                dot: "bg-emerald-500" },
  invoiced: { label: "Invoiced", classes: "bg-violet-50 text-violet-700 border border-violet-200",                   dot: "bg-violet-500" },
};

let nextId = 100;

// ─── Editable Cell ─────────────────────────────────────────────────────────

function EditableNumber({
  value,
  onChange,
  prefix,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));

  if (!editing) {
    return (
      <button
        onClick={() => { setRaw(String(value)); setEditing(true); }}
        className={`group flex items-center gap-1 hover:text-industrial-pine transition-colors ${className ?? ""}`}
      >
        {prefix && <span className="text-industrial-muted">{prefix}</span>}
        {value}
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {prefix && <span className="text-industrial-muted text-label">{prefix}</span>}
      <input
        autoFocus
        type="number"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => {
          const n = parseFloat(raw);
          if (!isNaN(n) && n >= 0) onChange(n);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            const n = parseFloat(raw);
            if (e.key === "Enter" && !isNaN(n) && n >= 0) onChange(n);
            setEditing(false);
          }
        }}
        className="w-20 rounded border border-industrial-pine px-1.5 py-0.5 text-label text-industrial-ink focus:outline-none bg-white"
      />
    </div>
  );
}

// ─── Status Badge + Dropdown ─────────────────────────────────────────────────

function StatusBadge({
  status,
  onChange,
}: {
  status: QuoteStatus;
  onChange: (s: QuoteStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const sm = STATUS_META[status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-label font-semibold ${sm.classes} hover:opacity-80 transition-opacity`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
        {sm.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-20 w-36 rounded-card border border-industrial-rail bg-white shadow-toolbar py-1">
          {(["draft", "sent", "approved", "invoiced"] as QuoteStatus[]).map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-label hover:bg-industrial-paper transition-colors ${status === s ? "font-semibold" : ""}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuoteEditorV1() {
  const [quote, setQuote] = useState<QuoteData>(INITIAL_QUOTE);
  const [editingNotes, setEditingNotes] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateItem = (id: string, field: keyof LineItem, value: number) => {
    setQuote((q) => ({
      ...q,
      lineItems: q.lineItems.map((li) =>
        li.id === id ? { ...li, [field]: value } : li
      ),
    }));
  };

  const removeItem = (id: string) => {
    setQuote((q) => ({ ...q, lineItems: q.lineItems.filter((li) => li.id !== id) }));
  };

  const addItem = () => {
    const id = `li${++nextId}`;
    setQuote((q) => ({
      ...q,
      lineItems: [
        ...q.lineItems,
        { id, product: "New Line Item", sku: "SKU-000", qty: 1, unitPrice: 0 },
      ],
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const subtotal = quote.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const tax = subtotal * quote.taxRate;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-industrial-paper">
      {/* Top bar */}
      <header className="border-b border-industrial-rail bg-white sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/quote-lab/v1"
            className="flex items-center gap-1.5 text-industrial-muted hover:text-industrial-ink transition-colors text-label"
          >
            <ArrowLeft className="w-4 h-4" />
            Quotes
          </Link>
          <span className="text-industrial-rail">／</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-industrial-pine shrink-0" />
            <span className="font-mono text-label font-semibold text-industrial-ink truncate">{quote.number}</span>
            <StatusBadge status={quote.status} onChange={(s) => setQuote((q) => ({ ...q, status: s }))} />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="flex items-center gap-1.5 rounded-chip border border-industrial-rail bg-white px-3 py-1.5 text-label text-industrial-steel hover:border-industrial-steel transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-chip border border-industrial-rail bg-white px-3 py-1.5 text-label text-industrial-steel hover:border-industrial-steel transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-label font-semibold transition-colors ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-industrial-pine text-white hover:bg-opacity-90"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {saved ? "Saved!" : "Save"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ── Left column: line items ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Meta strip */}
            <div className="rounded-card border border-industrial-rail bg-white px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-label">
              {[
                { label: "Created",    value: new Date(quote.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Expires",    value: new Date(quote.expiry).toLocaleDateString("en-US",  { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Line Items", value: String(quote.lineItems.length) },
                { label: "Tax Rate",   value: `${(quote.taxRate * 100).toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-caption text-industrial-muted uppercase tracking-wider mb-0.5">{label}</p>
                  <p className="font-semibold text-industrial-ink">{value}</p>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-industrial-rail bg-industrial-paper flex items-center justify-between">
                <h2 className="text-label font-semibold text-industrial-steel uppercase tracking-wider">Line Items</h2>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-industrial-pine text-label font-semibold hover:text-opacity-80 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-0 px-4 py-2 border-b border-industrial-rail bg-industrial-paper/50">
                {["Product / SKU", "Qty", "Unit Price", "Subtotal", ""].map((h) => (
                  <div key={h} className="text-caption font-semibold text-industrial-muted uppercase tracking-wider">
                    {h}
                  </div>
                ))}
              </div>

              {/* Item rows */}
              <div className="divide-y divide-industrial-rail">
                {quote.lineItems.map((li) => (
                  <div key={li.id} className="group grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-0 items-center px-4 py-3 hover:bg-industrial-paper/40 transition-colors">
                    {/* Product */}
                    <div className="min-w-0 pr-3">
                      <p className="text-body font-medium text-industrial-ink truncate">{li.product}</p>
                      <p className="text-caption text-industrial-muted font-mono">{li.sku}</p>
                    </div>

                    {/* Qty */}
                    <div className="text-body tabular-nums">
                      <EditableNumber
                        value={li.qty}
                        onChange={(v) => updateItem(li.id, "qty", Math.max(1, Math.round(v)))}
                        className="text-body"
                      />
                    </div>

                    {/* Unit price */}
                    <div className="text-body tabular-nums">
                      <EditableNumber
                        value={li.unitPrice}
                        onChange={(v) => updateItem(li.id, "unitPrice", v)}
                        prefix="$"
                        className="text-body"
                      />
                    </div>

                    {/* Subtotal */}
                    <div className="text-body font-semibold tabular-nums text-industrial-ink">
                      {fmt(li.qty * li.unitPrice)}
                    </div>

                    {/* Remove */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => removeItem(li.id)}
                        className="p-1.5 rounded text-industrial-muted hover:text-industrial-red hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {quote.lineItems.length === 0 && (
                  <div className="px-4 py-10 text-center text-industrial-muted text-body">
                    No line items.{" "}
                    <button onClick={addItem} className="text-industrial-pine font-semibold hover:underline">
                      Add one →
                    </button>
                  </div>
                )}
              </div>

              {/* Totals footer */}
              <div className="border-t border-industrial-rail bg-industrial-paper px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between text-body text-industrial-steel">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-body text-industrial-steel">
                  <span>Tax ({(quote.taxRate * 100).toFixed(1)}%)</span>
                  <span className="tabular-nums">{fmt(tax)}</span>
                </div>
                <div className="flex items-center justify-between text-heading font-bold text-industrial-ink border-t border-industrial-rail pt-2 mt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-industrial-rail bg-industrial-paper flex items-center justify-between">
                <h2 className="text-label font-semibold text-industrial-steel uppercase tracking-wider">Notes</h2>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="text-industrial-muted hover:text-industrial-ink transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="px-4 py-3">
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={quote.notes}
                      onChange={(e) => setQuote((q) => ({ ...q, notes: e.target.value }))}
                      rows={3}
                      className="w-full rounded border border-industrial-rail px-3 py-2 text-body text-industrial-ink focus:outline-none focus:ring-1 focus:ring-industrial-pine resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="rounded-chip border border-industrial-rail px-3 py-1 text-label text-industrial-steel hover:border-industrial-steel transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-body text-industrial-steel whitespace-pre-wrap">
                    {quote.notes || <span className="text-industrial-muted italic">No notes.</span>}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Right rail: customer + summary ──────────────────────────── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3 lg:sticky lg:top-[3.75rem]">
            {/* Customer card */}
            <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-industrial-rail bg-industrial-paper">
                <h2 className="text-label font-semibold text-industrial-steel uppercase tracking-wider">Customer</h2>
              </div>
              <div className="px-4 py-4 space-y-2.5">
                <div>
                  <p className="text-body font-semibold text-industrial-ink">{quote.customer}</p>
                  <p className="text-label text-industrial-steel">{quote.company}</p>
                </div>
                <div className="space-y-1.5 text-label">
                  <div className="flex items-start gap-2 text-industrial-steel">
                    <span className="text-caption font-semibold uppercase tracking-wider text-industrial-muted w-10 shrink-0 pt-0.5">Email</span>
                    <a href={`mailto:${quote.email}`} className="text-industrial-pine hover:underline break-all">{quote.email}</a>
                  </div>
                  <div className="flex items-start gap-2 text-industrial-steel">
                    <span className="text-caption font-semibold uppercase tracking-wider text-industrial-muted w-10 shrink-0 pt-0.5">Phone</span>
                    <span>{quote.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-industrial-steel">
                    <span className="text-caption font-semibold uppercase tracking-wider text-industrial-muted w-10 shrink-0 pt-0.5">Addr</span>
                    <span className="leading-snug">{quote.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-industrial-rail bg-industrial-paper">
                <h2 className="text-label font-semibold text-industrial-steel uppercase tracking-wider">Summary</h2>
              </div>
              <div className="px-4 py-4 space-y-2">
                {[
                  { label: "Subtotal",                   value: fmt(subtotal) },
                  { label: `Tax (${(quote.taxRate * 100).toFixed(1)}%)`, value: fmt(tax) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-label text-industrial-steel">
                    <span>{label}</span>
                    <span className="tabular-nums font-medium">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-industrial-rail text-body font-bold text-industrial-ink">
                  <span>Total</span>
                  <span className="tabular-nums text-industrial-pine">{fmt(total)}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 rounded-chip bg-industrial-pine text-white font-semibold text-label py-2.5 hover:bg-opacity-90 transition-colors">
                <Mail className="w-4 h-4" />
                Send to Customer
              </button>
              <button className="w-full flex items-center justify-center gap-2 rounded-chip border border-industrial-rail bg-white text-industrial-steel font-semibold text-label py-2.5 hover:border-industrial-steel transition-colors">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button className="w-full flex items-center justify-center gap-2 rounded-chip border border-red-200 bg-white text-industrial-red font-semibold text-label py-2.5 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete Quote
              </button>
            </div>

            {/* Activity log stub */}
            <div className="rounded-card border border-industrial-rail bg-white overflow-hidden">
              <div className="px-4 py-2.5 border-b border-industrial-rail bg-industrial-paper">
                <h2 className="text-label font-semibold text-industrial-steel uppercase tracking-wider">Activity</h2>
              </div>
              <div className="px-4 py-3 space-y-3">
                {[
                  { date: "May 15",  msg: "Status changed to Approved" },
                  { date: "May 10",  msg: "Quote sent to customer" },
                  { date: "May 1",   msg: "Quote created" },
                ].map(({ date, msg }) => (
                  <div key={date + msg} className="flex gap-2.5">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-industrial-rail shrink-0" />
                    <div>
                      <p className="text-label text-industrial-ink leading-snug">{msg}</p>
                      <p className="text-caption text-industrial-muted">{date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
