"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileText,
  Package,
  Plus,
  Send,
  Settings2,
  Trash2,
  User
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
  product: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface CustomerInfo {
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface TermsInfo {
  delivery: "pickup" | "delivery";
  address: string;
  requestedDate: string;
  paymentTerms: string;
  notes: string;
  expiry: string;
}

// ---------------------------------------------------------------------------
// Sample seed data shown in the editor
// ---------------------------------------------------------------------------

const SEED_CUSTOMER: CustomerInfo = {
  name: "Manny Ortega",
  company: "Anderson Fabrication",
  email: "manny@andersonfab.com",
  phone: "555-0188"
};

const SEED_ITEMS: LineItem[] = [
  { id: "li-1", product: "Ornamental Iron Panel 48 in", sku: "ORN-PANEL-48-BLK", qty: 8, unitPrice: 420 },
  { id: "li-2", product: "Heavy Duty Weld-On Hinge Set", sku: "GATE-HINGE-HD-ZN", qty: 12, unitPrice: 64 },
  { id: "li-3", product: "Commercial Gate Latch Kit", sku: "GATE-LATCH-COM-BLK", qty: 4, unitPrice: 185 }
];

const SEED_TERMS: TermsInfo = {
  delivery: "delivery",
  address: "1200 Industrial Way, Los Angeles CA 90001",
  requestedDate: "2026-05-28",
  paymentTerms: "Net 30",
  expiry: "2026-06-14",
  notes: "Forklift unload available at receiving gate 3. Contractor pricing applies."
};

const CATALOG_SUGGESTIONS = [
  { product: "Chain Link Fabric 6 ft", sku: "CL-FAB-6-50-11GA", unitPrice: 178 },
  { product: "Slide Gate Operator 1 HP", sku: "GATE-OP-SLD-1HP", unitPrice: 1250 },
  { product: "2 in Square Tubing 11 GA", sku: "TUBE-SQ-2-11GA", unitPrice: 52 },
  { product: "Swing Gate Kit 12 ft", sku: "SWING-KIT-12FT", unitPrice: 890 },
  { product: "Wrought Iron Picket 1 in x 36 in", sku: "PICT-WI-1-36", unitPrice: 8.5 }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function uid() {
  return `li-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1, label: "Customer", icon: User },
  { id: 2, label: "Line items", icon: Package },
  { id: 3, label: "Terms", icon: Settings2 },
  { id: 4, label: "Review & send", icon: Send }
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ---------------------------------------------------------------------------
// Progress indicator
// ---------------------------------------------------------------------------

function ProgressBar({ current }: { current: StepId }) {
  return (
    <nav aria-label="Quote wizard steps" className="w-full">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const done = current > step.id;
          const active = current === step.id;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-bold transition-colors duration-200
                    ${done ? "bg-emerald-500 text-white" : active ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "bg-stone-100 text-stone-400"}`}
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </span>
                <span
                  className={`hidden text-xs font-semibold sm:block ${active ? "text-amber-600" : done ? "text-emerald-600" : "text-stone-400"}`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded transition-colors duration-300 ${current > step.id ? "bg-emerald-300" : "bg-stone-200"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Customer
// ---------------------------------------------------------------------------

function StepCustomer({
  data,
  onChange
}: {
  data: CustomerInfo;
  onChange: (next: CustomerInfo) => void;
}) {
  function field(key: keyof CustomerInfo) {
    return (value: string) => onChange({ ...data, [key]: value });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-bold text-stone-800">Who is this quote for?</h2>
        <p className="mt-1 text-sm text-stone-400">
          Enter the customer&apos;s details — you can update these any time before sending.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-name">
            Contact name
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <User size={15} className="shrink-0 text-stone-300" />
            <input
              id="v5-name"
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-300 outline-none"
              placeholder="Full name"
              value={data.name}
              onChange={(e) => field("name")(e.target.value)}
            />
          </div>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-company">
            Company
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <Building2 size={15} className="shrink-0 text-stone-300" />
            <input
              id="v5-company"
              className="flex-1 bg-transparent text-sm text-stone-800 placeholder-stone-300 outline-none"
              placeholder="Company or project name"
              value={data.company}
              onChange={(e) => field("company")(e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-email">
            Email address
          </label>
          <input
            id="v5-email"
            type="email"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            placeholder="email@example.com"
            value={data.email}
            onChange={(e) => field("email")(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-phone">
            Phone
          </label>
          <input
            id="v5-phone"
            type="tel"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            placeholder="555-000-0000"
            value={data.phone}
            onChange={(e) => field("phone")(e.target.value)}
          />
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-amber-500">
          <CheckCircle2 size={16} />
        </span>
        <span>
          Once the quote is sent, a PDF will be emailed to the address above.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Line items
// ---------------------------------------------------------------------------

function StepLineItems({
  items,
  onChange
}: {
  items: LineItem[];
  onChange: (next: LineItem[]) => void;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  function addItem(overrides?: Partial<LineItem>) {
    onChange([
      ...items,
      {
        id: uid(),
        product: "",
        sku: "",
        qty: 1,
        unitPrice: 0,
        ...overrides
      }
    ]);
  }

  function updateItem(id: string, key: keyof LineItem, value: string | number) {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-bold text-stone-800">What are you quoting?</h2>
        <p className="mt-1 text-sm text-stone-400">
          Add products and materials. You can type freely or pick from common items below.
        </p>
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_110px_90px_36px] gap-3 border-b border-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <span>Product / SKU</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Total</span>
            <span className="sr-only">Remove</span>
          </div>

          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_80px_110px_90px_36px] items-center gap-3 px-4 py-3"
              >
                {/* Product + SKU */}
                <div className="flex min-w-0 flex-col gap-1">
                  <input
                    aria-label="Product name"
                    className="min-w-0 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm font-medium text-stone-800 outline-none focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-100"
                    placeholder="Product name"
                    value={item.product}
                    onChange={(e) => updateItem(item.id, "product", e.target.value)}
                  />
                  <input
                    aria-label="SKU"
                    className="min-w-0 rounded-lg border border-stone-100 bg-transparent px-2.5 py-1 text-xs text-stone-400 outline-none focus:border-stone-300 focus:bg-stone-50"
                    placeholder="SKU"
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                  />
                </div>

                {/* Qty */}
                <input
                  aria-label="Quantity"
                  type="number"
                  min={1}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-right text-sm font-medium text-stone-800 outline-none focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-100"
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(item.id, "qty", Math.max(1, Number(e.target.value) || 1))
                  }
                />

                {/* Unit price */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                    $
                  </span>
                  <input
                    aria-label="Unit price"
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-5 pr-2 text-right text-sm font-medium text-stone-800 outline-none focus:border-amber-400 focus:bg-white focus:ring-1 focus:ring-amber-100"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, "unitPrice", Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </div>

                {/* Line total */}
                <span className="text-right text-sm font-semibold text-stone-700">
                  {formatCurrency(item.qty * item.unitPrice)}
                </span>

                {/* Remove */}
                <button
                  type="button"
                  aria-label={`Remove ${item.product}`}
                  className="grid size-8 place-items-center rounded-lg text-stone-300 transition hover:bg-red-50 hover:text-red-500"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-4 py-3 text-sm">
            <span className="font-semibold text-stone-500">Subtotal</span>
            <span className="text-base font-bold text-stone-800">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Add row manually */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addItem()}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-500 transition hover:border-amber-400 hover:text-amber-600"
        >
          <Plus size={15} />
          Add a line item
        </button>
        <button
          type="button"
          onClick={() => setShowSuggestions((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-dashed border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-500 transition hover:border-amber-400 hover:text-amber-600"
        >
          <Package size={15} />
          {showSuggestions ? "Hide suggestions" : "Pick from catalog"}
        </button>
      </div>

      {/* Catalog suggestions */}
      {showSuggestions && (
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <p className="border-b border-stone-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Common products — click to add
          </p>
          <ul className="divide-y divide-stone-100">
            {CATALOG_SUGGESTIONS.map((cat) => (
              <li key={cat.sku}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-amber-50"
                  onClick={() => {
                    addItem({
                      product: cat.product,
                      sku: cat.sku,
                      unitPrice: cat.unitPrice,
                      qty: 1
                    });
                    setShowSuggestions(false);
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-700">{cat.product}</p>
                    <p className="text-xs text-stone-400">{cat.sku}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-stone-700">
                      {formatCurrency(cat.unitPrice)}
                    </span>
                    <span className="grid size-7 place-items-center rounded-full bg-stone-100 text-stone-400 transition hover:bg-amber-500 hover:text-white">
                      <Plus size={14} />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-stone-200 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-stone-300">
            <Package size={24} />
          </span>
          <p className="text-sm font-semibold text-stone-400">
            No items yet — add your first one above.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Terms & delivery
// ---------------------------------------------------------------------------

function StepTerms({
  data,
  onChange
}: {
  data: TermsInfo;
  onChange: (next: TermsInfo) => void;
}) {
  function field(key: keyof TermsInfo) {
    return (value: string) => onChange({ ...data, [key]: value });
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-bold text-stone-800">Terms &amp; delivery</h2>
        <p className="mt-1 text-sm text-stone-400">
          Set delivery preferences, payment terms, and any special notes.
        </p>
      </div>

      {/* Fulfillment toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-stone-500">Fulfillment</span>
        <div className="flex gap-2">
          {(["pickup", "delivery"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => field("delivery")(opt)}
              className={`flex-1 rounded-xl border py-3 text-sm font-semibold capitalize transition
                ${data.delivery === opt
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery address (only when delivery) */}
      {data.delivery === "delivery" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-address">
            Delivery address
          </label>
          <input
            id="v5-address"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            placeholder="Street, city, state, zip"
            value={data.address}
            onChange={(e) => field("address")(e.target.value)}
          />
        </div>
      )}

      {/* Date + expiry */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-requested-date">
            Requested date
          </label>
          <input
            id="v5-requested-date"
            type="date"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            value={data.requestedDate}
            onChange={(e) => field("requestedDate")(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-500" htmlFor="v5-expiry">
            Quote expiry
          </label>
          <input
            id="v5-expiry"
            type="date"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            value={data.expiry}
            onChange={(e) => field("expiry")(e.target.value)}
          />
        </div>
      </div>

      {/* Payment terms */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-stone-500" htmlFor="v5-payment-terms">
          Payment terms
        </label>
        <select
          id="v5-payment-terms"
          className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          value={data.paymentTerms}
          onChange={(e) => field("paymentTerms")(e.target.value)}
        >
          <option>Due on receipt</option>
          <option>Net 15</option>
          <option>Net 30</option>
          <option>Net 45</option>
          <option>50% deposit</option>
        </select>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-stone-500" htmlFor="v5-notes">
          Notes for customer <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="v5-notes"
          rows={3}
          className="resize-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm placeholder-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          placeholder="Lead time, special requirements, site instructions..."
          value={data.notes}
          onChange={(e) => field("notes")(e.target.value)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Review & send
// ---------------------------------------------------------------------------

function StepReview({
  customer,
  items,
  terms,
  onSend
}: {
  customer: CustomerInfo;
  items: LineItem[];
  terms: TermsInfo;
  onSend: () => void;
}) {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const deliveryFee = terms.delivery === "delivery" && subtotal < 500 ? 85 : 0;
  const tax = subtotal * 0.0975;
  const total = subtotal + deliveryFee + tax;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-bold text-stone-800">Looks great — ready to send?</h2>
        <p className="mt-1 text-sm text-stone-400">
          Review everything before sending the quote to{" "}
          <span className="font-semibold text-stone-600">{customer.email || "the customer"}</span>.
        </p>
      </div>

      {/* Customer card */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
          <User size={15} className="text-stone-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Customer
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4">
          {[
            { label: "Name", value: customer.name },
            { label: "Company", value: customer.company },
            { label: "Email", value: customer.email },
            { label: "Phone", value: customer.phone }
          ].map((row) => (
            <div key={row.label}>
              <p className="text-xs font-semibold text-stone-400">{row.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-stone-700">{row.value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
          <Package size={15} className="text-stone-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Line items
          </span>
        </div>
        <div className="divide-y divide-stone-100">
          {items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-stone-400">No items added.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-700">{item.product}</p>
                  <p className="text-xs text-stone-400">
                    {item.sku} &middot; {item.qty} &times;{" "}
                    {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-bold text-stone-700">
                  {formatCurrency(item.qty * item.unitPrice)}
                </span>
              </div>
            ))
          )}
        </div>
        {/* Totals */}
        <div className="grid gap-1.5 border-t border-stone-100 px-4 py-4 text-sm">
          <div className="flex justify-between text-stone-500">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-stone-500">
              <span>Delivery fee</span>
              <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-stone-500">
            <span>Est. tax (9.75%)</span>
            <span className="font-semibold">{formatCurrency(tax)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-800">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Terms summary */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
          <Settings2 size={15} className="text-stone-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Terms &amp; delivery
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4">
          {[
            { label: "Fulfillment", value: terms.delivery },
            { label: "Payment", value: terms.paymentTerms },
            { label: "Requested date", value: terms.requestedDate || "—" },
            { label: "Expiry", value: terms.expiry || "—" }
          ].map((row) => (
            <div key={row.label}>
              <p className="text-xs font-semibold capitalize text-stone-400">{row.label}</p>
              <p className="mt-0.5 text-sm font-semibold capitalize text-stone-700">
                {row.value}
              </p>
            </div>
          ))}
        </div>
        {terms.notes && (
          <p className="border-t border-stone-100 px-4 py-3 text-sm text-stone-500">
            <span className="font-semibold text-stone-600">Notes:</span> {terms.notes}
          </p>
        )}
      </div>

      {/* Send CTA */}
      <button
        type="button"
        onClick={onSend}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-500 px-6 py-4 text-base font-bold text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      >
        <Send size={18} />
        Send quote to {customer.company || "customer"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sent confirmation screen
// ---------------------------------------------------------------------------

function SentScreen({
  customer,
  onReset
}: {
  customer: CustomerInfo;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <span className="grid size-20 place-items-center rounded-3xl bg-emerald-100">
        <CheckCircle2 size={42} className="text-emerald-500" />
      </span>
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Quote sent!</h2>
        <p className="mt-2 text-sm text-stone-400">
          A copy has been emailed to{" "}
          <span className="font-semibold text-stone-600">
            {customer.email || "the customer"}
          </span>
          .
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/quote-lab/v5"
          className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-600 shadow-sm transition hover:border-stone-300"
        >
          <ArrowLeft size={16} />
          Back to quotes
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          <Plus size={16} />
          Create another
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function QuoteEditorV5() {
  const [step, setStep] = useState<StepId>(1);
  const [sent, setSent] = useState(false);

  const [customer, setCustomer] = useState<CustomerInfo>(SEED_CUSTOMER);
  const [items, setItems] = useState<LineItem[]>(SEED_ITEMS);
  const [terms, setTerms] = useState<TermsInfo>(SEED_TERMS);

  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as StepId);
  }

  function goNext() {
    if (step < 4) setStep((s) => (s + 1) as StepId);
  }

  function reset() {
    setStep(1);
    setSent(false);
    setCustomer(SEED_CUSTOMER);
    setItems(SEED_ITEMS);
    setTerms(SEED_TERMS);
  }

  const stepLabels: Record<StepId, string> = {
    1: "Customer",
    2: "Line items",
    3: "Terms & delivery",
    4: "Review & send"
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top nav */}
      <header className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link
            href="/quote-lab/v5"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-stone-400 transition hover:border-stone-300 hover:text-stone-600"
            aria-label="Back to quotes"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              New quote &middot; Q-10043
            </p>
            {!sent && (
              <p className="text-sm font-bold text-stone-700">
                Step {step} of 4 &mdash; {stepLabels[step]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-stone-400">
            <FileText size={14} />
            <span className="hidden sm:inline">Draft</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {sent ? (
          <SentScreen customer={customer} onReset={reset} />
        ) : (
          <>
            {/* Progress */}
            <div className="mb-8">
              <ProgressBar current={step} />
            </div>

            {/* Breadcrumb trail */}
            {step > 1 && (
              <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-stone-400" aria-label="Breadcrumb">
                {STEPS.filter((s) => s.id < step).map((s, idx) => (
                  <span key={s.id} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight size={12} />}
                    <button
                      type="button"
                      className="font-semibold text-amber-500 hover:underline"
                      onClick={() => setStep(s.id)}
                    >
                      {s.label}
                    </button>
                  </span>
                ))}
                <ChevronRight size={12} />
                <span className="font-semibold text-stone-600">{STEPS[step - 1].label}</span>
              </nav>
            )}

            {/* Step content */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              {step === 1 && (
                <StepCustomer data={customer} onChange={setCustomer} />
              )}
              {step === 2 && (
                <StepLineItems items={items} onChange={setItems} />
              )}
              {step === 3 && (
                <StepTerms data={terms} onChange={setTerms} />
              )}
              {step === 4 && (
                <StepReview
                  customer={customer}
                  items={items}
                  terms={terms}
                  onSend={() => setSent(true)}
                />
              )}
            </div>

            {/* Back / Next nav */}
            {step < 4 && (
              <div className="mt-6 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-500 shadow-sm transition hover:border-stone-300 hover:text-stone-700"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  Continue
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
