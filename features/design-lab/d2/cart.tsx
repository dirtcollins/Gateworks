"use client";

/** DESIGN 2 — Warehouse Dark · Cart */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  Truck
} from "lucide-react";
import { AccentButton, D2, D2Shell, Panel, PanelHead, PartPhoto, Tag, mono } from "./kit";
import { useCartStore } from "@/lib/cart-store";

const SHIP_FREE_AT = 750;
const TAX_RATE = 0.0731;

export function D2Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [po, setPo] = useState("");

  const { subtotal, units } = useMemo(() => {
    let sub = 0;
    let u = 0;
    for (const item of items) {
      sub += item.price * item.quantity;
      u += item.quantity;
    }
    return { subtotal: sub, units: u };
  }, [items]);

  const shipping = subtotal >= SHIP_FREE_AT || items.length === 0 ? 0 : 42.5;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const freeShipPct = Math.min(100, (subtotal / SHIP_FREE_AT) * 100);

  return (
    <D2Shell active="cart" kicker="CART // ORDER BUILD">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">
          Order Build{" "}
          <span className={`${mono} text-[14px]`} style={{ color: D2.muted }}>
            / DRAFT-0091
          </span>
        </h1>
        <Tag tone="accent">{units} UNITS · {items.length} LINES</Tag>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* lines */}
        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHead
              title="Line Items"
              meta={`${items.length} SKUS`}
              action={
                <Link
                  href="/design-lab/d2/category"
                  className={`${mono} text-[11px] uppercase tracking-wider`}
                  style={{ color: D2.accent }}
                >
                  + Add SKU
                </Link>
              }
            />
            {items.length === 0 ? (
              <div className="grid place-items-center gap-3 py-16">
                <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                  Cart is empty.
                </span>
                <AccentButton href="/design-lab/d2/category">Browse catalog</AccentButton>
              </div>
            ) : (
              items.map((l, i) => {
                const optionLabel =
                  [l.options.length, l.options.finish, l.options.material]
                    .filter((value) => value && value !== "Standard")
                    .join(" · ") || l.sku;
                return (
                  <div
                    key={l.variantId}
                    className="flex items-center gap-4 p-4"
                    style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
                  >
                    <PartPhoto
                      src={l.image}
                      alt={l.title}
                      seed={l.variantId}
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                        {l.sku} · {optionLabel}
                      </div>
                      <Link
                        href="/design-lab/d2/product"
                        className="block truncate text-[13px] font-medium hover:underline"
                      >
                        {l.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`${mono} text-[12px]`} style={{ color: D2.accent }}>
                          ${l.price.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center rounded-[3px]"
                      style={{ border: `1px solid ${D2.line}`, background: D2.bg }}
                    >
                      <button
                        type="button"
                        aria-label="decrease"
                        onClick={() => updateQuantity(l.variantId, l.quantity - 1)}
                        className="grid h-9 w-9 place-items-center"
                        style={{ color: D2.accent }}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className={`${mono} w-10 text-center text-[13px] font-bold`}>
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="increase"
                        onClick={() => updateQuantity(l.variantId, l.quantity + 1)}
                        className="grid h-9 w-9 place-items-center"
                        style={{ color: D2.accent }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className={`${mono} hidden w-24 text-right text-[15px] font-bold sm:block`}>
                      ${(l.price * l.quantity).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      aria-label="remove"
                      onClick={() => removeItem(l.variantId)}
                      className="grid h-9 w-9 place-items-center rounded-[3px] transition"
                      style={{ border: `1px solid ${D2.line}`, color: "#ff6b6b" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </Panel>

          <Panel className="flex items-center gap-3 p-4">
            <Bookmark className="h-4 w-4 shrink-0" style={{ color: D2.accent }} />
            <span className="flex-1 text-[12px]" style={{ color: D2.muted }}>
              Save this build as a reusable crew template.
            </span>
            <AccentButton ghost>Save draft</AccentButton>
          </Panel>
        </div>

        {/* summary */}
        <aside className="flex flex-col gap-4">
          <Panel glow>
            <PanelHead title="Summary" />
            <div className="p-4">
              {/* free shipping meter */}
              <div
                className="rounded-[3px] p-3"
                style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
              >
                <div className="flex items-center justify-between">
                  <span className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                    <Truck className="mr-1 inline h-3.5 w-3.5" />
                    {shipping === 0 ? "Freight unlocked" : "To free freight"}
                  </span>
                  <span className={`${mono} text-[11px] font-bold`} style={{ color: D2.accent }}>
                    {shipping === 0
                      ? "$0.00"
                      : `$${(SHIP_FREE_AT - subtotal).toFixed(0)} away`}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full"
                  style={{ background: D2.line }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${freeShipPct}%`,
                      background: D2.accent,
                      boxShadow: `0 0 10px ${D2.accent}`
                    }}
                  />
                </div>
              </div>

              <dl className="mt-4 flex flex-col gap-2.5">
                {[
                  ["Subtotal", `$${subtotal.toFixed(2)}`, false],
                  ["Freight", shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`, false],
                  ["Est. tax (7.31%)", `$${tax.toFixed(2)}`, false]
                ].map(([k, v, good]) => (
                  <div key={String(k)} className="flex items-center justify-between">
                    <dt className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                      {k}
                    </dt>
                    <dd
                      className={`${mono} text-[13px] font-medium`}
                      style={{ color: good ? D2.accent : D2.text }}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: D2.line }}
              >
                <span className={`${mono} text-[12px] uppercase tracking-wider`}>Total</span>
                <span className={`${mono} text-[26px] font-bold`} style={{ color: D2.accent }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* PO field */}
              <div className="mt-4">
                <div
                  className={`${mono} mb-1.5 text-[10px] uppercase tracking-[0.16em]`}
                  style={{ color: D2.muted }}
                >
                  Purchase order ref
                </div>
                <input
                  value={po}
                  onChange={(e) => setPo(e.target.value)}
                  placeholder="PO / job number…"
                  className={`${mono} w-full rounded-[3px] px-3 py-2.5 text-[12px] outline-none placeholder:text-[#3f4a52]`}
                  style={{ background: D2.bg, border: `1px solid ${D2.line}`, color: D2.text }}
                />
              </div>

              <AccentButton className="mt-4 w-full" href="/design-lab/d2/orders">
                Submit order <ArrowRight className="h-4 w-4" />
              </AccentButton>
              <Link
                href="/design-lab/d2/category"
                className={`${mono} mt-3 block text-center text-[11px] uppercase tracking-wider`}
                style={{ color: D2.muted }}
              >
                ← Keep building
              </Link>
            </div>
          </Panel>

          <Panel className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: D2.accent }} />
            <span className={`${mono} text-[11px] leading-relaxed`} style={{ color: D2.muted }}>
              Net-30 terms available · order routed to yard fulfillment on submit.
            </span>
          </Panel>
        </aside>
      </div>
    </D2Shell>
  );
}
