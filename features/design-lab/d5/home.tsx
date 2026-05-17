"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Flame,
  History,
  Layers,
  Plus,
  TrendingUp,
  Truck,
  Zap
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import {
  fmt,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  swatchFor,
  toRow,
  topCategories
} from "./data";
import { useCartStore } from "@/lib/cart-store";

const STATS = [
  { label: "Open orders", value: "37", delta: "+5 today", tone: D5.accent },
  { label: "Lines to pick", value: "184", delta: "2 hubs", tone: D5.blue },
  { label: "Backorder SKUs", value: "3", delta: "−1 vs wk", tone: D5.amber },
  { label: "Spend MTD", value: "$48.2k", delta: "+12.4%", tone: D5.accent }
];

export default function D5Home() {
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const addItem = useCartStore((state) => state.addItem);
  const quick = useMemo(() => popularProducts.slice(0, 6).map(toRow), []);
  const recent = useMemo(() => newArrivals.slice(0, 4).map(toRow), []);

  function add(row: ReturnType<typeof toRow>) {
    if (row.variant) {
      addItem({
        productId: row.product.id,
        variantId: row.variant.id,
        title: row.product.title,
        sku: row.variant.sku,
        image: row.variant.image,
        price: row.variant.price,
        quantity: 1,
        options: row.variant.options
      });
    }
    setAdded((p) => ({ ...p, [row.sku]: true }));
    window.setTimeout(() => setAdded((p) => ({ ...p, [row.sku]: false })), 1100);
  }

  return (
    <Shell crumb="home">
      {/* hero / command line */}
      <section
        className="mb-3 overflow-hidden rounded-md border"
        style={{ borderColor: D5.line, background: D5.panel }}
      >
        <div className="grid gap-px md:grid-cols-[1.6fr_1fr]" style={{ background: D5.line }}>
          <div className="p-5" style={{ background: D5.panel }}>
            <Tag tone="accent">
              <Zap size={10} /> compact utility
            </Tag>
            <h1
              className="mt-3 text-[26px] font-bold leading-[1.1] tracking-tight"
              style={{ color: D5.ink }}
            >
              A terminal for steel.
            </h1>
            <p className="mt-2 max-w-md text-[12px] leading-relaxed" style={{ color: D5.dim }}>
              Quote, source, and track gate hardware and structural steel at counter speed.
              No carousels. No fluff. Every SKU two clicks away.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Btn href="/design-lab/d5/category" variant="primary">
                <Layers size={13} /> Browse catalog
              </Btn>
              <Btn href="/design-lab/d5/orders">
                <History size={13} /> Order desk
              </Btn>
              <span
                className="flex items-center gap-1.5 text-[10px]"
                style={{ color: D5.faint }}
              >
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd> to search anything
              </span>
            </div>
          </div>
          <div
            className="flex flex-col justify-between p-5"
            style={{ background: D5.panelHi }}
          >
            <div>
              <div
                className="mb-2 text-[10px] uppercase tracking-[0.16em]"
                style={{ color: D5.faint }}
              >
                Live yard status
              </div>
              {[
                { hub: "DEN-01 Denver", state: "Open · cutting", tone: D5.accent },
                { hub: "COS-02 Colorado Spgs", state: "Open · counter", tone: D5.accent },
                { hub: "Will-call dock", state: "3 ready for pickup", tone: D5.amber }
              ].map((r) => (
                <div
                  key={r.hub}
                  className="flex items-center justify-between border-b py-1.5 last:border-0"
                  style={{ borderColor: D5.line }}
                >
                  <span className="flex items-center gap-2 text-[11px]" style={{ color: D5.ink }}>
                    <Dot color={r.tone} /> {r.hub}
                  </span>
                  <span className="text-[10px]" style={{ color: D5.dim }}>
                    {r.state}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 flex items-center gap-2 rounded border px-2.5 py-2 text-[10px]"
              style={{ borderColor: D5.line, color: D5.dim }}
            >
              <Truck size={13} style={{ color: D5.accent }} /> Free flatbed delivery on orders
              over $750 · cut-to-length same day
            </div>
          </div>
        </div>
      </section>

      {/* stat ribbon */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-md border px-3 py-2.5"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: D5.faint }}
            >
              {s.label}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[20px] font-bold" style={{ color: D5.ink }}>
                {s.value}
              </span>
              <span className="text-[10px]" style={{ color: s.tone }}>
                {s.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* quick-add catalog */}
        <Panel
          title="Quick order"
          hint="// type or click — qty defaults to UOM"
          right={
            <Link
              href="/design-lab/d5/category"
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: D5.accent }}
            >
              full catalog <ArrowUpRight size={11} />
            </Link>
          }
        >
          <div
            className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em]"
            style={{ borderColor: D5.line, color: D5.faint }}
          >
            <span>SKU / item</span>
            <span className="text-right">unit</span>
            <span className="text-right">add</span>
          </div>
          {quick.map((p) => (
            <div
              key={p.sku}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b px-3 py-2 transition-colors last:border-0 hover:brightness-110"
              style={{ borderColor: D5.line }}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span
                  className="h-7 w-7 shrink-0 rounded"
                  style={{ background: p.swatch }}
                />
                <div className="overflow-hidden">
                  <Link
                    href="/design-lab/d5/product"
                    className="block truncate text-[12px] font-semibold hover:underline"
                    style={{ color: D5.ink }}
                  >
                    {p.name}
                  </Link>
                  <div className="truncate text-[10px]" style={{ color: D5.faint }}>
                    <span style={{ color: D5.dim }}>{p.sku}</span> · {p.spec}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-bold" style={{ color: D5.ink }}>
                  {fmt(p.price)}
                </div>
                <div className="text-[9px]" style={{ color: D5.faint }}>
                  /ea
                </div>
              </div>
              <button
                type="button"
                onClick={() => add(p)}
                className="flex h-7 w-16 items-center justify-center gap-1 rounded text-[10px] font-bold transition-colors"
                style={{
                  background: added[p.sku] ? D5.accentDim : D5.accent,
                  color: added[p.sku] ? D5.accent : D5.bg
                }}
              >
                {added[p.sku] ? (
                  <>
                    <Check size={12} /> ADDED
                  </>
                ) : (
                  <>
                    <Plus size={12} /> ADD
                  </>
                )}
              </button>
            </div>
          ))}
        </Panel>

        <div className="flex flex-col gap-3">
          {/* categories */}
          <Panel title="Departments" hint={String(topCategories.length)}>
            <div className="p-1.5">
              {topCategories.map((c) => (
                <Link
                  key={c.slug}
                  href="/design-lab/d5/category"
                  className="flex items-center justify-between rounded px-2 py-1.5 transition-colors hover:brightness-125"
                  style={{ color: D5.ink }}
                >
                  <span className="flex items-center gap-2 text-[11px] font-semibold">
                    <span
                      className="h-3.5 w-3.5 rounded-sm"
                      style={{ background: swatchFor(c.slug) }}
                    />
                    {c.name}
                  </span>
                  <span
                    className="text-[10px]"
                    style={{ color: D5.faint, fontFamily: mono }}
                  >
                    {getCategoryProducts(c.slug).length}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          {/* reorder */}
          <Panel
            title="Reorder"
            hint="// last buys"
            right={<Flame size={12} style={{ color: D5.amber }} />}
          >
            <div className="p-1.5">
              {recent.map((r) => (
                <div
                  key={r.sku}
                  className="flex items-center justify-between rounded px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <div
                      className="truncate text-[11px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {r.sku}
                    </div>
                    <div className="truncate text-[9px]" style={{ color: D5.faint }}>
                      {r.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => add(r)}
                    className="flex h-6 items-center gap-1 rounded border px-2 text-[10px] font-bold"
                    style={{
                      borderColor: D5.line,
                      background: D5.panelHi,
                      color: added[r.sku] ? D5.accent : D5.dim
                    }}
                  >
                    {added[r.sku] ? <Check size={11} /> : <Plus size={11} />}
                    {added[r.sku] ? "OK" : "RE-ADD"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Spend trend" hint="// 8 wk">
            <div className="flex h-24 items-end gap-1 p-3">
              {[42, 55, 38, 61, 70, 58, 79, 92].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${v}%`,
                    background: i === 7 ? D5.accent : D5.accentDim
                  }}
                />
              ))}
            </div>
            <div
              className="flex items-center justify-between border-t px-3 py-1.5 text-[10px]"
              style={{ borderColor: D5.line, color: D5.dim }}
            >
              <span className="flex items-center gap-1">
                <TrendingUp size={11} style={{ color: D5.accent }} /> +12.4% MoM
              </span>
              <Link href="/design-lab/d5/reports" style={{ color: D5.accent }}>
                reports →
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
