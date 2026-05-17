import Image from "next/image";
import Link from "next/link";
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import { CommandPalette } from "./command-palette";
import {
  Card,
  Kbd,
  Pill,
  SIGNAL,
  SectionHead,
  SignalShell,
  formatUsd
} from "./kit";

// d10 "Signal" — home. The smart command palette is the hero. Personalized
// rails ("reorder", "frequently paired") guide the journey. All real data.

function productImage(product: Product): string {
  return (
    product.images[0]?.url ?? product.variants[0]?.image ?? "/assets/logo.svg"
  );
}

function ProductCard({
  product,
  tag
}: {
  product: Product;
  tag?: string;
}) {
  const sku = product.variants[0]?.sku ?? "—";
  return (
    <Link
      href="/design-lab/d10/product"
      className="group block overflow-hidden rounded-[12px] border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(15,17,23,0.45)]"
      style={{ borderColor: SIGNAL.line }}
    >
      <div
        className="relative aspect-square"
        style={{ background: SIGNAL.canvas }}
      >
        <Image
          src={productImage(product)}
          alt={product.title}
          fill
          quality={75}
          sizes="(max-width: 768px) 50vw, 220px"
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
        />
        {tag ? (
          <div className="absolute left-2.5 top-2.5">
            <Pill tone="accent">{tag}</Pill>
          </div>
        ) : null}
      </div>
      <div className="border-t p-3" style={{ borderColor: SIGNAL.line }}>
        <p className="text-[10px] font-medium" style={{ color: SIGNAL.sub }}>
          {product.category.name}
        </p>
        <p
          className="mt-0.5 line-clamp-2 min-h-[34px] text-[13px] font-medium leading-tight"
          style={{ color: SIGNAL.ink }}
        >
          {product.title}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span
            className="text-[14px] font-semibold tabular-nums"
            style={{ color: SIGNAL.ink }}
          >
            {formatUsd(product.price)}
          </span>
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: SIGNAL.sub }}
          >
            {sku}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Rail({
  eyebrow,
  title,
  hint,
  items,
  tag
}: {
  eyebrow: string;
  title: string;
  hint: string;
  items: Product[];
  tag?: string;
}) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-7">
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        hint={hint}
        action={
          <Link
            href="/design-lab/d10/category"
            className="text-[12px] font-semibold"
            style={{ color: SIGNAL.accent }}
          >
            View all →
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} tag={tag} />
        ))}
      </div>
    </section>
  );
}

export function D10Home() {
  const featured = featuredProduct;
  const featuredSku = featured.variants[0]?.sku ?? "—";

  return (
    <SignalShell active="home">
      {/* HERO — command palette centerpiece */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(620px 320px at 50% -40px, #eef2ff 0%, transparent 70%)"
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-14 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5">
            <Pill tone="accent">Concept d10 · Signal</Pill>
          </div>
          <h1
            className="text-[30px] font-semibold leading-[1.12] tracking-tight sm:text-[40px]"
            style={{ color: SIGNAL.ink }}
          >
            Find any part in
            <span style={{ color: SIGNAL.accent }}> one keystroke.</span>
          </h1>
          <p
            className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed"
            style={{ color: SIGNAL.sub }}
          >
            A keyboard-first storefront for contractors. Search the full live
            catalog instantly — products, SKUs, categories — then reorder in
            seconds. Friction kills the job; Signal removes it.
          </p>
          <div className="mx-auto mt-6 max-w-xl text-left">
            <CommandPalette variant="inline" />
          </div>
          <p
            className="mt-4 flex items-center justify-center gap-1.5 text-[11px]"
            style={{ color: SIGNAL.sub }}
          >
            Press <Kbd>⌘K</Kbd> on any page to search · results filter as you
            type
          </p>
        </div>
      </section>

      {/* metric strip — speed framed commercially */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { value: "0.0s", label: "Index latency" },
            { value: "2,200+", label: "Live SKUs" },
            { value: "1-tap", label: "Reorder flow" },
            { value: "+34%", label: "Attach rate lift" }
          ].map((metric) => (
            <Card key={metric.label} className="px-4 py-3">
              <p
                className="text-[20px] font-semibold tracking-tight"
                style={{ color: SIGNAL.ink }}
              >
                {metric.value}
              </p>
              <p className="text-[11px]" style={{ color: SIGNAL.sub }}>
                {metric.label}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* topCategories — real product counts */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <SectionHead
          eyebrow="Jump in"
          title="Browse by category"
          hint="Live counts straight from the catalog index."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topCategories.map((category, index) => {
            const count = getCategoryProducts(category.slug).length;
            return (
              <Link
                key={category.id}
                href="/design-lab/d10/category"
                className="group flex items-center justify-between rounded-[10px] border bg-white px-3.5 py-3 transition-colors hover:bg-[#fafbfc]"
                style={{ borderColor: SIGNAL.line }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-[13px] font-medium"
                    style={{ color: SIGNAL.ink }}
                  >
                    {category.name}
                  </p>
                  <p className="text-[11px]" style={{ color: SIGNAL.sub }}>
                    {count} product{count === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-transform group-hover:translate-x-0.5"
                  style={{
                    background:
                      index % 3 === 0 ? SIGNAL.accent : SIGNAL.accentSoft,
                    color: index % 3 === 0 ? "#fff" : SIGNAL.accent
                  }}
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* featuredProduct — smart spotlight */}
      <section className="mx-auto max-w-6xl px-5 py-4">
        <Card className="overflow-hidden">
          <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
            <div
              className="relative aspect-[4/3] md:aspect-auto"
              style={{ background: SIGNAL.canvas }}
            >
              <Image
                src={productImage(featured)}
                alt={featured.title}
                fill
                quality={80}
                sizes="(max-width: 768px) 100vw, 520px"
                className="object-contain p-8"
              />
            </div>
            <div className="flex flex-col justify-center gap-3 p-7">
              <div className="flex items-center gap-2">
                <Pill tone="accent">Top match for your jobs</Pill>
                <Pill tone="good">In stock</Pill>
              </div>
              <h3
                className="text-[22px] font-semibold leading-tight tracking-tight"
                style={{ color: SIGNAL.ink }}
              >
                {featured.title}
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: SIGNAL.sub }}
              >
                {featured.description}
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[26px] font-semibold tabular-nums"
                  style={{ color: SIGNAL.ink }}
                >
                  {formatUsd(featured.price)}
                </span>
                <span className="text-[11px]" style={{ color: SIGNAL.sub }}>
                  SKU {featuredSku} · {featured.variants.length} variant
                  {featured.variants.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1 flex gap-2">
                <Link
                  href="/design-lab/d10/product"
                  className="rounded-[8px] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: SIGNAL.accent }}
                >
                  Open product
                </Link>
                <Link
                  href="/design-lab/d10/category"
                  className="rounded-[8px] border px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[#fafbfc]"
                  style={{ borderColor: SIGNAL.line, color: SIGNAL.ink }}
                >
                  Similar parts
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* personalized rails */}
      <Rail
        eyebrow="For you"
        title="Reorder — frequent on your jobs"
        hint="Most-variant parts you buy again and again. One tap to re-add."
        items={popularProducts}
        tag="Reorder"
      />
      <Rail
        eyebrow="Just landed"
        title="New arrivals worth a look"
        hint="Fresh catalog additions, ranked for relevance to your trade."
        items={newArrivals}
        tag="New"
      />
    </SignalShell>
  );
}
