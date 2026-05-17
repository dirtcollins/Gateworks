"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FileDown, PackageSearch, Plus, Search } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { formatPricingMethod } from "@/lib/pricing";
import { getProductImageForSize } from "@/lib/product-image";
import type { Product } from "@/lib/types";
import {
  AdminCard,
  AdminEmpty,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill
} from "./admin-kit";

/* Ledger admin — products catalog list. Searchable / filterable view of
 * the real catalog (Supabase-backed via fetchSupabaseProducts, local
 * fallback). Each row links to the Ledger product editor. */

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

function productStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.inventoryQuantity, 0);
}

function reorderPoint(product: Product) {
  const raw = Number.parseInt(product.specifications["Reorder Point"] || "5", 10);
  return Number.isFinite(raw) ? raw : 5;
}

function stockTone(product: Product): { tone: "mint" | "amber" | "rose"; label: string } {
  const stock = productStock(product);
  if (stock <= 0) return { tone: "rose", label: "Out of stock" };
  if (stock <= reorderPoint(product)) return { tone: "amber", label: "Low stock" };
  return { tone: "mint", label: "In stock" };
}

export function LedgerAdminProducts({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => map.set(product.category.slug, product.category.name));
    return Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        product.title.toLowerCase().includes(normalized) ||
        product.category.name.toLowerCase().includes(normalized) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(normalized));
      const matchesCategory =
        categoryFilter === "all" || product.category.slug === categoryFilter;
      const tone = stockTone(product).tone;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && tone === "mint") ||
        (stockFilter === "low_stock" && tone === "amber") ||
        (stockFilter === "out_of_stock" && tone === "rose");
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const totals = useMemo(() => {
    const variantCount = products.reduce((sum, product) => sum + product.variants.length, 0);
    const lowStock = products.filter((product) => stockTone(product).tone !== "mint").length;
    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        product.variants.reduce(
          (variantSum, variant) => variantSum + variant.price * variant.inventoryQuantity,
          0
        ),
      0
    );
    return { variantCount, lowStock, inventoryValue };
  }, [products]);

  function exportCsv() {
    const headers = ["Product", "Category", "SKUs", "Price", "Pricing", "Stock", "Status"];
    const rows = filtered.map((product) =>
      [
        product.title,
        product.category.name,
        product.variants.length,
        formatUsd(product.final_price ?? product.price),
        formatPricingMethod(product.pricing_method ?? product.variants[0]?.pricing_method),
        productStock(product),
        stockTone(product).label
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ledger-products-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Catalog"
        title="Products"
        description="Every catalog product, its SKU variants, pricing method, and stock position."
        action={
          <div className="flex gap-2">
            <AdminGhostButton onClick={exportCsv}>
              <FileDown className="h-4 w-4" /> Export
            </AdminGhostButton>
            <Link href="/ledger/admin/products/new">
              <AdminPrimaryButton>
                <Plus className="h-4 w-4" /> New product
              </AdminPrimaryButton>
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Catalog products" value={String(products.length)} sub="Distinct items" />
        <StatTile
          label="SKU variants"
          value={String(totals.variantCount)}
          sub="Sellable variants"
        />
        <StatTile
          label="Needs attention"
          value={String(totals.lowStock)}
          sub="Low or out of stock"
          accent={totals.lowStock > 0 ? LEDGER.amber : LEDGER.mint}
        />
      </section>

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filter by category"
              className="rounded-xl px-3 py-2 text-[12px] font-semibold outline-none"
              onChange={(event) => setCategoryFilter(event.target.value)}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={categoryFilter}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by stock"
              className="rounded-xl px-3 py-2 text-[12px] font-semibold outline-none"
              onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={stockFilter}
            >
              <option value="all">All stock</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ border: `1px solid ${LEDGER.line}` }}
          >
            <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
            <input
              aria-label="Search products"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, category, or SKU"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left">
            <thead>
              <tr
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">SKUs</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-center">Stock</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, index) => {
                const variant = product.variants[0];
                const status = stockTone(product);
                const image = getProductImageForSize(
                  product.images[0]?.url || variant?.image || "/assets/logo.svg",
                  "card"
                );
                return (
                  <tr
                    key={product.id}
                    style={{ borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                          style={{ border: `1px solid ${LEDGER.line}` }}
                        >
                          <Image
                            alt={product.title}
                            className="object-contain p-1"
                            fill
                            quality={75}
                            sizes="44px"
                            src={image}
                          />
                        </span>
                        <span className="min-w-0">
                          <Link
                            className="block truncate text-[13px] font-semibold transition hover:underline"
                            href={`/ledger/admin/products/${encodeURIComponent(product.id)}/edit`}
                            style={{ color: LEDGER.indigo }}
                          >
                            {product.title}
                          </Link>
                          <span
                            className="text-[11px] font-medium uppercase tracking-[0.06em]"
                            style={{ color: LEDGER.muted }}
                          >
                            {variant?.sku || "No SKU"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {product.category.name}
                    </td>
                    <td
                      className="px-5 py-3.5 text-center text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {product.variants.length}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(product.final_price ?? product.price)}
                      </p>
                      <p
                        className="text-[11px] font-medium uppercase tracking-[0.06em]"
                        style={{ color: LEDGER.muted }}
                      >
                        {formatPricingMethod(
                          product.pricing_method ?? variant?.pricing_method
                        )}
                      </p>
                    </td>
                    <td
                      className="px-5 py-3.5 text-center text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {productStock(product)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <Link
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                          href={`/ledger/admin/products/${encodeURIComponent(product.id)}/edit`}
                          style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                        >
                          Edit <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <AdminEmpty
            icon={<PackageSearch className="h-9 w-9" />}
            title="No products match this view"
            description="Adjust the search or filters to see catalog products."
          />
        ) : null}
      </AdminCard>

      {filtered.length ? (
        <p className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
          Showing {filtered.length} of {products.length} products · estimated stock value{" "}
          {formatUsd0(totals.inventoryValue)}.
        </p>
      ) : null}
    </div>
  );
}
