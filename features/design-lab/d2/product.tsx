"use client";

/** DESIGN 2 — Warehouse Dark · Product detail */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck
} from "lucide-react";
import {
  AccentButton,
  D2,
  D2Shell,
  Panel,
  PanelHead,
  PartPhoto,
  Tag,
  mono
} from "./kit";
import { featuredProduct, getRelatedProducts } from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";

const PRODUCT = featuredProduct;
const RELATED = getRelatedProducts(PRODUCT, 3);

// Real catalog images for the gallery (deduplicated, capped at four views).
const VIEWS = (() => {
  const urls = Array.from(
    new Set([
      ...PRODUCT.images.map((image) => image.url),
      ...PRODUCT.variants.map((variant) => variant.image)
    ])
  ).filter((url): url is string => Boolean(url));
  const labels = ["FRONT", "PROFILE", "HARDWARE", "INSTALLED"];
  return urls.slice(0, 4).map((url, index) => ({
    code: labels[index] ?? `VIEW ${index + 1}`,
    url
  }));
})();

// Real spec rows from the catalog product, formatted for the d2 spec grid.
const SPECS: Array<[string, string]> = Object.entries(PRODUCT.specifications)
  .filter(([, value]) => Boolean(value) && !value.startsWith("http"))
  .slice(0, 8);

