// Wayfinder — storefront homepage. Search-led hero, aisle-coded department
// entry points, a deep-stocked featured product, and rails of real catalog
// data, plus the will-call reassurance band. All data via @/lib/catalog
// through the local data helpers.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  departments,
  featuredProduct,
  newArrivals,
  popularProducts
} from "./data";
import { ProductCard } from "./product-card";
import {
  Btn,
  Card,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  StockTag,
  fmt,
  monoFont,
  wf,
  wayfinding
} from "./kit";

function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        router.push(
          trimmed
            ? `/wayfinder/search?q=${encodeURIComponent(trimmed)}`
            : "/wayfinder/search"
        );
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        border: "1px solid rgba(255,255,255,0.25)",
        background: "rgba(255,255,255,0.06)",
        height: 56,
        marginTop: 22,
        maxWidth: 680
      }}
    >
      <label
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "center",
          padding: "0 16px"
        }}
      >
        <Ico.search size={20} />
        <input
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search hardware, model #, SKU…"
          style={{
            border: "none",
            background: "transparent",
            padding: "0 14px",
            height: "100%",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            outline: "none"
          }}
        />
      </label>
      <button
        type="submit"
        style={{
          padding: "0 28px",
          background: wf.pine,
          color: "#fff",
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          border: "none",
          cursor: "pointer"
        }}
      >
        Search
      </button>
    </form>
  );
}

function Rail({
  title,
  eyebrow,
  items
}: {
  title: string;
  eyebrow: string;
  items: Product[];
}) {
  return (
    <section style={{ padding: "8px 24px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${wf.rail}`
        }}
      >
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              marginTop: 4
            }}
          >
            {title}
          </h2>
        </div>
        <Btn href="/wayfinder/search" variant="ghost" size="sm">
          View catalog <Ico.arrowRight size={14} />
        </Btn>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 1,
          background: wf.rail,
          border: `1px solid ${wf.rail}`,
          marginTop: 16
        }}
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} showCta={false} />
        ))}
      </div>
    </section>
  );
}

export function WayfinderHome() {
  const depts = departments(8);
  const feature = featuredProduct();
  const featureVariant = feature.variants[0];
  const featureWay = wayfinding(feature.id);

  return (
    <>
      {/* Hero — search-led entry */}
      <section
        style={{
          background: wf.ink,
          color: "#fff",
          padding: "44px 24px",
          display: "grid",
          gap: 24
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <Eyebrow style={{ color: wf.amber }}>
            Gateworks Supply · Bakersfield Warehouse
          </Eyebrow>
          <h1
            style={{
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginTop: 10,
              maxWidth: 720
            }}
          >
            Find every part. Walk it in aisle order.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              marginTop: 10,
              maxWidth: 560
            }}
          >
            Gate hardware, steel tubing, ornamental iron, fence, and welding
            supply — stocked, mapped, and ready for same-day will-call pickup.
          </p>

          <HeroSearch />

          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 18,
              flexWrap: "wrap",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)"
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.truck size={14} /> Same-day pickup
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.map size={14} /> Aisle wayfinding
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.clipboard size={14} /> Net-30 pro terms
            </span>
          </div>
        </div>
      </section>

      {/* Department / aisle entry points */}
      <section style={{ padding: "32px 24px 8px" }}>
        <Eyebrow>Shop by department · find the aisle</Eyebrow>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 1,
            background: wf.rail,
            border: `1px solid ${wf.rail}`,
            marginTop: 12
          }}
        >
          {depts.map((dept) => (
            <Link
              key={dept.slug}
              href={`/wayfinder/categories/${dept.slug}`}
              style={{ background: "#fff", padding: 18, display: "grid", gap: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span
                  style={{
                    fontFamily: monoFont,
                    background: wf.ink,
                    color: "#fff",
                    padding: "4px 8px",
                    fontWeight: 800,
                    fontSize: 12
                  }}
                >
                  A{dept.aisle}
                </span>
                <Ico.chevronRight size={16} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: wf.ink }}>
                {dept.name}
              </div>
              <Mono style={{ fontSize: 11, color: wf.muted }}>
                {dept.count} SKUs in stock
              </Mono>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured product */}
      <section style={{ padding: "32px 24px 8px" }}>
        <Eyebrow>Featured · stocked deep</Eyebrow>
        <Card
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "minmax(0, 360px) 1fr"
          }}
        >
          <div style={{ padding: 24, borderRight: `1px solid ${wf.rail}` }}>
            <ProductImage product={feature} ratio={1} sizes="360px" priority />
          </div>
          <div style={{ padding: 28, display: "grid", gap: 12, alignContent: "center" }}>
            <Mono style={{ fontSize: 10, color: wf.muted, textTransform: "uppercase" }}>
              {feature.specifications.Brand} · SKU {featureVariant?.sku} · Aisle{" "}
              {featureWay.aisle} · Bay {featureWay.bay}
            </Mono>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                lineHeight: 1.2
              }}
            >
              {feature.title}
            </h2>
            <p style={{ fontSize: 14, color: wf.steel, maxWidth: 520 }}>
              {feature.description}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {feature.price > 0 ? fmt(feature.price) : "Quote"}
              </span>
              <StockTag product={feature} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <Btn href={`/wayfinder/products/${feature.slug}`} variant="primary">
                <Ico.arrowRight size={16} /> View product
              </Btn>
              <Btn
                href={`/wayfinder/categories/${feature.category.slug}`}
                variant="default"
              >
                <Ico.grid size={14} /> Browse {feature.category.name}
              </Btn>
            </div>
          </div>
        </Card>
      </section>

      <div style={{ display: "grid", gap: 32, paddingBottom: 40 }}>
        <Rail
          eyebrow="Most-pulled hardware"
          title="Popular at the counter"
          items={popularProducts(8)}
        />
        <Rail
          eyebrow="Fresh on the rack"
          title="New arrivals"
          items={newArrivals(8)}
        />
      </div>

      {/* Will-call reassurance band */}
      <section style={{ padding: "0 24px 48px" }}>
        <div
          style={{
            background: wf.amber,
            border: `1px solid ${wf.rail}`,
            padding: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18
          }}
        >
          {[
            {
              icon: <Ico.truck size={20} />,
              title: "Will-call by 11A",
              body: "Order before the cutoff for same-day staged pickup at bay 7."
            },
            {
              icon: <Ico.map size={20} />,
              title: "Walk it in aisle order",
              body: "Every line item carries an aisle + bay code so the pick is fast."
            },
            {
              icon: <Ico.clipboard size={20} />,
              title: "Net-30 trade terms",
              body: "Pro accounts route orders for approval and auto-invoice."
            }
          ].map((item) => (
            <div key={item.title} style={{ display: "grid", gap: 6 }}>
              <span style={{ color: wf.pine }}>{item.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{item.title}</div>
              <p style={{ fontSize: 12, color: wf.steel }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
