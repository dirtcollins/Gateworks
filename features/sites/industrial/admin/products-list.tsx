"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, PackageSearch, Plus, Search } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
import { formatPricingMethod } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin products list. Searchable / filterable view
 * of the merged Supabase + seed catalog. Links to the editor.
 * ------------------------------------------------------------------ */

type ProductTab = "all" | "in_stock" | "low_stock" | "out_of_stock" | "cwt";

const LOW_STOCK_THRESHOLD = 12;

function productStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + (variant.inventoryQuantity || 0),
    0
  );
}

function isCwtProduct(product: Product) {
  return (
    product.pricing_method === "cwt_calculated" ||
    product.variants.some((variant) => variant.pricing_method === "cwt_calculated")
  );
}

function matchesTab(product: Product, tab: ProductTab) {
  if (tab === "all") return true;
  if (tab === "cwt") return isCwtProduct(product);
  const stock = productStock(product);
  if (tab === "out_of_stock") return stock <= 0;
  if (tab === "low_stock") return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  return stock > LOW_STOCK_THRESHOLD;
}

const TABS: Array<{ id: ProductTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low_stock", label: "Low" },
  { id: "out_of_stock", label: "Out" },
  { id: "cwt", label: "CWT priced" }
];

export function IndustrialAdminProducts({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ProductTab>("all");
  const [categorySlug, setCategorySlug] = useState("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) =>
      map.set(product.category.slug, product.category.name)
    );
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !term ||
        product.title.toLowerCase().includes(term) ||
        product.category.name.toLowerCase().includes(term) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(term)
        );
      const matchesCategory =
        categorySlug === "all" || product.category.slug === categorySlug;
      return matchesQuery && matchesCategory && matchesTab(product, tab);
    });
  }, [products, query, tab, categorySlug]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count: products.filter((product) => matchesTab(product, entry.id)).length
  }));

  const stats = [
    { label: "Catalog products", value: String(products.length) },
    {
      label: "Total SKUs",
      value: String(
        products.reduce((sum, product) => sum + product.variants.length, 0)
      )
    },
    {
      label: "Low stock",
      value: String(
        products.filter((product) => matchesTab(product, "low_stock")).length
      )
    },
    {
      label: "Out of stock",
      value: String(
        products.filter((product) => matchesTab(product, "out_of_stock")).length
      )
    }
  ];

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Merchandising"
        title="Products"
        description="Every catalog product across the storefront, with stock and pricing at a glance."
        action={
          <Link
            className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            href="/industrial/admin/products/new"
          >
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />

      <AdminStatGrid stats={stats} />

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            className="h-9 border border-d1-line bg-white px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-d1-ink outline-none focus:border-d1-ink"
            onChange={(event) => setCategorySlug(event.target.value)}
            value={categorySlug}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              aria-label="Search products"
              className="h-9 w-52 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product or SKU"
              value={query}
            />
          </div>
        </div>
      </section>

      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">SKUs</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.map((product) => {
                const stock = productStock(product);
                const image =
                  product.images[0]?.url ||
                  product.variants[0]?.image ||
                  "/assets/logo.svg";
                const stockTone =
                  stock <= 0 ? "red" : stock <= LOW_STOCK_THRESHOLD ? "amber" : "pine";
                return (
                  <tr className="transition hover:bg-d1-paper" key={product.id}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="relative grid h-11 w-11 shrink-0 place-items-center border border-d1-line bg-white">
                          <Image
                            alt={product.title}
                            className="object-contain p-1"
                            fill
                            quality={45}
                            sizes="44px"
                            src={image}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-extrabold text-d1-ink">
                            {product.title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {product.variants[0]?.sku || product.slug}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                      {product.category.name}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                      {product.variants.length}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <AdminPill tone={stockTone}>{stock} units</AdminPill>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {formatUsd(product.final_price ?? product.price)}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-d1-steel">
                      {formatPricingMethod(
                        product.pricing_method ||
                          product.variants[0]?.pricing_method
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <Link
                          className="inline-flex items-center gap-1 bg-d1-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-paper transition hover:bg-d1-pine"
                          href={`/industrial/admin/products/${encodeURIComponent(
                            product.id
                          )}/edit`}
                        >
                          Edit <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          icon={<PackageSearch className="h-8 w-8" />}
          title="No products match this view"
          description="Adjust the filters or add a new product."
        />
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {filtered.length} of {products.length} products
      </p>
    </div>
  );
}
