"use client";

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
import { D4Shell, D4Stars, brandClasses } from "./shell";

const categories = [
  { name: "Gate Hardware", count: 312, tint: "bg-amber-100", emoji: "Gate" },
  { name: "Steel & Tube", count: 188, tint: "bg-sky-100", emoji: "Steel" },
  { name: "Fasteners", count: 940, tint: "bg-emerald-100", emoji: "Bolts" },
  { name: "Welding", count: 156, tint: "bg-orange-100", emoji: "Weld" },
  { name: "Power Tools", count: 274, tint: "bg-violet-100", emoji: "Tools" },
  { name: "Safety Gear", count: 203, tint: "bg-rose-100", emoji: "Safety" }
];

const deals = [
  {
    name: "Heavy-Duty Cantilever Gate Roller Kit",
    price: 142.0,
    was: 189.0,
    rating: 4.8,
    reviews: 214,
    badge: "Best Seller",
    tint: "from-amber-200 to-amber-50"
  },
  {
    name: '2" x 2" x 11ga Galvanized Steel Tube — 24 ft',
    price: 78.5,
    was: 96.0,
    rating: 4.9,
    reviews: 88,
    badge: "Low Stock",
    tint: "from-sky-200 to-sky-50"
  },
  {
    name: "Self-Closing Gravity Gate Hinge — Pair",
    price: 54.99,
    was: 71.0,
    rating: 4.7,
    reviews: 332,
    badge: "Free Pickup",
    tint: "from-emerald-200 to-emerald-50"
  },
  {
    name: "M18 FUEL Brushless Impact Driver Kit",
    price: 219.0,
    was: 259.0,
    rating: 4.9,
    reviews: 1204,
    badge: "Top Rated",
    tint: "from-violet-200 to-violet-50"
  }
];

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
              {["Gate latches", "Rebar", "Hinges", "Carriage bolts"].map((t) => (
                <Link
                  key={t}
                  href="/design-lab/d4/category"
                  className="rounded-full bg-white px-3 py-1 font-medium text-slate-600 ring-1 ring-slate-200 transition hover:ring-orange-300"
                >
                  {t}
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
          {categories.map((c) => (
            <Link
              key={c.name}
              href="/design-lab/d4/category"
              className="group rounded-2xl bg-white p-4 ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-xl ${c.tint} text-xs font-bold uppercase tracking-wide text-slate-700`}
              >
                {c.emoji}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900 group-hover:text-orange-600">
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
              key={d.name}
              className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100"
            >
              <div className={`relative aspect-square bg-gradient-to-br ${d.tint}`}>
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
                  {d.name}
                </Link>
                <div className="mt-2 flex items-center gap-1.5">
                  <D4Stars value={d.rating} />
                  <span className="text-xs text-slate-400">({d.reviews})</span>
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-lg font-extrabold text-slate-900">
                    ${d.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-400 line-through">
                    ${d.was.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <MapPin className="h-3.5 w-3.5" /> In stock — free pickup
                </p>
                <Link
                  href="/design-lab/d4/cart"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to cart
                </Link>
              </div>
            </article>
          ))}
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
