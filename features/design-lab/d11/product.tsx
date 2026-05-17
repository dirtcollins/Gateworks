// d11 "Wayfinder" — Product detail.
// Ported from prototype/product.jsx (standard variant): hairline cards,
// gallery + thumbnails, buy box with variant chips, fulfillment switcher,
// quantity stepper, and a specs/details accordion. Real catalog data; the
// add-to-cart wires the selected variant into the shared cart store.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { featuredProduct, getRelatedProducts } from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  Qty,
  Rating,
  d11,
  fmt,
  monoFont,
  wayfinding
} from "./kit";

const product = featuredProduct;
const related = getRelatedProducts(product, 4);

function variantLabel(variant: ProductVariant) {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

export function D11Product() {
  const addItem = useCartStore((state) => state.addItem);

  const gallery = useMemo(() => {
    const urls = Array.from(
      new Set([
        ...product.images.map((image) => image.url),
        ...product.variants.map((variant) => variant.image)
      ])
    ).filter((url): url is string => Boolean(url));
    return urls.length ? urls : ["/assets/logo.svg"];
  }, []);

  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery" | "ship">(
    "pickup"
  );
  const [openSection, setOpenSection] = useState<string>("details");
  const [added, setAdded] = useState(false);

  const selectedVariant =
    product.variants.find((variant) => variant.id === variantId) ??
    product.variants[0];
  const unit = selectedVariant?.price ?? product.price;
  const way = wayfinding(selectedVariant?.id ?? product.id);

  function handleAdd() {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image || gallery[0],
      price: selectedVariant.price,
      quantity: qty,
      options: selectedVariant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
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
                color: d11.ink,
                paddingLeft: 16,
                position: "relative"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: d11.pine,
                  fontWeight: 800
                }}
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
                  color: d11.ink,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em"
                }}
              >
                {key}
              </dt>
              <dd style={{ fontSize: 13, color: d11.steel, fontFamily: monoFont }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )
    },
    {
      id: "docs",
      label: "Documents & spec sheet",
      body: (
        <Btn variant="default" size="sm">
          <Ico.receipt size={14} /> Download PDF spec
        </Btn>
      )
    }
  ];

  return (
    <D11Shell active="product">
      {/* Breadcrumb */}
      <nav
        style={{
          padding: "10px 24px",
          borderBottom: `1px solid ${d11.rail}`,
          background: d11.bone,
          fontSize: 11,
          color: d11.steel,
          fontWeight: 700,
          letterSpacing: "0.04em"
        }}
      >
        <Link href="/design-lab/d11/home">Home</Link>
        <span style={{ margin: "0 8px", color: d11.rail }}>/</span>
        <Link href="/design-lab/d11/category">{product.category.name}</Link>
        <span style={{ margin: "0 8px", color: d11.rail }}>/</span>
        <span style={{ color: d11.ink }}>{product.title}</span>
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
                style={{
                  background: "#fff",
                  border: `1px solid ${activeImage === index ? d11.ink : d11.rail}`,
                  padding: 6,
                  cursor: "pointer"
                }}
              >
                <ProductImage
                  product={product}
                  src={url}
                  ratio={1}
                  sizes="120px"
                />
              </button>
            ))}
          </div>

          {/* Accordion */}
          <Card style={{ marginTop: 18, padding: 0 }}>
            {sections.map((section, index) => (
              <div
                key={section.id}
                style={{
                  borderBottom:
                    index < sections.length - 1
                      ? `1px solid ${d11.hairline}`
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
                    color: d11.ink,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: openSection === section.id ? d11.paper : "transparent",
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
                color: d11.muted,
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
          </Card>

          <Card style={{ padding: 16 }}>
            <Eyebrow style={{ marginBottom: 4 }}>List price</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: d11.ink,
                  letterSpacing: "-0.02em"
                }}
              >
                {unit > 0 ? fmt(unit) : "Quote required"}
              </span>
            </div>
            <Mono style={{ fontSize: 11, color: d11.steel, marginTop: 4, display: "block" }}>
              {qty} × {fmt(unit)} = <strong>{fmt(unit * qty)}</strong>
            </Mono>
          </Card>

          {product.variants.length > 1 ? (
            <Card style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: d11.ink,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  letterSpacing: "0.04em"
                }}
              >
                Variant:&nbsp;
                <span style={{ fontWeight: 600, color: d11.steel }}>
                  {selectedVariant ? variantLabel(selectedVariant) : ""}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {product.variants.map((variant) => {
                  const on = variant.id === variantId;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setVariantId(variant.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 36,
                        padding: "0 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: d11.ink,
                        cursor: "pointer",
                        border: on ? `2px solid ${d11.ink}` : `1px solid ${d11.rail}`,
                        background: on ? d11.amber : "#fff"
                      }}
                    >
                      {variantLabel(variant)}
                    </button>
                  );
                })}
              </div>
            </Card>
          ) : null}

          <Card style={{ padding: 0 }}>
            {/* Store stock */}
            <div style={{ padding: 14, borderBottom: `1px solid ${d11.rail}` }}>
              <Eyebrow style={{ marginBottom: 8 }}>Bakersfield store</Eyebrow>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: d11.pine
                }}
              >
                <Ico.check size={16} />
                {selectedVariant?.inventoryQuantity ?? way.stock} in stock · Aisle{" "}
                {way.aisle}, Bay {way.bay}
              </div>
            </div>

            {/* Fulfillment switcher */}
            <div style={{ padding: 14, borderBottom: `1px solid ${d11.rail}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6
                }}
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
                        border: on ? `2px solid ${d11.ink}` : `1px solid ${d11.rail}`,
                        background: on ? d11.amber : "#fff",
                        padding: "10px",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{option.title}</div>
                      <div style={{ fontSize: 10, color: d11.steel, marginTop: 2 }}>
                        {option.sub}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: d11.pine,
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

            {/* Qty + add */}
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Qty value={qty} onChange={setQty} />
                <Btn
                  variant="primary"
                  onClick={handleAdd}
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
            </div>
          </Card>
        </div>
      </div>

      {/* Related */}
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
              background: d11.rail,
              border: `1px solid ${d11.rail}`
            }}
          >
            {related.map((item) => (
              <Link
                key={item.id}
                href="/design-lab/d11/product"
                style={{ background: "#fff", padding: 14, display: "grid", gap: 8 }}
              >
                <ProductImage product={item} ratio={1} sizes="220px" />
                <Mono
                  style={{ fontSize: 9, color: d11.muted, textTransform: "uppercase" }}
                >
                  {item.specifications.Brand ?? "Gateworks"}
                </Mono>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: d11.ink,
                    lineHeight: 1.3,
                    minHeight: 34
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: d11.ink }}>
                  {item.price > 0 ? fmt(item.price) : "Quote"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </D11Shell>
  );
}
