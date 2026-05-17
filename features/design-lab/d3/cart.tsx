"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Minus, Plus, Tag, Trash2, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Cart. Wired to the real cart store. */

const TRADE_RATE = 0.08;
const TAX_RATE = 0.0825;

export function D3Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hydrated, setHydrated] = useState(false);

  // The cart store skips automatic hydration, so trigger it on mount.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const tradeDiscount = subtotal * TRADE_RATE;
  const delivery = subtotal > 250 || subtotal === 0 ? 0 : 45;
  const tax = (subtotal - tradeDiscount) * TAX_RATE;
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
                {lines.map((line) => {
                  const variantLabel =
                    [line.options?.length, line.options?.finish, line.options?.color]
                      .filter((opt) => opt && opt !== "Standard")
                      .join(" · ") || `SKU ${line.sku}`;

                  return (
                    <li
                      key={line.variantId}
                      className="grid grid-cols-1 gap-5 border-b py-6 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                      style={{ borderColor: d3.rule }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="relative h-24 w-24 shrink-0 overflow-hidden"
                          style={{ background: d3.card }}
                        >
                          {line.image ? (
                            <Image
                              src={line.image}
                              alt={line.title}
                              fill
                              quality={60}
                              sizes="96px"
                              className="object-contain p-2"
                            />
                          ) : (
                            <MaterialBlock tone="steel" className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-[0.66rem] font-semibold uppercase tracking-[0.2em]"
                            style={{ color: d3.brass }}
                          >
                            {line.options?.material || "Catalog item"}
                          </p>
                          <h3 className={`${serif} mt-1 text-xl font-semibold leading-snug`}>
                            {line.title}
                          </h3>
                          <p className="mt-0.5 text-sm" style={{ color: d3.graphite }}>
                            {variantLabel}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(line.variantId)}
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
                            onClick={() =>
                              updateQuantity(line.variantId, line.quantity - 1)
                            }
                            className="grid h-7 w-7 place-items-center rounded-full"
                            style={{ background: d3.paper }}
                            aria-label="Decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className={`${serif} w-6 text-center text-lg`}>
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(line.variantId, line.quantity + 1)
                            }
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
                          {formatCurrency(line.price * line.quantity)}
                        </span>
                      </div>
                    </li>
                  );
                })}
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
                    ["Subtotal", formatCurrency(subtotal), false],
                    ["Trade tier B (-8%)", `-${formatCurrency(tradeDiscount)}`, true],
                    [
                      "Delivery",
                      delivery === 0 ? "Free" : formatCurrency(delivery),
                      delivery === 0
                    ],
                    ["Estimated tax", formatCurrency(tax), false]
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
                    {formatCurrency(total)}
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
