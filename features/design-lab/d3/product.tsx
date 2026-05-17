"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  Truck
} from "lucide-react";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Product detail. */

const gallery = [
  { tone: "steel" as const, label: "Profile" },
  { tone: "ink" as const, label: "Wall section" },
  { tone: "rust" as const, label: "Cut end" },
  { tone: "paper" as const, label: "In context" }
];

const lengths = [
  { id: "20", label: "20 ft", price: 38.4 },
  { id: "24", label: "24 ft", price: 45.9 },
  { id: "cut", label: "Cut to spec", price: 41.0 }
];

const specs = [
  ["Profile", '2" × 2" square'],
  ["Wall gauge", "11 ga (0.120 in)"],
  ["Material", "ASTM A500 Grade B"],
  ["Finish", "Hot-rolled, pickled & oiled"],
  ["Weight", "2.94 lb / ft"],
  ["Origin", "Domestic mill, MTR available"]
];

const related = [
  { name: "1½ × 1½ Square Tube", price: "$28.10", tone: "steel" as const },
  { name: "2 × 2 Angle Iron — ¼″", price: "$33.75", tone: "ink" as const },
  { name: "Bolt-On Gate Hinge", price: "$24.90", tone: "brass" as const }
];

export function D3Product() {
  const [active, setActive] = useState(0);
  const [length, setLength] = useState(lengths[0]);
  const [qty, setQty] = useState(4);
  const [added, setAdded] = useState(false);

  const total = (length.price * qty).toFixed(2);

  return (
    <D3Shell active="Product">
      {/* breadcrumb */}
      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
        <nav
          className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em]"
          style={{ color: d3.haze }}
        >
          <Link href="/design-lab/d3/home">Catalog</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/design-lab/d3/category">Structural Steel</Link>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: d3.ink }}>Square Tube</span>
        </nav>
      </div>

      {/* HERO — gallery + buy column */}
      <section className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* gallery */}
          <div>
            <MaterialBlock
              tone={gallery[active].tone}
              label={`Plate ${active + 1} — ${gallery[active].label}`}
              className="aspect-[5/4] w-full"
            />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((g, i) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() => setActive(i)}
                  className="block"
                  aria-label={g.label}
                >
                  <MaterialBlock
                    tone={g.tone}
                    className="aspect-square w-full transition-opacity"
                  />
                  <span
                    className="mt-1.5 block text-[0.64rem] uppercase tracking-[0.16em]"
                    style={{
                      color: i === active ? d3.ink : d3.haze,
                      borderTop: `2px solid ${i === active ? d3.brass : "transparent"}`,
                      paddingTop: 4
                    }}
                  >
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* buy column */}
          <div className="lg:pt-2">
            <Eyebrow>Structural Steel — No. 04</Eyebrow>
            <h1
              className={`${serif} mt-3 text-[2.3rem] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[2.9rem]`}
            >
              2 × 2 Square Tube
            </h1>
            <p
              className="mt-4 max-w-md text-[0.95rem] leading-relaxed"
              style={{ color: d3.graphite }}
            >
              The workhorse of gate frames and fabrication. Eleven-gauge wall,
              domestic mill, clean welds — a profile we cut by the dozen every
              morning.
            </p>

            <div
              className="mt-6 flex items-baseline gap-3 border-t pt-6"
              style={{ borderColor: d3.rule }}
            >
              <span className={`${serif} text-4xl font-semibold`}>
                ${length.price.toFixed(2)}
              </span>
              <span
                className="text-[0.74rem] uppercase tracking-[0.16em]"
                style={{ color: d3.haze }}
              >
                per length · trade tier B
              </span>
            </div>

            {/* length selector */}
            <div className="mt-7">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: d3.graphite }}>
                Length
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {lengths.map((l) => {
                  const sel = l.id === length.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLength(l)}
                      className="rounded-full border px-5 py-2.5 text-[0.78rem] font-semibold transition-colors"
                      style={{
                        borderColor: sel ? d3.ink : d3.rule,
                        background: sel ? d3.ink : "transparent",
                        color: sel ? d3.paper : d3.ink
                      }}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* quantity + add */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div
                className="flex items-center gap-4 rounded-full border px-3 py-2"
                style={{ borderColor: d3.rule }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: d3.paper }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className={`${serif} w-8 text-center text-xl`}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: d3.paper }}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 1800);
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
                style={{ background: added ? d3.brassDeep : d3.ink }}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> Added to cart
                  </>
                ) : (
                  <>Add to cart — ${total}</>
                )}
              </button>
            </div>

            <Link
              href="/design-lab/d3/cart"
              className="mt-4 inline-block text-[0.76rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px]"
              style={{ color: d3.graphite }}
            >
              View cart & checkout
            </Link>

            {/* assurances */}
            <div
              className="mt-7 grid grid-cols-3 gap-3 border-t pt-6"
              style={{ borderColor: d3.rule }}
            >
              {[
                { icon: Truck, t: "Will-call", n: "Ready in 2 hrs" },
                { icon: Ruler, t: "Cut service", n: "± 1/16 in" },
                { icon: ShieldCheck, t: "Mill cert", n: "On request" }
              ].map((a) => (
                <div key={a.t}>
                  <a.icon className="h-5 w-5" style={{ color: d3.brass }} />
                  <p className="mt-2 text-[0.78rem] font-semibold">{a.t}</p>
                  <p className="text-[0.7rem]" style={{ color: d3.haze }}>
                    {a.n}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SPEC SHEET — editorial two-column */}
      <section className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[0.42fr_0.58fr]">
          <div>
            <Eyebrow>The Spec Sheet</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight`}>
              Measured, certified, and honest about its gauge.
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: d3.graphite }}>
              Every dimension below is verified against the mill test report.
              No nominal rounding, no surprises at the saw.
            </p>
          </div>
          <dl
            className="divide-y border-t"
            style={{ borderColor: d3.rule }}
          >
            {specs.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 py-4"
                style={{ borderColor: d3.rule }}
              >
                <dt
                  className="text-[0.74rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: d3.haze }}
                >
                  {k}
                </dt>
                <dd className={`${serif} text-right text-lg`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* RELATED — pairs well with */}
      <section className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Composed With</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold`}>
              Pairs well on the same order
            </h2>
          </div>
          <Link
            href="/design-lab/d3/category"
            className="hidden shrink-0 text-[0.78rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] sm:inline"
          >
            Full department
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {related.map((r) => (
            <Link key={r.name} href="/design-lab/d3/product" className="group block">
              <MaterialBlock
                tone={r.tone}
                className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className={`${serif} text-lg font-semibold`}>{r.name}</h3>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0"
                  style={{ color: d3.brass }}
                />
              </div>
              <p className="mt-1 text-sm font-semibold">{r.price}</p>
            </Link>
          ))}
        </div>
      </section>
    </D3Shell>
  );
}
