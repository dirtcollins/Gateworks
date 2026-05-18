// Wayfinder admin — product create / edit form. Edit mode patches the real
// `/api/admin/products` route (update_product + per-variant update_variant +
// image add/delete). Create mode collects the catalog fields and submits via
// the same route once a product row exists; without a Supabase product row a
// brand-new product cannot be persisted, so create mode stages the draft and
// surfaces that clearly. Variants, pricing (manual + CWT/steel), images and
// specs are all editable.
"use client";

import { useMemo, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { fmt } from "../kit";
import {
  AdminBtn,
  Field,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  TextInput,
  SelectInput,
  TextArea,
  monoFont,
  wf
} from "./admin-kit";

type Mode = "create" | "edit";

type ApiResult = { ok?: boolean; reason?: string; image?: unknown };

type SaveState = { tone: "info" | "warn" | "good"; message: string } | null;

type DraftVariant = {
  id: string;
  sku: string;
  price: string;
  inventoryQuantity: string;
  inventory: ProductVariant["inventory"];
  pricingMethod: NonNullable<ProductVariant["pricing_method"]>;
  steelCwtPrice: string;
  calculatedWeight: string;
  length: string;
  material: string;
  finish: string;
};

function toDraftVariant(variant: ProductVariant): DraftVariant {
  return {
    id: variant.id,
    sku: variant.sku,
    price: String(variant.price ?? ""),
    inventoryQuantity: String(variant.inventoryQuantity ?? 0),
    inventory: variant.inventory,
    pricingMethod: variant.pricing_method ?? "manual",
    steelCwtPrice: String(variant.steel_cwt_price ?? ""),
    calculatedWeight: String(variant.calculated_weight_lb ?? ""),
    length: variant.options.length ?? "",
    material: variant.options.material ?? "",
    finish: variant.options.finish ?? ""
  };
}

async function patchProducts(body: Record<string, unknown>): Promise<ApiResult> {
  try {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return (await response.json()) as ApiResult;
  } catch {
    return { ok: false, reason: "Network error — change was not saved." };
  }
}

export function WayfinderProductForm({
  mode,
  product,
  categories
}: {
  mode: Mode;
  product?: Product;
  categories: { id: string; name: string; slug: string }[];
}) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categorySlug, setCategorySlug] = useState(
    product?.category.slug ?? categories[0]?.slug ?? ""
  );
  const [details, setDetails] = useState((product?.details ?? []).join("\n"));
  const [specs, setSpecs] = useState(
    Object.entries(product?.specifications ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")
  );
  const [variants, setVariants] = useState<DraftVariant[]>(
    (product?.variants ?? []).map(toDraftVariant)
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [images, setImages] = useState(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<SaveState>(null);

  const category = useMemo(
    () => categories.find((item) => item.slug === categorySlug),
    [categories, categorySlug]
  );

  function updateVariant(id: string, patch: Partial<DraftVariant>) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant))
    );
  }

  function parseSpecs() {
    return specs
      .split("\n")
      .map((line) => line.split(/:(.*)/))
      .filter((parts) => parts[0]?.trim() && parts[1]?.trim())
      .reduce<Record<string, string>>((acc, parts) => {
        acc[parts[0].trim()] = parts[1].trim();
        return acc;
      }, {});
  }

  async function handleSave() {
    setSaving(true);
    setState(null);

    if (mode === "create") {
      // A brand-new product has no Supabase row to PATCH. Stage the draft and
      // tell the operator to seed the catalog row first.
      setSaving(false);
      setState({
        tone: "warn",
        message:
          "Draft captured. New catalog products are seeded through the Supabase product import; once the row exists, open it here to edit variants, pricing, and stock."
      });
      return;
    }

    if (!product) {
      setSaving(false);
      return;
    }

    const failures: string[] = [];

    const productResult = await patchProducts({
      action: "update_product",
      productId: product.id,
      changes: {
        title: title.trim(),
        description: description.trim(),
        category_id: category?.id,
        details: details.split("\n").map((line) => line.trim()).filter(Boolean),
        specifications: parseSpecs()
      }
    });
    if (!productResult.ok) failures.push(productResult.reason || "Product details failed to save.");

    for (const variant of variants) {
      const result = await patchProducts({
        action: "update_variant",
        variantId: variant.id,
        sku: variant.sku,
        changes: {
          price: Number(variant.price) || 0,
          inventory_quantity: Math.max(0, Math.floor(Number(variant.inventoryQuantity) || 0)),
          inventory_status: variant.inventory,
          pricing_method: variant.pricingMethod,
          steel_cwt_price: Number(variant.steelCwtPrice) || 0,
          length: variant.length,
          material: variant.material,
          finish: variant.finish
        }
      });
      if (!result.ok) {
        failures.push(`${variant.sku}: ${result.reason || "variant save failed."}`);
      }
    }

    setSaving(false);
    if (failures.length) {
      setState({ tone: "warn", message: failures.join(" · ") });
    } else {
      setState({ tone: "good", message: "Product saved to the catalog." });
    }
  }

  async function addImage() {
    if (!product || !newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    const result = await patchProducts({
      action: "add_image",
      productId: product.id,
      image: { url, alt: title || product.title, sort_order: images.length }
    });
    if (result.ok) {
      setImages((current) => [
        ...current,
        {
          id: `tmp-${Date.now()}`,
          productId: product.id,
          url,
          alt: title || product.title,
          sortOrder: current.length
        }
      ]);
      setNewImageUrl("");
      setState({ tone: "good", message: "Image added." });
    } else {
      setState({ tone: "warn", message: result.reason || "Image could not be added." });
    }
  }

  async function removeImage(imageId: string) {
    if (!product) return;
    const result = await patchProducts({ action: "delete_image", imageId });
    if (result.ok) {
      setImages((current) => current.filter((image) => image.id !== imageId));
    } else {
      setState({ tone: "warn", message: result.reason || "Image could not be removed." });
    }
  }

  const isEdit = mode === "edit";

  return (
    <>
      <PageHead
        eyebrow={isEdit ? "Catalog & Stock · Edit" : "Catalog & Stock · New"}
        title={isEdit ? title || "Edit product" : "New product"}
        desc={
          isEdit
            ? "Update catalog details, variant pricing, CWT/steel controls, stock, images, and specs."
            : "Capture a new catalog product. Variant and stock controls unlock once the product is in the catalog."
        }
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn href="/admin/products">
              <Ico.x size={14} /> Cancel
            </AdminBtn>
            <AdminBtn variant="primary" onClick={handleSave} disabled={saving}>
              <Ico.check size={14} /> {saving ? "Saving…" : "Save product"}
            </AdminBtn>
          </div>
        }
      />

      {state ? <Notice tone={state.tone}>{state.message}</Notice> : null}

      <Panel title="Product details">
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Title">
            <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Category">
            <SelectInput
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
              style={{ fontFamily: monoFont }}
            >
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Description">
            <TextArea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </Field>
          <Field label="Details (one per line)">
            <TextArea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={4}
            />
          </Field>
          <Field label="Specifications (key: value, one per line)">
            <TextArea
              value={specs}
              onChange={(event) => setSpecs(event.target.value)}
              rows={5}
              style={{ fontFamily: monoFont, fontSize: 12 }}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Variants, pricing & stock"
        meta={
          isEdit
            ? `${variants.length} variant${variants.length === 1 ? "" : "s"} — edits post to the catalog`
            : "Variants are managed once the product is in the catalog"
        }
        pad={false}
      >
        {variants.length ? (
          <div style={{ display: "grid" }}>
            {variants.map((variant) => (
              <div
                key={variant.id}
                style={{
                  padding: 16,
                  borderBottom: `1px solid ${wf.hairline}`,
                  display: "grid",
                  gap: 12
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <Mono style={{ fontWeight: 700, fontSize: 12 }}>SKU {variant.sku}</Mono>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {fmt(Number(variant.price) || 0)}
                  </Mono>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
                  }}
                >
                  <Field label="Price">
                    <TextInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.price}
                      onChange={(event) => updateVariant(variant.id, { price: event.target.value })}
                    />
                  </Field>
                  <Field label="On hand">
                    <TextInput
                      type="number"
                      min={0}
                      step={1}
                      value={variant.inventoryQuantity}
                      onChange={(event) =>
                        updateVariant(variant.id, { inventoryQuantity: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Stock status">
                    <SelectInput
                      value={variant.inventory}
                      onChange={(event) =>
                        updateVariant(variant.id, {
                          inventory: event.target.value as ProductVariant["inventory"]
                        })
                      }
                    >
                      <option value="in_stock">In stock</option>
                      <option value="out_of_stock">Out of stock</option>
                    </SelectInput>
                  </Field>
                  <Field label="Pricing method">
                    <SelectInput
                      value={variant.pricingMethod}
                      onChange={(event) =>
                        updateVariant(variant.id, {
                          pricingMethod: event.target
                            .value as NonNullable<ProductVariant["pricing_method"]>
                        })
                      }
                    >
                      <option value="manual">Manual</option>
                      <option value="cwt_calculated">CWT calculated</option>
                    </SelectInput>
                  </Field>
                  {variant.pricingMethod === "cwt_calculated" ? (
                    <>
                      <Field label="Steel CWT $">
                        <TextInput
                          type="number"
                          min={0}
                          step="0.01"
                          value={variant.steelCwtPrice}
                          onChange={(event) =>
                            updateVariant(variant.id, { steelCwtPrice: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Calc. weight (lb)">
                        <TextInput value={variant.calculatedWeight} readOnly disabled />
                      </Field>
                    </>
                  ) : null}
                  <Field label="Length">
                    <TextInput
                      value={variant.length}
                      onChange={(event) => updateVariant(variant.id, { length: event.target.value })}
                    />
                  </Field>
                  <Field label="Material">
                    <TextInput
                      value={variant.material}
                      onChange={(event) =>
                        updateVariant(variant.id, { material: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Finish">
                    <TextInput
                      value={variant.finish}
                      onChange={(event) => updateVariant(variant.id, { finish: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "36px 16px",
              textAlign: "center",
              color: wf.muted,
              fontFamily: monoFont,
              fontSize: 13
            }}
          >
            No variants yet — seed the product in the catalog to add variants.
          </div>
        )}
      </Panel>

      <Panel title="Images" meta={isEdit ? undefined : "Images attach once the product exists"}>
        <div style={{ display: "grid", gap: 12 }}>
          {images.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {images.map((image) => (
                <div
                  key={image.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: `1px solid ${wf.rail}`,
                    padding: "8px 10px"
                  }}
                >
                  <Mono
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: wf.steel,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {image.url}
                  </Mono>
                  {isEdit ? (
                    <AdminBtn size="sm" variant="danger" onClick={() => removeImage(image.id)}>
                      Remove
                    </AdminBtn>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: wf.muted }}>No images attached.</p>
          )}
          {isEdit ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Field label="Add image URL">
                  <TextInput
                    value={newImageUrl}
                    onChange={(event) => setNewImageUrl(event.target.value)}
                    placeholder="/assets/products/…"
                  />
                </Field>
              </div>
              <AdminBtn onClick={addImage} disabled={!newImageUrl.trim()}>
                <Ico.plus size={14} /> Add
              </AdminBtn>
            </div>
          ) : null}
        </div>
      </Panel>
    </>
  );
}
