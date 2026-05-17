"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Layers,
  LineChart,
  Package,
  RotateCcw
} from "lucide-react";
import {
  Card,
  Eyebrow,
  LedgerPage,
  LedgerSearch,
  LEDGER,
  Pill,
  SectionHeader,
  formatUsd
} from "./kit";
import { LedgerProductCard } from "./product-card";
import { categories, products, searchProducts } from "@/lib/catalog";
import type { Product } from "@/lib/types";

/* Ledger home — a real storefront homepage reframed as a procurement
 * account overview. Leads with account economics (net terms, volume
 * pricing, reorder convenience), then surfaces real catalog rails and
 * department entry points. All data from @/lib/catalog. */

const ACCOUNT_VALUE = [
  {
    icon: CreditCard,
    title: "Net-30 terms",
    body: "Order today, reconcile on a single monthly statement. No card friction at checkout."
  },
  {
    icon: Layers,
    title: "Tiered volume pricing",
    body: "Price breaks apply automatically as line quantities cross each volume threshold."
  },
  {
    icon: RotateCcw,
    title: "One-click reorder",
    body: "Rebuild a recurring purchase order from any past order in seconds."
  },
  {
    icon: LineChart,
    title: "Spend visibility",
    body: "Every order rolls into account reports for budget owners and approvers."
  }
];

