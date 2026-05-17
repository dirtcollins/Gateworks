"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Building2,
  Check,
  FileText,
  Minus,
  Plus,
  Trash2,
  Truck,
  Zap
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import { fmt } from "./data";
import { useCartStore } from "@/lib/cart-store";

export default function D5Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [fulfill, setFulfill] = useState<"willcall" | "delivery">("delivery");
  const [po, setPo] = useState("");
  const [placed, setPlaced] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Cart store uses skipHydration; rehydrate on mount for live persisted data.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const bump = (variantId: string, current: number, d: number) =>
    updateQuantity(variantId, Math.max(1, current + d));
  const setQ = (variantId: string, q: number) =>
    updateQuantity(variantId, Math.max(1, q));
  const remove = (variantId: string) => removeItem(variantId);

  const subtotal = useMemo(
    () => items.reduce((s, l) => s + l.price * l.quantity, 0),
    [items]
  );
  const proSavings = subtotal * 0.085;
  const freight = fulfill === "delivery" ? (subtotal > 750 ? 0 : 65) : 0;
  const tax = (subtotal - proSavings) * 0.081;
  const total = subtotal - proSavings + freight + tax;
  const units = items.reduce((s, l) => s + l.quantity, 0);

  return (
    <Shell crumb="cart">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Cart · order builder</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            {items.length} SKUs · {units} units · live catalog pricing
          </p>
        </div>
        <div className="flex gap-1.5">
          <Btn>
            <Bookmark size={12} /> Save as template
          </Btn>
          <Btn>
            <FileText size={12} /> Export quote
          </Btn>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {/* line items */}
          <Panel
            title="Line items"
            hint={`// ${items.length} rows`}
            right={
              items.length ? (
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-[10px] font-semibold"
                  style={{ color: D5.faint }}
                >
                  clear
                </button>
              ) : null
            }
          >
            <div
              className="grid grid-cols-[1fr_96px_96px_30px] gap-x-2 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] md:grid-cols-[1fr_84px_100px_100px_30px]"
              style={{ borderColor: D5.line, color: D5.faint }}
            >
              <span>item</span>
              <span className="hidden text-right md:block">unit</span>
              <span className="text-center">qty</span>
              <span className="text-right">ext</span>
              <span />
            </div>
            {hydrated && items.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-[12px]" style={{ color: D5.dim }}>
                  Cart empty.
                </p>
                <div className="mt-2 flex justify-center">
                  <Btn href="/design-lab/d5/category" variant="primary">
                    Browse catalog
                  </Btn>
                </div>
              </div>
            ) : (
              items.map((l) => (
                <div
                  key={l.variantId}
                  className="grid grid-cols-[1fr_96px_96px_30px] items-center gap-x-2 border-b px-3 py-2 last:border-0 md:grid-cols-[1fr_84px_100px_100px_30px]"
                  style={{ borderColor: D5.line }}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="relative h-9 w-9 shrink-0 overflow-hidden rounded"
                      style={{ background: D5.panelHi }}
                    >
                      <Image
                        src={l.image || "/assets/logo.svg"}
                        alt={l.title}
                        fill
                        quality={75}
                        sizes="36px"
                        className="object-contain p-0.5"
                      />
                    </span>
                    <div className="overflow-hidden">
                      <Link
                        href="/design-lab/d5/product"
                        className="block truncate text-[12px] font-semibold hover:underline"
                        style={{ color: D5.ink }}
                      >
                        {l.title}
                      </Link>
                      <div className="truncate text-[10px]" style={{ color: D5.faint }}>
                        <span style={{ color: D5.dim }}>{l.sku}</span> ·{" "}
                        {[l.options.length, l.options.finish]
                          .filter((x) => x && x !== "Standard")
                          .join(" · ") || "Standard"}
                      </div>
                    </div>
                  </div>
                  <span
                    className="hidden text-right text-[11px] md:block"
                    style={{ color: D5.dim }}
                  >
                    {fmt(l.price)}
                  </span>
                  <div className="flex items-center justify-center">
                    <div
                      className="flex items-center rounded border"
                      style={{ borderColor: D5.line }}
                    >
                      <button
                        type="button"
                        onClick={() => bump(l.variantId, l.quantity, -1)}
                        className="grid h-7 w-6 place-items-center"
                        style={{ color: D5.dim }}
                      >
                        <Minus size={11} />
                      </button>
                      <input
                        value={l.quantity}
                        onChange={(e) => setQ(l.variantId, Number(e.target.value) || 1)}
                        className="w-9 bg-transparent text-center text-[12px] font-bold outline-none"
                        style={{ color: D5.ink }}
                      />
                      <button
                        type="button"
                        onClick={() => bump(l.variantId, l.quantity, 1)}
                        className="grid h-7 w-6 place-items-center"
                        style={{ color: D5.dim }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold" style={{ color: D5.ink }}>
                      {fmt(l.price * l.quantity)}
                    </div>
                    <div className="text-[9px]" style={{ color: D5.faint }}>
                      ships today
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.variantId)}
                    className="grid h-7 w-7 place-items-center rounded"
                    style={{ color: D5.faint }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </Panel>

          {/* fulfillment + PO */}
          <div className="grid gap-3 md:grid-cols-2">
            <Panel title="Fulfillment">
              <div className="flex flex-col gap-1.5 p-2">
                {(
                  [
                    ["willcall", "Will-call pickup", "DEN-01 · ready 30 min", "$0"],
                    [
                      "delivery",
                      "Flatbed delivery",
                      "Metro next-day · free over $750",
                      freight === 0 ? "FREE" : fmt(freight)
                    ]
                  ] as [typeof fulfill, string, string, string][]
                ).map(([k, t, d, price]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFulfill(k)}
                    className="flex items-center gap-2.5 rounded px-2 py-2 text-left"
                    style={{
                      background: fulfill === k ? D5.panelHi : "transparent",
                      border: `1px solid ${fulfill === k ? D5.lineHi : D5.line}`
                    }}
                  >
                    <span
                      className="grid h-4 w-4 place-items-center rounded-full border"
                      style={{ borderColor: fulfill === k ? D5.accent : D5.lineHi }}
                    >
                      {fulfill === k ? <Dot color={D5.accent} /> : null}
                    </span>
                    {k === "willcall" ? (
                      <Building2 size={14} style={{ color: D5.dim }} />
                    ) : (
                      <Truck size={14} style={{ color: D5.dim }} />
                    )}
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold" style={{ color: D5.ink }}>
                        {t}
                      </div>
                      <div className="text-[9px]" style={{ color: D5.faint }}>
                        {d}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: price === "FREE" || price === "$0" ? D5.accent : D5.ink }}
                    >
                      {price}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Reference">
              <div className="p-2">
                <label
                  className="text-[9px] uppercase tracking-[0.14em]"
                  style={{ color: D5.faint }}
                >
                  PO number / job tag
                </label>
                <input
                  value={po}
                  onChange={(e) => setPo(e.target.value)}
                  placeholder="e.g. JOB-2210 / Mesa gate"
                  className="mt-1 h-8 w-full rounded border bg-transparent px-2 text-[12px] outline-none"
                  style={{ borderColor: D5.line, color: D5.ink }}
                />
                <label
                  className="mt-2 block text-[9px] uppercase tracking-[0.14em]"
                  style={{ color: D5.faint }}
                >
                  Account
                </label>
                <div
                  className="mt-1 flex items-center justify-between rounded border px-2 py-1.5"
                  style={{ borderColor: D5.line }}
                >
                  <span className="text-[11px] font-semibold" style={{ color: D5.ink }}>
                    Hoover Hardware
                  </span>
                  <Tag tone="accent">NET-30</Tag>
                </div>
                <p className="mt-2 text-[10px]" style={{ color: D5.faint }}>
                  Terms approved · credit available $24,800
                </p>
              </div>
            </Panel>
          </div>
        </div>

        {/* sticky summary */}
        <div className="lg:sticky lg:top-[88px] lg:self-start">
          <Panel title="Order summary" hint="// review">
            <div className="p-3">
              {[
                ["Subtotal", fmt(subtotal), D5.dim],
                ["PRO tier savings", `−${fmt(proSavings)}`, D5.accent],
                ["Freight", freight === 0 ? "FREE" : fmt(freight), D5.dim],
                ["Est. tax (8.1%)", fmt(tax), D5.dim]
              ].map(([k, v, c]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between py-1 text-[11px]"
                >
                  <span style={{ color: D5.faint }}>{k}</span>
                  <span style={{ color: c, fontFamily: mono }}>{v}</span>
                </div>
              ))}
              <div
                className="mt-1 flex items-baseline justify-between border-t pt-2"
                style={{ borderColor: D5.line }}
              >
                <span className="text-[11px] font-semibold" style={{ color: D5.ink }}>
                  Total due
                </span>
                <span className="text-[22px] font-bold" style={{ color: D5.accent }}>
                  {fmt(total)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPlaced(true);
                  window.setTimeout(() => setPlaced(false), 2200);
                }}
                disabled={items.length === 0}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded text-[12px] font-bold disabled:opacity-30"
                style={{
                  background: placed ? D5.accentDim : D5.accent,
                  color: placed ? D5.accent : D5.bg
                }}
              >
                {placed ? (
                  <>
                    <Check size={15} /> ORDER PLACED — GW-48202
                  </>
                ) : (
                  <>
                    <Zap size={14} /> PLACE ORDER · {fmt(total)}
                  </>
                )}
              </button>
              <p
                className="mt-2 flex items-center justify-center gap-1 text-[9px]"
                style={{ color: D5.faint }}
              >
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd> to place · <Kbd>S</Kbd> save draft
              </p>
              <Link
                href="/design-lab/d5/orders"
                className="mt-2 block text-center text-[10px] font-semibold"
                style={{ color: D5.accent }}
              >
                track on order desk →
              </Link>
            </div>
          </Panel>

          <div
            className="mt-2 flex items-start gap-2 rounded-md border px-2.5 py-2 text-[10px]"
            style={{ borderColor: D5.line, background: D5.panel, color: D5.dim }}
          >
            <Truck size={13} style={{ color: D5.accent }} className="mt-0.5 shrink-0" />
            Lock pricing for 14 days by exporting this cart as a quote — no commitment.
          </div>
        </div>
      </div>
    </Shell>
  );
}
