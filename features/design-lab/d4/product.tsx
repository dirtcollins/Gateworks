"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import { D4Shell, D4Stars, brandClasses } from "./shell";

const product = {
  name: "Heavy-Duty Cantilever Gate Roller Kit",
  sku: "GW-CANT-RK48",
  brand: "ForgeLine Pro",
  price: 142.0,
  was: 189.0,
  rating: 4.8,
  reviews: 214,
  stock: 38,
  thumbs: [
    "from-amber-200 to-amber-50",
    "from-orange-200 to-orange-50",
    "from-slate-200 to-slate-50",
    "from-amber-100 to-white"
  ]
};

const finishes = [
  { id: "galv", label: "Galvanized", delta: 0 },
  { id: "powder", label: "Powder-coat black", delta: 18 },
  { id: "ss", label: "Stainless 304", delta: 64 }
];

const specs: [string, string][] = [
  ["Load rating", "1,200 lb gate capacity"],
  ["Track length", "48 in (122 cm)"],
  ["Bearing type", "Sealed double-row"],
  ["Material", "Hot-dip galvanized steel"],
  ["Warranty", "5-year structural"],
  ["Ships from", "Yard #2 — Eastside"]
];

const related = [
  { name: 'Gate Latch — Lockable Drop Rod', price: 31.5, tint: "from-sky-200 to-sky-50" },
  { name: "Self-Closing Gravity Hinge Pair", price: 54.99, tint: "from-emerald-200 to-emerald-50" },
  { name: "Galvanized Steel Tube 2x2", price: 78.5, tint: "from-violet-200 to-violet-50" },
  { name: "Anti-Sag Gate Kit", price: 24.0, tint: "from-rose-200 to-rose-50" }
];