export function D2Product() {
  const addItem = useCartStore((state) => state.addItem);
  const firstAvailable =
    PRODUCT.variants.find((variant) => variant.inventory === "in_stock") ??
    PRODUCT.variants[0];

  const [qty, setQty] = useState(1);
  const [view, setView] = useState(0);
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(
    () => PRODUCT.variants.find((variant) => variant.id === variantId) ?? firstAvailable,
    [variantId, firstAvailable]
  );

  const unit = selectedVariant?.price ?? PRODUCT.price;
  const subtotal = unit * qty;

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      productId: PRODUCT.id,
      variantId: selectedVariant.id,
      title: PRODUCT.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image || PRODUCT.images[0]?.url || "/assets/logo.svg",
      price: selectedVariant.price,
      quantity: qty,
      options: selectedVariant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  const activeView = VIEWS[view] ?? VIEWS[0];

  return (
    <D2Shell active="product" kicker="PRODUCT // SPEC SHEET">
      {/* breadcrumb */}
      <div
        className={`${mono} mb-5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider`}
        style={{ color: D2.muted }}
      >
        <Link href="/design-lab/d2/home">Storefront</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/design-lab/d2/category">{PRODUCT.category.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: D2.accent }}>{firstAvailable?.sku ?? PRODUCT.id}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* gallery */}
        <Panel>
          <PanelHead title="Visual" meta={activeView?.code} />
          <div className="p-4">
            <PartPhoto
              src={activeView?.url}
              alt={PRODUCT.title}
              seed={`${PRODUCT.id}-${view}`}
              className="aspect-[4/3] w-full"
              label={`${firstAvailable?.sku ?? PRODUCT.id} · ${activeView?.code ?? ""}`}
              quality={90}
            />
            {VIEWS.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {VIEWS.map((v, i) => (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => setView(i)}
                    className="rounded-[4px] p-1 transition"
                    style={{
                      border: `1px solid ${i === view ? D2.accent : D2.line}`,
                      boxShadow: i === view ? `0 0 14px ${D2.accent}33` : undefined
                    }}
                  >
                    <PartPhoto
                      src={v.url}
                      alt={`${PRODUCT.title} ${v.code}`}
                      seed={v.url}
                      className="aspect-square w-full"
                    />
                    <span
                      className={`${mono} mt-1 block text-center text-[9px] uppercase`}
                      style={{ color: i === view ? D2.accent : D2.muted }}
                    >
                      {v.code}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Panel>

        {/* buy box */}
        <div className="flex flex-col gap-6">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Tag tone="accent">{firstAvailable?.sku ?? PRODUCT.id}</Tag>
              <Tag tone="muted">{PRODUCT.category.name}</Tag>
            </div>
            <h1 className="mt-3 text-[24px] font-bold leading-tight">{PRODUCT.title}</h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: D2.muted }}>
              {PRODUCT.description}
            </p>

            {/* price + qty */}
            <div
              className="mt-5 rounded-[5px] p-4"
              style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <div
                    className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
                    style={{ color: D2.muted }}
                  >
                    Unit price
                  </div>
                  <div className={`${mono} text-[34px] font-bold leading-none`}>
                    <span style={{ color: D2.accent }}>${unit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                    Subtotal
                  </div>
                  <div className={`${mono} text-[18px] font-bold`}>
                    ${subtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex items-center rounded-[3px]"
                  style={{ border: `1px solid ${D2.line}`, background: D2.bg }}
                >
                  <button
                    type="button"
                    aria-label="decrease"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-11 w-11 place-items-center"
                    style={{ color: D2.accent }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))
                    }
                    className={`${mono} h-11 w-16 bg-transparent text-center text-[16px] font-bold outline-none`}
                  />
                  <button
                    type="button"
                    aria-label="increase"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-11 w-11 place-items-center"
                    style={{ color: D2.accent }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <AccentButton className="flex-1" onClick={handleAddToCart}>
                  {added ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Added to cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to cart
                    </>
                  )}
                </AccentButton>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: Truck, t: "Ships today", s: "Order by 1pm MT" },
                { icon: ShieldCheck, t: "Mill certified", s: "Lot docs included" }
              ].map((x) => (
                <div
                  key={x.t}
                  className="flex items-center gap-2.5 rounded-[3px] px-3 py-2.5"
                  style={{ border: `1px solid ${D2.line}` }}
                >
                  <x.icon className="h-4 w-4 shrink-0" style={{ color: D2.accent }} />
                  <div>
                    <div className="text-[12px] font-semibold">{x.t}</div>
                    <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                      {x.s}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* variant picker (real variants) */}
          <Panel>
            <PanelHead
              title={PRODUCT.variants.length > 1 ? "Select Variant" : "Stock Item"}
              meta={`${PRODUCT.variants.length} SKU${PRODUCT.variants.length === 1 ? "" : "S"}`}
            />
            <div>
              {PRODUCT.variants.map((variant, i) => {
                const on = variant.id === selectedVariant?.id;
                const optionLabel = [
                  variant.options.length,
                  variant.options.finish
                ]
                  .filter((value) => value && value !== "Standard")
                  .join(" · ");
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setVariantId(variant.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition"
                    style={{
                      borderTop: i > 0 ? `1px solid ${D2.line}` : undefined,
                      background: on ? `${D2.accent}10` : undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: on ? D2.accent : D2.line }}
                      />
                      <span className={`${mono} text-[12px]`}>{variant.sku}</span>
                      {optionLabel ? (
                        <Tag tone={on ? "accent" : "muted"}>{optionLabel}</Tag>
                      ) : null}
                    </div>
                    <span
                      className={`${mono} text-[14px] font-bold`}
                      style={{ color: on ? D2.accent : D2.text }}
                    >
                      ${variant.price.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* spec sheet */}
      <Panel className="mt-6">
        <PanelHead
          title="Spec Sheet"
          meta={`DATASHEET ${firstAvailable?.sku ?? PRODUCT.id}`}
          action={
            <span
              className={`${mono} flex items-center gap-1.5 text-[11px] uppercase`}
              style={{ color: D2.accent }}
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </span>
          }
        />
        <div className="grid sm:grid-cols-2">
          {SPECS.map(([k, v], i) => (
            <div
              key={k}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderTop: i > 1 ? `1px solid ${D2.line}` : undefined,
                borderLeft: i % 2 ? `1px solid ${D2.line}` : undefined
              }}
            >
              <span className={`${mono} text-[11px] uppercase`} style={{ color: D2.muted }}>
                {k}
              </span>
              <span className={`${mono} text-[12px] font-medium`}>{v}</span>
            </div>
          ))}
        </div>
        {PRODUCT.details.length ? (
          <ul
            className="border-t px-4 py-3"
            style={{ borderColor: D2.line }}
          >
            {PRODUCT.details.map((detail) => (
              <li
                key={detail}
                className="flex gap-2 py-1 text-[12px]"
                style={{ color: D2.muted }}
              >
                <span style={{ color: D2.accent }}>•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>

      {/* related */}
      {RELATED.length ? (
        <Panel className="mt-6">
          <PanelHead title="Pairs With" meta={`${RELATED.length} ITEMS`} />
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {RELATED.map((r, i) => (
              <Link
                key={r.id}
                href="/design-lab/d2/product"
                className="flex items-center gap-3 p-4 transition hover:bg-white/[0.02]"
                style={{ borderLeft: i > 0 ? `1px solid ${D2.line}` : undefined }}
              >
                <PartPhoto
                  src={r.images[0]?.url ?? r.variants[0]?.image}
                  alt={r.title}
                  seed={r.id}
                  className="h-16 w-16 shrink-0"
                />
                <div className="min-w-0">
                  <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                    {r.variants[0]?.sku ?? r.id}
                  </div>
                  <div className="truncate text-[13px] font-medium">{r.title}</div>
                  <div className={`${mono} text-[13px] font-bold`} style={{ color: D2.accent }}>
                    ${r.price.toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      ) : null}
    </D2Shell>
  );
}
