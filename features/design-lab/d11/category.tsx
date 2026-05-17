// d11 "Wayfinder" — Catalog / category view.
// Ported from prototype/category.jsx (standard variant): filters sidebar on
// the left, product grid on the right with mono SKU labels and stock/aisle
// tags. Real catalog data via the shared live-data layer.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  categories,
  featuredCategoryProducts,
  featuredCategorySlug,
  getCategoryProducts,
  searchProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  Rating,
  StockTag,
  Tag,
  d11,
  fmt
} from "./kit";

const PRICE_BANDS = ["Under $20", "$20–$50", "$50–$200", "Over $200"];
const FINISHES = ["Black", "Zinc Plated", "Galvanized", "Raw / mill"];
const AVAILABILITY = ["In stock · Bakersfield", "Pickup today", "Delivery today", "Freight"];
const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price ↑" },
  { value: "price-high", label: "Price ↓" },
  { value: "title", label: "A–Z" }
] as const;

function departments() {
  return topCategories.map((category, index) => ({
    slug: category.slug,
    name: category.name,
    aisle: String(8 + index * 4).padStart(2, "0")
  }));
}

function FilterGroup({
  label,
  options,
  open,
  onToggle
}: {
  label: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${d11.hairline}` }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: d11.ink,
          background: open ? d11.paper : "transparent",
          border: "none",
          cursor: "pointer"
        }}
      >
        {label}
        <Ico.chevronDown
          size={14}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
        />
      </button>
      {open ? (
        <div style={{ padding: "4px 14px 14px" }}>
          {options.map((option) => (
            <label
              key={option}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
                fontSize: 13,
                color: d11.ink
              }}
            >
              <input type="checkbox" />
              {option}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function D11Category() {
  const [categorySlug, setCategorySlug] = useState<string>(featuredCategorySlug);
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("featured");
  const [openFilter, setOpenFilter] = useState<string | null>("Price");

  const activeCategory =
    categories.find((category) => category.slug === categorySlug) ?? null;

  const products = useMemo<Product[]>(() => {
    const base =
      categorySlug === featuredCategorySlug
        ? featuredCategoryProducts
        : categorySlug === "all"
          ? searchProducts("")
          : getCategoryProducts(categorySlug);
    const list = [...base];
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [categorySlug, sort]);

  return (
    <D11Shell active="category" departments={departments()}>
      {/* Page header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 16,
          padding: "20px 24px 12px",
          borderBottom: `1px solid ${d11.rail}`,
          background: d11.paper
        }}
      >
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Gateworks Supply · Catalog</Eyebrow>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              color: d11.ink
            }}
          >
            {activeCategory ? activeCategory.name : "Catalog"}
          </h1>
          <p style={{ fontSize: 13, color: d11.steel, marginTop: 6, maxWidth: 560 }}>
            {activeCategory ? activeCategory.name : "All products"} for contractors
            and trade buyers. Same-day pickup at Bakersfield.
          </p>
          <Mono style={{ fontSize: 11, color: d11.muted, marginTop: 8, display: "block" }}>
            {products.length} results · showing 1–{Math.min(products.length, 24)}
          </Mono>
        </div>
        <select
          value={sort}
          onChange={(event) =>
            setSort(event.target.value as (typeof SORTS)[number]["value"])
          }
          style={{
            height: 36,
            border: `1px solid ${d11.rail}`,
            background: "#fff",
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 600,
            color: d11.ink,
            width: 160
          }}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 24,
          padding: "20px 24px 40px"
        }}
      >
        {/* Filter rail */}
        <aside>
          <Eyebrow style={{ marginBottom: 8 }}>Filters</Eyebrow>
          <Card>
            <div style={{ borderBottom: `1px solid ${d11.hairline}` }}>
              <div
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: d11.ink
                }}
              >
                Department
              </div>
              <div style={{ padding: "0 14px 12px", display: "grid", gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setCategorySlug("all")}
                  style={{
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: categorySlug === "all" ? 800 : 600,
                    color: categorySlug === "all" ? d11.ink : d11.steel,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 0"
                  }}
                >
                  All departments
                </button>
                {topCategories.map((category) => {
                  const on = categorySlug === category.slug;
                  return (
                    <button
                      key={category.slug}
                      type="button"
                      onClick={() => setCategorySlug(category.slug)}
                      style={{
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: on ? 800 : 600,
                        color: on ? d11.ink : d11.steel,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 0"
                      }}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <FilterGroup
              label="Price"
              options={PRICE_BANDS}
              open={openFilter === "Price"}
              onToggle={() => setOpenFilter(openFilter === "Price" ? null : "Price")}
            />
            <FilterGroup
              label="Finish"
              options={FINISHES}
              open={openFilter === "Finish"}
              onToggle={() => setOpenFilter(openFilter === "Finish" ? null : "Finish")}
            />
            <FilterGroup
              label="Availability"
              options={AVAILABILITY}
              open={openFilter === "Availability"}
              onToggle={() =>
                setOpenFilter(openFilter === "Availability" ? null : "Availability")
              }
            />
          </Card>
        </aside>

        {/* Product grid */}
        <div>
          {products.length === 0 ? (
            <Card style={{ padding: 48, textAlign: "center" }}>
              <Mono style={{ fontSize: 12, color: d11.muted }}>
                No products in this department.
              </Mono>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 1,
                background: d11.rail,
                border: `1px solid ${d11.rail}`
              }}
            >
              {products.map((product) => {
                const variant = product.variants[0];
                const hasOptions = product.variants.length > 1;
                return (
                  <div
                    key={product.id}
                    style={{ background: "#fff", padding: 14, display: "grid", gap: 8 }}
                  >
                    <Link href="/design-lab/d11/product">
                      <ProductImage product={product} ratio={1} sizes="240px" />
                    </Link>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Mono
                        style={{
                          fontSize: 9,
                          color: d11.muted,
                          textTransform: "uppercase"
                        }}
                      >
                        {product.specifications.Brand ?? "Gateworks"}
                      </Mono>
                      {hasOptions ? (
                        <Tag tone="solid" style={{ fontSize: 8, padding: "1px 5px" }}>
                          {product.variants.length} sizes
                        </Tag>
                      ) : null}
                    </div>
                    <Link
                      href="/design-lab/d11/product"
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: d11.ink,
                        lineHeight: 1.3,
                        minHeight: 38
                      }}
                    >
                      {product.title}
                    </Link>
                    <Mono style={{ fontSize: 10, color: d11.steel }}>
                      SKU {variant?.sku ?? product.id}
                    </Mono>
                    <Rating value={4.7} count={product.variants.length * 18 + 24} size={11} />
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: d11.ink,
                        letterSpacing: "-0.01em"
                      }}
                    >
                      {product.price > 0 ? fmt(product.price) : "Quote"}
                    </div>
                    <StockTag product={product} />
                    <Btn href="/design-lab/d11/product" variant="primary" size="sm" block>
                      <Ico.arrowRight size={14} /> View product
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </D11Shell>
  );
}