export function LedgerHome() {
  const allProducts = products;
  const variantCount = allProducts.reduce(
    (total, product) => total + product.variants.length,
    0
  );
  const departmentCards = categories
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      count: searchProducts("", category.slug).length
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const reorderRail = [...allProducts]
    .sort((a, b) => b.variants.length - a.variants.length)
    .slice(0, 4);
  const arrivalsRail = allProducts.slice(0, 8);
  const featured: Product =
    allProducts.find((product) => product.slug === "21-adjust-o-matic-latch") ??
    allProducts[0];
  const featuredImage = featured.images[0]?.url ?? featured.variants[0]?.image;

  return (
    <LedgerPage>
      {/* Hero — account overview with working search */}
      <section className="grid gap-6 py-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Procurement portal</Eyebrow>
          <h1
            className="mt-3 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl"
            style={{ color: LEDGER.ink }}
          >
            Hardware procurement,
            <br />
            run like a finance team.
          </h1>
          <p
            className="mt-4 max-w-lg text-[15px] leading-relaxed"
            style={{ color: LEDGER.body }}
          >
            Gateworks gives purchasing managers a single account for gate
            hardware, structural steel, and welding supply &mdash; with net
            terms, volume pricing, and spend reporting built in.
          </p>
          <LedgerSearch className="mt-6 max-w-lg" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
              href="/ledger/search"
              style={{ backgroundColor: LEDGER.indigo }}
            >
              Browse the catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
              href="/ledger/quote"
              style={{
                color: LEDGER.ink,
                border: `1px solid ${LEDGER.line}`,
                backgroundColor: LEDGER.surface
              }}
            >
              Request a quote
            </Link>
          </div>
          <div
            className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-[12px] font-medium"
            style={{ color: LEDGER.muted }}
          >
            <span>{allProducts.length}+ catalogued SKUs</span>
            <span>Net-30 / Net-60 available</span>
            <span>Same-day will-call</span>
          </div>
        </div>

        {/* Account snapshot card */}
        <div className="lg:col-span-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: LEDGER.muted }}
              >
                Account snapshot
              </span>
              <Pill bg={LEDGER.mintSoft} fg={LEDGER.mint}>
                Good standing
              </Pill>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: "Catalogued SKUs", value: String(allProducts.length) },
                { label: "Tracked variants", value: String(variantCount) }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3.5"
                  style={{ backgroundColor: LEDGER.canvas }}
                >
                  <p
                    className="text-lg font-semibold tracking-tight"
                    style={{ color: LEDGER.ink }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: LEDGER.muted }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <Link
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition"
              href="/ledger/orders"
              style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
            >
              Open order ledger
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </section>

      {/* Account value props */}
      <section className="py-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACCOUNT_VALUE.map((value) => (
            <Card key={value.title} className="p-5">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ backgroundColor: LEDGER.indigoSoft }}
              >
                <value.icon className="h-[18px] w-[18px]" style={{ color: LEDGER.indigo }} />
              </span>
              <p
                className="mt-3 text-[15px] font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {value.title}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: LEDGER.body }}>
                {value.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Departments — real category entry points with live counts */}
      <section className="py-8">
        <SectionHeader
          eyebrow="Procurement categories"
          title="Shop by line of supply"
          description="Live counts from the Gateworks catalog."
          action={
            <Link
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
              href="/ledger/search"
              style={{ color: LEDGER.indigo }}
            >
              All categories <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {departmentCards.map((category) => (
            <Link
              key={category.slug}
              className="group flex items-center justify-between rounded-2xl p-4 transition"
              href={`/ledger/categories/${category.slug}`}
              style={{
                backgroundColor: LEDGER.surface,
                border: `1px solid ${LEDGER.line}`
              }}
            >
              <div>
                <p
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {category.name}
                </p>
                <p
                  className="mt-0.5 text-[12px] font-medium"
                  style={{ color: LEDGER.muted }}
                >
                  {category.count} SKUs catalogued
                </p>
              </div>
              <span
                className="grid h-8 w-8 place-items-center rounded-lg transition group-hover:translate-x-0.5"
                style={{ backgroundColor: LEDGER.indigoSoft }}
              >
                <ArrowRight className="h-4 w-4" style={{ color: LEDGER.indigo }} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Reorder rail */}
      <section className="py-8">
        <SectionHeader
          eyebrow="Fast reorder"
          title="Frequently ordered on trade accounts"
          description="Known-good lines with the deepest variant coverage."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {reorderRail.map((product) => (
            <LedgerProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Featured product spotlight */}
      <section className="py-8">
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div
              className="flex items-center justify-center p-10"
              style={{ backgroundColor: LEDGER.canvas }}
            >
              {featuredImage ? (
                <Image
                  alt={featured.title}
                  className="max-h-72 w-auto object-contain"
                  height={520}
                  quality={75}
                  src={featuredImage}
                  width={520}
                />
              ) : (
                <Package className="h-20 w-20" style={{ color: LEDGER.muted }} />
              )}
            </div>
            <div className="p-8">
              <Eyebrow>Catalog spotlight</Eyebrow>
              <h3
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {featured.title}
              </h3>
              <p
                className="mt-2 text-[14px] leading-relaxed"
                style={{ color: LEDGER.body }}
              >
                {featured.description}
              </p>
              <div className="mt-5 flex items-end gap-3">
                <span
                  className="text-3xl font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(featured.price)}
                </span>
                <span
                  className="pb-1 text-[12px] font-medium"
                  style={{ color: LEDGER.muted }}
                >
                  per unit &middot; volume pricing on this line
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Pill bg={LEDGER.indigoSoft} fg={LEDGER.indigo}>
                  {featured.variants.length} variants
                </Pill>
                <Pill bg={LEDGER.mintSoft} fg={LEDGER.mint}>
                  In stock
                </Pill>
                <Pill bg={LEDGER.canvas} fg={LEDGER.body}>
                  {featured.category.name}
                </Pill>
              </div>
              <Link
                className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
                href={`/ledger/products/${featured.slug}`}
                style={{ backgroundColor: LEDGER.indigo }}
              >
                View product detail <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* New arrivals rail */}
      <section className="py-8">
        <SectionHeader
          eyebrow="Recently catalogued"
          title="New to the catalog"
          description="The latest additions across all lines of supply."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {arrivalsRail.map((product) => (
            <LedgerProductCard key={product.id} product={product} size="sm" />
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pb-4 pt-8">
        <div
          className="rounded-2xl px-8 py-10 text-center"
          style={{ backgroundColor: LEDGER.ink }}
        >
          <h3 className="text-2xl font-semibold tracking-tight text-white">
            Open a Gateworks trade account
          </h3>
          <p
            className="mx-auto mt-2 max-w-md text-sm"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Net terms, volume pricing, and spend reporting &mdash; approved in
            one business day.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold transition"
            href="/ledger/search"
            style={{ color: LEDGER.ink }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </LedgerPage>
  );
}
