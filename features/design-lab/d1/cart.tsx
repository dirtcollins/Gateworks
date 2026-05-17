"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  Tag,
  Trash2,
  Truck
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";

type Line = {
  id: string;
  name: string;
  sku: string;
  variant: string;
  price: number;
  qty: number;
  tone: string;
};

const INITIAL: Line[] = [
  {
    id: "l1",
    name: "Heavy-Duty Cantilever Roller Kit",
    sku: "GW-CR-2400",
    variant: "24 ft span",
    price: 289.0,
    qty: 1,
    tone: "#16150f"
  },
  {
    id: "l2",
    name: "Cantilever Track — 21 ft",
    sku: "GW-CT-2100",
    variant: "Galvanized",
    price: 178.0,
    qty: 2,
    tone: "#6c685c"
  },
  {
    id: "l3",
    name: "Slide Gate Latch — Lockable",
    sku: "GW-SL-440",
    variant: "Black powder-coat",
    price: 52.0,
    qty: 1,
    tone: "#2f6f4e"
  }
];

const TRADE_RATE = 0.08;
const TAX_RATE = 0.0725;

export function D1Cart() {
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);

  function updateQty(id: string, delta: number) {
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? { ...line, qty: Math.max(1, line.qty + delta) }
          : line
      )
    );
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    [lines]
  );
  const tradeDiscount = subtotal * TRADE_RATE;
  const promoDiscount = applied ? subtotal * 0.05 : 0;
  const taxable = subtotal - tradeDiscount - promoDiscount;
  const tax = taxable * TAX_RATE;
  const shipping = subtotal > 750 ? 0 : 49;
  const total = taxable + tax + shipping;
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <D1Page>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      <header className="border-y-2 border-d1-ink py-8">
        <Eyebrow>Will-call order</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
            Your Cart
          </h1>
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-d1-steel">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </header>

      {lines.length === 0 ? (
        <div className="my-12 border border-dashed border-d1-line bg-d1-card px-6 py-20 text-center">
          <p className="text-lg font-extrabold text-d1-ink">
            Your cart is empty.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            href="/design-lab/d1/category"
          >
            Browse the catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 py-8 lg:grid-cols-12">
          {/* Lines */}
          <div className="lg:col-span-8">
            <div className="hidden grid-cols-12 gap-4 border-b-2 border-d1-ink pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel sm:grid">
              <span className="col-span-6">Item</span>
              <span className="col-span-3 text-center">Quantity</span>
              <span className="col-span-3 text-right">Line total</span>
            </div>
            <div className="divide-y divide-d1-line border-b border-d1-line">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 items-center gap-4 py-5"
                >
                  <div className="col-span-12 flex items-center gap-4 sm:col-span-6">
                    <div
                      className="grid h-20 w-20 shrink-0 place-items-center"
                      style={{ backgroundColor: line.tone }}
                    >
                      <span
                        className="text-xl font-black"
                        style={{ color: "rgba(246,243,236,0.2)" }}
                      >
                        GW
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {line.sku}
                      </p>
                      <Link
                        className="text-sm font-bold leading-snug text-d1-ink hover:text-d1-pine"
                        href="/design-lab/d1/product"
                      >
                        {line.name}
                      </Link>
                      <p className="text-xs font-semibold text-d1-steel">
                        {line.variant} &middot; {formatUsd(line.price)} ea
                      </p>
                      <button
                        className="mt-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-red transition hover:underline"
                        onClick={() => removeLine(line.id)}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="col-span-7 sm:col-span-3 sm:justify-self-center">
                    <div className="flex w-fit items-center border border-d1-ink">
                      <button
                        aria-label="Decrease"
                        className="grid h-10 w-10 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                        onClick={() => updateQty(line.id, -1)}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="grid h-10 w-12 place-items-center border-x border-d1-ink text-sm font-extrabold">
                        {line.qty}
                      </span>
                      <button
                        aria-label="Increase"
                        className="grid h-10 w-10 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                        onClick={() => updateQty(line.id, 1)}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-5 text-right sm:col-span-3">
                    <span className="text-lg font-extrabold text-d1-ink">
                      {formatUsd(line.price * line.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
              href="/design-lab/d1/category"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Continue
              shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:col-span-4">
            <div className="border-2 border-d1-ink bg-d1-card">
              <div className="border-b-2 border-d1-ink bg-d1-ink px-5 py-3">
                <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-d1-paper">
                  Order summary
                </span>
              </div>
              <div className="space-y-2.5 px-5 py-5 text-sm">
                <Row label="Subtotal" value={formatUsd(subtotal)} />
                <Row
                  accent
                  label="Trade discount (8%)"
                  value={`- ${formatUsd(tradeDiscount)}`}
                />
                {applied ? (
                  <Row
                    accent
                    label="Promo CREW5 (5%)"
                    value={`- ${formatUsd(promoDiscount)}`}
                  />
                ) : null}
                <Row label="Tax (7.25%)" value={formatUsd(tax)} />
                <Row
                  label="Pickup / delivery"
                  value={shipping === 0 ? "FREE" : formatUsd(shipping)}
                />
                <div className="mt-3 flex items-center justify-between border-t-2 border-d1-ink pt-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-d1-ink">
                    Order total
                  </span>
                  <span className="text-2xl font-extrabold text-d1-ink">
                    {formatUsd(total)}
                  </span>
                </div>
              </div>

              {/* Promo */}
              <div className="border-t border-d1-line px-5 py-4">
                <div className="flex">
                  <div className="flex flex-1 items-center gap-2 border border-d1-ink border-r-0 px-3">
                    <Tag className="h-4 w-4 text-d1-steel" />
                    <input
                      className="w-full bg-transparent py-2.5 text-sm font-semibold uppercase text-d1-ink outline-none placeholder:text-d1-steel/70 placeholder:normal-case"
                      onChange={(event) => setPromo(event.target.value)}
                      placeholder="Promo code"
                      value={promo}
                    />
                  </div>
                  <button
                    className="bg-d1-ink px-4 text-xs font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                    onClick={() => setApplied(true)}
                    type="button"
                  >
                    Apply
                  </button>
                </div>
                {applied ? (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine">
                    Code CREW5 applied
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] font-semibold text-d1-steel">
                    Try code CREW5 for 5% off.
                  </p>
                )}
              </div>

              <div className="px-5 pb-5">
                <Link
                  className="flex w-full items-center justify-center gap-2 bg-d1-pine py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-d1-ink"
                  href="/design-lab/d1/orders"
                >
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-4 grid gap-px border border-d1-line bg-d1-line text-[12px]">
              {[
                { icon: Truck, text: "Free delivery on orders over $750" },
                { icon: ShieldCheck, text: "Secure trade checkout & net terms" }
              ].map((row) => (
                <p
                  key={row.text}
                  className="flex items-center gap-2.5 bg-d1-card px-4 py-3 font-semibold text-d1-ink"
                >
                  <row.icon className="h-4 w-4 shrink-0 text-d1-pine" />
                  {row.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </D1Page>
  );
}

function Row({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-d1-steel">{label}</span>
      <span
        className={`font-bold ${accent ? "text-d1-pine" : "text-d1-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}
