"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import {
  featuredCategoryProducts,
  featuredProduct,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Category / product listing. Real catalog. */

const department = featuredProduct.category;
const catalogProducts = featuredCategoryProducts;

// Facet list — real catalog departments, with the active one first.
const facets = [
  { name: "All", slug: "all" },
  ...topCategories.map((category) => ({
    name: category.name,
    slug: category.slug
  }))
];

const sorts = ["Editor's order", "Price · low to high", "Price · high to low"];
const tones = ["steel", "ink", "brass", "rust", "paper"] as const;

export function D3Category() {
  const [facet, setFacet] = useState(department.slug);
  const [sort, setSort] = useState(sorts[0]);

  const list = useMemo(() => {
    const base =
      facet === "all" || facet === department.slug
        ? catalogProducts
        : getCategoryProducts(facet);
    let next = [...base];
    if (sort === sorts[1]) next = next.sort((a, b) => a.price - b.price);
    if (sort === sorts[2]) next = next.sort((a, b) => b.price - a.price);
    return next;
  }, [facet, sort]);

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
          <span style={{ color: d3.ink }}>{department.name}</span>
        </nav>
      </div>

      {/* department header — editorial cover */}
      <section className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
        <div className="grid items-end gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Eyebrow>Department</Eyebrow>
            <h1
              className={`${serif} mt-4 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[3.6rem]`}
            >
              {department.name}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: d3.graphite }}>
              The full {department.name.toLowerCase()} shelf — every item
              photographed, specified and stocked, ready to cut, quote and
              route the same day.
            </p>
          </div>
          <MaterialBlock tone="steel" label={`${department.name} — cover plate`} className="h-[200px] w-full md:h-[240px]" />
        </div>
      </section>

      {/* toolbar */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div
          className="flex flex-col gap-4 border-y py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: d3.rule }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {facets.map((g) => {
              const sel = g.slug === facet;
              return (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => setFacet(g.slug)}
                  className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: sel ? d3.ink : "transparent",
                    color: sel ? d3.paper : d3.graphite,
                    border: `1px solid ${sel ? d3.ink : d3.rule}`
                  }}
                >
                  {g.name}
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
        {list.length === 0 ? (
          <p className="py-20 text-center text-sm" style={{ color: d3.haze }}>
            No items in this department yet.
          </p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p, i) => {
              const image = p.images[0]?.url;
              return (
                <Link key={p.id} href="/design-lab/d3/product" className="group block">
                  <div className="relative overflow-hidden" style={{ background: d3.card }}>
                    <div className="relative aspect-[4/5] w-full">
                      {image ? (
                        <Image
                          src={image}
                          alt={p.title}
                          fill
                          quality={75}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <MaterialBlock
                          tone={tones[i % tones.length]}
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <span
                      className={`${serif} absolute left-4 top-3 text-lg`}
                      style={{ color: d3.haze }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p.variants.length > 1 ? (
                      <span
                        className="absolute right-3 top-3 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em]"
                        style={{ background: d3.brass, color: "#fff" }}
                      >
                        {p.variants.length} options
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: d3.brass }}
                  >
                    {p.category.name}
                  </p>
                  <div className="mt-1.5 flex items-start justify-between gap-3">
                    <h3 className={`${serif} text-xl font-semibold leading-snug`}>
                      {p.title}
                    </h3>
                    <ArrowUpRight
                      className="mt-1 h-4 w-4 shrink-0 transition-transform group-hover:rotate-45"
                      style={{ color: d3.brass }}
                    />
                  </div>
                  <p className="mt-2 text-sm" style={{ color: d3.graphite }}>
                    <span className="font-semibold" style={{ color: d3.ink }}>
                      {formatCurrency(p.price)}
                    </span>{" "}
                    {p.variants.length > 1 ? "/ from" : "/ each"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
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
