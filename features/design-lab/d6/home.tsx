"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Cpu, Layers, Zap } from "lucide-react";
import {
  ApexButton,
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  ProductStage,
  SectionHeader,
  apex,
  formatUsd
} from "./kit";
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";

/* Real catalog departments with live SKU counts. */
const CATEGORIES = topCategories.map((category) => ({
  name: category.name,
  count: getCategoryProducts(category.slug).length,
  slug: category.slug
}));

/* Real featured stock — popular products fall back to new arrivals. */
const FEATURED = (popularProducts.length ? popularProducts : newArrivals)
  .slice(0, 6)
  .map((product) => ({
    name: product.title,
    sku: product.variants[0]?.sku ?? product.id,
    price: product.price,
    image: product.images[0]?.url,
    variants: product.variants.length
  }));

const HERO = {
  name: featuredProduct.title,
  category: featuredProduct.category.name,
  price: featuredProduct.price,
  sku: featuredProduct.variants[0]?.sku ?? featuredProduct.id,
  image:
    featuredProduct.images[0]?.url ?? featuredProduct.variants[0]?.image,
  blurb: featuredProduct.description
};

const PILLARS = [
  {
    icon: Cpu,
    head: "Engineered precision",
    body: "Every component is spec-verified and mill-certified before it reaches the counter."
  },
  {
    icon: Zap,
    head: "Same-day will-call",
    body: "Order before 11:00 — the Apex console routes it straight to the pick floor."
  },
  {
    icon: Layers,
    head: "Deep catalog stock",
    body: "Hundreds of structural and ornamental SKUs, tracked live across the network."
  }
];

