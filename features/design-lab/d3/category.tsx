"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Category / product listing. */

type Tone = "steel" | "brass" | "ink" | "rust" | "paper";

type Product = {
  id: string;
  name: string;
  group: string;
  price: number;
  unit: string;
  tone: Tone;
  tag?: string;
};

const products: Product[] = [
  { id: "p1", name: "2 × 2 Square Tube — 11ga", group: "Tube", price: 38.4, unit: "/ 20 ft", tone: "steel", tag: "Picked" },
  { id: "p2", name: "1½ × 1½ Square Tube — 14ga", group: "Tube", price: 28.1, unit: "/ 20 ft", tone: "steel" },
  { id: "p3", name: "2 × 2 Angle Iron — ¼″", group: "Angle", price: 33.75, unit: "/ 20 ft", tone: "ink" },
  { id: "p4", name: "C4 × 5.4 Steel Channel", group: "Channel", price: 71.2, unit: "/ 20 ft", tone: "ink", tag: "New" },
  { id: "p5", name: "¼″ Hot-Rolled Plate — 12×12", group: "Plate", price: 19.5, unit: "/ sheet", tone: "rust" },
  { id: "p6", name: "Round Bar — 1″ Solid", group: "Bar", price: 24.0, unit: "/ 20 ft", tone: "steel" },
  { id: "p7", name: "Flat Bar — 2 × ¼″", group: "Bar", price: 16.8, unit: "/ 20 ft", tone: "rust" },
  { id: "p8", name: "Rectangular Tube — 3 × 2", group: "Tube", price: 52.6, unit: "/ 20 ft", tone: "steel" },
  { id: "p9", name: "Expanded Metal Sheet — 4×8", group: "Plate", price: 88.0, unit: "/ sheet", tone: "ink", tag: "Picked" }
];

const groups = ["All", "Tube", "Angle", "Channel", "Plate", "Bar"];
const sorts = ["Editor's order", "Price · low to high", "Price · high to low"];

export function D3Category() {
  const [group, setGroup] = useState("All");
  const [sort, setSort] = useState(sorts[0]);

  const list = useMemo(() => {
    let next = products.filter((p) => group === "All" || p.group === group);
    if (sort === sorts[1]) next = [...next].sort((a, b) => a.price - b.price);
    if (sort === sorts[2]) next = [...next].sort((a, b) => b.price - a.price);
    return next;
  }, [group, sort]);

  return (
    <D3Shell active="Catalog">
      {/* breadcrumb */}
      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
        <nav
          className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em]"
          style={{ color: d3.haze }}
        >
          <Link href="/design-lab/d3/home">Catalog</Link>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: d3.ink }}>Structural Steel</span>
        </nav>
      </div>

      {/* department header — editorial cover */}
      <section className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
        <div className="grid items-end gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Eyebrow>Department 01</Eyebrow>
            <h1
              className={`${serif} mt-4 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[3.6rem]`}
            >
              Structural Steel
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: d3.graphite }}>
              Tube, angle, channel, plate and bar — the raw vocabulary of every
              fabrication. Stocked in 20-foot lengths, cut to spec at the saw.
            </p>
          </div>
          <MaterialBlock tone="steel" label="Department 01 — cover plate" className="h-[200px] w-full md:h-[240px]" />
        </div>
      </section>

      {/* toolbar */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div
          className="flex flex-col gap-4 border-y py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: d3.rule }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {groups.map((g) => {
              const sel = g === group;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: sel ? d3.ink : "transparent",
                    color: sel ? d3.paper : d3.graphite,
                    border: `1px solid ${sel ? d3.ink : d3.rule}`
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4" style={{ color: d3.haze }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border bg-transparent px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.12em]"
              style={{ borderColor: d3.rule, color: d3.ink }}
            >
              {sorts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span
              className="hidden text-[0.72rem] uppercase tracking-[0.16em] sm:inline"
              style={{ color: d3.haze }}
            >
              {list.length} items
            </span>
          </div>
        </div>
      </section>

      {/* product grid — editorial cards */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Link key={p.id} href="/design-lab/d3/product" className="group block">
              <div className="relative overflow-hidden">
                <MaterialBlock
                  tone={p.tone}
                  className="aspect-[4/5] w-full transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span
                  className={`${serif} absolute left-4 top-3 text-lg`}
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.tag ? (
                  <span
                    className="absolute right-3 top-3 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em]"
                    style={{ background: d3.brass, color: "#fff" }}
                  >
                    {p.tag}
                  </span>
                ) : null}
              </div>
              <p
                className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                style={{ color: d3.brass }}
              >
                {p.group}
              </p>
              <div className="mt-1.5 flex items-start justify-between gap-3">
                <h3 className={`${serif} text-xl font-semibold leading-snug`}>
                  {p.name}
                </h3>
                <ArrowUpRight
                  className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:rotate-45"
                  style={{ color: d3.brass }}
                />
              </div>
              <p className="mt-2 text-sm" style={{ color: d3.graphite }}>
                <span className="font-semibold" style={{ color: d3.ink }}>
                  ${p.price.toFixed(2)}
                </span>{" "}
                {p.unit}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* editorial interlude */}
      <section className="mx-auto mt-24 max-w-[1280px] px-5 sm:px-8">
        <div
          className="grid items-center gap-8 p-8 sm:p-12 md:grid-cols-[0.6fr_0.4fr]"
          style={{ background: d3.ink, color: d3.paper }}
        >
          <div>
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d3.brass }}
            >
              Cutting Service
            </span>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight`}>
              Order a length, name a cut — we'll have it bundled by pickup.
            </h2>
          </div>
          <Link
            href="/design-lab/d3/product"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full px-7 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
            style={{ background: d3.brass, color: "#fff" }}
          >
            Spec a cut <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </D3Shell>
  );
}
