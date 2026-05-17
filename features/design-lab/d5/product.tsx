"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Layers,
  Minus,
  Package,
  Plus,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import { PRODUCTS, fmt } from "./data";

const SPECS: [string, string][] = [
  ["Material", "ASTM A500 Grade B"],
  ["Profile", 'Square HSS · 2.000" OD'],
  ["Wall", '0.083" (14 ga)'],
  ["Stock length", "24 ft"],
  ["Weight", "1.43 lb/ft · 34.3 lb/stick"],
  ["Finish", "Hot-roll black, mill scale"],
  ["Yield", "46 ksi min"],
  ["Tolerance", "±0.020in OD · ±10% wall"]
];

const TIERS = [
  { label: "List", qty: "1–9", price: 44.1, on: false },
  { label: "Contractor", qty: "10–39", price: 41.0, on: false },
  { label: "PRO", qty: "40–119", price: 38.4, on: true },
  { label: "Bulk", qty: "120+", price: 35.6, on: false }
];

const CUT = ["No cut (full 24 ft)", "Half (2 × 12 ft)", "Custom — cut sheet"];

export default function D5Product() {
  const p = PRODUCTS[0];
  const [qty, setQty] = useState(40);
  const [cut, setCut] = useState(0);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"specs" | "ship" | "docs">("specs");

  const tier =
    qty >= 120 ? TIERS[3] : qty >= 40 ? TIERS[2] : qty >= 10 ? TIERS[1] : TIERS[0];
  const line = tier.price * qty;

  function add() {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  const related = PRODUCTS.slice(2, 6);

  return (
    <Shell crumb="catalog / steel-tube / STL-SQT-2014">
      <div
        className="mb-3 flex items-center gap-1 text-[10px]"
        style={{ color: D5.faint }}
      >
        <Link href="/design-lab/d5/category" style={{ color: D5.accent }}>
          Catalog
        </Link>
        <ChevronRight size={10} />
        <Link href="/design-lab/d5/category" style={{ color: D5.dim }}>
          Steel Tube
        </Link>
        <ChevronRight size={10} />
        <span style={{ color: D5.ink }}>{p.sku}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr_280px]">
        {/* image / swatch column */}
        <div className="flex flex-col gap-2">
          <div
            className="relative aspect-square overflow-hidden rounded-md border"
            style={{ borderColor: D5.line, background: p.swatch }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 12px, transparent 12px 24px)"
              }}
            />
            <span className="absolute left-2 top-2">
              <Tag tone="accent">
                <Check size={10} /> in stock · {p.stock}
              </Tag>
            </span>
            <span
              className="absolute bottom-2 right-2 text-[10px]"
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: mono }}
            >
              cross-section preview
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["#6b7180", "#5a606d", "#7a808d", "#4d5360"].map((c, i) => (
              <div
                key={i}
                className="aspect-square rounded border"
                style={{
                  background: c,
                  borderColor: i === 0 ? D5.accent : D5.line
                }}
              />
            ))}
          </div>
        </div>

        {/* core info */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag tone="dim">{p.category}</Tag>
              <span className="text-[10px]" style={{ color: D5.faint }}>
                SKU {p.sku} · UPC 8842-0014
              </span>
            </div>
            <H>
              <span className="text-[20px]">{p.name}</span>
            </H>
            <p className="mt-1 text-[12px]" style={{ color: D5.dim }}>
              {p.spec}. Structural square HSS for gate frames, posts, and weldments.
              Cut-to-length at the {p.hub} hub, same-day before 2pm.
            </p>
          </div>

          {/* price tier matrix */}
          <Panel title="Volume pricing" hint="// tier auto-applies at checkout">
            <div className="grid grid-cols-4 divide-x" style={{ borderColor: D5.line }}>
              {TIERS.map((t) => {
                const on = tier.label === t.label;
                return (
                  <div
                    key={t.label}
                    className="px-2.5 py-2"
                    style={{
                      borderColor: D5.line,
                      background: on ? D5.accentDim : "transparent"
                    }}
                  >
                    <div
                      className="text-[9px] uppercase tracking-[0.12em]"
                      style={{ color: on ? D5.accent : D5.faint }}
                    >
                      {t.label}
                    </div>
                    <div
                      className="text-[15px] font-bold"
                      style={{ color: on ? D5.accent : D5.ink }}
                    >
                      {fmt(t.price)}
                    </div>
                    <div className="text-[9px]" style={{ color: D5.faint }}>
                      {t.qty} {p.uom}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* tabbed detail */}
          <Panel
            title={
              tab === "specs" ? "Specifications" : tab === "ship" ? "Fulfillment" : "Documents"
            }
            right={
              <div className="flex gap-0.5">
                {(
                  [
                    ["specs", "Specs"],
                    ["ship", "Ship"],
                    ["docs", "Docs"]
                  ] as [typeof tab, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className="rounded px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: tab === k ? D5.panelHi : "transparent",
                      color: tab === k ? D5.accent : D5.faint
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            {tab === "specs" ? (
              <div className="grid grid-cols-2 gap-px" style={{ background: D5.line }}>
                {SPECS.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 px-3 py-1.5"
                    style={{ background: D5.panel }}
                  >
                    <span className="text-[10px]" style={{ color: D5.faint }}>
                      {k}
                    </span>
                    <span
                      className="text-right text-[11px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            {tab === "ship" ? (
              <div className="space-y-px" style={{ background: D5.line }}>
                {[
                  ["Will-call DEN-01", "Ready in 30 min", D5.accent, Package],
                  ["Flatbed delivery", "Free over $750 · next-day metro", D5.accent, Truck],
                  ["Cut-to-length", "Same day before 2pm cutoff", D5.amber, Wrench]
                ].map(([t, d, c, Icon]) => {
                  const I = Icon as typeof Truck;
                  return (
                    <div
                      key={t as string}
                      className="flex items-center gap-2.5 px-3 py-2"
                      style={{ background: D5.panel }}
                    >
                      <I size={14} style={{ color: c as string }} />
                      <span className="text-[11px] font-semibold" style={{ color: D5.ink }}>
                        {t as string}
                      </span>
                      <span className="ml-auto text-[10px]" style={{ color: D5.dim }}>
                        {d as string}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {tab === "docs" ? (
              <div className="space-y-px" style={{ background: D5.line }}>
                {["Mill test report (MTR).pdf", "A500 spec sheet.pdf", "Safety data sheet.pdf"].map(
                  (d) => (
                    <button
                      key={d}
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
                      style={{ background: D5.panel }}
                    >
                      <ShieldCheck size={14} style={{ color: D5.blue }} />
                      <span className="text-[11px]" style={{ color: D5.ink }}>
                        {d}
                      </span>
                      <span
                        className="ml-auto text-[10px] font-bold"
                        style={{ color: D5.accent }}
                      >
                        ↓ GET
                      </span>
                    </button>
                  )
                )}
              </div>
            ) : null}
          </Panel>
        </div>

        {/* sticky buy box */}
        <div className="flex flex-col gap-3">
          <Panel title="Order" hint="// 1-click add">
            <div className="p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-bold" style={{ color: D5.ink }}>
                  {fmt(tier.price)}
                </span>
                <span className="text-[11px]" style={{ color: D5.faint }}>
                  /{p.uom} · {tier.label} tier
                </span>
              </div>

              <div
                className="mt-3 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                Quantity ({p.uom})
              </div>
              <div className="mt-1 flex items-stretch gap-1.5">
                <div
                  className="flex flex-1 items-center rounded border"
                  style={{ borderColor: D5.line }}
                >
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center"
                    style={{ color: D5.dim }}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-transparent text-center text-[15px] font-bold outline-none"
                    style={{ color: D5.ink }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-9 w-9 place-items-center"
                    style={{ color: D5.dim }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {[10, 40, 120].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(q)}
                    className="rounded border px-2 text-[10px] font-bold"
                    style={{
                      borderColor: qty === q ? D5.accent : D5.line,
                      background: qty === q ? D5.accentDim : D5.panelHi,
                      color: qty === q ? D5.accent : D5.dim
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div
                className="mt-3 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                <Ruler size={10} /> cut option
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {CUT.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCut(i)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] font-semibold"
                    style={{
                      background: cut === i ? D5.panelHi : "transparent",
                      color: cut === i ? D5.ink : D5.dim,
                      border: `1px solid ${cut === i ? D5.lineHi : D5.line}`
                    }}
                  >
                    <span
                      className="grid h-3.5 w-3.5 place-items-center rounded-full border"
                      style={{ borderColor: cut === i ? D5.accent : D5.lineHi }}
                    >
                      {cut === i ? <Dot color={D5.accent} /> : null}
                    </span>
                    {c}
                  </button>
                ))}
              </div>

              <div
                className="mt-3 flex items-baseline justify-between border-t pt-2"
                style={{ borderColor: D5.line }}
              >
                <span className="text-[10px]" style={{ color: D5.faint }}>
                  Line total
                </span>
                <span className="text-[18px] font-bold" style={{ color: D5.accent }}>
                  {fmt(line)}
                </span>
              </div>

              <button
                type="button"
                onClick={add}
                className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded text-[12px] font-bold"
                style={{
                  background: added ? D5.accentDim : D5.accent,
                  color: added ? D5.accent : D5.bg
                }}
              >
                {added ? (
                  <>
                    <Check size={15} /> ADDED TO CART
                  </>
                ) : (
                  <>
                    <Plus size={15} /> ADD {qty} TO CART
                  </>
                )}
              </button>
              <div className="mt-2 flex gap-1.5">
                <Btn href="/design-lab/d5/cart" size="sm">
                  View cart
                </Btn>
                <Btn href="/design-lab/d5/category" size="sm">
                  Keep browsing
                </Btn>
              </div>
              <p
                className="mt-2 flex items-center justify-center gap-1 text-[9px]"
                style={{ color: D5.faint }}
              >
                <Kbd>A</Kbd> add · <Kbd>Q</Kbd> quote · <Kbd>↵</Kbd> checkout
              </p>
            </div>
          </Panel>

          <Panel title="Pairs with" hint="// frequently welded together">
            <div className="p-1.5">
              {related.map((r) => (
                <Link
                  key={r.sku}
                  href="/design-lab/d5/product"
                  className="flex items-center gap-2 rounded px-1.5 py-1.5 hover:brightness-125"
                >
                  <span
                    className="h-7 w-7 shrink-0 rounded"
                    style={{ background: r.swatch }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[11px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {r.name}
                    </div>
                    <div className="text-[9px]" style={{ color: D5.faint }}>
                      {r.sku}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: D5.accent }}>
                    {fmt(r.price)}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
