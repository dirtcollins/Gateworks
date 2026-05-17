"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap
} from "lucide-react";
import {
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import { D4Shell, D4Stars, brandClasses } from "./shell";

// Real catalog data — top categories with live product counts.
const categoryTints = [
  "bg-amber-100",
  "bg-sky-100",
  "bg-emerald-100",
  "bg-orange-100",
  "bg-violet-100",
  "bg-rose-100"
];

const departments = topCategories.slice(0, 6).map((category, index) => ({
  name: category.name,
  slug: category.slug,
  count: getCategoryProducts(category.slug).length,
  tint: categoryTints[index % categoryTints.length]
}));

// Real "trending" products from the catalog, sorted by variant richness.
const dealTints = [
  "from-amber-200 to-amber-50",
  "from-sky-200 to-sky-50",
  "from-emerald-200 to-emerald-50",
  "from-violet-200 to-violet-50"
];
const dealBadges = ["Best Seller", "Low Stock", "Free Pickup", "Top Rated"];

const deals = popularProducts.slice(0, 4).map((product, index) => {
  const variant = product.variants[0];
  return {
    title: product.title,
    sku: variant?.sku ?? product.id,
    price: product.price,
    image: product.images[0]?.url ?? variant?.image ?? "/assets/logo.svg",
    rating: 4.6 + ((product.variants.length % 4) * 0.1),
    reviews: 80 + product.variants.length * 11,
    badge: dealBadges[index % dealBadges.length],
    tint: dealTints[index % dealTints.length]
  };
});

export function D4Home() {
  const [query, setQuery] = useState("");

  return (
    <D4Shell active="home">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 shadow-sm ring-1 ring-orange-100">
            <Zap className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            Same-day pickup at 6 yards across the region
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
            Everything to build, gate &amp;{" "}
            <span className="text-orange-500">finish the job.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            2,200+ contractor-grade products. Honest pricing, real stock counts,
            and a checkout that takes 30 seconds.
          </p>

          {/* Search */}
          <div className="mt-7 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-lg shadow-orange-100 ring-1 ring-slate-100">
              <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 2,200+ products, SKUs or brands..."
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <Link
                href="/design-lab/d4/category"
                className={`${brandClasses.btn} shrink-0 px-5 py-2.5 text-sm`}
              >
                Search
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium">Popular:</span>
              {departments.slice(0, 4).map((d) => (
                <Link
                  key={d.slug}
                  href="/design-lab/d4/category"
                  className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 ring-1 ring-slate-200 transition hover:ring-orange-300"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, label: "Free pickup today" },
              { icon: ShieldCheck, label: "90-day returns" },
              { icon: BadgeCheck, label: "Pro price match" }
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-100"
              >
                <Icon className="h-4 w-4 text-orange-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Shop by category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Curated for builders, fabricators and gate installers.
            </p>
          </div>
          <Link
            href="/design-lab/d4/category"
            className="hidden items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 sm:flex"
          >
            All categories <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {departments.map((c) => (
            <Link
              key={c.slug}
              href="/design-lab/d4/category"
              className="group rounded-2xl bg-white p-4 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-xl ${c.tint} px-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-700`}
              >
                {c.name.split(" ")[0]}
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-600">
                {c.name}
              </p>
              <p className="text-xs text-slate-400">{c.count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white sm:col-span-2">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-100">
              Pro Week
            </p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
              Up to 25% off gate hardware bundles
            </h3>
            <p className="mt-1 max-w-md text-sm text-orange-50">
              Stock the truck before the season. Mix &amp; match hinges,
              latches and rollers.
            </p>
            <Link
              href="/design-lab/d4/category"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
            >
              Shop the sale <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Trade account
            </p>
            <h3 className="mt-2 text-xl font-extrabold leading-tight">
              Net-30 terms &amp; volume pricing
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              Apply in minutes. Built for crews running multiple jobs.
            </p>
            <Link
              href="/design-lab/d4/orders"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Deals grid */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Trending this week
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hand-picked deals our pros keep reordering.
            </p>
          </div>
          <Link
            href="/design-lab/d4/category"
            className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {deals.map((d) => (
            <article
              key={d.sku}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100"
            >
              <div className={`relative aspect-square bg-gradient-to-br ${d.tint}`}>
                <Image
                  alt={d.title}
                  src={d.image}
                  fill
                  quality={75}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-6"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                  {d.badge}
                </span>
                <button
                  type="button"
                  aria-label="Save item"
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-400 shadow-sm transition hover:text-rose-500"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Link
                  href="/design-lab/d4/product"
                  className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600"
                >
                  {d.title}
                </Link>
                <div className="mt-2 flex items-center gap-1.5">
                  <D4Stars value={d.rating} />
                  <span className="text-xs text-slate-400">({d.reviews})</span>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-lg font-extrabold text-slate-900">
                    ${d.price.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    SKU {d.sku}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <MapPin className="h-3.5 w-3.5" /> In stock — free pickup
                </p>
                <Link
                  href="/design-lab/d4/product"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" /> View product
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Fresh in the catalog
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Newly listed contractor-grade products.
            </p>
          </div>
          <Link
            href="/design-lab/d4/category"
            className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {newArrivals.slice(0, 4).map((product, index) => {
            const variant = product.variants[0];
            return (
              <Link
                key={product.id}
                href="/design-lab/d4/product"
                className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100"
              >
                <div
                  className={`relative aspect-square bg-gradient-to-br ${dealTints[index % dealTints.length]}`}
                >
                  <Image
                    alt={product.title}
                    src={product.images[0]?.url ?? variant?.image ?? "/assets/logo.svg"}
                    fill
                    quality={75}
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-6"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600">
                    {product.title}
                  </p>
                  <p className="mt-2 text-lg font-extrabold text-slate-900">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {product.category.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center gap-2">
            <D4Stars value={5} />
            <p className="text-sm font-bold text-slate-900">
              4.9 / 5 from 12,400+ verified pros
            </p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                q: "Order on my phone at 6am, parts are bagged and waiting when I roll up. Game changer.",
                a: "Marcus T.",
                r: "Fence contractor"
              },
              {
                q: "Real stock counts I can trust. I stopped driving to 3 yards to find one bracket.",
                a: "Dana R.",
                r: "Welder / fabricator"
              },
              {
                q: "Net-30 plus volume pricing made this our default supplier for every gate job.",
                a: "Priya S.",
                r: "GC, 14-person crew"
              }
            ].map((t) => (
              <figure
                key={t.a}
                className="rounded-2xl bg-white p-5 ring-1 ring-slate-100"
              >
                <Star className="h-5 w-5 fill-orange-400 text-orange-400" />
                <blockquote className="mt-3 text-sm text-slate-700">
                  &ldquo;{t.q}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-bold text-slate-900">
                  {t.a}
                  <span className="block text-xs font-normal text-slate-400">
                    {t.r}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </D4Shell>
  );
}
