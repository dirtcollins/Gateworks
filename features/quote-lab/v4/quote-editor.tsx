"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Save,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Hash,
  Package,
  Tag,
  Percent,
  StickyNote,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types & sample data
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
  product: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

const INITIAL_ITEMS: LineItem[] = [
  { id: "li1", product: "Cantilever Slide Gate – 30 ft", sku: "GW-CSG-30", qty: 1, unitPrice: 5900 },
  { id: "li2", product: "RFID Card Reader", sku: "GW-RFID-01", qty: 1, unitPrice: 495 },
  { id: "li3", product: "Intercom Unit – Video", sku: "GW-ICM-V1", qty: 1, unitPrice: 820 },
  { id: "li4", product: "Ground Mount Pedestal", sku: "GW-GMP-01", qty: 2, unitPrice: 175 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function genId() {
  return `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`block h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Line items card
// ---------------------------------------------------------------------------

function LineItemsCard({
  items,
  onChange,
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}) {
  function update(id: string, field: keyof LineItem, raw: string) {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        if (field === "qty" || field === "unitPrice") {
          const n = parseFloat(raw);
          return { ...item, [field]: isNaN(n) ? 0 : n };
        }
        return { ...item, [field]: raw };
      })
    );
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function add() {
    onChange([...items, { id: genId(), product: "", sku: "", qty: 1, unitPrice: 0 }]);
  }

  return (
    <SectionCard>
      <SectionHeader
        icon={<Package size={16} />}
        title="Line Items"
        subtitle="Products and services included in this quote"
      />

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_120px_80px_110px_36px] gap-3 border-b border-slate-50 bg-slate-50/60 px-6 py-2.5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Product / SKU</p>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">SKU</p>
        <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">Qty</p>
        <p className="text-right text-xs font-medium uppercase tracking-wider text-slate-400">Unit Price</p>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_120px_80px_110px_36px] items-center gap-3 px-6 py-3"
          >
            <input
              type="text"
              value={item.product}
              onChange={(e) => update(item.id, "product", e.target.value)}
              placeholder="Product name"
              className="block h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
            />
            <input
              type="text"
              value={item.sku}
              onChange={(e) => update(item.id, "sku", e.target.value)}
              placeholder="SKU"
              className="block h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
            />
            <input
              type="number"
              min={1}
              value={item.qty}
              onChange={(e) => update(item.id, "qty", e.target.value)}
              className="block h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-center text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice}
                onChange={(e) => update(item.id, "unitPrice", e.target.value)}
                className="block h-9 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-3 text-right text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
              />
            </div>
            <button
              onClick={() => remove(item.id)}
              className="grid size-8 place-items-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Package size={28} className="text-slate-200" />
            <p className="text-sm text-slate-400">No line items yet. Add one below.</p>
          </div>
        )}
      </div>

      {/* Add row */}
      <div className="border-t border-slate-100 px-6 py-4">
        <button
          onClick={add}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
        >
          <Plus size={13} />
          Add line item
        </button>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Totals card
// ---------------------------------------------------------------------------

function TotalsCard({ items, discount }: { items: LineItem[]; discount: number }) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const discountAmt = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmt;
  const tax = afterDiscount * 0.085;
  const total = afterDiscount + tax;

  return (
    <SectionCard>
      <SectionHeader icon={<Tag size={16} />} title="Summary" subtitle="Quote pricing breakdown" />
      <div className="space-y-2 px-6 py-5">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Discount ({discount}%)</span>
            <span>− {fmt(discountAmt)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-600">
          <span>Tax (8.5%)</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteEditorV4() {
  // Customer fields
  const [contactName, setContactName] = useState("Angela Torres");
  const [company, setCompany] = useState("Torres Commercial RE");
  const [email, setEmail] = useState("angela@torrescommercialre.com");
  const [phone, setPhone] = useState("(415) 882-4471");
  const [address, setAddress] = useState("3220 Market St, San Francisco, CA 94114");

  // Quote metadata
  const [quoteNumber] = useState("QTE-2024-0046");
  const [issueDate, setIssueDate] = useState("2024-10-08");
  const [expiryDate, setExpiryDate] = useState("2024-11-08");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState(
    "Installation to be scheduled within 3 weeks of approval. Site access required during business hours."
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS);

  // Status
  const [status, setStatus] = useState<"draft" | "sent" | "approved">("approved");

  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/quote-lab/v4"
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronLeft size={16} />
            </Link>
            <div>
              <p className="font-mono text-xs text-slate-400">{quoteNumber}</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status selector */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-8 rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
            </select>

            <button
              onClick={handleSave}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition ${
                saved
                  ? "bg-emerald-50 text-emerald-700"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {saved ? "Saved" : "Save"}
            </button>

            <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700">
              <Send size={13} />
              Send Quote
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-6 py-8">
        {/* Customer card */}
        <SectionCard>
          <SectionHeader
            icon={<User size={16} />}
            title="Customer"
            subtitle="Contact details for this quote"
          />
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
            <Field label="Contact Name">
              <Input value={contactName} onChange={setContactName} placeholder="Full name" />
            </Field>
            <Field label="Company">
              <Input value={company} onChange={setCompany} placeholder="Company name" />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={setEmail} placeholder="email@company.com" type="email" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={setPhone} placeholder="(555) 000-0000" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input value={address} onChange={setAddress} placeholder="Street, City, State ZIP" />
            </Field>
          </div>
        </SectionCard>

        {/* Quote details card */}
        <SectionCard>
          <SectionHeader
            icon={<FileText size={16} />}
            title="Quote Details"
            subtitle="Reference number, dates, and discount"
          />
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-3">
            <Field label="Quote Number">
              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-500">
                {quoteNumber}
              </div>
            </Field>
            <Field label="Issue Date">
              <Input value={issueDate} onChange={setIssueDate} type="date" />
            </Field>
            <Field label="Expiry Date">
              <Input value={expiryDate} onChange={setExpiryDate} type="date" />
            </Field>
            <Field label="Discount (%)">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="block h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
                />
                <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Line items */}
        <LineItemsCard items={items} onChange={setItems} />

        {/* Notes & Totals row */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          {/* Notes */}
          <SectionCard>
            <SectionHeader icon={<StickyNote size={16} />} title="Notes" subtitle="Internal or customer-facing notes" />
            <div className="px-6 py-5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes, terms, or special conditions…"
                className="block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
              />
            </div>
          </SectionCard>

          {/* Totals */}
          <TotalsCard items={items} discount={discount} />
        </div>

        {/* Footer actions */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle size={14} className="text-slate-300" />
            <span>Quote expires on {new Date(expiryDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-medium transition ${
                saved ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {saved ? "Saved" : "Save Draft"}
            </button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700">
              <Send size={14} />
              Send to Customer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
