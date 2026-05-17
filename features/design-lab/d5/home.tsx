"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { Beacon, Button, Chip, FO, Panel, Shell, Stamp, Title } from "./kit";
import {
  categoryCount,
  featuredProduct,
  money,
  newArrivals,
  popularProducts,
  primaryVariant,
  topCategories
} from "./data";

const PRODUCT_HREF = "/design-lab/d5/product";
const CATEGORY_HREF = "/design-lab/d5/category";

function ProductCard({
  product,
  flag
}: {
  product: (typeof popularProducts)[number];
  flag?: string;
}) {
  const variant = primaryVariant(product);
  const image = product.images[0]?.url ?? variant?.image;
  return (
    <Link
      href={PRODUCT_HREF}
      className="group flex flex-col"
      style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
    >
      <div
        className="relative flex aspect-square items-center justify-center"
        style={{ background: "#f4f1e9" }}
      >
        {image ? (
          <Image
            alt={product.title}
            src={image}
            width={420}
            height={420}
            quality={75}
            className="h-full w-full object-contain p-5"
          />
        ) : (
          <span className="text-5xl font-black" style={{ color: "rgba(22,20,15,0.12)" }}>
            GW
          </span>
        )}
        {flag ? (
          <span
            className="absolute left-0 top-0 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ background: FO.hi, color: FO.black }}
          >
            {flag}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <span
          className="text-[10px] font-black uppercase tracking-[0.14em]"
          style={{ color: FO.faint }}
        >
          {variant?.sku ?? product.id}
        </span>
        <span
          className="line-clamp-2 flex-1 text-[13px] font-black uppercase leading-tight tracking-[0.02em]"
          style={{ color: FO.ink }}
        >
          {product.title}
        </span>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-xl font-black" style={{ color: FO.hi }}>
            {money(product.price)}
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center transition-colors group-hover:brightness-110"
            style={{ background: FO.panelHi, color: FO.ink }}
          >
            <ArrowRight size={16} strokeWidth={2.75} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function D5Home() {
  const heroVariant = primaryVariant(featuredProduct);
  const heroImage = featuredProduct.images[0]?.url ?? heroVariant?.image;
  const popular = popularProducts.slice(0, 8);
  const fresh = newArrivals.slice(0, 4);

  return (
    <Shell crumb="Base camp" wide>
      {/* Hero */}
      <section className="grid gap-px lg:grid-cols-[1.15fr_1fr]" style={{ background: FO.line }}>
        <div
          className="flex flex-col justify-between gap-8 p-6 sm:p-9"
          style={{ background: FO.panel }}
        >
          <div>
            <Stamp>Rugged gate hardware</Stamp>
            <h1
              className="mt-5 text-4xl font-black uppercase leading-[0.92] tracking-tight sm:text-6xl"
              style={{ color: FO.ink }}
            >
              Built for the
              <br />
              <span style={{ color: FO.hi }}>jobsite</span>, not the
              <br />
              showroom.
            </h1>
            <p
              className="mt-5 max-w-md text-sm font-semibold leading-relaxed"
              style={{ color: FO.dim }}
            >
              Gate latches, hinges, and steel — priced for trade, stocked for
              same-day will-call. Order with gloves on.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={CATEGORY_HREF} size="lg" variant="primary">
              Shop the catalog <ArrowRight size={17} strokeWidth={2.75} />
            </Button>
            <Button href={PRODUCT_HREF} size="lg" variant="outline">
              View featured gear
            </Button>
          </div>
        </div>

        <Link
          href={PRODUCT_HREF}
          className="group flex flex-col justify-between gap-4 p-6 sm:p-7"
          style={{ background: FO.panelHi }}
        >
          <div className="flex items-center justify-between">
            <Chip tone="hi">
              <Zap size={12} strokeWidth={3} /> Featured
            </Chip>
            <span
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.go }}
            >
              <Beacon tone="go" /> In stock
            </span>
          </div>
          <div
            className="flex flex-1 items-center justify-center"
            style={{ background: "#f4f1e9", border: `2px solid ${FO.line}` }}
          >
            {heroImage ? (
              <Image
                alt={featuredProduct.title}
                src={heroImage}
                width={520}
                height={520}
                priority
                quality={75}
                className="h-full max-h-[260px] w-full object-contain p-6"
              />
            ) : (
              <span className="text-6xl font-black" style={{ color: "rgba(22,20,15,0.12)" }}>
                GW
              </span>
            )}
          </div>
          <div>
            <span
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.faint }}
            >
              {featuredProduct.category.name} · {heroVariant?.sku}
            </span>
            <p
              className="mt-1 text-lg font-black uppercase leading-tight"
              style={{ color: FO.ink }}
            >
              {featuredProduct.title}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-black" style={{ color: FO.hi }}>
                {money(featuredProduct.price)}
              </span>
              <span
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-colors group-hover:brightness-110"
                style={{ color: FO.ink }}
              >
                Open spec <ArrowRight size={14} strokeWidth={2.75} />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Value strip */}
      <section
        className="mt-6 grid gap-px sm:grid-cols-3"
        style={{ background: FO.line, border: `2px solid ${FO.line}` }}
      >
        {[
          { icon: Truck, head: "Same-day will-call", sub: "Order by 11am, pick up by 3" },
          { icon: ShieldCheck, head: "Trade pricing", sub: "Contractor rates on every SKU" },
          { icon: Zap, head: "Stocked deep", sub: "Real inventory, no backorder games" }
        ].map((item) => (
          <div
            key={item.head}
            className="flex items-center gap-3.5 p-4"
            style={{ background: FO.panel }}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center"
              style={{ background: FO.hiSoft, color: FO.hi }}
            >
              <item.icon size={20} strokeWidth={2.5} />
            </span>
            <div>
              <p
                className="text-[12px] font-black uppercase tracking-[0.1em]"
                style={{ color: FO.ink }}
              >
                {item.head}
              </p>
              <p className="text-[11px] font-semibold" style={{ color: FO.dim }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Stamp>Departments</Stamp>
            <h2
              className="mt-2 text-2xl font-black uppercase tracking-tight"
              style={{ color: FO.ink }}
            >
              Pick your aisle
            </h2>
          </div>
          <Link
            href={CATEGORY_HREF}
            className="hidden items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] sm:flex"
            style={{ color: FO.hi }}
          >
            All catalog <ArrowRight size={14} strokeWidth={2.75} />
          </Link>
        </div>
        <div
          className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: FO.line, border: `2px solid ${FO.line}` }}
        >
          {topCategories.map((category, index) => (
            <Link
              key={category.slug}
              href={CATEGORY_HREF}
              className="group flex items-center justify-between gap-3 p-4"
              style={{ background: FO.panel }}
            >
              <div className="min-w-0">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: FO.hi }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p
                  className="truncate text-[13px] font-black uppercase leading-tight"
                  style={{ color: FO.ink }}
                >
                  {category.name}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: FO.faint }}
                >
                  {categoryCount(category.slug)} SKUs in stock
                </p>
              </div>
              <span
                className="grid h-9 w-9 shrink-0 place-items-center transition-colors group-hover:bg-[#ff5a1f] group-hover:text-[#16140f]"
                style={{ background: FO.panelHi, color: FO.ink }}
              >
                <ArrowRight size={16} strokeWidth={2.75} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular grid */}
      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Stamp>Crew favorites</Stamp>
            <h2
              className="mt-2 text-2xl font-black uppercase tracking-tight"
              style={{ color: FO.ink }}
            >
              Top-moving gear
            </h2>
          </div>
          <Link
            href={CATEGORY_HREF}
            className="hidden items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] sm:flex"
            style={{ color: FO.hi }}
          >
            Browse all <ArrowRight size={14} strokeWidth={2.75} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              flag={index === 0 ? "Best seller" : undefined}
            />
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mt-8">
        <Panel
          title="Just landed"
          kicker="// fresh stock"
          right={
            <Link
              href={CATEGORY_HREF}
              className="text-[10px] font-black uppercase tracking-[0.12em]"
              style={{ color: FO.hi }}
            >
              See all
            </Link>
          }
        >
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: FO.line }}>
            {fresh.map((product) => {
              const variant = primaryVariant(product);
              const image = product.images[0]?.url ?? variant?.image;
              return (
                <Link
                  key={product.id}
                  href={PRODUCT_HREF}
                  className="flex items-center gap-3.5 p-4"
                  style={{ background: FO.panel }}
                >
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center"
                    style={{ background: "#f4f1e9" }}
                  >
                    {image ? (
                      <Image
                        alt={product.title}
                        src={image}
                        width={140}
                        height={140}
                        quality={75}
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : (
                      <span className="text-lg font-black" style={{ color: "rgba(22,20,15,0.16)" }}>
                        GW
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="line-clamp-2 text-[12px] font-black uppercase leading-tight"
                      style={{ color: FO.ink }}
                    >
                      {product.title}
                    </p>
                    <p className="mt-1 text-sm font-black" style={{ color: FO.hi }}>
                      {money(product.price)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>
      </section>

      {/* CTA banner */}
      <section
        className="mt-8 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8"
        style={{ background: FO.hi }}
      >
        <div>
          <Title>
            <span style={{ color: FO.black }}>Gear up. Get out.</span>
          </Title>
          <p
            className="mt-2 text-sm font-bold uppercase tracking-[0.06em]"
            style={{ color: FO.black }}
          >
            The whole catalog, contractor-priced and ready for will-call.
          </p>
        </div>
        <Button href={CATEGORY_HREF} size="lg" variant="dark">
          Start an order <ArrowRight size={17} strokeWidth={2.75} />
        </Button>
      </section>
    </Shell>
  );
}
