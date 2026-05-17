// d11 "Wayfinder" — Home landing.
// The prototype is catalog-first with no landing; this builds a proper home
// in the prototype's exact visual language: black context bar shell, the big
// search, department/aisle entry points, a featured product, and rails of
// real catalog data.
import Link from "next/link";
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  StockTag,
  d11,
  fmt,
  monoFont,
  wayfinding
} from "./kit";

function departmentsFromCategories() {
  return topCategories.map((category, index) => ({
    slug: category.slug,
    name: category.name,
    aisle: String(8 + index * 4).padStart(2, "0")
  }));
}

function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  return (
    <Link
      href="/design-lab/d11/product"
      style={{ display: "block", background: "#fff" }}
    >
      <div style={{ padding: 14, display: "grid", gap: 8 }}>
        <ProductImage product={product} ratio={1} sizes="240px" />
        <Mono
          style={{ fontSize: 9, color: d11.muted, textTransform: "uppercase" }}
        >
          {product.specifications.Brand ?? "Gateworks"}
        </Mono>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: d11.ink,
            lineHeight: 1.3,
            minHeight: 38
          }}
        >
          {product.title}
        </div>
        <Mono style={{ fontSize: 10, color: d11.steel }}>
          SKU {variant?.sku ?? product.id}
        </Mono>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: d11.ink,
            letterSpacing: "-0.01em"
          }}
        >
          {product.price > 0 ? fmt(product.price) : "Quote"}
        </div>
        <StockTag product={product} />
      </div>
    </Link>
  );
}

function Rail({ title, eyebrow, items }: { title: string; eyebrow: string; items: Product[] }) {
  return (
    <section style={{ padding: "8px 24px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${d11.rail}`
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
        <Btn href="/design-lab/d11/category" variant="ghost" size="sm">
          View catalog <Ico.arrowRight size={14} />
        </Btn>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 1,
          background: d11.rail,
          border: `1px solid ${d11.rail}`,
          marginTop: 16
        }}
      >
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export function D11Home() {
  const departments = departmentsFromCategories();
  const feature = featuredProduct;
  const featureVariant = feature.variants[0];
  const featureWay = wayfinding(feature.id);

  return (
    <D11Shell active="home" departments={departments}>
      {/* Hero — search-led entry */}
      <section
        style={{
          background: d11.ink,
          color: "#fff",
          padding: "44px 24px",
          display: "grid",
          gap: 24
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <Eyebrow style={{ color: d11.amber }}>
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
            supply — stocked, mapped, and ready for same-day pickup.
          </p>

          <form
            action="/design-lab/d11/category"
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
                background: d11.pine,
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
            background: d11.rail,
            border: `1px solid ${d11.rail}`,
            marginTop: 12
          }}
        >
          {topCategories.map((category, index) => {
            const count = getCategoryProducts(category.slug).length;
            const aisle = String(8 + index * 4).padStart(2, "0");
            return (
              <Link
                key={category.slug}
                href={{ pathname: "/design-lab/d11/category", query: { c: category.slug } }}
                style={{
                  background: "#fff",
                  padding: 18,
                  display: "grid",
                  gap: 8
                }}
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
                      background: d11.ink,
                      color: "#fff",
                      padding: "4px 8px",
                      fontWeight: 800,
                      fontSize: 12
                    }}
                  >
                    A{aisle}
                  </span>
                  <Ico.chevronRight size={16} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: d11.ink }}>
                  {category.name}
                </div>
                <Mono style={{ fontSize: 11, color: d11.muted }}>
                  {count} SKUs in stock
                </Mono>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured product */}
      <section style={{ padding: "32px 24px 8px" }}>
        <Eyebrow>Featured · stocked deep</Eyebrow>
        <Card
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "minmax(0, 360px) 1fr",
            gap: 0
          }}
        >
          <div style={{ padding: 24, borderRight: `1px solid ${d11.rail}` }}>
            <ProductImage product={feature} ratio={1} sizes="360px" priority />
          </div>
          <div style={{ padding: 28, display: "grid", gap: 12, alignContent: "center" }}>
            <Mono
              style={{ fontSize: 10, color: d11.muted, textTransform: "uppercase" }}
            >
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
            <p style={{ fontSize: 14, color: d11.steel, maxWidth: 520 }}>
              {feature.description}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {fmt(feature.price)}
              </span>
              <StockTag product={feature} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <Btn href="/design-lab/d11/product" variant="primary">
                <Ico.arrowRight size={16} /> View product
              </Btn>
              <Btn href="/design-lab/d11/category" variant="default">
                <Ico.grid size={14} /> Browse category
              </Btn>
            </div>
          </div>
        </Card>
      </section>

      <div style={{ display: "grid", gap: 32, paddingBottom: 40 }}>
        <Rail
          eyebrow="Most-pulled hardware"
          title="Popular at the counter"
          items={popularProducts.slice(0, 8)}
        />
        <Rail
          eyebrow="Fresh on the rack"
          title="New arrivals"
          items={newArrivals.slice(0, 8)}
        />
      </div>

      {/* Will-call reassurance band */}
      <section style={{ padding: "0 24px 48px" }}>
        <div
          style={{
            background: d11.amber,
            border: `1px solid ${d11.rail}`,
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
              <span style={{ color: d11.pine }}>{item.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{item.title}</div>
              <p style={{ fontSize: 12, color: d11.steel }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </D11Shell>
  );
}
