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
import { AccentButton, D2, D2Shell, Panel, PanelHead, PartImage, Tag, mono } from "./kit";

type Item = {
  id: string;
  name: string;
  group: string;
  price: number;
  stock: number;
  rating: number;
};

const ITEMS: Item[] = [
  { id: "GW-7740", name: 'Bolt-On Gate Hinge 6" Weld-Free', group: "Hinges", price: 38.5, stock: 240, rating: 4.8 },
  { id: "GW-2208", name: "Galvanized Drop Rod Latch", group: "Latches", price: 24.0, stock: 96, rating: 4.6 },
  { id: "GW-4417", name: "Slide Gate V-Track Roller — Cast", group: "Rollers", price: 19.95, stock: 410, rating: 4.7 },
  { id: "GW-9051", name: 'Steel Square Tube 2"x2"x11ga', group: "Steel", price: 61.75, stock: 18, rating: 4.9 },
  { id: "GW-3390", name: "Gate Anti-Sag Truss Kit", group: "Hinges", price: 52.25, stock: 130, rating: 4.5 },
  { id: "GW-1180", name: "Heavy Gravity Latch — Lockable", group: "Latches", price: 31.4, stock: 0, rating: 4.4 },
  { id: "GW-6602", name: "Cantilever Gate Truck Assembly", group: "Rollers", price: 144.0, stock: 22, rating: 4.8 },
  { id: "GW-2275", name: "Self-Closing Spring Hinge Pair", group: "Hinges", price: 47.8, stock: 188, rating: 4.6 },
  { id: "GW-8810", name: 'Angle Iron 2"x2"x1/4" — 20ft', group: "Steel", price: 88.9, stock: 64, rating: 4.7 },
  { id: "GW-5520", name: "Pad-Lockable Slide Bolt", group: "Latches", price: 16.25, stock: 305, rating: 4.3 },
  { id: "GW-4490", name: "Internal Track Roller — Sealed", group: "Rollers", price: 27.6, stock: 90, rating: 4.6 },
  { id: "GW-7012", name: 'Flat Bar Stock 1/4" x 2" — 20ft', group: "Steel", price: 54.0, stock: 41, rating: 4.5 }
];

const GROUPS = ["All", "Hinges", "Latches", "Rollers", "Steel"];
const SORTS = ["Top rated", "Price ↑", "Price ↓", "Stock"];

export function D2Category() {
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState("Top rated");
  const [query, setQuery] = useState("");
  const [inStock, setInStock] = useState(false);
  const [grid, setGrid] = useState(true);

  const results = useMemo(() => {
    let r = ITEMS.filter((i) => group === "All" || i.group === group);
    if (inStock) r = r.filter((i) => i.stock > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }
    return [...r].sort((a, b) => {
      if (sort === "Price ↑") return a.price - b.price;
      if (sort === "Price ↓") return b.price - a.price;
      if (sort === "Stock") return b.stock - a.stock;
      return b.rating - a.rating;
    });
  }, [group, sort, query, inStock]);

  return (
    <D2Shell active="catalog" kicker="CATALOG // GATE HARDWARE">
      <div
        className={`${mono} mb-5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider`}
        style={{ color: D2.muted }}
      >
        <Link href="/design-lab/d2/home">Storefront</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: D2.accent }}>Gate Hardware</span>
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
                  Subgroup
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
                  <PartImage seed={p.id} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                      {p.id} · {p.group}
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
        <PartImage seed={p.id} className="aspect-[4/3] w-full" label={p.id} />
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
              ★ {p.rating}
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
