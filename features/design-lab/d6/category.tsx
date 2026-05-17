"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  ProductStage,
  apex,
  formatUsd
} from "./kit";
import {
  categories,
  featuredCategoryProducts,
  featuredProduct,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";

type Row = {
  name: string;
  slug: string;
  sku: string;
  price: number;
  group: string;
  inStock: boolean;
  variants: number;
  image?: string;
};

const SORTS = ["Featured", "Price: Low to High", "Price: High to Low"] as const;

const CATEGORY_NAME = featuredProduct.category.name;

/* Real products from the featured catalog category. */
const PRODUCTS: Row[] = featuredCategoryProducts.map((product) => {
  const firstVariant = product.variants[0];
  return {
    name: product.title,
    slug: product.slug,
    sku: firstVariant?.sku ?? product.id,
    price: product.price,
    group:
      firstVariant?.options.finish ||
      firstVariant?.options.material ||
      "Standard",
    inStock: product.variants.some(
      (variant) => variant.inventory === "in_stock"
    ),
    variants: product.variants.length,
    image: product.images[0]?.url
  };
});

const GROUPS = Array.from(new Set(PRODUCTS.map((product) => product.group)));

/* Real department facet list. */
const FACETS = topCategories.length
  ? topCategories.map((category) => ({
      name: category.name,
      slug: category.slug,
      count: getCategoryProducts(category.slug).length
    }))
  : categories.map((category) => ({
      name: category.name,
      slug: category.slug,
      count: getCategoryProducts(category.slug).length
    }));

export function D6Category() {
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Featured");

  const visible = useMemo(() => {
    let list = PRODUCTS.filter(
      (product) =>
        (activeGroups.length === 0 || activeGroups.includes(product.group)) &&
        (!inStockOnly || product.inStock)
    );
    if (sort === "Price: Low to High") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: High to Low") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [activeGroups, inStockOnly, sort]);

  function toggleGroup(group: string) {
    setActiveGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group]
    );
  }

  return (
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      <nav
        className="flex items-center gap-2 py-7"
        style={{ color: apex.faint }}
      >
        <Link href="/design-lab/d6/home">
          <Mono style={{ color: apex.faint }}>Home</Mono>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Mono style={{ color: apex.accent }}>{CATEGORY_NAME}</Mono>
      </nav>

      {/* Department header */}
      <header
        className="border-y py-12"
        style={{ borderColor: apex.line }}
      >
        <Eyebrow>Catalog · Department</Eyebrow>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <h1
            className="text-[2.8rem] font-medium leading-[1.02] tracking-[-0.04em] sm:text-[4rem]"
            style={{ color: apex.text }}
          >
            {CATEGORY_NAME}
          </h1>
          <span
            className="rounded-full border px-4 py-2"
            style={{ borderColor: apex.line }}
          >
            <Mono style={{ color: apex.accent }}>
              {visible.length} / {PRODUCTS.length} SKU
            </Mono>
          </span>
        </div>
        <p
          className="mt-5 max-w-xl text-[14px] leading-relaxed"
          style={{ color: apex.mute }}
        >
          Contractor-grade {CATEGORY_NAME.toLowerCase()} for swing and slide
          gates. Deep counter stock, trade pricing applied at checkout, ready
          for same-day will-call pickup.
        </p>
      </header>

      <div className="grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        {/* Filter rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel className="p-6">
            <Mono style={{ color: apex.faint }}>Refine results</Mono>

            <div className="mt-6">
              <Mono style={{ color: apex.accent }}>Finish</Mono>
              <div className="mt-3 space-y-2.5">
                {GROUPS.map((group) => {
                  const active = activeGroups.includes(group);
                  return (
                    <button
                      key={group}
                      className="flex w-full items-center gap-3 text-left"
                      onClick={() => toggleGroup(group)}
                      type="button"
                    >
                      <span
                        className="grid h-4 w-4 shrink-0 place-items-center rounded border transition-all"
                        style={{
                          borderColor: active ? apex.accent : apex.line,
                          background: active
                            ? apex.accent
                            : "transparent"
                        }}
                      >
                        {active ? (
                          <span
                            className="h-1.5 w-1.5 rounded-sm"
                            style={{ background: apex.void }}
                          />
                        ) : null}
                      </span>
                      <span
                        className="text-[13px]"
                        style={{ color: active ? apex.text : apex.mute }}
                      >
                        {group}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-6 border-t pt-5"
              style={{ borderColor: apex.line }}
            >
              <button
                className="flex w-full items-center gap-3"
                onClick={() => setInStockOnly((value) => !value)}
                type="button"
              >
                <span
                  className="grid h-4 w-4 shrink-0 place-items-center rounded border transition-all"
                  style={{
                    borderColor: inStockOnly ? apex.accent : apex.line,
                    background: inStockOnly ? apex.accent : "transparent"
                  }}
                >
                  {inStockOnly ? (
                    <span
                      className="h-1.5 w-1.5 rounded-sm"
                      style={{ background: apex.void }}
                    />
                  ) : null}
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: inStockOnly ? apex.text : apex.mute }}
                >
                  In stock only
                </span>
              </button>
            </div>

            <button
              className="mt-5 transition-colors hover:opacity-80"
              onClick={() => {
                setActiveGroups([]);
                setInStockOnly(false);
              }}
              type="button"
            >
              <Mono style={{ color: apex.accent }}>Clear all filters</Mono>
            </button>
          </Panel>

          {/* Department index */}
          <Panel className="mt-4 p-6">
            <Mono style={{ color: apex.faint }}>All departments</Mono>
            <div className="mt-4 space-y-1">
              {FACETS.map((facet) => (
                <Link
                  key={facet.slug}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                  href="/design-lab/d6/category"
                >
                  <span
                    className="text-[13px]"
                    style={{ color: apex.text }}
                  >
                    {facet.name}
                  </span>
                  <Mono style={{ color: apex.faint }}>{facet.count}</Mono>
                </Link>
              ))}
            </div>
          </Panel>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Mono style={{ color: apex.mute }}>
              Showing {visible.length} of {PRODUCTS.length} products
            </Mono>
            <div className="flex items-center gap-3">
              <Mono style={{ color: apex.faint }}>Sort</Mono>
              <select
                className="rounded-full border px-4 py-2 text-[12px] outline-none"
                onChange={(event) =>
                  setSort(event.target.value as (typeof SORTS)[number])
                }
                style={{
                  borderColor: apex.line,
                  background: apex.surface,
                  color: apex.text
                }}
                value={sort}
              >
                {SORTS.map((option) => (
                  <option key={option} style={{ background: apex.surface }}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visible.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <Link key={product.sku} href="/design-lab/d6/product">
                  <Panel
                    className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                    style={{ borderColor: "rgba(255,255,255,0.14)" }}
                  >
                    <div className="relative p-2.5">
                      <ProductStage
                        alt={product.name}
                        badge={
                          !product.inStock ? (
                            <span
                              className="absolute left-3 top-3 z-20 rounded-full px-2.5 py-1"
                              style={{
                                background: "rgba(8,8,11,0.82)",
                                border: `1px solid ${apex.line}`
                              }}
                            >
                              <Mono style={{ color: apex.mute }}>
                                Backorder
                              </Mono>
                            </span>
                          ) : undefined
                        }
                        className="h-52 rounded-xl"
                        imgClassName="transition-transform duration-500 group-hover:scale-[1.07]"
                        size="card"
                        src={product.image}
                      />
                    </div>
                    <div
                      className="border-t p-5"
                      style={{ borderColor: apex.line }}
                    >
                      <Mono style={{ color: apex.mute }}>
                        {product.sku} · {product.variants} variants
                      </Mono>
                      <p
                        className="mt-2 text-[15px] font-semibold leading-snug"
                        style={{ color: apex.text }}
                      >
                        {product.name}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span
                          className="text-xl font-semibold tracking-[-0.02em]"
                          style={{ color: apex.text }}
                        >
                          {formatUsd(product.price)}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[12px]"
                          style={{ color: apex.accent }}
                        >
                          View <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Panel>
                </Link>
              ))}
            </div>
          ) : (
            <Panel className="px-6 py-20 text-center">
              <p
                className="text-[15px] font-medium"
                style={{ color: apex.text }}
              >
                No products match those filters.
              </p>
              <button
                className="mt-4 transition-colors hover:opacity-80"
                onClick={() => {
                  setActiveGroups([]);
                  setInStockOnly(false);
                }}
                type="button"
              >
                <Mono style={{ color: apex.accent }}>Reset filters</Mono>
              </button>
            </Panel>
          )}
        </div>
      </div>
    </D6Page>
  );
}
