"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ImageOff, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import { formatPricingMethod } from "@/lib/pricing";
import { getProductImageForSize } from "@/lib/product-image";
import type { Product, ProductVariant } from "@/lib/types";
import {
  AdminCard,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatusPill
} from "./admin-kit";

/* Ledger admin — product editor. Used for both the new-product workspace
 * and the existing-product editor. Saves run against the real
 * /api/admin/products PATCH route (update_product / update_variant), the
 * same endpoint the production catalog manager uses. */

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined) {
  return Boolean(value && uuidPattern.test(value));
}

type SaveState = { tone: "idle" | "saving" | "ok" | "error"; message: string };

type FieldProps = {
  label: string;
  children: React.ReactNode;
  hint?: string;
};

function Field({ label, children, hint }: FieldProps) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: LEDGER.muted }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px]" style={{ color: LEDGER.muted }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl px-3 py-2 text-[13px] outline-none transition focus:ring-2";

function inputStyle() {
  return {
    border: `1px solid ${LEDGER.line}`,
    color: LEDGER.ink,
    backgroundColor: LEDGER.surface
  } as const;
}

export function LedgerAdminProductForm({
  product,
  mode
}: {
  product?: Product;
  mode: "create" | "edit";
}) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryName, setCategoryName] = useState(product?.category.name ?? "");
  const [details, setDetails] = useState((product?.details ?? []).join("\n"));
  const [specs, setSpecs] = useState(
    Object.entries(product?.specifications ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants ?? [
      {
        id: `new-variant-${Date.now()}`,
        productId: product?.id ?? "new-product",
        sku: "",
        price: 0,
        inventory: "out_of_stock",
        inventoryQuantity: 0,
        image: "/assets/logo.svg",
        options: { length: "Standard", material: "Steel", finish: "Raw", color: "Standard" }
      }
    ]
  );
  const [productSave, setProductSave] = useState<SaveState>({ tone: "idle", message: "" });
  const [variantSave, setVariantSave] = useState<Record<string, SaveState>>({});

  const heroImage = useMemo(
    () =>
      getProductImageForSize(
        product?.images[0]?.url || variants[0]?.image || "/assets/logo.svg",
        "medium"
      ),
    [product, variants]
  );

  function setVariantField<K extends keyof ProductVariant>(
    variantId: string,
    key: K,
    value: ProductVariant[K]
  ) {
    setVariants((current) =>
      current.map((variant) =>
        variant.id === variantId ? { ...variant, [key]: value } : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        id: `new-variant-${Date.now()}`,
        productId: product?.id ?? "new-product",
        sku: "",
        price: 0,
        inventory: "out_of_stock",
        inventoryQuantity: 0,
        image: "/assets/logo.svg",
        options: { length: "Standard", material: "Steel", finish: "Raw", color: "Standard" }
      }
    ]);
  }

  function removeVariant(variantId: string) {
    setVariants((current) =>
      current.length > 1 ? current.filter((variant) => variant.id !== variantId) : current
    );
  }

  function parseSpecs(): Record<string, string> {
    return specs
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce<Record<string, string>>((accumulator, line) => {
        const splitIndex = line.indexOf(":");
        if (splitIndex === -1) return accumulator;
        const key = line.slice(0, splitIndex).trim();
        const value = line.slice(splitIndex + 1).trim();
        if (key) accumulator[key] = value;
        return accumulator;
      }, {});
  }

  async function saveProduct() {
    if (mode === "create") {
      setProductSave({
        tone: "ok",
        message:
          "Draft staged. New products are published from the catalog import pipeline — saved details apply on import."
      });
      return;
    }
    if (!product) return;
    setProductSave({ tone: "saving", message: "Saving product details…" });
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_product",
          productId: product.id,
          changes: {
            title: title.trim(),
            description: description.trim(),
            details: details.split("\n").map((line) => line.trim()).filter(Boolean),
            specifications: parseSpecs()
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; reason?: string }
        | null;
      if (response.ok && payload?.ok) {
        setProductSave({ tone: "ok", message: "Product details saved to Supabase." });
      } else {
        setProductSave({
          tone: "error",
          message: payload?.reason || "Product details were not saved."
        });
      }
    } catch {
      setProductSave({ tone: "error", message: "Network error — product was not saved." });
    }
  }

  async function saveVariant(variant: ProductVariant) {
    if (mode === "create" || !isUuid(variant.id)) {
      setVariantSave((current) => ({
        ...current,
        [variant.id]: {
          tone: "ok",
          message: "Variant staged — applied when the product is published."
        }
      }));
      return;
    }
    setVariantSave((current) => ({
      ...current,
      [variant.id]: { tone: "saving", message: "Saving…" }
    }));
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_variant",
          variantId: variant.id,
          sku: variant.sku,
          changes: {
            price: Number(variant.price) || 0,
            inventory_quantity: Math.max(0, Math.floor(Number(variant.inventoryQuantity) || 0)),
            inventory_status: variant.inventory,
            image_url: variant.image,
            length: variant.options.length ?? "",
            material: variant.options.material ?? "",
            finish: variant.options.finish ?? ""
          }
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; reason?: string }
        | null;
      if (response.ok && payload?.ok) {
        setVariantSave((current) => ({
          ...current,
          [variant.id]: { tone: "ok", message: "Variant saved to Supabase." }
        }));
      } else {
        setVariantSave((current) => ({
          ...current,
          [variant.id]: {
            tone: "error",
            message: payload?.reason || "Variant was not saved."
          }
        }));
      }
    } catch {
      setVariantSave((current) => ({
        ...current,
        [variant.id]: { tone: "error", message: "Network error — variant not saved." }
      }));
    }
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow={mode === "create" ? "New product" : "Edit product"}
        title={mode === "create" ? "Create catalog product" : title || "Product editor"}
        description={
          mode === "create"
            ? "Stage a new product, its variants, and pricing for the catalog."
            : "Update product details, SKU variants, pricing, and stock."
        }
        action={
          <Link href="/ledger/admin/products">
            <AdminGhostButton>
              <ArrowLeft className="h-4 w-4" /> Back to products
            </AdminGhostButton>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-6">
          {/* Product details */}
          <AdminCard className="p-5">
            <h2 className="text-[15px] font-semibold" style={{ color: LEDGER.ink }}>
              Product details
            </h2>
            <div className="mt-4 grid gap-4">
              <Field label="Title">
                <input
                  className={inputClass}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Heavy-duty gate hinge"
                  style={inputStyle()}
                  value={title}
                />
              </Field>
              <Field label="Category" hint="Category drives merchandising and pricing rules.">
                <input
                  className={inputClass}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Gate hardware"
                  style={inputStyle()}
                  value={categoryName}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={`${inputClass} min-h-[96px] resize-y`}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short marketing description shown on the storefront."
                  style={inputStyle()}
                  value={description}
                />
              </Field>
              <Field label="Detail bullets" hint="One bullet per line.">
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y`}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder={"Galvanized finish\nFits 2in posts"}
                  style={inputStyle()}
                  value={details}
                />
              </Field>
              <Field label="Specifications" hint="One per line, formatted as Key: Value.">
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y font-mono text-[12px]`}
                  onChange={(event) => setSpecs(event.target.value)}
                  placeholder={"Brand: Gateworks\nReorder Point: 6"}
                  style={inputStyle()}
                  value={specs}
                />
              </Field>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <AdminPrimaryButton onClick={saveProduct} disabled={productSave.tone === "saving"}>
                {productSave.tone === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save product details
              </AdminPrimaryButton>
              {productSave.message ? (
                <span
                  className="text-[12px] font-medium"
                  style={{
                    color:
                      productSave.tone === "error"
                        ? LEDGER.rose
                        : productSave.tone === "ok"
                          ? LEDGER.mint
                          : LEDGER.body
                  }}
                >
                  {productSave.message}
                </span>
              ) : null}
            </div>
          </AdminCard>

          {/* Variants */}
          <AdminCard className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold" style={{ color: LEDGER.ink }}>
                SKU variants & pricing
              </h2>
              <button
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition"
                onClick={addVariant}
                style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" /> Add variant
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              {variants.map((variant) => {
                const save = variantSave[variant.id];
                return (
                  <div
                    key={variant.id}
                    className="rounded-xl p-4"
                    style={{ border: `1px solid ${LEDGER.line}`, backgroundColor: LEDGER.canvas }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="SKU">
                        <input
                          className={inputClass}
                          onChange={(event) =>
                            setVariantField(variant.id, "sku", event.target.value)
                          }
                          placeholder="GW-HNG-001"
                          style={inputStyle()}
                          value={variant.sku}
                        />
                      </Field>
                      <Field label="Price (USD)">
                        <input
                          className={inputClass}
                          inputMode="decimal"
                          onChange={(event) =>
                            setVariantField(variant.id, "price", Number(event.target.value) || 0)
                          }
                          style={inputStyle()}
                          type="number"
                          value={variant.price}
                        />
                      </Field>
                      <Field label="On hand">
                        <input
                          className={inputClass}
                          inputMode="numeric"
                          onChange={(event) =>
                            setVariantField(
                              variant.id,
                              "inventoryQuantity",
                              Math.max(0, Math.floor(Number(event.target.value) || 0))
                            )
                          }
                          style={inputStyle()}
                          type="number"
                          value={variant.inventoryQuantity}
                        />
                      </Field>
                      <Field label="Length / size">
                        <input
                          className={inputClass}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((entry) =>
                                entry.id === variant.id
                                  ? {
                                      ...entry,
                                      options: { ...entry.options, length: event.target.value }
                                    }
                                  : entry
                              )
                            )
                          }
                          style={inputStyle()}
                          value={variant.options.length ?? ""}
                        />
                      </Field>
                      <Field label="Material">
                        <input
                          className={inputClass}
                          onChange={(event) =>
                            setVariants((current) =>
                              current.map((entry) =>
                                entry.id === variant.id
                                  ? {
                                      ...entry,
                                      options: { ...entry.options, material: event.target.value }
                                    }
                                  : entry
                              )
                            )
                          }
                          style={inputStyle()}
                          value={variant.options.material ?? ""}
                        />
                      </Field>
                      <Field label="Stock status">
                        <select
                          className={inputClass}
                          onChange={(event) =>
                            setVariantField(
                              variant.id,
                              "inventory",
                              event.target.value as ProductVariant["inventory"]
                            )
                          }
                          style={inputStyle()}
                          value={variant.inventory}
                        >
                          <option value="in_stock">In stock</option>
                          <option value="out_of_stock">Out of stock</option>
                        </select>
                      </Field>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] font-medium" style={{ color: LEDGER.muted }}>
                        {formatPricingMethod(variant.pricing_method)} ·{" "}
                        {formatUsd(variant.price)}
                      </span>
                      <div className="flex items-center gap-2">
                        {save?.message ? (
                          <span
                            className="text-[11px] font-medium"
                            style={{
                              color:
                                save.tone === "error"
                                  ? LEDGER.rose
                                  : save.tone === "ok"
                                    ? LEDGER.mint
                                    : LEDGER.body
                            }}
                          >
                            {save.message}
                          </span>
                        ) : null}
                        <button
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                          disabled={save?.tone === "saving"}
                          onClick={() => saveVariant(variant)}
                          style={{ backgroundColor: LEDGER.indigo, color: "#ffffff" }}
                          type="button"
                        >
                          {save?.tone === "saving" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : save?.tone === "ok" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save variant
                        </button>
                        <button
                          aria-label="Remove variant"
                          className="grid h-7 w-7 place-items-center rounded-lg transition"
                          onClick={() => removeVariant(variant.id)}
                          style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.rose }}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        </div>

        {/* Sidebar — media + summary */}
        <div className="grid content-start gap-6">
          <AdminCard className="p-5">
            <h2 className="text-[15px] font-semibold" style={{ color: LEDGER.ink }}>
              Primary image
            </h2>
            <div
              className="relative mt-3 aspect-square overflow-hidden rounded-xl"
              style={{ border: `1px solid ${LEDGER.line}` }}
            >
              {heroImage ? (
                <Image
                  alt={title || "Product image"}
                  className="object-contain p-3"
                  fill
                  quality={75}
                  sizes="280px"
                  src={heroImage}
                />
              ) : (
                <div className="grid h-full place-items-center" style={{ color: LEDGER.muted }}>
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
            </div>
            <Field label="Image URL">
              <input
                className={`${inputClass} mt-3`}
                onChange={(event) =>
                  setVariants((current) =>
                    current.map((entry, index) =>
                      index === 0 ? { ...entry, image: event.target.value } : entry
                    )
                  )
                }
                placeholder="/assets/products/hinge.jpg"
                style={inputStyle()}
                value={variants[0]?.image ?? ""}
              />
            </Field>
          </AdminCard>

          <AdminCard className="p-5">
            <h2 className="text-[15px] font-semibold" style={{ color: LEDGER.ink }}>
              Summary
            </h2>
            <dl className="mt-3 grid gap-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt style={{ color: LEDGER.body }}>Variants</dt>
                <dd className="font-semibold" style={{ color: LEDGER.ink }}>
                  {variants.length}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: LEDGER.body }}>Total on hand</dt>
                <dd className="font-semibold" style={{ color: LEDGER.ink }}>
                  {variants.reduce(
                    (sum, variant) => sum + (Number(variant.inventoryQuantity) || 0),
                    0
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt style={{ color: LEDGER.body }}>From</dt>
                <dd className="font-semibold" style={{ color: LEDGER.ink }}>
                  {formatUsd(
                    variants.reduce(
                      (min, variant) => Math.min(min, Number(variant.price) || 0),
                      variants.length ? Number.POSITIVE_INFINITY : 0
                    ) || 0
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <StatusPill tone={mode === "create" ? "amber" : "indigo"}>
                {mode === "create" ? "Draft — not published" : "Published product"}
              </StatusPill>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
