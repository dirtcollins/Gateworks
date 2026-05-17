// Wayfinder admin — products list. Reads the real catalog (Supabase-backed via
// fetchSupabaseProducts on the server, passed in as `products`), then offers
// search, category + stock filtering, and links into the edit form. Stock and
// aisle/bay framing is derived from the warehouse-wayfinding kit.
"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { fmt, wayfinding } from "../kit";
import {
  AdminBtn,
  DataTable,
  Ico,
  Mono,
  Panel,
  PageHead,
  Pill,
  FilterChips,
  Kpi,
  TextInput,
  SelectInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";

type StockTab = "all" | "in_stock" | "low_stock" | "out_of_stock";

const STOCK_TABS: { id: StockTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low_stock", label: "Low" },
  { id: "out_of_stock", label: "Out" }
];

// Aggregate variant inventory into a single product-level stock figure.
function productStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + Math.max(0, variant.inventoryQuantity || 0),
    0
  );
}

function productInStock(product: Product) {
  return product.variants.some((variant) => variant.inventory === "in_stock");
}

function stockState(product: Product): StockTab {
  if (!productInStock(product)) return "out_of_stock";
  return productStock(product) < 18 ? "low_stock" : "in_stock";
}

function priceRange(product: Product) {
  const prices = product.variants.map((variant) => variant.price).filter((n) => n > 0);
  if (!prices.length) return product.price;
  return Math.min(...prices);
}

export function WayfinderProductsList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StockTab>("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => map.set(product.category.slug, product.category.name));
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const hit =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.category.name.toLowerCase().includes(q) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(q));
      const matchCategory = category === "all" || product.category.slug === category;
      const matchTab = tab === "all" || stockState(product) === tab;
      return hit && matchCategory && matchTab;
    });
  }, [products, query, tab, category]);

  const stats = useMemo(() => {
    let inStock = 0;
    let low = 0;
    let out = 0;
    let variantCount = 0;
    products.forEach((product) => {
      variantCount += product.variants.length;
      const state = stockState(product);
      if (state === "in_stock") inStock += 1;
      else if (state === "low_stock") low += 1;
      else out += 1;
    });
    return { inStock, low, out, variantCount };
  }, [products]);

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => {
        const sku = product.variants[0]?.sku;
        return (
          <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 800 }}>{product.title}</span>
            {sku ? (
              <Mono style={{ fontSize: 10, color: wf.muted, letterSpacing: "0.04em" }}>
                SKU {sku}
              </Mono>
            ) : null}
          </div>
        );
      }
    },
    {
      key: "category",
      header: "Category",
      render: (product) => {
        const { aisle } = wayfinding(product.category.slug);
        return (
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{product.category.name}</span>
            <Mono style={{ fontSize: 10, color: wf.muted }}>Aisle {aisle}</Mono>
          </div>
        );
      }
    },
    {
      key: "variants",
      header: "Variants",
      align: "right",
      render: (product) => (
        <Mono style={{ fontWeight: 700 }}>{product.variants.length}</Mono>
      )
    },
    {
      key: "stock",
      header: "On hand",
      align: "right",
      render: (product) => {
        const { bay } = wayfinding(product.id);
        return (
          <div style={{ display: "grid", gap: 2 }}>
            <Mono style={{ fontWeight: 700 }}>{productStock(product)}</Mono>
            <Mono style={{ fontSize: 10, color: wf.muted }}>Bay {bay}</Mono>
          </div>
        );
      }
    },
    {
      key: "state",
      header: "Status",
      render: (product) => {
        const state = stockState(product);
        if (state === "out_of_stock") return <Pill tone="stop">Out</Pill>;
        if (state === "low_stock") return <Pill tone="warn">Low</Pill>;
        return <Pill tone="active">In stock</Pill>;
      }
    },
    {
      key: "price",
      header: "From",
      align: "right",
      render: (product) => <Mono style={{ fontWeight: 700 }}>{fmt(priceRange(product))}</Mono>
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (product) => (
        <AdminBtn
          size="sm"
          variant="primary"
          href={`/wayfinder/admin/products/${encodeURIComponent(product.id)}/edit`}
        >
          Edit
        </AdminBtn>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Catalog & Stock"
        title="Products"
        desc="Every catalog SKU on the warehouse floor — review pricing, variants, and stock, then open a product to edit."
        action={
          <AdminBtn href="/wayfinder/admin/products/new" variant="primary">
            <Ico.plus size={14} /> New product
          </AdminBtn>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))"
        }}
      >
        <Kpi label="Catalog products" value={products.length} hint={`${stats.variantCount} variants`} />
        <Kpi label="In stock" value={stats.inStock} tone="pine" />
        <Kpi label="Low stock" value={stats.low} tone="safety" hint="Below 18 on hand" />
        <Kpi label="Out of stock" value={stats.out} tone="red" />
      </div>

      <Panel
        title="Catalog list"
        meta={`${filtered.length} of ${products.length} products`}
        action={
          <div style={{ width: 260, maxWidth: "48vw" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, SKU, category…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${wf.hairline}`,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <FilterChips value={tab} options={STOCK_TABS} onChange={setTab} />
          <div style={{ width: 220 }}>
            <SelectInput
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{ height: 34, fontSize: 12, fontFamily: monoFont }}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(product) => product.id}
          empty="No products match the current filters."
          onRowHref={(product) =>
            `/wayfinder/admin/products/${encodeURIComponent(product.id)}/edit`
          }
        />
      </Panel>
    </>
  );
}