export function D6Home() {
  return (
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      {/* Hero */}
      <section className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="flex flex-col justify-center">
          <Eyebrow>Gateworks · Apex System</Eyebrow>
          <h1
            className="mt-7 text-[3rem] font-medium leading-[1.02] tracking-[-0.04em] sm:text-[4.4rem]"
            style={{ color: apex.text }}
          >
            Hardware,
            <br />
            engineered to
            <br />
            <span
              style={{
                background: `linear-gradient(120deg, ${apex.accent}, #b9d4ff)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent"
              }}
            >
              an exact standard.
            </span>
          </h1>
          <p
            className="mt-7 max-w-lg text-[15px] leading-relaxed"
            style={{ color: apex.mute }}
          >
            Gate hardware, structural steel and ornamental iron — presented
            with the precision they are built with. A cinematic storefront
            wired to a live operations console.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ApexButton href="/design-lab/d6/category">
              Explore the catalog <ArrowRight className="h-4 w-4" />
            </ApexButton>
            <ApexButton href="/design-lab/d6/product" variant="ghost">
              View flagship hardware
            </ApexButton>
          </div>

          <div
            className="mt-12 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl border"
            style={{ borderColor: apex.line, background: apex.line }}
          >
            {[
              { value: `${CATEGORIES.length}`, label: "Departments" },
              {
                value: `${popularProducts.length + newArrivals.length}`,
                label: "Tracked SKUs"
              },
              { value: "11:00", label: "Will-call cutoff" }
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-5 py-5"
                style={{ background: apex.surface }}
              >
                <p
                  className="text-2xl font-medium tracking-[-0.02em]"
                  style={{ color: apex.text }}
                >
                  {stat.value}
                </p>
                <Mono style={{ color: apex.faint }}>{stat.label}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Hero product object */}
        <div className="flex items-center">
          <Panel className="w-full overflow-hidden" glow>
            <ProductStage
              alt={HERO.name}
              badge={
                <span
                  className="absolute left-5 top-5 z-20 rounded-full px-3 py-1.5"
                  style={{
                    background: "rgba(8,8,11,0.82)",
                    border: `1px solid ${apex.line}`
                  }}
                >
                  <Mono style={{ color: apex.accent }}>Flagship</Mono>
                </span>
              }
              className="aspect-[5/4]"
              priority
              quality={90}
              size="hero"
              src={HERO.image}
            />
            <div
              className="flex items-center justify-between gap-4 border-t px-6 py-5"
              style={{ borderColor: apex.line }}
            >
              <div className="min-w-0">
                <Mono style={{ color: apex.faint }}>
                  {HERO.category} · {HERO.sku}
                </Mono>
                <p
                  className="mt-1.5 truncate text-base font-medium"
                  style={{ color: apex.text }}
                >
                  {HERO.name}
                </p>
              </div>
              <Link
                className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-semibold tracking-[0.08em] transition-colors"
                href="/design-lab/d6/product"
                style={{
                  color: apex.accent,
                  border: `1px solid ${apex.line}`
                }}
              >
                {formatUsd(HERO.price)}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      {/* Pillars */}
      <section
        className="grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-3"
        style={{ borderColor: apex.line, background: apex.line }}
      >
        {PILLARS.map((pillar) => (
          <div
            key={pillar.head}
            className="px-7 py-8"
            style={{ background: apex.surface }}
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl"
              style={{
                background: "rgba(91,157,255,0.1)",
                border: `1px solid ${apex.line}`,
                color: apex.accent
              }}
            >
              <pillar.icon className="h-5 w-5" />
            </span>
            <p
              className="mt-5 text-[15px] font-medium"
              style={{ color: apex.text }}
            >
              {pillar.head}
            </p>
            <p
              className="mt-2 text-[13px] leading-relaxed"
              style={{ color: apex.mute }}
            >
              {pillar.body}
            </p>
          </div>
        ))}
      </section>

      {/* Departments */}
      <section className="py-20">
        <SectionHeader
          eyebrow="Catalog · Departments"
          title="Browse by discipline"
          action={
            <Link
              className="flex items-center gap-2 transition-colors hover:opacity-80"
              href="/design-lab/d6/category"
              style={{ color: apex.accent }}
            >
              <Mono style={{ color: apex.accent }}>All departments</Mono>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat, index) => (
            <Link key={cat.slug} href="/design-lab/d6/category">
              <Panel className="group h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <Mono style={{ color: apex.faint }}>
                    {String(index + 1).padStart(2, "0")}
                  </Mono>
                  <span
                    className="rounded-full px-2.5 py-1"
                    style={{
                      background: "rgba(91,157,255,0.1)",
                      color: apex.accent
                    }}
                  >
                    <Mono style={{ color: apex.accent }}>
                      {cat.count} SKU
                    </Mono>
                  </span>
                </div>
                <p
                  className="mt-12 text-lg font-medium leading-snug tracking-[-0.02em]"
                  style={{ color: apex.text }}
                >
                  {cat.name}
                </p>
                <p
                  className="mt-2 flex items-center gap-1.5 text-[12px] transition-colors group-hover:opacity-80"
                  style={{ color: apex.accent }}
                >
                  Enter department <ArrowRight className="h-3 w-3" />
                </p>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="pb-20">
        <SectionHeader
          eyebrow="Counter favorites"
          title="Featured hardware"
          action={
            <Link
              className="flex items-center gap-2 transition-colors hover:opacity-80"
              href="/design-lab/d6/category"
              style={{ color: apex.accent }}
            >
              <Mono style={{ color: apex.accent }}>View all stock</Mono>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((product) => (
            <Link key={product.sku} href="/design-lab/d6/product">
              <Panel
                className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                style={{ borderColor: "rgba(255,255,255,0.14)" }}
              >
                <div className="relative p-2.5">
                  <ProductStage
                    alt={product.name}
                    className="h-60 rounded-xl"
                    imgClassName="transition-transform duration-500 group-hover:scale-[1.07]"
                    size="card"
                    src={product.image}
                  />
                </div>
                <div
                  className="border-t p-5"
                  style={{ borderColor: apex.line }}
                >
                  <Mono style={{ color: apex.mute }}>
                    {product.sku} · {product.variants} variants
                  </Mono>
                  <p
                    className="mt-2 text-[15px] font-semibold leading-snug"
                    style={{ color: apex.text }}
                  >
                    {product.name}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="text-xl font-semibold tracking-[-0.02em]"
                      style={{ color: apex.text }}
                    >
                      {formatUsd(product.price)}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[12px]"
                      style={{ color: apex.accent }}
                    >
                      Detail <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>

      {/* Trade CTA */}
      <section className="pb-4">
        <Panel className="overflow-hidden" glow>
          <div className="grid gap-8 p-10 sm:p-14 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <Eyebrow>Trade accounts</Eyebrow>
              <h2
                className="mt-5 text-[2rem] font-medium leading-[1.1] tracking-[-0.03em] sm:text-[2.6rem]"
                style={{ color: apex.text }}
              >
                Run a crew? Open an Apex trade account.
              </h2>
              <p
                className="mt-4 max-w-md text-[14px] leading-relaxed"
                style={{ color: apex.mute }}
              >
                Tiered pricing, net terms, saved carts and a dedicated console
                login — built for shops that move volume.
              </p>
              <div className="mt-7">
                <ApexButton href="/design-lab/d6/orders">
                  Open the console <ArrowRight className="h-4 w-4" />
                </ApexButton>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-3">
              {[
                "Volume pricing applied automatically",
                "Net-30 terms on approval",
                "Live order tracking & reorder lists"
              ].map((line) => (
                <p
                  key={line}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3.5 text-[13px]"
                  style={{
                    borderColor: apex.line,
                    background: "rgba(255,255,255,0.025)",
                    color: apex.text
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rotate-45"
                    style={{
                      background: apex.accent,
                      boxShadow: `0 0 8px ${apex.accentGlow}`
                    }}
                  />
                  {line}
                </p>
              ))}
            </div>
          </div>
        </Panel>
      </section>
    </D6Page>
  );
}
