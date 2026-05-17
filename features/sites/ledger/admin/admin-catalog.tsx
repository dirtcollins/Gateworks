"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Boxes,
  Check,
  Layers3,
  Loader2,
  PackageSearch,
  Save,
  SlidersHorizontal
} from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { DEFAULT_STEEL_CWT_PRICE, isTubingProduct } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import {
  AdminCard,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill
} from "./admin-kit";

/* Ledger admin — catalog manager. Category / merchandising overview plus
 * the CWT steel pricing control. The steel price persists via the real
 * /api/admin/settings PATCH route (key: steel_cwt_price). */

type SaveState = { tone: "idle" | "saving" | "ok" | "error"; message: string };

type CategoryRow = {
  slug: string;
  name: string;
  productCount: number;
  variantCount: number;
  inventoryValue: number;
  lowStock: number;
  tubing: boolean;
};

function reorderPoint(product: Product) {
  const raw = Number.parseInt(product.specifications["Reorder Point"] || "5", 10);
  return Number.isFinite(raw) ? raw : 5;
}

function isLowStock(product: Product) {
  const stock = product.variants.reduce(
    (total, variant) => total + variant.inventoryQuantity,
    0
  );
  return stock <= reorderPoint(product);
}

export function LedgerAdminCatalog({
  products,
  steelCwtPrice
}: {
  products: Product[];
  steelCwtPrice: number;
}) {
  const [cwtPrice, setCwtPrice] = useState(String(steelCwtPrice || DEFAULT_STEEL_CWT_PRICE));
  const [cwtSave, setCwtSave] = useState<SaveState>({ tone: "idle", message: "" });

  const categories = useMemo<CategoryRow[]>(() => {
    const map = new Map<string, CategoryRow>();
    products.forEach((product) => {
      const existing = map.get(product.category.slug) ?? {
        slug: product.category.slug,
        name: product.category.name,
        productCount: 0,
        variantCount: 0,
        inventoryValue: 0,
        lowStock: 0,
        tubing: isTubingProduct(product)
      };
      existing.productCount += 1;
      existing.variantCount += product.variants.length;
      existing.inventoryValue += product.variants.reduce(
        (sum, variant) => sum + variant.price * variant.inventoryQuantity,
        0
      );
      existing.lowStock += isLowStock(product) ? 1 : 0;
      existing.tubing = existing.tubing || isTubingProduct(product);
      map.set(product.category.slug, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.productCount - a.productCount);
  }, [products]);

  const tubingCount = useMemo(
    () => products.filter((product) => isTubingProduct(product)).length,
    [products]
  );

  const totalValue = categories.reduce((sum, category) => sum + category.inventoryValue, 0);

  async function saveCwtPrice() {
    const value = Number(cwtPrice);
    if (!Number.isFinite(value) || value <= 0) {
      setCwtSave({ tone: "error", message: "Enter a valid CWT price." });
      return;
    }
    setCwtSave({ tone: "saving", message: "Saving steel CWT price…" });
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
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; reason?: string }
        | null;
      if (response.ok && payload?.ok) {
        setCwtSave({
          tone: "ok",
          message: `Steel CWT price set to ${formatUsd(value)} per hundredweight.`
        });
      } else {
        setCwtSave({
          tone: "error",
          message: payload?.reason || "Steel CWT price was not saved."
        });
      }
    } catch {
      setCwtSave({ tone: "error", message: "Network error — price was not saved." });
    }
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Catalog"
        title="Catalog manager"
        description="Category merchandising overview and the steel CWT pricing control that drives tubing prices."
        action={
          <Link href="/ledger/admin/products">
            <AdminPrimaryButton>
              <PackageSearch className="h-4 w-4" /> Manage products
            </AdminPrimaryButton>
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Categories"
          value={String(categories.length)}
          sub="Active merchandising groups"
        />
        <StatTile
          label="Tubing products"
          value={String(tubingCount)}
          sub="Priced by steel CWT"
        />
        <StatTile
          label="Catalog stock value"
          value={formatUsd0(totalValue)}
          sub="Estimated at list price"
        />
      </section>

      {/* Steel CWT pricing control */}
      <AdminCard className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: LEDGER.ink }}>
              Steel CWT pricing
            </h2>
            <p className="mt-0.5 text-[13px]" style={{ color: LEDGER.body }}>
              The cost per hundredweight (100 lb) of steel. Every CWT-calculated tubing
              variant recalculates against this rate.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span
              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: LEDGER.muted }}
            >
              Steel CWT price (USD / 100 lb)
            </span>
            <input
              className="w-44 rounded-xl px-3 py-2 text-[13px] outline-none"
              inputMode="decimal"
              onChange={(event) => setCwtPrice(event.target.value)}
              style={{
                border: `1px solid ${LEDGER.line}`,
                color: LEDGER.ink,
                backgroundColor: LEDGER.surface
              }}
              type="number"
              value={cwtPrice}
            />
          </label>
          <AdminPrimaryButton onClick={saveCwtPrice} disabled={cwtSave.tone === "saving"}>
            {cwtSave.tone === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cwtSave.tone === "ok" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save CWT price
          </AdminPrimaryButton>
          {cwtSave.message ? (
            <span
              className="text-[12px] font-medium"
              style={{
                color:
                  cwtSave.tone === "error"
                    ? LEDGER.rose
                    : cwtSave.tone === "ok"
                      ? LEDGER.mint
                      : LEDGER.body
              }}
            >
              {cwtSave.message}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: LEDGER.muted }}>
          Default rate {formatUsd(DEFAULT_STEEL_CWT_PRICE)} per hundredweight. Saved rates
          apply on the next catalog pricing recalculation.
        </p>
      </AdminCard>

      {/* Category breakdown */}
      <AdminCard>
        <div
          className="flex items-center gap-2 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <Layers3 className="h-4 w-4" style={{ color: LEDGER.indigo }} />
          <h2 className="text-[14px] font-semibold" style={{ color: LEDGER.ink }}>
            Category merchandising
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Products</th>
                <th className="px-5 py-3 text-center">SKUs</th>
                <th className="px-5 py-3 text-right">Stock value</th>
                <th className="px-5 py-3">Pricing</th>
                <th className="px-5 py-3">Health</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={category.slug}
                  style={{ borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}` }}
                >
                  <td className="px-5 py-3.5">
                    <Link
                      className="text-[13px] font-semibold transition hover:underline"
                      href={`/ledger/admin/products?category=${category.slug}`}
                      style={{ color: LEDGER.indigo }}
                    >
                      {category.name}
                    </Link>
                  </td>
                  <td
                    className="px-5 py-3.5 text-center text-[13px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {category.productCount}
                  </td>
                  <td
                    className="px-5 py-3.5 text-center text-[13px] font-medium"
                    style={{ color: LEDGER.body }}
                  >
                    {category.variantCount}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd0(category.inventoryValue)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={category.tubing ? "indigo" : "neutral"}>
                      {category.tubing ? "CWT calculated" : "Manual"}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-3.5">
                    {category.lowStock > 0 ? (
                      <StatusPill tone="amber">
                        {category.lowStock} low stock
                      </StatusPill>
                    ) : (
                      <StatusPill tone="mint">Healthy</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories.length === 0 ? (
          <div
            className="px-5 py-12 text-center text-sm font-medium"
            style={{ color: LEDGER.muted }}
          >
            <Boxes className="mx-auto mb-2 h-8 w-8" />
            No catalog categories loaded.
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}
