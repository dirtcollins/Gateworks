"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  ShieldCheck,
  Truck
} from "lucide-react";
import {
  D1DesignBadge,
  D1Page,
  Eyebrow,
  SectionHeader,
  formatUsd
} from "./kit";
import {
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";

/* Real catalog departments with live product counts. */
const CATEGORIES = topCategories.map((category) => ({
  name: category.name,
  count: getCategoryProducts(category.slug).length,
  slug: category.slug
}));

/* Real featured stock — popular products fall back to new arrivals. */
const FEATURED_TONES = ["#2f6f4e", "#6c685c", "#d6a93f", "#16150f"];
const FEATURED_TAGS = ["Best seller", "Mill stock", "New", "Crew pick"];
const FEATURED = (popularProducts.length ? popularProducts : newArrivals)
  .slice(0, 4)
  .map((product, index) => ({
    name: product.title,
    sku: product.variants[0]?.sku ?? product.id,
    price: product.price,
    tag: FEATURED_TAGS[index] ?? "In stock",
    tone: FEATURED_TONES[index] ?? "#16150f",
    image: product.images[0]?.url,
    slug: product.slug
  }));

const TRUST = [
  { icon: Truck, head: "Same-day will-call", body: "Order by 11am, pick up at the counter today." },
  { icon: BadgeCheck, head: "Contractor pricing", body: "Tiered trade rates applied automatically." },
  { icon: ShieldCheck, head: "Mill-certified steel", body: "Full traceability and MTRs on request." }
];

export function D1Home() {
  return (
    <D1Page>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      {/* Hero */}
      <section className="grid gap-8 border-b border-d1-line py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-7">
          <Eyebrow>Built for the trade since 1986</Eyebrow>
          <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-d1-ink sm:text-6xl">
            Everything your crew needs to{" "}
            <span className="text-d1-pine">frame, hang & finish</span> the
            job.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-d1-steel">
            Gate hardware, structural steel, ornamental iron and welding
            supply &mdash; priced for contractors, stocked deep, and ready
            for same-day pickup at the counter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 bg-d1-ink px-6 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/design-lab/d1/category"
            >
              Browse the catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 border border-d1-ink px-6 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              href="/design-lab/d1/product"
            >
              Request a quote
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-d1-line border-y border-d1-line">
            {[
              { value: "650+", label: "Stocked SKUs" },
              { value: "11am", label: "Same-day cutoff" },
              { value: "40yrs", label: "In the trade" }
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3">
                <dt className="text-2xl font-extrabold text-d1-ink">
                  {stat.value}
                </dt>
                <dd className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative h-full overflow-hidden border-2 border-d1-ink bg-d1-ink">
            <div
              className="h-full min-h-[340px] w-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 22px)"
              }}
            >
              <div className="flex h-full flex-col justify-between p-7">
                <span className="inline-flex w-fit items-center gap-2 bg-d1-amber px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-d1-ink">
                  <ClipboardCheck className="h-3.5 w-3.5" /> This week
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-d1-amber">
                    Featured program
                  </p>
                  <p className="mt-2 text-3xl font-extrabold leading-tight text-d1-paper">
                    Slide-gate hardware bundles &mdash; 15% off complete
                    kits.
                  </p>
                  <Link
                    className="mt-5 inline-flex items-center gap-2 border border-d1-paper/40 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-d1-paper transition hover:bg-d1-paper hover:text-d1-ink"
                    href="/design-lab/d1/category"
                  >
                    Shop the program <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid gap-px border-b border-d1-line bg-d1-line sm:grid-cols-3">
        {TRUST.map((item) => (
          <div key={item.head} className="bg-d1-paper px-5 py-6">
            <item.icon className="h-5 w-5 text-d1-pine" />
            <p className="mt-3 text-sm font-extrabold text-d1-ink">
              {item.head}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-d1-steel">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="py-12">
        <SectionHeader
          eyebrow="Shop by department"
          title="Departments"
          action={
            <Link
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
              href="/design-lab/d1/category"
            >
              All departments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-6 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              className="group flex flex-col justify-between bg-d1-card p-6 transition hover:bg-white"
              href="/design-lab/d1/category"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center border border-d1-ink text-base font-black text-d1-ink transition group-hover:bg-d1-pine group-hover:text-white group-hover:border-d1-pine">
                  {cat.name.charAt(0)}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  {cat.count} SKUs
                </span>
              </div>
              <div className="mt-10">
                <p className="text-lg font-extrabold text-d1-ink">
                  {cat.name}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-d1-pine">
                  Shop now <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="pb-12">
        <SectionHeader
          eyebrow="Counter favorites"
          title="Featured stock"
          action={
            <Link
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
              href="/design-lab/d1/category"
            >
              View all stock <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="mt-6 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED.map((product) => (
            <Link
              key={product.sku}
              className="group flex flex-col bg-d1-card transition hover:bg-white"
              href="/design-lab/d1/product"
            >
              <div
                className="relative flex h-44 items-center justify-center"
                style={{ backgroundColor: product.tone }}
              >
                {product.image ? (
                  <Image
                    alt={product.name}
                    className="h-full w-full object-contain p-4"
                    height={320}
                    quality={75}
                    src={product.image}
                    width={320}
                  />
                ) : (
                  <span
                    className="text-5xl font-black"
                    style={{ color: "rgba(246,243,236,0.18)" }}
                  >
                    GW
                  </span>
                )}
                <span className="absolute left-3 top-3 bg-d1-paper px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-d1-ink">
                  {product.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  {product.sku}
                </p>
                <p className="mt-1.5 flex-1 text-sm font-bold leading-snug text-d1-ink">
                  {product.name}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-d1-line pt-3">
                  <span className="text-lg font-extrabold text-d1-ink">
                    {formatUsd(product.price)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine">
                    Detail <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trade CTA */}
      <section className="mb-4 grid gap-px border border-d1-line bg-d1-line lg:grid-cols-3">
        <div className="bg-d1-ink p-8 text-d1-paper lg:col-span-2">
          <Eyebrow>Trade accounts</Eyebrow>
          <p className="mt-4 max-w-lg text-2xl font-extrabold leading-tight">
            Run a shop or crew? Open a Gateworks trade account for tiered
            pricing, net terms and a dedicated counter rep.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 bg-d1-amber px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-paper"
            href="/design-lab/d1/orders"
          >
            Apply for an account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-col justify-center gap-3 bg-d1-card p-8">
          {[
            "Volume discounts auto-applied",
            "Net-30 terms on approval",
            "Saved carts & reorder lists"
          ].map((line) => (
            <p
              key={line}
              className="flex items-center gap-2.5 text-sm font-semibold text-d1-ink"
            >
              <BadgeCheck className="h-4 w-4 shrink-0 text-d1-pine" />
              {line}
            </p>
          ))}
        </div>
      </section>
    </D1Page>
  );
}
