"use client";

/* DESIGN 2 — "MONO" — Cart, wired to the live cart store. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Label,
  MONO,
  MonoButton,
  MonoPage,
  ProductImage,
  Section,
  formatUsd
} from "./kit";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";

const TAX_RATE = 0.0725;
const FREE_FREIGHT_AT = 750;
const FREIGHT = 42.5;

function variantSummary(item: CartItem): string {
  const parts = [item.options.length, item.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" / ") : "Standard";
}

export function D2Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Cart store uses skipHydration — rehydrate once on the client so SSR and
  // first client render agree before live data arrives.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );
  const units = lines.reduce((sum, line) => sum + line.quantity, 0);
  const freight =
    lines.length === 0 || subtotal >= FREE_FREIGHT_AT ? 0 : FREIGHT;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + freight;

  return (
    <MonoPage active="Cart">
      <Section
        className="pt-12 pb-8"
        style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
      >
        <Label index="CART">Order build</Label>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[56px]">
            Your cart
          </h1>
          <p
            className="text-[12px] uppercase tracking-[0.18em]"
            style={{ color: MONO.muted }}
          >
            {units} {units === 1 ? "unit" : "units"} · {lines.length}{" "}
            {lines.length === 1 ? "line" : "lines"}
          </p>
        </div>
      </Section>

      {lines.length === 0 ? (
        <Section className="py-24">
          <div
            className="grid place-items-center py-20 text-center"
            style={{ border: `1px solid ${MONO.line}` }}
          >
            <div className="max-w-sm px-6">
              <span
                className="text-[56px] font-semibold tracking-[-0.04em]"
                style={{ color: MONO.line }}
              >
                00
              </span>
              <p className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">
                Your cart is empty.
              </p>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: MONO.steel }}
              >
                Nothing on the line yet. Browse the catalogue to add stocked
                hardware and steel.
              </p>
              <div className="mt-7 flex justify-center">
                <MonoButton href="/design-lab/d2/category">
                  Browse catalogue
                </MonoButton>
              </div>
            </div>
          </div>
        </Section>
      ) : (
        <Section className="pt-10 pb-16">
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Lines */}
            <div className="lg:col-span-8">
              <div
                className="hidden grid-cols-12 gap-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] sm:grid"
                style={{
                  borderBottom: `1px solid ${MONO.lineStrong}`,
                  color: MONO.muted
                }}
              >
                <span className="col-span-6">Object</span>
                <span className="col-span-3 text-center">Quantity</span>
                <span className="col-span-3 text-right">Line total</span>
              </div>
              <ul>
                {lines.map((line) => (
                  <li
                    key={line.variantId}
                    className="grid grid-cols-12 items-center gap-4 py-5"
                    style={{ borderBottom: `1px solid ${MONO.line}` }}
                  >
                    <div className="col-span-12 flex items-center gap-4 sm:col-span-6">
                      <div
                        className="h-20 w-20 shrink-0"
                        style={{ border: `1px solid ${MONO.line}` }}
                      >
                        <ProductImage
                          alt={line.title}
                          className="h-full w-full"
                          pad="p-2"
                          sizes="80px"
                          src={line.image}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                          style={{ color: MONO.muted }}
                        >
                          {line.sku}
                        </p>
                        <Link
                          href="/design-lab/d2/product"
                          className="mt-0.5 block text-[13px] font-medium leading-snug tracking-[-0.01em] hover:underline"
                        >
                          {line.title}
                        </Link>
                        <p
                          className="mt-0.5 text-[11px]"
                          style={{ color: MONO.steel }}
                        >
                          {variantSummary(line)} · {formatUsd(line.price)} ea
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(line.variantId)}
                          className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] underline underline-offset-2"
                          style={{ color: MONO.steel }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="col-span-7 sm:col-span-3 sm:justify-self-center">
                      <div
                        className="flex w-fit items-stretch"
                        style={{ border: `1px solid ${MONO.lineStrong}` }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity - 1)
                          }
                          className="grid h-10 w-10 place-items-center text-[16px] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                        >
                          &minus;
                        </button>
                        <span
                          className="grid h-10 w-11 place-items-center text-[13px] font-semibold tabular-nums"
                          style={{
                            borderLeft: `1px solid ${MONO.line}`,
                            borderRight: `1px solid ${MONO.line}`
                          }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(line.variantId, line.quantity + 1)
                          }
                          className="grid h-10 w-10 place-items-center text-[16px] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="col-span-5 text-right sm:col-span-3">
                      <span className="text-[16px] font-semibold tabular-nums">
                        {formatUsd(line.price * line.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/design-lab/d2/category"
                className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
              >
                ← Continue browsing
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-4">
              <div style={{ border: `1px solid ${MONO.lineStrong}` }}>
                <div
                  className="px-5 py-3.5"
                  style={{ background: MONO.ink, color: MONO.paper }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    Order summary
                  </p>
                </div>
                <dl className="px-5 py-5">
                  {[
                    ["Subtotal", formatUsd(subtotal)],
                    [
                      "Freight",
                      freight === 0 ? "Free" : formatUsd(freight)
                    ],
                    ["Tax (7.25%)", formatUsd(tax)]
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-1.5 text-[13px]"
                    >
                      <dt style={{ color: MONO.steel }}>{label}</dt>
                      <dd className="font-medium tabular-nums">{value}</dd>
                    </div>
                  ))}
                  <div
                    className="mt-3 flex items-center justify-between pt-3"
                    style={{ borderTop: `1px solid ${MONO.lineStrong}` }}
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Total
                    </dt>
                    <dd className="text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                      {formatUsd(total)}
                    </dd>
                  </div>
                </dl>
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: `1px solid ${MONO.line}` }}
                >
                  <p
                    className="py-3 text-[11px]"
                    style={{ color: MONO.steel }}
                  >
                    {freight === 0
                      ? "Freight is included on this order."
                      : `Add ${formatUsd(
                          FREE_FREIGHT_AT - subtotal
                        )} for free freight.`}
                  </p>
                  <MonoButton full href="/design-lab/d2/orders">
                    Proceed to checkout
                  </MonoButton>
                </div>
              </div>
              <p
                className="mt-4 text-[11px] leading-relaxed"
                style={{ color: MONO.muted }}
              >
                Net-30 terms available. Order is routed to yard fulfilment on
                submit.
              </p>
            </div>
          </div>
        </Section>
      )}
    </MonoPage>
  );
}
