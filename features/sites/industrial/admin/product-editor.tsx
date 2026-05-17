"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminField,
  AdminHeader,
  AdminPill,
  AdminSection,
  adminInputClass,
  adminTextareaClass
} from "@/features/sites/industrial/admin/kit";
import { formatPricingMethod } from "@/lib/pricing";
import type { Product, ProductVariant } from "@/lib/types";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin product editor. Drives both /products/new
 * and /products/[id]/edit. Persists to /api/admin/products (PATCH).
 * Create mode is local-state only (no product-create API exists yet).
 * ------------------------------------------------------------------ */

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

type EditorMode = "create" | "edit";

type SpecRow = { key: string; value: string };

type VariantDraft = {
  id: string;
  sku: string;
  price: string;
  inventoryQuantity: string;
  length: string;
  material: string;
  finish: string;
  pricing_method: "manual" | "cwt_calculated";
  steel_cwt_price: string;
};

function toVariantDraft(variant: ProductVariant): VariantDraft {
  return {
    id: variant.id,
    sku: variant.sku,
    price: String(variant.price ?? 0),
    inventoryQuantity: String(variant.inventoryQuantity ?? 0),
    length: variant.options.length ?? "",
    material: variant.options.material ?? "",
    finish: variant.options.finish ?? "",
    pricing_method: variant.pricing_method ?? "manual",
    steel_cwt_price: String(variant.steel_cwt_price ?? "")
  };
}

type PatchPayload =
  | { action: "update_product"; productId: string; changes: Record<string, unknown> }
  | {
      action: "update_variant";
      variantId?: string;
      sku?: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "add_image";
      productId: string;
      image: { url: string; alt: string; sort_order: number };
    }
  | { action: "delete_image"; imageId: string };

async function persist(payload: PatchPayload) {
  const response = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = (await response.json().catch(() => null)) as
    | { reason?: string }
    | null;
  return { ok: response.ok, reason: result?.reason };
}

