// Wayfinder admin — catalog manager. Category / merchandising overview plus the
// CWT + steel pricing controls. The steel CWT rate persists through the real
// `/api/admin/settings` route (key `steel_cwt_price`); category aisle framing
// is derived from the warehouse-wayfinding kit. Per-category counts and pricing
// mix come from the live catalog passed in by the server route.
"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { fmt, wayfinding } from "../kit";
import {
  AdminBtn,
  DataTable,
  Field,
  Ico,
  Kpi,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";

const DEFAULT_STEEL_CWT = 72;

type CategoryRow = {
  slug: string;
  name: string;
  productCount: number;
  variantCount: number;
  cwtCount: number;
  minPrice: number;
  maxPrice: number;
  inStock: number;
};

function isTubing(slug: string) {
  return slug.includes("tubing") || slug.includes("steel") || slug.includes("metal");
}

export function WayfinderCatalogManager({ products }: { products: Product[] }) {
  const seedCwt = useMemo(() => {
    const tubingVariant = products
      .flatMap((product) => product.variants)
      .find((variant) => variant.steel_cwt_price);
    return tubingVariant?.steel_cwt_price ?? DEFAULT_STEEL_CWT;
  }, [products]);

  const [cwtRate, setCwtRate] = useState(String(seedCwt));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<
    { tone: "info" | "warn" | "good"; message: string } | null
  >(null);

  const rows = useMemo<CategoryRow[]>(() => {
    const map = new Map<string, CategoryRow>();
    products.forEach((product) => {
      const slug = product.category.slug;
      const existing =
        map.get(slug) ??
        ({
          slug,
          name: product.category.name,
          productCount: 0,
          variantCount: 0,
          cwtCount: 0,
          minPrice: Infinity,
          maxPrice: 0,
          inStock: 0
        } satisfies CategoryRow);
      existing.productCount += 1;
      existing.variantCount += product.variants.length;
      product.variants.forEach((variant) => {
        if (variant.pricing_method === "cwt_calculated") existing.cwtCount += 1;
        if (variant.price > 0) {
          existing.minPrice = Math.min(existing.minPrice, variant.price);
          existing.maxPrice = Math.max(existing.maxPrice, variant.price);
        }
        if (variant.inventory === "in_stock") existing.inStock += 1;
      });
      map.set(slug, existing);
    });
    return Array.from(map.values())
      .map((row) => ({ ...row, minPrice: row.minPrice === Infinity ? 0 : row.minPrice }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const totals = useMemo(() => {
    const variantTotal = rows.reduce((sum, row) => sum + row.variantCount, 0);
    const cwtTotal = rows.reduce((sum, row) => sum + row.cwtCount, 0);
    return {
      categories: rows.length,
      variants: variantTotal,
      cwt: cwtTotal,
      manual: variantTotal - cwtTotal
    };
  }, [rows]);

  async function saveCwtRate() {
    const value = Number(cwtRate);
    if (!Number.isFinite(value) || value <= 0) {
      setNotice({ tone: "warn", message: "Enter a valid steel CWT rate." });
      return;
    }
    setSaving(true);
    setNotice(null);
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
      const payload = (await response.json()) as { ok?: boolean; reason?: string };
      if (payload.ok) {
        setNotice({
          tone: "good",
          message: `Steel CWT rate saved at ${fmt(value)}/cwt. CWT-priced variants recalculate on next variant save.`
        });
      } else {
        setNotice({ tone: "warn", message: payload.reason || "CWT rate could not be saved." });
      }
    } catch {
      setNotice({ tone: "warn", message: "Network error — CWT rate was not saved." });
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<CategoryRow>[] = [
    {
      key: "category",
      header: "Category",
      render: (row) => {
        const { aisle } = wayfinding(row.slug);
        return (
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontWeight: 800 }}>{row.name}</span>
            <Mono style={{ fontSize: 10, color: wf.muted }}>
              Aisle {aisle} · {row.slug}
            </Mono>
          </div>
        );
      }
    },
    {
      key: "products",
      header: "Products",
      align: "right",
      render: (row) => <Mono style={{ fontWeight: 700 }}>{row.productCount}</Mono>
    },
    {
      key: "variants",
      header: "Variants",
      align: "right",
      render: (row) => <Mono style={{ fontWeight: 700 }}>{row.variantCount}</Mono>
    },
    {
      key: "pricing",
      header: "Pricing mix",
      render: (row) =>
        isTubing(row.slug) || row.cwtCount > 0 ? (
          <Pill tone="open">CWT · {row.cwtCount}</Pill>
        ) : (
          <Pill tone="neutral">Manual</Pill>
        )
    },
    {
      key: "range",
      header: "Price range",
      align: "right",
      render: (row) => (
        <Mono style={{ fontSize: 12 }}>
          {fmt(row.minPrice)} – {fmt(row.maxPrice)}
        </Mono>
      )
    },
    {
      key: "stock",
      header: "In stock",
      align: "right",
      render: (row) => (
        <Mono style={{ fontWeight: 700, color: row.inStock ? wf.pine : wf.red }}>
          {row.inStock}/{row.variantCount}
        </Mono>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Catalog & Stock"
        title="Catalog manager"
        desc="Merchandising overview by category, plus the steel CWT pricing rate that feeds CWT-calculated tubing variants."
        action={
          <AdminBtn href="/admin/products" variant="primary">
            <Ico.cart size={14} /> Manage products
          </AdminBtn>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.message}</Notice> : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
        }}
      >
        <Kpi label="Categories" value={totals.categories} />
        <Kpi label="Variants" value={totals.variants} />
        <Kpi label="CWT priced" value={totals.cwt} tone="pine" hint="Tubing / steel" />
        <Kpi label="Manual priced" value={totals.manual} />
      </div>

      <Panel
        title="Steel CWT pricing control"
        meta="Persists via /api/admin/settings · key steel_cwt_price"
      >
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "minmax(180px, 240px) auto",
            alignItems: "end"
          }}
        >
          <Field label="Steel rate ($ per cwt)">
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={cwtRate}
              onChange={(event) => setCwtRate(event.target.value)}
              style={{ fontFamily: monoFont }}
            />
          </Field>
          <AdminBtn variant="primary" onClick={saveCwtRate} disabled={saving}>
            <Ico.check size={14} /> {saving ? "Saving…" : "Save CWT rate"}
          </AdminBtn>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: wf.muted }}>
          The CWT rate drives weight-based pricing for square, round, and rectangle tubing.
          {" "}
          {totals.cwt} variant{totals.cwt === 1 ? "" : "s"} currently use CWT-calculated pricing —
          their final price recalculates whenever the variant is saved on the product edit screen.
        </p>
      </Panel>

      <Panel
        title="Categories & merchandising"
        meta={`${rows.length} categories across the catalog`}
        pad={false}
      >
        <DataTable
          columns={columns}
          rows={rows}
          getKey={(row) => row.slug}
          empty="No catalog categories found."
        />
      </Panel>
    </>
  );
}
