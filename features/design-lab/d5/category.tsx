"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  Filter,
  LayoutGrid,
  Minus,
  Plus,
  Rows3,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import { CATEGORIES, PRODUCTS, fmt } from "./data";

type Sort = "sku" | "price" | "stock";

function stockTone(stock: number) {
  if (stock === 0) return { tone: "red" as const, label: "OUT" };
  if (stock < 90) return { tone: "amber" as const, label: "LOW" };
  return { tone: "accent" as const, label: "IN" };
}

export default function D5Category() {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [hub, setHub] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("sku");
  const [view, setView] = useState<"rows" | "grid">("rows");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    let r = PRODUCTS.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (hub && p.hub !== hub) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      if (sort === "price") return a.price - b.price;
      if (sort === "stock") return b.stock - a.stock;
      return a.sku.localeCompare(b.sku);
    });
    return r;
  }, [activeCat, hub, inStockOnly, sort]);

  const getQty = (sku: string) => qty[sku] ?? 1;
  const bump = (sku: string, d: number) =>
    setQty((p) => ({ ...p, [sku]: Math.max(1, getQty(sku) + d) }));
  const add = (sku: string) => {
    setAdded((p) => ({ ...p, [sku]: true }));
    window.setTimeout(() => setAdded((p) => ({ ...p, [sku]: false })), 1100);
  };

  const hubs = ["DEN-01", "COS-02"];

  return (
    <Shell crumb="catalog">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Catalog · {activeCat ?? "All departments"}</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            {rows.length} SKUs · prices reflect PRO tier · cut-to-length available
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: D5.faint }}>
            view
          </span>
          {(["rows", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="grid h-7 w-7 place-items-center rounded border"
              style={{
                borderColor: view === v ? D5.lineHi : D5.line,
                background: view === v ? D5.panelHi : "transparent",
                color: view === v ? D5.accent : D5.faint
              }}
            >
              {v === "rows" ? <Rows3 size={13} /> : <LayoutGrid size={13} />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[214px_1fr]">
        {/* filter rail */}
        <aside className="flex flex-col gap-3">
          <Panel
            title="Filters"
            hint=""
            right={
              <button
                type="button"
                onClick={() => {
                  setActiveCat(null);
                  setHub(null);
                  setInStockOnly(false);
                }}
                className="text-[10px] font-semibold"
                style={{ color: D5.accent }}
              >
                reset
              </button>
            }
          >
            <div className="p-2">
              <div
                className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                <SlidersHorizontal size={10} /> department
              </div>
              {CATEGORIES.map((c) => {
                const on = activeCat === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setActiveCat(on ? null : c.name)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left"
                    style={{ background: on ? D5.panelHi : "transparent" }}
                  >
                    <span
                      className="flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ color: on ? D5.ink : D5.dim }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: c.swatch }}
                      />
                      {c.name}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: on ? D5.accent : D5.faint, fontFamily: mono }}
                    >
                      {on ? "✓" : c.count}
                    </span>
                  </button>
                );
              })}

              <div
                className="mb-1 mt-3 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                hub
              </div>
              <div className="flex gap-1">
                {hubs.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHub(hub === h ? null : h)}
                    className="flex-1 rounded border py-1 text-[10px] font-bold"
                    style={{
                      borderColor: hub === h ? D5.accent : D5.line,
                      background: hub === h ? D5.accentDim : D5.panelHi,
                      color: hub === h ? D5.accent : D5.dim
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>

              <label
                className="mt-3 flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-[11px] font-semibold"
                style={{ background: D5.panelHi, color: D5.dim }}
              >
                <span
                  className="grid h-4 w-4 place-items-center rounded-sm border"
                  style={{
                    borderColor: inStockOnly ? D5.accent : D5.lineHi,
                    background: inStockOnly ? D5.accent : "transparent"
                  }}
                >
                  {inStockOnly ? <Check size={11} style={{ color: D5.bg }} /> : null}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                In-stock only
              </label>
            </div>
          </Panel>

          <Panel title="Sort">
            <div className="flex flex-col p-1.5">
              {(
                [
                  ["sku", "SKU A→Z"],
                  ["price", "Price low→high"],
                  ["stock", "Stock high→low"]
                ] as [Sort, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  className="flex items-center justify-between rounded px-1.5 py-1 text-[11px] font-semibold"
                  style={{
                    background: sort === k ? D5.panelHi : "transparent",
                    color: sort === k ? D5.ink : D5.dim
                  }}
                >
                  {label}
                  {sort === k ? <Dot color={D5.accent} /> : null}
                </button>
              ))}
            </div>
          </Panel>
        </aside>

        {/* results */}
        <div>
          <div
            className="mb-2 flex flex-wrap items-center gap-1.5 rounded-md border px-2.5 py-1.5"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            <Filter size={12} style={{ color: D5.faint }} />
            <span className="text-[10px]" style={{ color: D5.faint }}>
              active:
            </span>
            {[activeCat, hub, inStockOnly ? "in-stock" : null]
              .filter(Boolean)
              .map((f) => (
                <Tag key={f as string} tone="accent">
                  {f}
                  <X size={9} />
                </Tag>
              ))}
            {!activeCat && !hub && !inStockOnly ? (
              <span className="text-[10px]" style={{ color: D5.dim }}>
                none — showing everything
              </span>
            ) : null}
            <span className="ml-auto text-[10px]" style={{ color: D5.faint }}>
              <Kbd>/</Kbd> to focus search
            </span>
          </div>

          {view === "rows" ? (
            <Panel>
              <div
                className="grid grid-cols-[1fr_88px_92px_110px] gap-x-3 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] md:grid-cols-[1fr_72px_88px_92px_128px]"
                style={{ borderColor: D5.line, color: D5.faint }}
              >
                <span>SKU / item</span>
                <span className="hidden text-right md:block">hub</span>
                <span className="text-right">stock</span>
                <span className="text-right">price</span>
                <span className="text-right">order</span>
              </div>
              {rows.map((p) => {
                const st = stockTone(p.stock);
                const out = p.stock === 0;
                return (
                  <div
                    key={p.sku}
                    className="grid grid-cols-[1fr_88px_92px_110px] items-center gap-x-3 border-b px-3 py-2 transition-colors last:border-0 hover:brightness-110 md:grid-cols-[1fr_72px_88px_92px_128px]"
                    style={{ borderColor: D5.line }}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className="h-8 w-8 shrink-0 rounded"
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
                    <span
                      className="hidden text-right text-[10px] md:block"
                      style={{ color: D5.dim }}
                    >
                      {p.hub}
                    </span>
                    <div className="text-right">
                      <Tag tone={st.tone}>{st.label}</Tag>
                      <div className="mt-0.5 text-[9px]" style={{ color: D5.faint }}>
                        {p.stock} {p.uom}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-bold" style={{ color: D5.ink }}>
                        {fmt(p.price)}
                      </div>
                      <div className="text-[9px]" style={{ color: D5.faint }}>
                        /{p.uom}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <div
                        className="flex items-center rounded border"
                        style={{ borderColor: D5.line }}
                      >
                        <button
                          type="button"
                          onClick={() => bump(p.sku, -1)}
                          disabled={out}
                          className="grid h-6 w-5 place-items-center disabled:opacity-30"
                          style={{ color: D5.dim }}
                        >
                          <Minus size={10} />
                        </button>
                        <span
                          className="w-6 text-center text-[11px] font-bold"
                          style={{ color: D5.ink }}
                        >
                          {getQty(p.sku)}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(p.sku, 1)}
                          disabled={out}
                          className="grid h-6 w-5 place-items-center disabled:opacity-30"
                          style={{ color: D5.dim }}
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => add(p.sku)}
                        disabled={out}
                        className="grid h-6 w-6 place-items-center rounded disabled:opacity-30"
                        style={{
                          background: added[p.sku] ? D5.accentDim : D5.accent,
                          color: added[p.sku] ? D5.accent : D5.bg
                        }}
                      >
                        {added[p.sku] ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </Panel>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
              {rows.map((p) => {
                const st = stockTone(p.stock);
                const out = p.stock === 0;
                return (
                  <div
                    key={p.sku}
                    className="flex flex-col rounded-md border"
                    style={{ borderColor: D5.line, background: D5.panel }}
                  >
                    <Link href="/design-lab/d5/product">
                      <div
                        className="relative h-24 rounded-t-md"
                        style={{ background: p.swatch }}
                      >
                        <span className="absolute left-1.5 top-1.5">
                          <Tag tone={st.tone}>{st.label}</Tag>
                        </span>
                      </div>
                    </Link>
                    <div className="flex flex-1 flex-col p-2">
                      <div className="text-[9px]" style={{ color: D5.faint }}>
                        {p.sku}
                      </div>
                      <Link
                        href="/design-lab/d5/product"
                        className="text-[11px] font-semibold leading-tight hover:underline"
                        style={{ color: D5.ink }}
                      >
                        {p.name}
                      </Link>
                      <div
                        className="mt-auto flex items-end justify-between pt-2"
                      >
                        <span className="text-[13px] font-bold" style={{ color: D5.ink }}>
                          {fmt(p.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => add(p.sku)}
                          disabled={out}
                          className="flex h-6 items-center gap-1 rounded px-2 text-[10px] font-bold disabled:opacity-30"
                          style={{
                            background: added[p.sku] ? D5.accentDim : D5.accent,
                            color: added[p.sku] ? D5.accent : D5.bg
                          }}
                        >
                          {added[p.sku] ? <Check size={11} /> : <Plus size={11} />}
                          {added[p.sku] ? "OK" : "ADD"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <Btn href="/design-lab/d5/cart" variant="primary">
              Review cart →
            </Btn>
          </div>
        </div>
      </div>
    </Shell>
  );
}