export function D4Product() {
  const [active, setActive] = useState(0);
  const [finish, setFinish] = useState(finishes[0].id);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);

  const finishDelta = finishes.find((f) => f.id === finish)?.delta ?? 0;
  const unit = product.price + finishDelta;
  const total = unit * qty;

  return (
    <D4Shell active="product">
      {/* breadcrumb */}
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <nav className="flex items-center gap-1 text-xs text-slate-400">
          <Link href="/design-lab/d4/home" className="hover:text-orange-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/design-lab/d4/category" className="hover:text-orange-600">
            Gate Hardware
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-600">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div
            className={`relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${product.thumbs[active]} ring-1 ring-slate-100`}
          >
            <span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              Save ${(product.was - product.price).toFixed(0)}
            </span>
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-label="Save item"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-rose-500"
            >
              <Heart
                className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>
            <span className="absolute bottom-4 left-4 grid h-12 w-12 place-items-center rounded-xl bg-white/70 text-[10px] font-bold uppercase text-slate-500">
              Photo
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {product.thumbs.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`aspect-square rounded-xl bg-gradient-to-br ${t} ring-2 transition ${
                  active === i ? "ring-orange-500" : "ring-transparent hover:ring-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <D4Stars value={product.rating} size="md" />
              <span className="text-sm font-bold text-slate-700">
                {product.rating}
              </span>
            </span>
            <span className="text-sm text-slate-400">
              {product.reviews} reviews
            </span>
            <span className="text-xs font-semibold text-slate-400">
              SKU {product.sku}
            </span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-extrabold text-slate-900">
              ${unit.toFixed(2)}
            </span>
            <span className="pb-1 text-lg text-slate-400 line-through">
              ${product.was.toFixed(2)}
            </span>
            <span className="mb-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              25% off
            </span>
          </div>

          {/* stock */}
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <Check className="h-4 w-4" />
            {product.stock} in stock · free pickup today at Yard #2
          </p>

          {/* finish */}
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-900">Finish</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {finishes.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                    finish === f.id
                      ? "bg-orange-50 text-orange-600 ring-orange-300"
                      : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                  }`}
                >
                  {f.label}
                  {f.delta ? (
                    <span className="ml-1 text-xs text-slate-400">
                      +${f.delta}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* quantity */}
          <div className="mt-6 flex items-center gap-4">
            <p className="text-sm font-bold text-slate-900">Quantity</p>
            <div className="flex items-center rounded-xl ring-1 ring-slate-200">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-orange-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-slate-400">
              Subtotal{" "}
              <span className="font-bold text-slate-900">
                ${total.toFixed(2)}
              </span>
            </span>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <Link
              href="/design-lab/d4/cart"
              className={`${brandClasses.btn} flex-1 px-5 py-3.5 text-base`}
            >
              <ShoppingCart className="h-5 w-5" /> Add to cart
            </Link>
            <Link
              href="/design-lab/d4/cart"
              className="grid place-items-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Buy now
            </Link>
          </div>

          {/* assurances */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, t: "Free pickup", s: "Ready in 1 hr" },
              { icon: RotateCcw, t: "90-day returns", s: "No restock fee" },
              { icon: ShieldCheck, t: "5-yr warranty", s: "Structural" }
            ].map(({ icon: Icon, t, s }) => (
              <div
                key={t}
                className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-100"
              >
                <Icon className="mx-auto h-5 w-5 text-orange-500" />
                <p className="mt-1.5 text-xs font-bold text-slate-800">{t}</p>
                <p className="text-[11px] text-slate-400">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details + specs */}
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            About this product
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The ForgeLine cantilever roller kit is engineered for sliding gates
            up to 1,200 lb. Sealed double-row bearings shrug off grit, rain and
            daily cycling, while the hot-dip galvanized track resists corrosion
            for decades. Everything bolts up with standard hardware — no
            specialty tools required — so a two-person crew can hang a gate in
            under an afternoon.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "Includes 48 in track, 4 truck assemblies and end stops",
              "Pre-drilled mounting plates for fast install",
              "Compatible with 2 in and 2.5 in square gate frames"
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className={`${brandClasses.card} p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Package className="h-5 w-5 text-orange-500" /> Specifications
          </h2>
          <dl className="mt-3 divide-y divide-slate-100 text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Reviews snapshot */}
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className={`${brandClasses.card} p-6`}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-slate-900">
                {product.rating}
              </p>
              <D4Stars value={product.rating} size="md" />
              <p className="mt-1 text-xs text-slate-400">
                {product.reviews} reviews
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                [5, 82],
                [4, 12],
                [3, 4],
                [2, 1],
                [1, 1]
              ].map(([star, pct]) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-semibold text-slate-500">
                    {star}★
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-slate-400">
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                a: "Jordan K.",
                q: "Hung a 16-ft sliding gate solo. The bearings are buttery and the track lined up perfectly."
              },
              {
                a: "Lena M.",
                q: "Picked up same day, saved the job. Powder-coat finish looks sharp against the fence."
              }
            ].map((r) => (
              <div key={r.a} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                  <span className="text-sm font-bold text-slate-900">
                    {r.a}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verified
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{r.q}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-xl font-bold text-slate-900">
          Pairs well with
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {related.map((r) => (
            <Link
              key={r.name}
              href="/design-lab/d4/product"
              className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100"
            >
              <div className={`aspect-square bg-gradient-to-br ${r.tint}`} />
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600">
                  {r.name}
                </p>
                <p className="mt-1 text-base font-extrabold text-slate-900">
                  ${r.price.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sticky add-to-cart */}
      <div className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <div className={`hidden h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br ${product.thumbs[0]} sm:block`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              {product.name}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">
              In stock · free pickup today
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-slate-900">
              ${total.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400">qty {qty}</p>
          </div>
          <Link
            href="/design-lab/d4/cart"
            className={`${brandClasses.btn} px-5 py-2.5 text-sm`}
          >
            <ShoppingCart className="h-4 w-4" /> Add to cart
          </Link>
        </div>
      </div>
    </D4Shell>
  );
}
