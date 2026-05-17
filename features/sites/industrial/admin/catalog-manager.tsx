"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Layers, Save } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminField,
  AdminHeader,
  AdminPill,
  AdminSection,
  AdminStatGrid,
  adminInputClass
} from "@/features/sites/industrial/admin/kit";
import { DEFAULT_STEEL_CWT_PRICE } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin catalog manager. Category merchandising
 * overview plus the steel CWT pricing control wired to
 * /api/admin/settings (key: steel_cwt_price).
 * ------------------------------------------------------------------ */

type CategorySummary = {
  slug: string;
  name: string;
  productCount: number;
  skuCount: number;
  stock: number;
  catalogValue: number;
  isSteel: boolean;
};

function isCwtProduct(product: Product) {
  return (
    product.pricing_method === "cwt_calculated" ||
    product.variants.some((variant) => variant.pricing_method === "cwt_calculated")
  );
}

export function IndustrialCatalogManager({ products }: { products: Product[] }) {
  const [cwtPrice, setCwtPrice] = useState(() => {
    const steelVariant = products
      .flatMap((product) => product.variants)
      .find((variant) => variant.steel_cwt_price);
    return String(steelVariant?.steel_cwt_price || DEFAULT_STEEL_CWT_PRICE);
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const categories = useMemo<CategorySummary[]>(() => {
    const map = new Map<string, CategorySummary>();
    products.forEach((product) => {
      const key = product.category.slug;
      const existing =
        map.get(key) ||
        ({
          slug: key,
          name: product.category.name,
          productCount: 0,
          skuCount: 0,
          stock: 0,
          catalogValue: 0,
          isSteel: false
        } as CategorySummary);
      const stock = product.variants.reduce(
        (sum, variant) => sum + (variant.inventoryQuantity || 0),
        0
      );
      existing.productCount += 1;
      existing.skuCount += product.variants.length;
      existing.stock += stock;
      existing.catalogValue += stock * (product.final_price ?? product.price);
      existing.isSteel = existing.isSteel || isCwtProduct(product);
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const steelProductCount = products.filter(isCwtProduct).length;

  const stats = [
    { label: "Categories", value: String(categories.length) },
    { label: "Products", value: String(products.length) },
    {
      label: "Steel (CWT)",
      value: String(steelProductCount),
      hint: "Recalculated by CWT price"
    },
    {
      label: "Catalog value",
      value: formatUsd(
        categories.reduce((sum, category) => sum + category.catalogValue, 0)
      )
    }
  ];

  async function saveCwtPrice() {
    const value = Number(cwtPrice);
    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter a valid CWT price greater than zero.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "steel_cwt_price",
          value,
          label: "Steel CWT price"
        })
      });
      const result = (await response.json().catch(() => null)) as
        | { reason?: string }
        | null;
      setMessage(
        response.ok
          ? `Steel CWT price saved at ${formatUsd(value)}. Steel products recalculate on next catalog sync.`
          : result?.reason || "CWT price was not saved."
      );
    } catch {
      setMessage("CWT price save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Merchandising"
        title="Catalog"
        description="Category merchandising and steel pricing controls for the storefront."
        action={
          <Link
            className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
            href="/industrial/admin/products"
          >
            <Layers className="h-4 w-4" /> Manage products
          </Link>
        }
      />

      <AdminStatGrid stats={stats} />

      <AdminSection title="Steel CWT pricing">
        <AdminCard className="grid gap-4 p-5">
          <p className="max-w-2xl text-sm text-d1-steel">
            The steel CWT (hundredweight) price drives calculated pricing for all
            square and rectangle tubing. Updating it re-prices every steel SKU on
            the next catalog rebuild.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <AdminField label="Steel CWT price (USD)">
                <input
                  className={adminInputClass}
                  inputMode="decimal"
                  onChange={(event) => setCwtPrice(event.target.value)}
                  value={cwtPrice}
                />
              </AdminField>
            </div>
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:opacity-60"
              disabled={saving}
              onClick={saveCwtPrice}
              type="button"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save CWT price"}
            </button>
          </div>
          {message ? (
            <p className="border border-d1-line bg-white px-3 py-2 text-sm font-semibold text-d1-ink">
              {message}
            </p>
          ) : null}
        </AdminCard>
      </AdminSection>

      <AdminSection title="Categories">
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3 text-right">Products</th>
                <th className="px-4 py-3 text-right">SKUs</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Catalog value</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {categories.map((category) => (
                <tr className="transition hover:bg-d1-paper" key={category.slug}>
                  <td className="px-4 py-3.5 text-sm font-extrabold text-d1-ink">
                    {category.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminPill tone={category.isSteel ? "amber" : "neutral"}>
                      {category.isSteel ? "CWT steel" : "Manual"}
                    </AdminPill>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                    {category.productCount}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                    {category.skuCount}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                    {category.stock}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                    {formatUsd(category.catalogValue)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      <Link
                        className="inline-flex items-center gap-1 bg-d1-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-paper transition hover:bg-d1-pine"
                        href={`/industrial/categories/${category.slug}`}
                      >
                        Storefront <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </AdminSection>
    </div>
  );
}
