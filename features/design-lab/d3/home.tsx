import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Compass, PackageCheck, Ruler } from "lucide-react";
import {
  getCategoryProducts,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Home / storefront landing. */

// Departments — real catalog categories that have stocked products.
const departmentTones = ["steel", "brass", "rust", "ink"] as const;
const departmentSpans = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7"
];
const collections = topCategories.slice(0, 4).map((category, index) => ({
  tag: String(index + 1).padStart(2, "0"),
  tone: departmentTones[index % departmentTones.length],
  name: category.name,
  slug: category.slug,
  count: getCategoryProducts(category.slug).length,
  span: departmentSpans[index % departmentSpans.length]
}));

// "On the cover" picks — real catalog products, image-forward.
const featured = popularProducts.slice(0, 4).map((product) => ({
  slug: product.slug,
  name: product.title,
  sku: product.variants[0]?.sku ?? product.id,
  price: formatCurrency(product.price),
  unit: product.variants.length > 1 ? "/ from" : "/ each",
  image: product.images[0]?.url
}));

export function D3Home() {
  return (
    <D3Shell active="Home">
      {/* HERO — asymmetric editorial split */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8 sm:pt-16">
        <div className="grid items-end gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Eyebrow>The Material Catalog — Issue 03</Eyebrow>
            <h1
              className={`${serif} mt-5 text-[2.9rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[4.2rem]`}
            >
              Steel, hardware
              <br />
              and the craft
              <br />
              <span style={{ color: d3.brass }}>of building well.</span>
            </h1>
            <p
              className="mt-6 max-w-md text-base leading-relaxed"
              style={{ color: d3.graphite }}
            >
              A supply yard with the eye of a catalog. Every gauge, hinge and
              fastener photographed, specified and stocked — so you spend less
              time sourcing and more time on the build.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/design-lab/d3/category"
                className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
                style={{ background: d3.ink }}
              >
                Browse the catalog
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </Link>
              <Link
                href="/design-lab/d3/product"
                className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px]"
                style={{ color: d3.graphite }}
              >
                See a product page
              </Link>
            </div>
          </div>

          <div className="relative">
            <MaterialBlock
              tone="steel"
              label="Cold-rolled · Issue 03"
              className="h-[340px] w-full sm:h-[440px]"
            />
            <div
              className="absolute -bottom-6 -left-4 hidden w-56 border bg-white p-5 shadow-[0_24px_50px_rgba(26,24,20,0.16)] sm:block"
              style={{ borderColor: d3.rule }}
            >
              <p className={`${serif} text-3xl`}>2,400+</p>
              <p
                className="mt-1 text-[0.72rem] uppercase tracking-[0.2em]"
                style={{ color: d3.haze }}
              >
                Line items, in stock & specified
              </p>
            </div>
          </div>
        </div>

        {/* running marquee rule */}
        <div
          className="mt-14 flex items-center gap-6 overflow-hidden border-y py-3 text-[0.72rem] uppercase tracking-[0.26em]"
          style={{ borderColor: d3.rule, color: d3.haze }}
        >
          {["Cut to length", "Trade pricing", "Same-day will-call", "Delivery routed daily", "Certified mill", "Quotes in minutes"].map(
            (t) => (
              <span key={t} className="flex shrink-0 items-center gap-6">
                {t}
                <span style={{ color: d3.brass }}>—</span>
              </span>
            )
          )}
        </div>
      </section>

      {/* DEPARTMENTS — editorial mosaic */}
      <section className="mx-auto max-w-[1280px] px-5 pt-20 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Departments</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold sm:text-[2.6rem]`}>
              Shelves, fully stocked
            </h2>
          </div>
          <Link
            href="/design-lab/d3/category"
            className="hidden shrink-0 text-[0.78rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] sm:inline"
          >
            All departments
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-12">
          {collections.map((c) => (
            <Link
              key={c.slug}
              href="/design-lab/d3/category"
              className={`group relative block overflow-hidden ${c.span}`}
            >
              <MaterialBlock tone={c.tone} className="h-[260px] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <span
                  className={`${serif} text-2xl text-white/80`}
                >
                  {c.tag}
                </span>
                <div>
                  <h3 className={`${serif} text-2xl font-semibold text-white`}>
                    {c.name}
                  </h3>
                  <p className="mt-1 max-w-xs text-sm text-white/75">
                    {c.count} {c.count === 1 ? "item" : "items"} stocked & specified.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white">
                    Explore <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURE STORY — full-bleed editorial block */}
      <section className="mt-24" style={{ background: d3.ink, color: d3.paper }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-[0.9fr_1.1fr]">
          <MaterialBlock tone="brass" label="Field study no. 7" className="h-[380px] w-full" />
          <div>
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.32em]"
              style={{ color: d3.brass }}
            >
              The Workbench — Field Notes
            </span>
            <h2
              className={`${serif} mt-4 text-3xl font-semibold leading-tight sm:text-[2.8rem]`}
            >
              How to spec a gate that never sags
            </h2>
            <p
              className="mt-5 max-w-lg text-base leading-relaxed"
              style={{ color: "rgba(244,241,234,0.7)" }}
            >
              It starts with the frame. We walk through gauge selection, hinge
              load ratings, and the diagonal brace geometry that keeps a 16-foot
              drive gate true through twenty winters.
            </p>
            <div className="mt-8 flex flex-wrap gap-8">
              {[
                { icon: Ruler, t: "Gauge guide", n: "11ga vs 14ga" },
                { icon: Compass, t: "Brace angle", n: "Bottom-hinge rule" },
                { icon: PackageCheck, t: "Hardware kit", n: "Matched & stocked" }
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3">
                  <f.icon className="h-5 w-5" style={{ color: d3.brass }} />
                  <div>
                    <p className="text-sm font-semibold">{f.t}</p>
                    <p className="text-[0.74rem]" style={{ color: "rgba(244,241,234,0.55)" }}>
                      {f.n}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/design-lab/d3/category"
              className="mt-9 inline-flex items-center gap-2 border-b pb-1 text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: d3.brass, color: d3.brass }}
            >
              Read the field note <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS — catalog row */}
      <section className="mx-auto max-w-[1280px] px-5 pt-20 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>This Issue's Picks</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold sm:text-[2.6rem]`}>
              On the cover
            </h2>
          </div>
          <Link
            href="/design-lab/d3/category"
            className="hidden shrink-0 text-[0.78rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] sm:inline"
          >
            Shop all picks
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Link
              key={p.slug}
              href="/design-lab/d3/product"
              className="group block"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: d3.card }}>
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    quality={75}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <MaterialBlock tone="steel" className="h-full w-full" />
                )}
                <span
                  className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: d3.ink }}
                >
                  No. {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <h3 className={`${serif} text-lg font-semibold leading-snug`}>
                  {p.name}
                </h3>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:rotate-45"
                  style={{ color: d3.brass }}
                />
              </div>
              <p
                className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
                style={{ color: d3.haze }}
              >
                SKU {p.sku}
              </p>
              <p className="mt-1 text-sm" style={{ color: d3.graphite }}>
                <span className="font-semibold" style={{ color: d3.ink }}>
                  {p.price}
                </span>{" "}
                {p.unit}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* CLOSING — quote / studio CTA */}
      <section className="mx-auto mt-24 max-w-[1280px] px-5 sm:px-8">
        <div
          className="grid items-center gap-8 border p-8 sm:p-14 md:grid-cols-[1.3fr_0.7fr]"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          <div>
            <Eyebrow>For the Trade</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight sm:text-[2.6rem]`}>
              Build a quote like you'd build a list — line by line.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: d3.graphite }}>
              Trade accounts get tiered pricing, saved material lists, and
              quotes that turn into orders in a single click.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/design-lab/d3/cart"
              className="rounded-full px-7 py-4 text-center text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white"
              style={{ background: d3.ink }}
            >
              Review your cart
            </Link>
            <Link
              href="/design-lab/d3/orders"
              className="rounded-full border px-7 py-4 text-center text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
              style={{ borderColor: d3.ink }}
            >
              Open the studio
            </Link>
          </div>
        </div>
      </section>
    </D3Shell>
  );
}
