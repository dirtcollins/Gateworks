// Wayfinder — product detail. Fully functional: image gallery, option-based
// variant selection with live price / SKU / image, quantity stepper,
// add-to-cart writing the real @/lib/cart-store, request-a-quote writing the
// real @/lib/quote-store, a specs / details accordion, and related products.
//
// Variant logic is ported from components/product-page-client.tsx: each
// option (length / material / finish / color) that varies is a real selector,
// and changing one resolves the closest matching variant.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useQuoteStore } from "@/lib/quote-store";
import type { Product, ProductVariant } from "@/lib/types";
import { ProductCard } from "./product-card";
import {
  Btn,
  Card,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  Qty,
  Rating,
  fmt,
  monoFont,
  wf,
  wayfinding
} from "./kit";

const OPTION_KEYS: Array<keyof ProductVariant["options"]> = [
  "length",
  "material",
  "finish",
  "color"
];

export function WayfinderProduct({
  product,
  related
}: {
  product: Product;
  related: Product[];
}) {
  const addToCart = useCartStore((state) => state.addItem);
  const addQuoteItem = useQuoteStore((state) => state.addItem);
  const activeQuoteId = useQuoteStore((state) => state.activeQuoteId);

  // Stores use skipHydration — rehydrate once so writes land in the persisted
  // (and user-scoped) cart / quote rather than a fresh in-memory copy.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useQuoteStore.persist.rehydrate();
  }, []);

  const firstAvailable =
    product.variants.find((variant) => variant.inventory === "in_stock") ??
    product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState(firstAvailable);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [openSection, setOpenSection] = useState("details");
  const [added, setAdded] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery" | "ship">(
    "pickup"
  );

  // Full image set: variant images + gallery images, de-duplicated.
  const gallery = useMemo(() => {
    const urls = Array.from(
      new Set([
        ...product.images.map((image) => image.url),
        ...product.variants.map((variant) => variant.image)
      ])
    ).filter((url): url is string => Boolean(url));
    return urls.length ? urls : ["/assets/logo.svg"];
  }, [product]);

  // Available values per option.
  const optionValues = useMemo(() => {
    return OPTION_KEYS.reduce<Record<string, string[]>>((values, key) => {
      values[key] = Array.from(
        new Set(
          product.variants
            .map((variant) => variant.options[key])
            .filter((value): value is string => Boolean(value))
        )
      );
      return values;
    }, {});
  }, [product.variants]);

  // Only options with more than one value get a selector.
  const configurableOptions = useMemo(
    () => OPTION_KEYS.filter((key) => (optionValues[key]?.length ?? 0) > 1),
    [optionValues]
  );

  // Resolve the best variant when an option changes (ported logic).
  function handleOptionChange(
    option: keyof ProductVariant["options"],
    value: string
  ) {
    const nextOptions = { ...selectedVariant.options, [option]: value };
    const exact = product.variants.find((variant) =>
      configurableOptions.every(
        (key) => variant.options[key] === nextOptions[key]
      )
    );
    const closest = product.variants
      .filter((variant) => variant.options[option] === value)
      .sort((left, right) => {
        const leftScore = configurableOptions.filter(
          (key) => left.options[key] === selectedVariant.options[key]
        ).length;
        const rightScore = configurableOptions.filter(
          (key) => right.options[key] === selectedVariant.options[key]
        ).length;
        return rightScore - leftScore;
      })[0];

    setSelectedVariant(exact ?? closest ?? selectedVariant);
  }

  // Keep the gallery synced to the selected variant's image.
  useEffect(() => {
    const index = gallery.indexOf(selectedVariant.image);
    if (index >= 0) setActiveImage(index);
  }, [selectedVariant, gallery]);

  const unit = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant?.inventory === "in_stock";
  const way = wayfinding(selectedVariant?.id ?? product.id);

  const cartItem = useMemo(
    () => ({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image || gallery[0],
      price: selectedVariant.price,
      quantity: qty,
      options: selectedVariant.options
    }),
    [product, selectedVariant, gallery, qty]
  );

  function onAddToCart() {
    if (!inStock) return;
    addToCart(cartItem);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  function onRequestQuote() {
    addQuoteItem(cartItem, activeQuoteId);
    setQuoted(true);
    window.setTimeout(() => setQuoted(false), 1800);
  }

  const sections: { id: string; label: string; body: React.ReactNode }[] = [
    {
      id: "details",
      label: "Product details",
      body: (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
          {product.details.map((detail) => (
            <li
              key={detail}
              style={{
                fontSize: 13,
                color: wf.ink,
                paddingLeft: 16,
                position: "relative"
              }}
            >
              <span
                style={{ position: "absolute", left: 0, color: wf.pine, fontWeight: 800 }}
              >
                ·
              </span>
              {detail}
            </li>
          ))}
        </ul>
      )
    },
    {
      id: "specs",
      label: "Specifications",
      body: (
        <dl
          style={{
            margin: 0,
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "6px 16px"
          }}
        >
          {Object.entries(product.specifications).map(([key, value]) => (
            <div key={key} style={{ display: "contents" }}>
              <dt
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: wf.ink,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}
              >
                {key}
              </dt>
              <dd style={{ fontSize: 13, color: wf.steel, fontFamily: monoFont }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )
    },
    {
      id: "pickup",
      label: "Will-call & delivery",
      body: (
        <p style={{ fontSize: 13, color: wf.steel, margin: 0, lineHeight: 1.6 }}>
          Staged for same-day will-call pickup at Bay 7 when ordered before the
          11A cutoff. Local delivery runs same-day in the Bakersfield service
          area; mill-direct freight is quoted on heavier steel orders.
        </p>
      )
    }
  ];

  return (
    <>
      {/* Breadcrumb */}
      <nav
        style={{
          padding: "10px 24px",
          borderBottom: `1px solid ${wf.rail}`,
          background: wf.bone,
          fontSize: 11,
          color: wf.steel,
          fontWeight: 700,
          letterSpacing: "0.04em"
        }}
      >
        <Link href="/wayfinder">Home</Link>
        <span style={{ margin: "0 8px", color: wf.rail }}>/</span>
        <Link href={`/wayfinder/categories/${product.category.slug}`}>
          {product.category.name}
        </Link>
        <span style={{ margin: "0 8px", color: wf.rail }}>/</span>
        <span style={{ color: wf.ink }}>{product.title}</span>
      </nav>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 460px",
          gap: 24,
          padding: 24,
          maxWidth: 1400,
          margin: "0 auto"
        }}
      >
        {/* Gallery */}
        <div>
          <Card style={{ padding: 24 }}>
            <ProductImage
              product={product}
              src={gallery[activeImage]}
              ratio={1.1}
              sku={selectedVariant?.sku}
              sizes="(max-width: 900px) 100vw, 720px"
              priority
            />
          </Card>
          {gallery.length > 1 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 6,
                marginTop: 8
              }}
            >
              {gallery.slice(0, 5).map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  style={{
                    background: "#fff",
                    border: `1px solid ${activeImage === index ? wf.ink : wf.rail}`,
                    padding: 6,
                    cursor: "pointer"
                  }}
                >
                  <ProductImage product={product} src={url} ratio={1} sizes="120px" />
                </button>
              ))}
            </div>
          ) : null}

          {/* Accordion */}
          <Card style={{ marginTop: 18, padding: 0 }}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                style={{
                  borderBottom:
                    index < sections.length - 1
                      ? `1px solid ${wf.hairline}`
                      : "none"
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection(openSection === section.id ? "" : section.id)
                  }
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 14,
                    fontWeight: 800,
                    color: wf.ink,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: openSection === section.id ? wf.paper : "transparent",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {section.label}
                  <Ico.chevronDown
                    size={16}
                    style={{
                      transform:
                        openSection === section.id ? "rotate(180deg)" : "none",
                      transition: "transform 120ms"
                    }}
                  />
                </button>
                {openSection === section.id ? (
                  <div style={{ padding: "0 18px 18px" }}>{section.body}</div>
                ) : null}
              </div>
            ))}
          </Card>
        </div>

        {/* Buy box */}
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Card style={{ padding: 16 }}>
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 10,
                color: wf.muted,
                textTransform: "uppercase",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4
              }}
            >
              <span>Stock # {selectedVariant?.sku ?? product.id}</span>
              <span>Model # {product.specifications["Catalog Number"] ?? "—"}</span>
              <span>{product.specifications.Brand ?? "Gateworks"}</span>
              <span>
                Aisle {way.aisle} · Bay {way.bay}
              </span>
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 900,
                marginTop: 10,
                lineHeight: 1.25,
                letterSpacing: "-0.01em"
              }}
            >
              {product.title}
            </h1>
            <div style={{ marginTop: 10 }}>
              <Rating value={4.8} count={120 + product.variants.length} size={13} />
            </div>
            <p style={{ fontSize: 13, color: wf.steel, marginTop: 10, lineHeight: 1.5 }}>
              {product.description}
            </p>
          </Card>

          <Card style={{ padding: 16 }}>
            <Eyebrow style={{ marginBottom: 4 }}>List price</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: wf.ink,
                  letterSpacing: "-0.02em"
                }}
              >
                {unit > 0 ? fmt(unit) : "Quote required"}
              </span>
            </div>
            <Mono style={{ fontSize: 11, color: wf.steel, marginTop: 4, display: "block" }}>
              {qty} × {unit > 0 ? fmt(unit) : "—"} ={" "}
              <strong>{unit > 0 ? fmt(unit * qty) : "quote required"}</strong>
            </Mono>
          </Card>

          {/* Variant / option selectors */}
          {configurableOptions.length ? (
            <Card style={{ padding: 16, display: "grid", gap: 14 }}>
              {configurableOptions.map((option) => (
                <div key={option}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: wf.ink,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 8
                    }}
                  >
                    {option}:&nbsp;
                    <span style={{ fontWeight: 600, color: wf.steel }}>
                      {selectedVariant.options[option] ?? "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {optionValues[option].map((value) => {
                      const on = selectedVariant.options[option] === value;
                      return (
                        <button
                          key={`${option}-${value}`}
                          type="button"
                          onClick={() => handleOptionChange(option, value)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            minHeight: 36,
                            padding: "0 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            color: wf.ink,
                            cursor: "pointer",
                            border: on
                              ? `2px solid ${wf.ink}`
                              : `1px solid ${wf.rail}`,
                            background: on ? wf.amber : "#fff"
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Card>
          ) : null}

          <Card style={{ padding: 0 }}>
            {/* Store stock */}
            <div style={{ padding: 14, borderBottom: `1px solid ${wf.rail}` }}>
              <Eyebrow style={{ marginBottom: 8 }}>Bakersfield store</Eyebrow>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: inStock ? wf.pine : wf.red
                }}
              >
                <Ico.check size={16} />
                {inStock
                  ? `${selectedVariant?.inventoryQuantity ?? way.stock} in stock · Aisle ${way.aisle}, Bay ${way.bay}`
                  : "Out of stock — request a quote"}
              </div>
            </div>

            {/* Fulfillment switcher */}
            <div style={{ padding: 14, borderBottom: `1px solid ${wf.rail}` }}>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}
              >
                {(
                  [
                    { id: "pickup", title: "Pickup", sub: "Today · 30 min", price: "Free" },
                    { id: "delivery", title: "Delivery", sub: "Today, 4–6p", price: "$12" },
                    { id: "ship", title: "Mill ship", sub: "5–7d", price: "Calc" }
                  ] as const
                ).map((option) => {
                  const on = fulfillment === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFulfillment(option.id)}
                      style={{
                        textAlign: "left",
                        border: on ? `2px solid ${wf.ink}` : `1px solid ${wf.rail}`,
                        background: on ? wf.amber : "#fff",
                        padding: 10,
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{option.title}</div>
                      <div style={{ fontSize: 10, color: wf.steel, marginTop: 2 }}>
                        {option.sub}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: wf.pine,
                          marginTop: 4
                        }}
                      >
                        {option.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qty + add to cart */}
            <div style={{ padding: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Qty value={qty} onChange={setQty} />
                <Btn
                  variant="primary"
                  onClick={onAddToCart}
                  disabled={!inStock}
                  style={{ flex: 1, height: 48, fontSize: 14 }}
                >
                  {added ? (
                    <>
                      <Ico.check size={18} /> Added to cart
                    </>
                  ) : (
                    <>
                      <Ico.cart size={16} /> Add to cart
                    </>
                  )}
                </Btn>
              </div>
              <Btn
                variant="default"
                onClick={onRequestQuote}
                block
                style={{ height: 42 }}
              >
                {quoted ? (
                  <>
                    <Ico.check size={16} /> Added to quote
                  </>
                ) : (
                  <>
                    <Ico.clipboard size={14} /> Request a quote
                  </>
                )}
              </Btn>
            </div>
          </Card>
        </div>
      </div>

      {/* Related products */}
      {related.length ? (
        <section style={{ padding: "0 24px 48px", maxWidth: 1400, margin: "0 auto" }}>
          <Eyebrow style={{ marginBottom: 12 }}>
            Often goes with this · {product.category.name.toLowerCase()}
          </Eyebrow>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 1,
              background: wf.rail,
              border: `1px solid ${wf.rail}`
            }}
          >
            {related.map((item) => (
              <ProductCard key={item.id} product={item} showCta={false} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