export function IndustrialProductEditor({
  mode,
  product,
  categories
}: {
  mode: EditorMode;
  product: Product | null;
  categories: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categorySlug, setCategorySlug] = useState(
    product?.category.slug ?? categories[0]?.slug ?? ""
  );
  const [status, setStatus] = useState("active");
  const [details, setDetails] = useState((product?.details ?? []).join("\n"));
  const [specs, setSpecs] = useState<SpecRow[]>(
    product
      ? Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value
        }))
      : [{ key: "", value: "" }]
  );
  const [variants, setVariants] = useState<VariantDraft[]>(
    product && product.variants.length
      ? product.variants.map(toVariantDraft)
      : [
          {
            id: "new-variant-1",
            sku: "",
            price: "0",
            inventoryQuantity: "0",
            length: "",
            material: "",
            finish: "",
            pricing_method: "manual",
            steel_cwt_price: ""
          }
        ]
  );
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const images = useMemo(() => product?.images ?? [], [product]);

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, ...patch } : variant))
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        id: `new-variant-${current.length + 1}`,
        sku: "",
        price: "0",
        inventoryQuantity: "0",
        length: "",
        material: "",
        finish: "",
        pricing_method: "manual",
        steel_cwt_price: ""
      }
    ]);
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  function updateSpec(index: number, patch: Partial<SpecRow>) {
    setSpecs((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    if (mode === "create" || !product || !isUuid(product.id)) {
      // No product-create API yet — record the draft locally and return.
      setSaving(false);
      setMessage(
        mode === "create"
          ? "Draft captured. Connect the product-create API to persist new products."
          : "This catalog product is seed-only and cannot be saved to Supabase."
      );
      return;
    }

    const category = categories.find((entry) => entry.slug === categorySlug);
    const specMap = Object.fromEntries(
      specs
        .filter((row) => row.key.trim())
        .map((row) => [row.key.trim(), row.value])
    );

    const productResult = await persist({
      action: "update_product",
      productId: product.id,
      changes: {
        title,
        description,
        details: details
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        specifications: specMap,
        status,
        ...(category ? { category_id: category.id } : {})
      }
    });

    let failures = productResult.ok ? 0 : 1;

    for (const variant of variants) {
      if (!variant.sku.trim() && !isUuid(variant.id)) continue;
      const variantResult = await persist({
        action: "update_variant",
        variantId: isUuid(variant.id) ? variant.id : undefined,
        sku: variant.sku.trim() || undefined,
        changes: {
          price: Number(variant.price) || 0,
          inventory_quantity: Number(variant.inventoryQuantity) || 0,
          inventory_status:
            Number(variant.inventoryQuantity) > 0 ? "in_stock" : "out_of_stock",
          pricing_method: variant.pricing_method,
          length: variant.length || null,
          material: variant.material || null,
          finish: variant.finish || null,
          ...(variant.steel_cwt_price
            ? { steel_cwt_price: Number(variant.steel_cwt_price) }
            : {})
        }
      });
      if (!variantResult.ok) failures += 1;
    }

    setSaving(false);
    setMessage(
      failures === 0
        ? "Product saved to Supabase."
        : `${failures} change(s) could not be saved. Check the Supabase service role.`
    );
    if (failures === 0) router.refresh();
  }

  async function handleAddImage() {
    if (!product || !isUuid(product.id) || !imageUrl.trim()) return;
    const result = await persist({
      action: "add_image",
      productId: product.id,
      image: {
        url: imageUrl.trim(),
        alt: title || product.title,
        sort_order: images.length + 1
      }
    });
    setMessage(result.ok ? "Image added." : result.reason || "Image was not saved.");
    if (result.ok) {
      setImageUrl("");
      router.refresh();
    }
  }

  async function handleDeleteImage(imageId: string) {
    const result = await persist({ action: "delete_image", imageId });
    setMessage(result.ok ? "Image removed." : result.reason || "Image was not removed.");
    if (result.ok) router.refresh();
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow={mode === "create" ? "Merchandising" : "Edit product"}
        title={mode === "create" ? "New product" : title || "Product"}
        description={
          mode === "create"
            ? "Define the product, variants, and specs for the storefront."
            : "Update product copy, variants, pricing, specs, and media."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              href="/industrial/admin/products"
            >
              <ArrowLeft className="h-4 w-4" /> Products
            </Link>
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:opacity-60"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save product"}
            </button>
          </div>
        }
      />

      {message ? (
        <p className="border border-d1-line bg-d1-card px-4 py-3 text-sm font-semibold text-d1-ink">
          {message}
        </p>
      ) : null}

      <AdminSection title="Product detail">
        <AdminCard className="grid gap-5 p-5">
          <AdminField label="Title">
            <input
              className={adminInputClass}
              onChange={(event) => {
                setTitle(event.target.value);
                if (mode === "create") setSlug(slugify(event.target.value));
              }}
              placeholder="e.g. 2 in Square Steel Tubing"
              value={title}
            />
          </AdminField>
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField label="Slug">
              <input
                className={adminInputClass}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="square-steel-tubing-2in"
                value={slug}
              />
            </AdminField>
            <AdminField label="Category">
              <select
                className={adminInputClass}
                onChange={(event) => setCategorySlug(event.target.value)}
                value={categorySlug}
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </AdminField>
          </div>
          <AdminField label="Status">
            <select
              className={adminInputClass}
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
              <option value="discontinued">Discontinued</option>
              <option value="archived">Archived</option>
            </select>
          </AdminField>
          <AdminField label="Description">
            <textarea
              className={adminTextareaClass}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Storefront-facing product summary"
              rows={3}
              value={description}
            />
          </AdminField>
          <AdminField label="Detail bullets (one per line)">
            <textarea
              className={adminTextareaClass}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={"Hot-rolled steel\nRaw mill finish"}
              rows={4}
              value={details}
            />
          </AdminField>
        </AdminCard>
      </AdminSection>

      <AdminSection
        title="Variants"
        action={
          <button
            className="inline-flex items-center gap-1.5 border border-d1-ink bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
            onClick={addVariant}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> Add variant
          </button>
        }
      >
        <div className="grid gap-3">
          {variants.map((variant, index) => (
            <AdminCard className="grid gap-4 p-5" key={variant.id}>
              <div className="flex items-center justify-between">
                <AdminPill tone="ink">SKU {variant.sku || "—"}</AdminPill>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-d1-steel">
                    {formatPricingMethod(variant.pricing_method)} ·{" "}
                    {formatUsd(Number(variant.price) || 0)}
                  </span>
                  {variants.length > 1 ? (
                    <button
                      aria-label="Remove variant"
                      className="grid h-8 w-8 place-items-center border border-d1-line text-d1-red transition hover:border-d1-red"
                      onClick={() => removeVariant(index)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <AdminField label="SKU">
                  <input
                    className={adminInputClass}
                    onChange={(event) =>
                      updateVariant(index, { sku: event.target.value })
                    }
                    value={variant.sku}
                  />
                </AdminField>
                <AdminField label="Price (USD)">
                  <input
                    className={adminInputClass}
                    inputMode="decimal"
                    onChange={(event) =>
                      updateVariant(index, { price: event.target.value })
                    }
                    value={variant.price}
                  />
                </AdminField>
                <AdminField label="Stock on hand">
                  <input
                    className={adminInputClass}
                    inputMode="numeric"
                    onChange={(event) =>
                      updateVariant(index, {
                        inventoryQuantity: event.target.value
                      })
                    }
                    value={variant.inventoryQuantity}
                  />
                </AdminField>
                <AdminField label="Length / size">
                  <input
                    className={adminInputClass}
                    onChange={(event) =>
                      updateVariant(index, { length: event.target.value })
                    }
                    value={variant.length}
                  />
                </AdminField>
                <AdminField label="Material">
                  <input
                    className={adminInputClass}
                    onChange={(event) =>
                      updateVariant(index, { material: event.target.value })
                    }
                    value={variant.material}
                  />
                </AdminField>
                <AdminField label="Finish">
                  <input
                    className={adminInputClass}
                    onChange={(event) =>
                      updateVariant(index, { finish: event.target.value })
                    }
                    value={variant.finish}
                  />
                </AdminField>
                <AdminField label="Pricing method">
                  <select
                    className={adminInputClass}
                    onChange={(event) =>
                      updateVariant(index, {
                        pricing_method: event.target
                          .value as VariantDraft["pricing_method"]
                      })
                    }
                    value={variant.pricing_method}
                  >
                    <option value="manual">Manual</option>
                    <option value="cwt_calculated">CWT calculated</option>
                  </select>
                </AdminField>
                {variant.pricing_method === "cwt_calculated" ? (
                  <AdminField label="Steel CWT price">
                    <input
                      className={adminInputClass}
                      inputMode="decimal"
                      onChange={(event) =>
                        updateVariant(index, {
                          steel_cwt_price: event.target.value
                        })
                      }
                      value={variant.steel_cwt_price}
                    />
                  </AdminField>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Specifications">
        <AdminCard className="grid gap-3 p-5">
          {specs.map((row, index) => (
            <div className="grid gap-3 sm:grid-cols-2" key={index}>
              <input
                className={adminInputClass}
                onChange={(event) => updateSpec(index, { key: event.target.value })}
                placeholder="Spec name"
                value={row.key}
              />
              <input
                className={adminInputClass}
                onChange={(event) =>
                  updateSpec(index, { value: event.target.value })
                }
                placeholder="Spec value"
                value={row.value}
              />
            </div>
          ))}
          <button
            className="inline-flex w-fit items-center gap-1.5 border border-d1-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:border-d1-ink"
            onClick={() => setSpecs((current) => [...current, { key: "", value: "" }])}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> Add spec
          </button>
        </AdminCard>
      </AdminSection>

      <AdminSection title="Media">
        <AdminCard className="grid gap-4 p-5">
          {images.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {images.map((image) => (
                <div
                  className="flex items-center gap-3 border border-d1-line bg-white p-2"
                  key={image.id}
                >
                  <span className="relative grid h-14 w-14 shrink-0 place-items-center border border-d1-line bg-white">
                    <Image
                      alt={image.alt}
                      className="object-contain p-1"
                      fill
                      quality={45}
                      sizes="56px"
                      src={image.url}
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-d1-steel">
                    {image.alt || image.url}
                  </span>
                  <button
                    aria-label="Delete image"
                    className="grid h-8 w-8 place-items-center border border-d1-line text-d1-red transition hover:border-d1-red"
                    onClick={() => handleDeleteImage(image.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-d1-steel">No images on this product yet.</p>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <AdminField label="Add image by URL">
                <input
                  className={adminInputClass}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="/assets/products/example.jpg"
                  value={imageUrl}
                />
              </AdminField>
            </div>
            <button
              className="inline-flex items-center gap-1.5 border border-d1-ink bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:opacity-50"
              disabled={!imageUrl.trim() || !product || !isUuid(product.id)}
              onClick={handleAddImage}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" /> Add image
            </button>
          </div>
        </AdminCard>
      </AdminSection>
    </div>
  );
}
