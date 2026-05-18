// Wayfinder — category landing. A single department's products with a real
// in-page price-band filter, sort control, and copy. Receives the category +
// its products from the route (data sourced from @/lib/catalog).
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { ProductGrid } from "./product-card";
import { Btn, Eyebrow, Ico, Mono, aisleFor, wf } from "./kit";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price ↑" },
  { value: "price-high", label: "Price ↓" },
  { value: "title", label: "A–Z" }
] as const;

type SortValue = (typeof SORTS)[number]["value"];

const PRICE_BANDS = [
  { id: "all", label: "All prices", test: () => true },
  { id: "u20", label: "Under $20", test: (p: Product) => p.price > 0 && p.price < 20 },
  {
    id: "20-50",
    label: "$20 – $50",
    test: (p: Product) => p.price >= 20 && p.price < 50
  },
  {
    id: "50-200",
    label: "$50 – $200",
    test: (p: Product) => p.price >= 50 && p.price < 200
  },
  { id: "200+", label: "Over $200", test: (p: Product) => p.price >= 200 }
] as const;

export function WayfinderCategory({
  category,
  products
}: {
  category: Category;
  products: Product[];
}) {
  const [sort, setSort] = useState<SortValue>("featured");
  const [band, setBand] = useState<(typeof PRICE_BANDS)[number]["id"]>("all");

  const aisle = aisleFor(category.slug);
  const variantCount = useMemo(
    () => products.reduce((total, product) => total + product.variants.length, 0),
    [products]
  );

  const filtered = useMemo(() => {
    const activeBand = PRICE_BANDS.find((option) => option.id === band) ?? PRICE_BANDS[0];
    const list = products.filter((product) => activeBand.test(product));
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [products, band, sort]);

  return (
    <>
      {/* Breadcrumb */}
      <nav
        style={{
          padding: "10px 24px",
          borderBottom: `1px solid ${wf.rail}`,
          background: wf.bone,
          fontSize: 11,
          color: wf.steel,
          fontWeight: 700,
          letterSpacing: "0.04em"
        }}
      >
        <Link href="/">Home</Link>
        <span style={{ margin: "0 8px", color: wf.rail }}>/</span>
        <Link href="/search">Catalog</Link>
        <span style={{ margin: "0 8px", color: wf.rail }}>/</span>
        <span style={{ color: wf.ink }}>{category.name}</span>
      </nav>

      {/* Department header */}
      <div
        style={{
          padding: "22px 24px 14px",
          borderBottom: `1px solid ${wf.rail}`,
          background: wf.paper,
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <span
          style={{
            fontFamily: "var(--wf-mono), monospace",
            background: wf.ink,
            color: "#fff",
            padding: "8px 12px",
            fontWeight: 800,
            fontSize: 16
          }}
        >
          A{aisle}
        </span>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Eyebrow style={{ marginBottom: 6 }}>Department · Aisle {aisle}</Eyebrow>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              color: wf.ink
            }}
          >
            {category.name}
          </h1>
          <p style={{ fontSize: 13, color: wf.steel, marginTop: 6, maxWidth: 620 }}>
            Contractor-ready {category.name.toLowerCase()} for gate, fence, and
            metal fabrication work — stocked at the Bakersfield warehouse and
            staged for same-day will-call pickup.
          </p>
          <Mono style={{ fontSize: 11, color: wf.muted, marginTop: 8, display: "block" }}>
            {products.length} SKUs · {variantCount} variants in aisle {aisle}
          </Mono>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 24,
          padding: "20px 24px 48px"
        }}
      >
        {/* Filter rail */}
        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div>
            <Eyebrow style={{ marginBottom: 8 }}>Price band</Eyebrow>
            <div style={{ background: "#fff", border: `1px solid ${wf.rail}` }}>
              {PRICE_BANDS.map((option) => {
                const on = option.id === band;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setBand(option.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 14px",
                      fontSize: 13,
                      fontWeight: on ? 800 : 600,
                      color: on ? wf.ink : wf.steel,
                      background: on ? wf.paper : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${wf.hairline}`,
                      cursor: "pointer"
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Btn href="/search" variant="default" size="sm" block>
            <Ico.grid size={14} /> All departments
          </Btn>
        </aside>

        {/* Product grid */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${wf.rail}`,
              marginBottom: 16
            }}
          >
            <Mono style={{ fontSize: 12, color: wf.steel }}>
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </Mono>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              aria-label="Sort products"
              style={{
                height: 36,
                border: `1px solid ${wf.rail}`,
                background: "#fff",
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 600,
                color: wf.ink,
                width: 170
              }}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>

          <ProductGrid products={filtered} />
        </div>
      </div>
    </>
  );
}
