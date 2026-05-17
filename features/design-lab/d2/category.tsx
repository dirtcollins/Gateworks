"use client";

/** DESIGN 2 — Warehouse Dark · Category / product listing */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  LayoutGrid,
  Rows3,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { AccentButton, D2, D2Shell, Panel, PanelHead, PartPhoto, Tag, mono } from "./kit";
import {
  featuredCategoryProducts,
  featuredProduct
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

type Item = {
  id: string;
  sku: string;
  name: string;
  group: string;
  price: number;
  stock: number;
  image?: string;
};

// Real catalog products for the featured category, mapped to the d2 row shape.
const ITEMS: Item[] = featuredCategoryProducts.map((product: Product) => {
  const variant = product.variants[0];
  return {
    id: product.id,
    sku: variant?.sku ?? product.id,
    name: product.title,
    group: variant?.options.material ?? product.category.name,
    price: product.price,
    stock: variant?.inventoryQuantity ?? 0,
    image: product.images[0]?.url ?? variant?.image
  };
});

const CATEGORY_NAME = featuredProduct.category.name;

// Facet groups derived from the real variant materials in this category.
const GROUPS = ["All", ...Array.from(new Set(ITEMS.map((item) => item.group)))];
const SORTS = ["Price ↑", "Price ↓", "Stock", "A–Z"];

export function D2Category() {
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState("Stock");
  const [query, setQuery] = useState("");
  const [inStock, setInStock] = useState(false);
  const [grid, setGrid] = useState(true);

  const results = useMemo(() => {
    let r = ITEMS.filter((i) => group === "All" || i.group === group);
    if (inStock) r = r.filter((i) => i.stock > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }
    return [...r].sort((a, b) => {
      if (sort === "Price ↑") return a.price - b.price;
      if (sort === "Price ↓") return b.price - a.price;
      if (sort === "A–Z") return a.name.localeCompare(b.name);
      return b.stock - a.stock;
    });
  }, [group, sort, query, inStock]);

  return (
    <D2Shell active="catalog" kicker={`CATALOG // ${CATEGORY_NAME.toUpperCase()}`}>
      <div
        className={`${mono} mb-5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider`}
        style={{ color: D2.muted }}
      >
        <Link href="/design-lab/d2/home">Storefront</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: D2.accent }}>{CATEGORY_NAME}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* filter rail */}
        <aside className="flex flex-col gap-4">
          <Panel>
            <PanelHead title="Filter" />
            <div className="p-4">
              <div
                className="flex items-center gap-2 rounded-[3px] px-3 py-2.5"
                style={{ background: D2.bg, border: `1px solid ${D2.line}` }}
              >
                <Search className="h-4 w-4" style={{ color: D2.muted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SKU or name…"
                  className={`${mono} w-full bg-transparent text-[12px] outline-none placeholder:text-[#3f4a52]`}
                />
              </div>

              <div className="mt-4">
                <div
                  className={`${mono} mb-2 text-[10px] uppercase tracking-[0.16em]`}
                  style={{ color: D2.muted }}
                >
                  Material
                </div>
                <div className="flex flex-col gap-1">
                  {GROUPS.map((g) => {
                    const on = g === group;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroup(g)}
                        className={`${mono} flex items-center justify-between rounded-[3px] px-3 py-2 text-[12px] transition`}
                        style={{
                          color: on ? D2.bg : D2.text,
                          background: on ? D2.accent : D2.panelHi,
                          border: `1px solid ${on ? D2.accent : D2.line}`
                        }}
                      >
                        {g}
                        <span style={{ opacity: 0.7 }}>
                          {g === "All"
                            ? ITEMS.length
                            : ITEMS.filter((i) => i.group === g).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label
                className="mt-4 flex cursor-pointer items-center justify-between rounded-[3px] px-3 py-2.5"
                style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
              >
                <span className={`${mono} text-[12px]`}>In stock only</span>
                <button
                  type="button"
                  onClick={() => setInStock((v) => !v)}
                  className="relative h-5 w-9 rounded-full transition"
                  style={{ background: inStock ? D2.accent : D2.line }}
                  aria-pressed={inStock}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
                    style={{
                      left: inStock ? "18px" : "2px",
                      background: inStock ? D2.bg : D2.muted
                    }}
                  />
                </button>
              </label>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" style={{ color: D2.accent }} />
              <span className="text-[12px] font-semibold">Contractor pricing</span>
            </div>
            <p className={`${mono} mt-2 text-[11px] leading-relaxed`} style={{ color: D2.muted }}>
              Sign in to unlock crew & yard tier rates across the full catalog.
            </p>
            <AccentButton ghost className="mt-3 w-full" href="/design-lab/d2/cart">
              Sign in
            </AccentButton>
          </Panel>
        </aside>

        {/* results */}
        <section>
          <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
              <span style={{ color: D2.accent }}>{results.length}</span> of {ITEMS.length} SKUs
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSort(s)}
                    className={`${mono} rounded-[3px] px-2.5 py-1.5 text-[10px] uppercase tracking-wider transition`}
                    style={{
                      color: s === sort ? D2.bg : D2.muted,
                      background: s === sort ? D2.accent : D2.panelHi,
                      border: `1px solid ${s === sort ? D2.accent : D2.line}`
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div
                className="flex items-center rounded-[3px]"
                style={{ border: `1px solid ${D2.line}` }}
              >
                {[
                  { on: grid, set: () => setGrid(true), Icon: LayoutGrid },
                  { on: !grid, set: () => setGrid(false), Icon: Rows3 }
                ].map(({ on, set, Icon }, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={set}
                    className="grid h-8 w-8 place-items-center"
                    style={{ background: on ? D2.accent : "transparent", color: on ? D2.bg : D2.muted }}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {results.length === 0 ? (
            <Panel className="grid place-items-center py-20">
              <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                No SKUs match — adjust filters.
              </span>
            </Panel>
          ) : grid ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <Panel>
              {results.map((p, i) => (
                <Link
                  key={p.id}
                  href="/design-lab/d2/product"
                  className="flex items-center gap-4 p-3.5 transition hover:bg-white/[0.02]"
                  style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
                >
                  <PartPhoto
                    src={p.image}
                    alt={p.name}
                    seed={p.id}
                    className="h-14 w-14 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                      {p.sku} · {p.group}
                    </div>
                    <div className="truncate text-[13px] font-medium">{p.name}</div>
                  </div>
                  <StockChip stock={p.stock} />
                  <span className={`${mono} w-20 text-right text-[14px] font-bold`} style={{ color: D2.accent }}>
                    ${p.price.toFixed(2)}
                  </span>
                </Link>
              ))}
            </Panel>
          )}
        </section>
      </div>
    </D2Shell>
  );
}

function StockChip({ stock }: { stock: number }) {
  if (stock === 0) return <Tag tone="bad">Out</Tag>;
  if (stock < 25) return <Tag tone="warn">{stock} left</Tag>;
  return <Tag tone="accent">{stock} avail</Tag>;
}

function ProductCard({ p }: { p: Item }) {
  return (
    <Link
      href="/design-lab/d2/product"
      className="group flex flex-col rounded-[5px] transition"
      style={{ background: D2.panel, border: `1px solid ${D2.line}` }}
    >
      <div className="p-3 pb-0">
        <PartPhoto
          src={p.image}
          alt={p.name}
          seed={p.id}
          className="aspect-[4/3] w-full"
          label={p.sku}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-center justify-between">
          <span className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
            {p.group}
          </span>
          <StockChip stock={p.stock} />
        </div>
        <div className="text-[13px] font-medium leading-snug">{p.name}</div>
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
              {p.sku}
            </div>
            <div className={`${mono} text-[18px] font-bold`} style={{ color: D2.accent }}>
              ${p.price.toFixed(2)}
            </div>
          </div>
          <span
            className={`${mono} rounded-[3px] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition group-hover:translate-y-0`}
            style={{ background: D2.panelHi, color: D2.accent, border: `1px solid ${D2.line}` }}
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
