"use client";

/** DESIGN 2 — Warehouse Dark · Home / storefront landing */

import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Gauge,
  PackageCheck,
  ShieldCheck,
  Truck,
  Zap
} from "lucide-react";
import {
  AccentButton,
  D2,
  D2Shell,
  Panel,
  PanelHead,
  PartPhoto,
  StatCell,
  Tag,
  mono
} from "./kit";
import {
  getCategoryProducts,
  newArrivals,
  popularProducts,
  products,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

// Marketing copy stays static; numbers below are derived from the real catalog.
const YARD_STATS = [
  {
    label: "SKUs in stock",
    value: products.length.toLocaleString(),
    delta: "live",
    good: true
  },
  { label: "Open orders", value: "37", delta: "4 today", good: true },
  { label: "Avg ship time", value: "1.4d", delta: "0.3d", good: true },
  { label: "Yard capacity", value: "82%", delta: "6%", good: false }
];

// Two-letter zone code from a real category name (e.g. "Gate Hinges" → "GH").
function categoryCode(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const DEPARTMENTS = topCategories.map((category) => {
  const items = getCategoryProducts(category.slug);
  return {
    code: categoryCode(category.name),
    name: category.name,
    count: items.length,
    note: items[0]?.title ?? "Browse stock"
  };
});

const FEED = [
  { t: "08:41", msg: "PO-5512 staged at dock 3", tag: "SHIP" },
  { t: "08:33", msg: "Cycle count complete — Aisle ST-04", tag: "AUDIT" },
  { t: "08:21", msg: "Stock dropped below reorder point", tag: "ALERT" },
  { t: "08:02", msg: "Inbound trailer · 14 pallets structural", tag: "INBOUND" }
];

// Featured rail = real catalog products; first three popular + one new arrival.
const FEATURED_BADGES = ["TOP MOVER", "RESTOCKED", "LOW STOCK", "BULK READY"];
const FEATURED_TONES = ["accent", "muted", "warn", "muted"] as const;
const FEATURED: Array<{
  product: Product;
  badge: string;
  tone: (typeof FEATURED_TONES)[number];
}> = (() => {
  const picks: Product[] = [];
  const seen = new Set<string>();
  for (const product of [...popularProducts, ...newArrivals]) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    picks.push(product);
    if (picks.length === 4) break;
  }
  return picks.map((product, index) => ({
    product,
    badge: FEATURED_BADGES[index],
    tone: FEATURED_TONES[index]
  }));
})();

export function D2Home() {
  return (
    <D2Shell active="storefront" kicker="STOREFRONT // GW-OPS">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[6px] px-6 py-10 sm:px-10 sm:py-14"
        style={{
          background: `linear-gradient(135deg, ${D2.panelHi}, ${D2.bg})`,
          border: `1px solid ${D2.line}`
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `${D2.accent}22` }}
        />
        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <Tag tone="accent">
              <Zap className="h-3 w-3" /> B2B Supply Terminal
            </Tag>
            <h1 className="mt-5 text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[46px]">
              The steel yard,
              <br />
              <span style={{ color: D2.accent }}>wired into one console.</span>
            </h1>
            <p
              className="mt-4 max-w-xl text-[15px] leading-relaxed"
              style={{ color: D2.muted }}
            >
              Gateworks supplies contractors, fabricators and fencing crews with
              gate hardware and structural steel — quoted, priced and dispatched
              from a single live inventory view. Order at 2am, ship at 7.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AccentButton href="/design-lab/d2/category">
                Browse catalog <ArrowUpRight className="h-3.5 w-3.5" />
              </AccentButton>
              <AccentButton ghost href="/design-lab/d2/product">
                View a product
              </AccentButton>
            </div>
          </div>

          {/* live yard panel */}
          <Panel glow>
            <PanelHead title="Yard Status" meta="LIVE" />
            <div className="grid grid-cols-2">
              {YARD_STATS.map((s) => (
                <StatCell key={s.label} {...s} />
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* trust strip */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, t: "Same-day dispatch", s: "Orders in by 1pm MT ship today" },
          { icon: ShieldCheck, t: "Spec-verified steel", s: "Mill certs on every structural lot" },
          { icon: Gauge, t: "Contractor pricing", s: "Tiered rates unlock by volume" }
        ].map((b) => (
          <Panel key={b.t} className="flex items-center gap-3 px-4 py-4">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px]"
              style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
            >
              <b.icon className="h-5 w-5" style={{ color: D2.accent }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold">{b.t}</div>
              <div className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                {b.s}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* categories + feed */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHead
            title="Departments"
            meta={`${DEPARTMENTS.length} ZONES`}
            action={
              <Link
                href="/design-lab/d2/category"
                className={`${mono} text-[11px] uppercase tracking-wider`}
                style={{ color: D2.accent }}
              >
                All →
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {DEPARTMENTS.map((c, i) => (
              <Link
                key={c.code}
                href="/design-lab/d2/category"
                className="group flex items-center gap-3 px-4 py-4 transition"
                style={{
                  borderTop: i > 1 ? `1px solid ${D2.line}` : undefined,
                  borderLeft: i % 2 ? `1px solid ${D2.line}` : undefined
                }}
              >
                <div
                  className={`${mono} grid h-11 w-11 shrink-0 place-items-center rounded-[3px] text-[13px] font-bold`}
                  style={{
                    background: D2.panelHi,
                    color: D2.accent,
                    border: `1px solid ${D2.line}`
                  }}
                >
                  {c.code}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold">{c.name}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
                      style={{ color: D2.accent }}
                    />
                  </div>
                  <div className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                    {c.note}
                  </div>
                </div>
                <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Yard Feed" meta="REALTIME" />
          <ul>
            {FEED.map((f, i) => (
              <li
                key={f.t}
                className="flex items-start gap-3 px-4 py-3.5"
                style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
              >
                <span className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                  {f.t}
                </span>
                <span className="flex-1 text-[12px] leading-snug">{f.msg}</span>
                <Tag tone={f.tag === "ALERT" ? "warn" : "muted"}>{f.tag}</Tag>
              </li>
            ))}
          </ul>
          <div className="px-4 pb-4 pt-2">
            <AccentButton ghost className="w-full" href="/design-lab/d2/orders">
              Open orders console
            </AccentButton>
          </div>
        </Panel>
      </div>

      {/* featured products */}
      <Panel className="mt-6">
        <PanelHead
          title="Featured Stock"
          meta="HOT SKUS"
          action={
            <Link
              href="/design-lab/d2/category"
              className={`${mono} text-[11px] uppercase tracking-wider`}
              style={{ color: D2.accent }}
            >
              Full catalog →
            </Link>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {FEATURED.map(({ product, badge, tone }, i) => {
            const variant = product.variants[0];
            const sku = variant?.sku ?? product.id;
            const stock = variant?.inventoryQuantity ?? 0;
            return (
              <Link
                key={product.id}
                href="/design-lab/d2/product"
                className="group flex flex-col gap-3 p-4 transition hover:bg-white/[0.02]"
                style={{ borderLeft: i > 0 ? `1px solid ${D2.line}` : undefined }}
              >
                <PartPhoto
                  src={product.images[0]?.url ?? variant?.image}
                  alt={product.title}
                  seed={product.id}
                  className="aspect-square w-full"
                  label={sku}
                />
                <div className="flex items-center justify-between">
                  <Tag tone={tone}>{badge}</Tag>
                  <span className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                    {stock} on hand
                  </span>
                </div>
                <div className="text-[13px] font-medium leading-snug">{product.title}</div>
                <div className="mt-auto flex items-baseline justify-between">
                  <span className={`${mono} text-[18px] font-bold`} style={{ color: D2.accent }}>
                    ${product.price.toFixed(2)}
                  </span>
                  <span
                    className={`${mono} flex items-center gap-1 text-[11px] uppercase`}
                    style={{ color: D2.muted }}
                  >
                    <PackageCheck className="h-3.5 w-3.5" /> ea
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* CTA */}
      <section
        className="mt-6 flex flex-col items-center justify-between gap-5 rounded-[6px] px-6 py-8 sm:flex-row sm:px-10"
        style={{
          background: `linear-gradient(120deg, ${D2.accentDim}, ${D2.panel})`,
          border: `1px solid ${D2.accent}44`
        }}
      >
        <div className="flex items-center gap-4">
          <Boxes className="h-9 w-9" style={{ color: D2.accent }} />
          <div>
            <div className="text-[18px] font-bold">Run a standing account.</div>
            <div className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
              Net-30 terms, saved carts, crew-level ordering.
            </div>
          </div>
        </div>
        <AccentButton href="/design-lab/d2/cart">Set up account</AccentButton>
      </section>
    </D2Shell>
  );
}
