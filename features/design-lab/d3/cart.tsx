"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus, Tag, Trash2, Truck } from "lucide-react";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Cart. */

type Tone = "steel" | "brass" | "ink" | "rust";

type Line = {
  id: string;
  name: string;
  variant: string;
  group: string;
  price: number;
  qty: number;
  tone: Tone;
};

const initialLines: Line[] = [
  {
    id: "l1",
    name: "2 × 2 Square Tube",
    variant: "11ga · 20 ft length",
    group: "Structural Steel",
    price: 38.4,
    qty: 6,
    tone: "steel"
  },
  {
    id: "l2",
    name: "Heavy Bolt-On Gate Hinge",
    variant: 'Black · 5/8" pin · pair',
    group: "Gate Hardware",
    price: 24.9,
    qty: 2,
    tone: "brass"
  },
  {
    id: "l3",
    name: "Self-Drilling Tek Screw",
    variant: "#12 × 1″ · box of 250",
    group: "Fasteners",
    price: 18.75,
    qty: 3,
    tone: "rust"
  }
];

export function D3Cart() {
  const [lines, setLines] = useState(initialLines);

  const setQty = (id: string, delta: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, qty: Math.max(1, l.qty + delta) } : l
      )
    );
  const remove = (id: string) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const tradeDiscount = subtotal * 0.08;
  const delivery = subtotal > 250 ? 0 : 45;
  const tax = (subtotal - tradeDiscount) * 0.0825;
  const total = subtotal - tradeDiscount + delivery + tax;

  return (
    <D3Shell active="Cart">
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8 sm:pt-14">
        <Eyebrow>The Order Sheet</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1
            className={`${serif} text-[2.6rem] font-semibold leading-none tracking-[-0.02em] sm:text-[3.4rem]`}
          >
            Your cart
          </h1>
          <span
            className="text-[0.78rem] uppercase tracking-[0.16em]"
            style={{ color: d3.haze }}
          >
            {lines.length} {lines.length === 1 ? "line" : "lines"} · saved as draft
          </span>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        {lines.length === 0 ? (
          <div
            className="border py-24 text-center"
            style={{ borderColor: d3.rule, background: d3.card }}
          >
            <p className={`${serif} text-3xl`}>The sheet is empty.</p>
            <Link
              href="/design-lab/d3/category"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white"
              style={{ background: d3.ink }}
            >
              Back to the catalog <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1.55fr_0.95fr]">
            {/* line items */}
            <div>
              <div
                className="hidden grid-cols-[1fr_auto_auto] gap-6 border-b pb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] sm:grid"
                style={{ borderColor: d3.rule, color: d3.haze }}
              >
                <span>Item</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Line total</span>
              </div>

              <ul>
                {lines.map((l) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-1 gap-5 border-b py-6 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                    style={{ borderColor: d3.rule }}
                  >
                    <div className="flex gap-4">
                      <MaterialBlock
                        tone={l.tone}
                        className="h-24 w-24 shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className="text-[0.66rem] font-semibold uppercase tracking-[0.2em]"
                          style={{ color: d3.brass }}
                        >
                          {l.group}
                        </p>
                        <h3 className={`${serif} mt-1 text-xl font-semibold leading-snug`}>
                          {l.name}
                        </h3>
                        <p className="mt-0.5 text-sm" style={{ color: d3.graphite }}>
                          {l.variant}
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          className="mt-2 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: d3.haze }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-center">
                      <span className="text-[0.7rem] uppercase tracking-[0.14em] sm:hidden" style={{ color: d3.haze }}>
                        Qty
                      </span>
                      <div
                        className="flex items-center gap-3 rounded-full border px-2.5 py-1.5"
                        style={{ borderColor: d3.rule }}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(l.id, -1)}
                          className="grid h-7 w-7 place-items-center rounded-full"
                          style={{ background: d3.paper }}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className={`${serif} w-6 text-center text-lg`}>{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.id, 1)}
                          className="grid h-7 w-7 place-items-center rounded-full"
                          style={{ background: d3.paper }}
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
                      <span className="text-[0.7rem] uppercase tracking-[0.14em] sm:hidden" style={{ color: d3.haze }}>
                        Total
                      </span>
                      <span className={`${serif} text-2xl font-semibold`}>
                        ${(l.price * l.qty).toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href="/design-lab/d3/category"
                className="mt-6 inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px]"
              >
                Continue browsing the catalog
              </Link>
            </div>

            {/* summary */}
            <aside className="lg:pt-2">
              <div
                className="border p-7"
                style={{ borderColor: d3.rule, background: d3.card }}
              >
                <h2 className={`${serif} text-2xl font-semibold`}>Order summary</h2>

                <dl className="mt-5 space-y-3 text-[0.92rem]">
                  {[
                    ["Subtotal", `$${subtotal.toFixed(2)}`, false],
                    ["Trade tier B (-8%)", `-$${tradeDiscount.toFixed(2)}`, true],
                    [
                      "Delivery",
                      delivery === 0 ? "Free" : `$${delivery.toFixed(2)}`,
                      delivery === 0
                    ],
                    ["Estimated tax", `$${tax.toFixed(2)}`, false]
                  ].map(([k, v, accent]) => (
                    <div key={k as string} className="flex justify-between">
                      <dt style={{ color: d3.graphite }}>{k}</dt>
                      <dd
                        className="font-semibold"
                        style={{ color: accent ? d3.brass : d3.ink }}
                      >
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div
                  className="mt-5 flex items-baseline justify-between border-t pt-5"
                  style={{ borderColor: d3.rule }}
                >
                  <span className="text-[0.74rem] font-semibold uppercase tracking-[0.18em]" style={{ color: d3.haze }}>
                    Total
                  </span>
                  <span className={`${serif} text-3xl font-semibold`}>
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* promo */}
                <div
                  className="mt-5 flex items-center gap-2 rounded-full border px-4 py-2.5"
                  style={{ borderColor: d3.rule }}
                >
                  <Tag className="h-4 w-4" style={{ color: d3.brass }} />
                  <input
                    placeholder="Promo or PO reference"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

                <button
                  type="button"
                  className="mt-5 w-full rounded-full px-6 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: d3.ink }}
                >
                  Proceed to checkout
                </button>
                <button
                  type="button"
                  className="mt-3 w-full rounded-full border px-6 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em]"
                  style={{ borderColor: d3.ink }}
                >
                  Save as quote
                </button>

                <div
                  className="mt-6 flex items-start gap-3 border-t pt-5 text-[0.78rem] leading-relaxed"
                  style={{ borderColor: d3.rule, color: d3.graphite }}
                >
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: d3.brass }} />
                  <span>
                    Orders over $250 deliver free on the next routed run. Will-call
                    bundles are ready within two hours.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </D3Shell>
  );
}
