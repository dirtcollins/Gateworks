"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Truck,
  Wrench
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import { featuredProduct, fmt, getRelatedProducts, swatchFor } from "./data";
import { useCartStore } from "@/lib/cart-store";

const CUT = ["No cut (full length)", "Half length", "Custom — cut sheet"];

export default function D5Product() {
  const p = featuredProduct;
  const addItem = useCartStore((state) => state.addItem);

  const [variantId, setVariantId] = useState(
    (p.variants.find((v) => v.inventory === "in_stock") || p.variants[0])?.id ?? ""
  );
  const [qty, setQty] = useState(1);
  const [cut, setCut] = useState(0);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"specs" | "ship" | "docs">("specs");

  const variant = useMemo(
    () => p.variants.find((v) => v.id === variantId) || p.variants[0],
    [p.variants, variantId]
  );

  const related = useMemo(() => getRelatedProducts(p, 4), [p]);
  const specs = useMemo(() => Object.entries(p.specifications), [p]);
  const line = (variant?.price ?? 0) * qty;
  const inStock = variant?.inventory === "in_stock";
  const heroImage = variant?.image || p.images[0]?.url || "/assets/logo.svg";

  function add() {
    if (!variant) return;
    addItem({
      productId: p.id,
      variantId: variant.id,
      title: p.title,
      sku: variant.sku,
      image: variant.image,
      price: variant.price,
      quantity: qty,
      options: variant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <Shell crumb={`catalog / ${p.category.slug} / ${variant?.sku ?? p.id}`}>
      <div
        className="mb-3 flex items-center gap-1 text-[10px]"
        style={{ color: D5.faint }}
      >
        <Link href="/design-lab/d5/category" style={{ color: D5.accent }}>
          Catalog
        </Link>
        <ChevronRight size={10} />
        <Link href="/design-lab/d5/category" style={{ color: D5.dim }}>
          {p.category.name}
        </Link>
        <ChevronRight size={10} />
        <span style={{ color: D5.ink }}>{variant?.sku ?? p.id}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr_280px]">
        {/* image column */}
        <div className="flex flex-col gap-2">
          <div
            className="relative aspect-square overflow-hidden rounded-md border"
            style={{ borderColor: D5.line, background: D5.panelHi }}
          >
            <Image
              src={heroImage}
              alt={p.title}
              fill
              quality={75}
              sizes="300px"
              className="object-contain p-3"
            />
            <span className="absolute left-2 top-2">
              <Tag tone={inStock ? "accent" : "red"}>
                {inStock ? (
                  <>
                    <Check size={10} /> in stock · {variant?.inventoryQuantity ?? 0}
                  </>
                ) : (
                  "out of stock"
                )}
              </Tag>
            </span>
          </div>
          {p.images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {p.images.slice(0, 4).map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded border"
                  style={{
                    background: D5.panelHi,
                    borderColor: img.url === heroImage ? D5.accent : D5.line
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    quality={75}
                    sizes="72px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* core info */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag tone="dim">{p.category.name}</Tag>
              <span className="text-[10px]" style={{ color: D5.faint }}>
                SKU {variant?.sku ?? p.id}
              </span>
            </div>
            <H>
              <span className="text-[20px]">{p.title}</span>
            </H>
            <p className="mt-1 text-[12px]" style={{ color: D5.dim }}>
              {p.description}
            </p>
          </div>

          {/* variant matrix */}
          {p.variants.length > 1 ? (
            <Panel title="Variants" hint="// select option">
              <div
                className="grid gap-px md:grid-cols-2"
                style={{ background: D5.line }}
              >
                {p.variants.map((v) => {
                  const on = v.id === variant?.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-left"
                      style={{
                        background: on ? D5.accentDim : D5.panel
                      }}
                    >
                      <div className="min-w-0">
                        <div
                          className="truncate text-[11px] font-semibold"
                          style={{ color: on ? D5.accent : D5.ink }}
                        >
                          {[v.options.length, v.options.finish]
                            .filter((x) => x && x !== "Standard")
                            .join(" · ") || v.sku}
                        </div>
                        <div className="text-[9px]" style={{ color: D5.faint }}>
                          {v.sku}
                        </div>
                      </div>
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: on ? D5.accent : D5.ink }}
                      >
                        {fmt(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          ) : null}

          {/* tabbed detail */}
          <Panel
            title={
              tab === "specs" ? "Specifications" : tab === "ship" ? "Fulfillment" : "Details"
            }
            right={
              <div className="flex gap-0.5">
                {(
                  [
                    ["specs", "Specs"],
                    ["ship", "Ship"],
                    ["docs", "Details"]
                  ] as [typeof tab, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTab(k)}
                    className="rounded px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: tab === k ? D5.panelHi : "transparent",
                      color: tab === k ? D5.accent : D5.faint
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
          >
            {tab === "specs" ? (
              <div className="grid grid-cols-2 gap-px" style={{ background: D5.line }}>
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 px-3 py-1.5"
                    style={{ background: D5.panel }}
                  >
                    <span className="text-[10px]" style={{ color: D5.faint }}>
                      {k}
                    </span>
                    <span
                      className="truncate text-right text-[11px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            {tab === "ship" ? (
              <div className="space-y-px" style={{ background: D5.line }}>
                {[
                  ["Will-call DEN-01", "Ready in 30 min", D5.accent, Package],
                  ["Flatbed delivery", "Free over $750 · next-day metro", D5.accent, Truck],
                  ["Cut-to-length", "Same day before 2pm cutoff", D5.amber, Wrench]
                ].map(([t, d, c, Icon]) => {
                  const I = Icon as typeof Truck;
                  return (
                    <div
                      key={t as string}
                      className="flex items-center gap-2.5 px-3 py-2"
                      style={{ background: D5.panel }}
                    >
                      <I size={14} style={{ color: c as string }} />
                      <span className="text-[11px] font-semibold" style={{ color: D5.ink }}>
                        {t as string}
                      </span>
                      <span className="ml-auto text-[10px]" style={{ color: D5.dim }}>
                        {d as string}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {tab === "docs" ? (
              <div className="space-y-px" style={{ background: D5.line }}>
                {p.details.map((d) => (
                  <div
                    key={d}
                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left"
                    style={{ background: D5.panel }}
                  >
                    <ShieldCheck
                      size={14}
                      className="mt-0.5 shrink-0"
                      style={{ color: D5.blue }}
                    />
                    <span className="text-[11px]" style={{ color: D5.ink }}>
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        </div>

        {/* sticky buy box */}
        <div className="flex flex-col gap-3">
          <Panel title="Order" hint="// 1-click add">
            <div className="p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-bold" style={{ color: D5.ink }}>
                  {fmt(variant?.price ?? 0)}
                </span>
                <span className="text-[11px]" style={{ color: D5.faint }}>
                  /ea
                </span>
              </div>

              <div
                className="mt-3 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                Quantity
              </div>
              <div className="mt-1 flex items-stretch gap-1.5">
                <div
                  className="flex flex-1 items-center rounded border"
                  style={{ borderColor: D5.line }}
                >
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center"
                    style={{ color: D5.dim }}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-transparent text-center text-[15px] font-bold outline-none"
                    style={{ color: D5.ink }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-9 w-9 place-items-center"
                    style={{ color: D5.dim }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {[5, 10, 25].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(q)}
                    className="rounded border px-2 text-[10px] font-bold"
                    style={{
                      borderColor: qty === q ? D5.accent : D5.line,
                      background: qty === q ? D5.accentDim : D5.panelHi,
                      color: qty === q ? D5.accent : D5.dim
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div
                className="mt-3 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em]"
                style={{ color: D5.faint }}
              >
                <Wrench size={10} /> cut option
              </div>
              <div className="mt-1 flex flex-col gap-1">
                {CUT.map((c, i) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCut(i)}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] font-semibold"
                    style={{
                      background: cut === i ? D5.panelHi : "transparent",
                      color: cut === i ? D5.ink : D5.dim,
                      border: `1px solid ${cut === i ? D5.lineHi : D5.line}`
                    }}
                  >
                    <span
                      className="grid h-3.5 w-3.5 place-items-center rounded-full border"
                      style={{ borderColor: cut === i ? D5.accent : D5.lineHi }}
                    >
                      {cut === i ? <Dot color={D5.accent} /> : null}
                    </span>
                    {c}
                  </button>
                ))}
              </div>

              <div
                className="mt-3 flex items-baseline justify-between border-t pt-2"
                style={{ borderColor: D5.line }}
              >
                <span className="text-[10px]" style={{ color: D5.faint }}>
                  Line total
                </span>
                <span className="text-[18px] font-bold" style={{ color: D5.accent }}>
                  {fmt(line)}
                </span>
              </div>

              <button
                type="button"
                onClick={add}
                disabled={!inStock}
                className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded text-[12px] font-bold disabled:opacity-40"
                style={{
                  background: added ? D5.accentDim : D5.accent,
                  color: added ? D5.accent : D5.bg
                }}
              >
                {added ? (
                  <>
                    <Check size={15} /> ADDED TO CART
                  </>
                ) : (
                  <>
                    <Plus size={15} /> ADD {qty} TO CART
                  </>
                )}
              </button>
              <div className="mt-2 flex gap-1.5">
                <Btn href="/design-lab/d5/cart" size="sm">
                  View cart
                </Btn>
                <Btn href="/design-lab/d5/category" size="sm">
                  Keep browsing
                </Btn>
              </div>
              <p
                className="mt-2 flex items-center justify-center gap-1 text-[9px]"
                style={{ color: D5.faint }}
              >
                <Kbd>A</Kbd> add · <Kbd>Q</Kbd> quote · <Kbd>↵</Kbd> checkout
              </p>
            </div>
          </Panel>

          <Panel title="Pairs with" hint="// related items">
            <div className="p-1.5">
              {related.length === 0 ? (
                <p className="px-1.5 py-2 text-[10px]" style={{ color: D5.faint }}>
                  No related items.
                </p>
              ) : (
                related.map((r) => (
                  <Link
                    key={r.id}
                    href="/design-lab/d5/product"
                    className="flex items-center gap-2 rounded px-1.5 py-1.5 hover:brightness-125"
                  >
                    <span
                      className="h-7 w-7 shrink-0 rounded"
                      style={{ background: swatchFor(r.id) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[11px] font-semibold"
                        style={{ color: D5.ink }}
                      >
                        {r.title}
                      </div>
                      <div className="text-[9px]" style={{ color: D5.faint }}>
                        {r.variants[0]?.sku ?? r.id}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: D5.accent }}>
                      {fmt(r.price)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
