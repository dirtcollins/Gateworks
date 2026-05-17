"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { D9DesignBadge, D9Page, Display, Eyebrow, d9, formatUsd, serif } from "./kit";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";

/* DESIGN 9 — "Showroom" — Cart. Wired to the real cart store. */

const TAX_RATE = 0.0725;

function variantSummary(item: CartItem): string {
  const parts = [item.options.length, item.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : "Standard edition";
}

export function D9Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hydrated, setHydrated] = useState(false);

  // Cart store uses skipHydration — rehydrate once on the client so SSR and
  // the first client render agree (empty) before persisted data arrives.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );
  const tax = subtotal * TAX_RATE;
  const delivery = subtotal > 0 && subtotal < 1500 ? 85 : 0;
  const total = subtotal + tax + delivery;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <D9Page>
      <D9DesignBadge />

      {/* Masthead */}
      <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:px-8 sm:pt-20">
        <Eyebrow>Your acquisition</Eyebrow>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1
            className="text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[3.8rem]"
            style={{ ...serif, color: d9.ink }}
          >
            The Cart
          </h1>
          <span
            className="text-[0.66rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: d9.haze }}
          >
            {itemCount} {itemCount === 1 ? "piece" : "pieces"} reserved
          </span>
        </div>
      </section>

      {lines.length === 0 ? (
        <section className="mx-auto max-w-[1240px] px-6 pb-28 sm:px-8">
          <div
            className="px-8 py-24 text-center"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <span className="text-5xl" style={{ ...serif, color: d9.rule }}>
              —
            </span>
            <p className="mt-5 text-2xl" style={{ ...serif, color: d9.ink }}>
              Your cart awaits its first piece.
            </p>
            <p className="mt-3 text-sm" style={{ color: d9.graphite }}>
              Browse the collection and reserve the objects worth keeping.
            </p>
            <Link
              className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              href="/design-lab/d9/category"
              style={{ background: d9.ink, color: d9.bone }}
            >
              Enter the collection <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-[1240px] px-6 pb-28 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            {/* Line items */}
            <div
              className="grid gap-px self-start"
              style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
            >
              {lines.map((line) => (
                <div
                  key={line.variantId}
                  className="grid items-center gap-6 px-7 py-7 sm:grid-cols-[110px_1fr_auto]"
                  style={{ background: d9.card }}
                >
                  <div
                    className="flex aspect-square items-center justify-center overflow-hidden"
                    style={{ background: d9.linen }}
                  >
                    {line.image ? (
                      <Image
                        alt={line.title}
                        className="h-full w-full object-contain p-3"
                        height={220}
                        quality={75}
                        src={line.image}
                        width={220}
                      />
                    ) : (
                      <span style={{ ...serif, color: d9.rule }}>GW</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[0.58rem] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: d9.bronze }}
                    >
                      {line.sku}
                    </span>
                    <Link
                      className="mt-1.5 block text-lg leading-snug"
                      href="/design-lab/d9/product"
                      style={{ ...serif, color: d9.ink }}
                    >
                      {line.title}
                    </Link>
                    <p className="mt-1 text-[0.78rem]" style={{ color: d9.haze }}>
                      {variantSummary(line)} · {formatUsd(line.price)} each
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <div
                        className="flex items-center"
                        style={{ border: `1px solid ${d9.ink}` }}
                      >
                        <button
                          aria-label="Decrease"
                          className="grid h-9 w-9 place-items-center"
                          onClick={() =>
                            updateQuantity(line.variantId, Math.max(1, line.quantity - 1))
                          }
                          style={{ color: d9.ink }}
                          type="button"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className="grid h-9 w-10 place-items-center text-sm"
                          style={{
                            ...serif,
                            borderLeft: `1px solid ${d9.ink}`,
                            borderRight: `1px solid ${d9.ink}`
                          }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          aria-label="Increase"
                          className="grid h-9 w-9 place-items-center"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity + 1)
                          }
                          style={{ color: d9.ink }}
                          type="button"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                        onClick={() => removeItem(line.variantId)}
                        style={{ color: d9.haze }}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl" style={{ ...serif, color: d9.ink }}>
                      {formatUsd(line.price * line.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <div style={{ background: d9.ink, color: d9.bone }}>
                <div
                  className="px-7 py-5"
                  style={{ borderBottom: "1px solid rgba(243,237,225,0.12)" }}
                >
                  <span
                    className="text-[0.6rem] font-semibold uppercase tracking-[0.26em]"
                    style={{ color: d9.bronzeLite }}
                  >
                    Order summary
                  </span>
                </div>
                <div className="space-y-3.5 px-7 py-6 text-sm">
                  <Row label="Subtotal" value={formatUsd(subtotal)} />
                  <Row label="Tax (7.25%)" value={formatUsd(tax)} />
                  <Row
                    label="White-glove delivery"
                    value={delivery === 0 ? "Complimentary" : formatUsd(delivery)}
                  />
                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(243,237,225,0.14)" }}
                  >
                    <span
                      className="text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
                      style={{ color: "rgba(243,237,225,0.7)" }}
                    >
                      Total
                    </span>
                    <span className="text-3xl" style={{ ...serif, color: d9.bone }}>
                      {formatUsd(total)}
                    </span>
                  </div>
                </div>
                <div className="px-7 pb-7">
                  <Link
                    className="flex w-full items-center justify-center gap-2.5 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                    href="/design-lab/d9/orders"
                    style={{ background: d9.bronze, color: d9.bone }}
                  >
                    Proceed to checkout <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div
                className="mt-4 px-7 py-6"
                style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
              >
                <Display className="text-lg">The Atelier promise</Display>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: d9.graphite }}>
                  Complimentary white-glove delivery on orders over $1,500.
                  Every order is crated, insured, and concierge-scheduled.
                </p>
              </div>

              <Link
                className="mt-4 inline-flex items-center gap-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em]"
                href="/design-lab/d9/category"
                style={{ color: d9.bronze }}
              >
                <ArrowRight className="h-3 w-3 rotate-180" /> Continue browsing
              </Link>
            </div>
          </div>
        </section>
      )}
    </D9Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "rgba(243,237,225,0.62)" }}>{label}</span>
      <span style={{ color: d9.bone }}>{value}</span>
    </div>
  );
}
