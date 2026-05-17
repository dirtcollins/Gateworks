"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Filter, Layers } from "lucide-react";
import {
  categories,
  featuredCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  projects,
  usd
} from "./kit";

/* Real catalog products framed as a project component set. */
const COMPONENTS: Product[] = featuredCategoryProducts;
const activeProject =
  projects.find(
    (project) => project.categorySlug === (COMPONENTS[0]?.category.slug ?? "")
  ) ?? projects[0];

const SORTS = [
  "Build sequence",
  "Price low → high",
  "Price high → low",
  "Most variants"
] as const;

const maxPrice = Math.max(
  100,
  Math.ceil(COMPONENTS.reduce((max, product) => Math.max(max, product.price), 0))
);

export function D8Category() {
  const [sort, setSort] = useState<(typeof SORTS)[number]>(SORTS[0]);
  const [priceCap, setPriceCap] = useState(maxPrice);
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = COMPONENTS.filter((product) => {
      const hasStock = product.variants.some(
        (variant) => variant.inventory === "in_stock"
      );
      return product.price <= priceCap && (!inStockOnly || hasStock);
    });
    if (sort === "Price low → high")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price high → low")
      list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "Most variants")
      list = [...list].sort((a, b) => b.variants.length - a.variants.length);
    return list;
  }, [sort, priceCap, inStockOnly]);

  const setSubtotal = filtered.reduce(
    (sum, product) => sum + product.price,
    0
  );

  return (
    <D8Shell active="category">
      {/* Project header */}
      <section
        className="border-b"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto max-w-6xl px-5 py-9">
          <nav
            className={`${mono} flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]`}
            style={{ color: ink.chalkFaint }}
          >
            <Link href="/design-lab/d8/home" style={{ color: ink.cyan }}>
              Projects
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span>{activeProject.name}</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <DraftingMark label={`${activeProject.code} · Component set`} />
              <h1
                className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
                style={{ color: ink.chalk }}
              >
                {activeProject.name}
              </h1>
              <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
                {activeProject.brief}
              </p>
            </div>
            <div
              className="rounded-sm border px-4 py-3 text-right"
              style={{ borderColor: ink.line }}
            >
              <Dimension
                value={`${COMPONENTS.length} parts`}
                hint={activeProject.stage}
              />
              <p
                className={`${mono} mt-1 text-[11px]`}
                style={{ color: ink.chalkFaint }}
              >
                Full BOM est. {usd(setSubtotal, false)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Facets */}
        <aside className="space-y-4">
          <BlueprintCard>
            <div
              className="flex items-center gap-2 border-b px-4 py-2.5"
              style={{ borderColor: ink.lineSoft }}
            >
              <Filter className="h-4 w-4" style={{ color: ink.cyan }} />
              <span
                className={`${mono} text-[11px] uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkDim }}
              >
                Other builds
              </span>
            </div>
            <div className="px-2 py-2">
              {projects.map((project) => {
                const isActive = project.id === activeProject.id;
                return (
                  <Link
                    key={project.id}
                    href="/design-lab/d8/category"
                    className={`${mono} flex items-center justify-between rounded-sm px-2 py-1.5 text-[12px] transition`}
                    style={{
                      color: isActive ? ink.cyan : ink.chalkDim,
                      backgroundColor: isActive ? ink.panelSoft : "transparent"
                    }}
                  >
                    <span className="truncate">{project.name}</span>
                    {isActive ? (
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </BlueprintCard>

          <BlueprintCard>
            <div className="px-4 py-3">
              <p
                className={`${mono} text-[11px] uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkDim }}
              >
                Budget ceiling
              </p>
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={priceCap}
                onChange={(event) => setPriceCap(Number(event.target.value))}
                className="mt-3 w-full"
                style={{ accentColor: ink.cyan }}
              />
              <p
                className={`${mono} mt-1.5 text-xs`}
                style={{ color: ink.cyan }}
              >
                ≤ {usd(priceCap, false)} / part
              </p>
            </div>
          </BlueprintCard>

          <BlueprintCard>
            <button
              type="button"
              onClick={() => setInStockOnly((value) => !value)}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <span
                className={`${mono} text-[11px] uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkDim }}
              >
                On-shelf only
              </span>
              <span
                className="relative h-5 w-9 rounded-sm border transition"
                style={{
                  borderColor: ink.line,
                  backgroundColor: inStockOnly ? ink.cyan : "transparent"
                }}
              >
                <span
                  className="absolute top-0.5 h-3.5 w-3.5 rounded-sm transition"
                  style={{
                    left: inStockOnly ? "18px" : "2px",
                    backgroundColor: inStockOnly ? ink.groundDeep : ink.chalkFaint
                  }}
                />
              </span>
            </button>
          </BlueprintCard>

          <BlueprintCard>
            <div className="px-4 py-3">
              <p
                className={`${mono} text-[11px] uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkDim }}
              >
                Catalog stages
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topCategories.slice(0, 6).map((category) => (
                  <span
                    key={category.slug}
                    className={`${mono} rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]`}
                    style={{
                      borderColor: ink.lineSoft,
                      color: ink.chalkFaint
                    }}
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              <p
                className={`${mono} mt-2 text-[10px]`}
                style={{ color: ink.chalkFaint }}
              >
                {categories.length} categories indexed
              </p>
            </div>
          </BlueprintCard>
        </aside>

        {/* Component grid */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p
              className={`${mono} text-[12px] uppercase tracking-[0.16em]`}
              style={{ color: ink.chalkDim }}
            >
              {filtered.length} component{filtered.length === 1 ? "" : "s"}{" "}
              scheduled
            </p>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as (typeof SORTS)[number])
              }
              className={`${mono} rounded-sm border px-3 py-2 text-[12px]`}
              style={{
                borderColor: ink.line,
                backgroundColor: ink.panel,
                color: ink.chalkDim
              }}
            >
              {SORTS.map((option) => (
                <option key={option} style={{ backgroundColor: ink.panel }}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <BlueprintCard>
              <div className="grid place-items-center px-5 py-16 text-center">
                <Layers className="h-8 w-8" style={{ color: ink.chalkFaint }} />
                <p
                  className="mt-3 text-sm font-semibold"
                  style={{ color: ink.chalk }}
                >
                  No components match the spec
                </p>
                <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
                  Widen the budget ceiling to reveal more of the build.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPriceCap(maxPrice);
                    setInStockOnly(false);
                  }}
                  className={`${mono} mt-4 rounded-sm border px-4 py-2 text-[11px] uppercase tracking-[0.18em]`}
                  style={{ borderColor: ink.line, color: ink.cyan }}
                >
                  Reset filters
                </button>
              </div>
            </BlueprintCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product, index) => {
                const variant = product.variants[0];
                const out = !product.variants.some(
                  (item) => item.inventory === "in_stock"
                );
                return (
                  <Link key={product.id} href="/design-lab/d8/product">
                    <BlueprintCard className="group h-full overflow-hidden transition hover:-translate-y-0.5">
                      <div
                        className="relative aspect-square"
                        style={{ backgroundColor: ink.panelSoft }}
                      >
                        <Image
                          alt={product.title}
                          src={
                            product.images[0]?.url ??
                            variant?.image ??
                            "/assets/logo.svg"
                          }
                          fill
                          quality={75}
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-contain p-6"
                        />
                        <span
                          className={`${mono} absolute left-2 top-2 text-[10px] uppercase tracking-[0.16em]`}
                          style={{ color: ink.cyan }}
                        >
                          {activeProject.code}.{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        className="border-t p-3"
                        style={{ borderColor: ink.lineSoft }}
                      >
                        <p
                          className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
                          style={{ color: ink.chalkFaint }}
                        >
                          {variant?.sku ?? product.id}
                        </p>
                        <p
                          className="mt-1 line-clamp-2 text-xs font-semibold leading-snug"
                          style={{ color: ink.chalk }}
                        >
                          {product.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`${mono} text-sm font-semibold`}
                            style={{ color: ink.cyan }}
                          >
                            {usd(product.price)}
                          </span>
                          <span
                            className={`${mono} text-[10px] uppercase tracking-[0.14em]`}
                            style={{ color: out ? ink.amber : ink.chalkFaint }}
                          >
                            {out
                              ? "Backorder"
                              : `${product.variants.length} var`}
                          </span>
                        </div>
                        <span
                          className={`${mono} mt-2 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] transition group-hover:gap-2`}
                          style={{ color: ink.cyan }}
                        >
                          Open spec <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </BlueprintCard>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </D8Shell>
  );
}
