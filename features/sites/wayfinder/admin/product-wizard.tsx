// Wayfinder admin — guided product/service creation. A five-step wizard that
// walks an operator through getting a new catalog item into the system and
// actually persists it via POST /api/admin/products. Replaces the old create
// form, which could not save. Edit-once-created lives in product-form.tsx.
"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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

type Category = { id: string; name: string; slug: string };
type Kind = "product" | "service";

type VariantDraft = {
  key: string;
  sku: string;
  price: string;
  cost: string;
  qty: string;
  size: string;
  material: string;
  finish: string;
  inStock: boolean;
};

type CreateResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; reason: string }
  | null;

const STEPS = ["Type", "Basics", "Pricing", "Details", "Review"] as const;

function newKey() {
  return Math.random().toString(36).slice(2, 9);
}

function suggestSku(title: string, index: number) {
  const root =
    title
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word.slice(0, 4))
      .join("-") || "SKU";
  return index === 0 ? root : `${root}-${index + 1}`;
}

function emptyVariant(title: string, index: number): VariantDraft {
  return {
    key: newKey(),
    sku: suggestSku(title, index),
    price: "",
    cost: "",
    qty: "0",
    size: "",
    material: "",
    finish: "",
    inStock: true
  };
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSpecs(value: string) {
  return value
    .split("\n")
    .map((line) => line.split(/:(.*)/))
    .filter((parts) => parts[0]?.trim() && parts[1]?.trim())
    .reduce<Record<string, string>>((acc, parts) => {
      acc[parts[0].trim()] = parts[1].trim();
      return acc;
    }, {});
}

export function WayfinderProductWizard({ categories }: { categories: Category[] }) {
  const hasCategories = categories.length > 0;

  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">(
    hasCategories ? "existing" : "new"
  );
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [details, setDetails] = useState("");
  const [specs, setSpecs] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateResult>(null);

  const isService = kind === "service";

  // Seed the first variant once a kind is chosen.
  function chooseKind(next: Kind) {
    setKind(next);
    setVariants((current) =>
      current.length ? current : [emptyVariant(title, 0)]
    );
    setStep(1);
  }

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant
      )
    );
  }

  function addVariant() {
    setVariants((current) => [...current, emptyVariant(title, current.length)]);
  }

  function removeVariant(key: string) {
    setVariants((current) =>
      current.length > 1 ? current.filter((variant) => variant.key !== key) : current
    );
  }

  const categoryLabel = useMemo(() => {
    if (categoryMode === "new") return newCategoryName.trim() || "—";
    return categories.find((category) => category.id === categoryId)?.name || "—";
  }, [categoryMode, newCategoryName, categories, categoryId]);

  const stepValid = useMemo(() => {
    if (step === 0) return kind !== null;
    if (step === 1) {
      const categoryOk =
        categoryMode === "existing" ? Boolean(categoryId) : Boolean(newCategoryName.trim());
      return Boolean(title.trim()) && categoryOk;
    }
    if (step === 2) {
      return (
        variants.length > 0 &&
        variants.every((variant) => {
          const price = Number(variant.price);
          return Boolean(variant.sku.trim()) && Number.isFinite(price) && price >= 0;
        })
      );
    }
    return true;
  }, [step, kind, title, categoryMode, categoryId, newCategoryName, variants]);

  async function submit() {
    setSubmitting(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            title: title.trim(),
            description: description.trim(),
            details: parseLines(details),
            specifications: parseSpecs(specs)
          },
          categoryId: categoryMode === "existing" ? categoryId : undefined,
          newCategoryName: categoryMode === "new" ? newCategoryName.trim() : undefined,
          variants: variants.map((variant) => ({
            sku: variant.sku.trim(),
            price: Number(variant.price) || 0,
            cost: variant.cost.trim() === "" ? undefined : Number(variant.cost) || 0,
            inventoryQuantity: isService ? 9999 : Number(variant.qty) || 0,
            inventoryStatus: isService || variant.inStock ? "in_stock" : "out_of_stock",
            length: isService ? undefined : variant.size.trim() || undefined,
            material: isService ? undefined : variant.material.trim() || undefined,
            finish: isService ? undefined : variant.finish.trim() || undefined
          })),
          images: imageUrl.trim() ? [{ url: imageUrl.trim(), alt: title.trim() }] : []
        })
      });
      const payload = (await response.json()) as
        | { ok: true; productId: string; slug: string }
        | { ok?: false; reason?: string };
      if (payload.ok) {
        setResult({ ok: true, productId: payload.productId, slug: payload.slug });
      } else {
        setResult({ ok: false, reason: payload.reason || "Creation failed." });
      }
    } catch {
      setResult({ ok: false, reason: "Network error — the product was not created." });
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep(0);
    setKind(null);
    setTitle("");
    setDescription("");
    setCategoryMode(hasCategories ? "existing" : "new");
    setCategoryId(categories[0]?.id ?? "");
    setNewCategoryName("");
    setVariants([]);
    setDetails("");
    setSpecs("");
    setImageUrl("");
    setResult(null);
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (result?.ok) {
    return (
      <>
        <PageHead eyebrow="Catalog & stock" title="Item created" />
        <Panel>
          <div style={{ display: "grid", gap: 14, justifyItems: "start", padding: "8px 4px" }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 44,
                height: 44,
                background: "#e7f0ea",
                color: wf.pineDeep
              }}
            >
              <Ico.check size={24} />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: wf.ink }}>
                {title.trim()} is live in the catalog
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: wf.muted }}>
                {variants.length} {variants.length === 1 ? "variant" : "variants"} ·{" "}
                {categoryLabel}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <AdminBtn href={`/admin/products/${result.productId}/edit`} variant="primary">
                <Ico.clipboard size={14} /> Open in editor
              </AdminBtn>
              <AdminBtn href={`/products/${result.slug}`}>
                <Ico.arrowRight size={14} /> View storefront page
              </AdminBtn>
              <AdminBtn onClick={startOver}>
                <Ico.plus size={14} /> Add another
              </AdminBtn>
              <AdminBtn href="/admin/products">All products</AdminBtn>
            </div>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Catalog & stock"
        title="Add a product or service"
        desc="A guided walkthrough — five short steps to get a new catalog item live and sellable."
        action={
          <AdminBtn href="/admin/products">
            <Ico.x size={14} /> Cancel
          </AdminBtn>
        }
      />

      <Stepper current={step} />

      {result && !result.ok ? <Notice tone="warn">{result.reason}</Notice> : null}

      {/* ── Step 0 — Type ─────────────────────────────────────────────────── */}
      {step === 0 ? (
        <Panel title="What are you adding?" meta="Pick one to get started">
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
            }}
          >
            <TypeCard
              active={kind === "product"}
              icon={<Ico.cart size={22} />}
              title="Physical product"
              body="Gates, latches, tubing, hardware. Tracks stock on hand and can have multiple sizes or finishes."
              onClick={() => chooseKind("product")}
            />
            <TypeCard
              active={kind === "service"}
              icon={<Ico.truck size={22} />}
              title="Service"
              body="Installation, fabrication, delivery, or labor. Sold at a flat rate — no stock to track."
              onClick={() => chooseKind("service")}
            />
          </div>
        </Panel>
      ) : null}

      {/* ── Step 1 — Basics ──────────────────────────────────────────────── */}
      {step === 1 ? (
        <Panel
          title="The basics"
          meta={isService ? "Name and categorize the service" : "Name and categorize the product"}
        >
          <div style={{ display: "grid", gap: 16 }}>
            <Field label={isService ? "Service name" : "Product name"}>
              <TextInput
                value={title}
                autoFocus
                placeholder={
                  isService ? "e.g. Gate installation — standard" : "e.g. Heavy-duty gate latch"
                }
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>

            <div style={{ display: "grid", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: wf.steel
                }}
              >
                Category
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <ModeChip
                  active={categoryMode === "existing"}
                  disabled={!hasCategories}
                  onClick={() => setCategoryMode("existing")}
                >
                  Use existing
                </ModeChip>
                <ModeChip
                  active={categoryMode === "new"}
                  onClick={() => setCategoryMode("new")}
                >
                  Create new
                </ModeChip>
              </div>
              {categoryMode === "existing" ? (
                <SelectInput
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <TextInput
                  value={newCategoryName}
                  placeholder="e.g. Gate hardware"
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
              )}
              <Hint>
                {categoryMode === "new"
                  ? "A new category is created the first time you use it."
                  : "Categories group items in the storefront and admin."}
              </Hint>
            </div>

            <Field label="Short description">
              <TextArea
                value={description}
                rows={3}
                placeholder="One or two sentences a customer would read before buying."
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </div>
        </Panel>
      ) : null}

      {/* ── Step 2 — Pricing ─────────────────────────────────────────────── */}
      {step === 2 ? (
        <Panel
          title={isService ? "Rate" : "Pricing & variants"}
          meta={
            isService
              ? "What the service sells for"
              : "Each size, finish, or option is a variant with its own SKU"
          }
          action={
            isService ? undefined : (
              <AdminBtn size="sm" onClick={addVariant}>
                <Ico.plus size={13} /> Add variant
              </AdminBtn>
            )
          }
          pad={false}
        >
          <div style={{ display: "grid" }}>
            {variants.map((variant, index) => (
              <div
                key={variant.key}
                style={{
                  padding: 16,
                  borderBottom:
                    index < variants.length - 1 ? `1px solid ${wf.hairline}` : undefined,
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
                  <Mono style={{ fontWeight: 800, fontSize: 12, color: wf.steel }}>
                    {isService ? "SERVICE" : `VARIANT ${index + 1}`}
                  </Mono>
                  {!isService && variants.length > 1 ? (
                    <AdminBtn
                      size="sm"
                      variant="danger"
                      onClick={() => removeVariant(variant.key)}
                    >
                      Remove
                    </AdminBtn>
                  ) : null}
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
                  }}
                >
                  <Field label="SKU">
                    <TextInput
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(variant.key, { sku: event.target.value })
                      }
                      style={{ fontFamily: monoFont }}
                    />
                  </Field>
                  <Field label={isService ? "Rate ($)" : "Price ($)"}>
                    <TextInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.price}
                      placeholder="0.00"
                      onChange={(event) =>
                        updateVariant(variant.key, { price: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Your cost ($)">
                    <TextInput
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.cost}
                      placeholder="optional"
                      onChange={(event) =>
                        updateVariant(variant.key, { cost: event.target.value })
                      }
                    />
                  </Field>
                  {!isService ? (
                    <>
                      <Field label="On hand">
                        <TextInput
                          type="number"
                          min={0}
                          step={1}
                          value={variant.qty}
                          onChange={(event) =>
                            updateVariant(variant.key, { qty: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Size or length">
                        <TextInput
                          value={variant.size}
                          placeholder="optional"
                          onChange={(event) =>
                            updateVariant(variant.key, { size: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Material">
                        <TextInput
                          value={variant.material}
                          placeholder="optional"
                          onChange={(event) =>
                            updateVariant(variant.key, { material: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Finish">
                        <TextInput
                          value={variant.finish}
                          placeholder="optional"
                          onChange={(event) =>
                            updateVariant(variant.key, { finish: event.target.value })
                          }
                        />
                      </Field>
                    </>
                  ) : null}
                </div>
                {variant.cost.trim() !== "" && Number(variant.price) > 0 ? (
                  <Hint>
                    Margin: {fmt(Number(variant.price) - (Number(variant.cost) || 0))} per
                    unit ·{" "}
                    {(
                      ((Number(variant.price) - (Number(variant.cost) || 0)) /
                        Number(variant.price)) *
                      100
                    ).toFixed(0)}
                    %
                  </Hint>
                ) : (
                  <Hint>
                    Cost is optional but powers the margin numbers in Reports.
                  </Hint>
                )}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {/* ── Step 3 — Details ─────────────────────────────────────────────── */}
      {step === 3 ? (
        <Panel title="Details" meta="All optional — you can fill these in later">
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Selling points (one per line)">
              <TextArea
                value={details}
                rows={4}
                placeholder={"Powder-coated for outdoor use\nFits 1.5\" – 2\" gate frames"}
                onChange={(event) => setDetails(event.target.value)}
              />
            </Field>
            <Field label="Specifications (key: value, one per line)">
              <TextArea
                value={specs}
                rows={4}
                placeholder={"Material: Galvanized steel\nWarranty: 5 years"}
                onChange={(event) => setSpecs(event.target.value)}
                style={{ fontFamily: monoFont, fontSize: 12 }}
              />
            </Field>
            <Field label="Image URL">
              <TextInput
                value={imageUrl}
                placeholder="/assets/products/… or https://…"
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </Field>
            <Hint>Skip anything you don&apos;t have yet — the editor covers it all.</Hint>
          </div>
        </Panel>
      ) : null}

      {/* ── Step 4 — Review ──────────────────────────────────────────────── */}
      {step === 4 ? (
        <Panel title="Review & create" meta="Confirm the essentials, then create">
          <div style={{ display: "grid", gap: 10 }}>
            <ReviewRow label="Type" value={isService ? "Service" : "Physical product"} />
            <ReviewRow label="Name" value={title.trim() || "—"} />
            <ReviewRow label="Category" value={categoryLabel} />
            <ReviewRow
              label={isService ? "Rate" : "Variants"}
              value={
                isService
                  ? fmt(Number(variants[0]?.price) || 0)
                  : `${variants.length} · from ${fmt(
                      Math.min(...variants.map((v) => Number(v.price) || 0))
                    )}`
              }
            />
            <ReviewRow
              label="Description"
              value={description.trim() ? `${description.trim().slice(0, 80)}` : "— none —"}
            />
            <ReviewRow
              label="Extras"
              value={
                [
                  parseLines(details).length ? `${parseLines(details).length} points` : null,
                  Object.keys(parseSpecs(specs)).length
                    ? `${Object.keys(parseSpecs(specs)).length} specs`
                    : null,
                  imageUrl.trim() ? "image" : null
                ]
                  .filter(Boolean)
                  .join(" · ") || "— none —"
              }
            />
          </div>
        </Panel>
      ) : null}

      {/* ── Footer nav ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap"
        }}
      >
        <AdminBtn
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || submitting}
        >
          <Ico.chevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </AdminBtn>
        {step < STEPS.length - 1 ? (
          <AdminBtn
            variant="primary"
            disabled={!stepValid}
            onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
          >
            Continue <Ico.chevronRight size={14} />
          </AdminBtn>
        ) : (
          <AdminBtn variant="primary" disabled={submitting} onClick={submit}>
            <Ico.check size={14} /> {submitting ? "Creating…" : "Create item"}
          </AdminBtn>
        )}
      </div>
    </>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 12px",
              background: active ? wf.control : "#fff",
              border: `1px solid ${active ? wf.control : wf.rail}`,
              flex: "1 1 120px"
            }}
          >
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 18,
                height: 18,
                background: active ? wf.safety : done ? wf.pine : wf.bone,
                color: done || active ? "#fff" : wf.steel,
                fontFamily: monoFont,
                fontSize: 10,
                fontWeight: 800
              }}
            >
              {done ? <Ico.check size={11} /> : index + 1}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: active ? "#fff" : done ? wf.ink : wf.muted
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TypeCard({
  active,
  icon,
  title,
  body,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        display: "grid",
        gap: 8,
        padding: 18,
        cursor: "pointer",
        background: "#fff",
        border: `2px solid ${active ? wf.control : wf.rail}`
      }}
    >
      <span
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 40,
          height: 40,
          background: wf.bone,
          color: wf.ink
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 15, fontWeight: 900, color: wf.ink }}>{title}</span>
      <span style={{ fontSize: 12, color: wf.muted, lineHeight: 1.5 }}>{body}</span>
    </button>
  );
}

function ModeChip({
  active,
  disabled,
  onClick,
  children
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 12px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: active ? wf.control : "#fff",
        color: active ? "#fff" : wf.steel,
        border: `1px solid ${active ? wf.control : wf.rail}`
      }}
    >
      {children}
    </button>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 11, color: wf.muted, fontFamily: monoFont }}>
      {children}
    </p>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        paddingBottom: 8,
        borderBottom: `1px solid ${wf.hairline}`
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: wf.steel }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: wf.ink, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
