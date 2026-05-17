"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Filter, LayoutGrid } from "lucide-react";
import { Beacon, Button, Chip, FO, Panel, Shell, Stamp } from "./kit";
import {
  categoryCount,
  featuredCategoryProducts,
  featuredCategorySlug,
  getCategoryProducts,
  money,
  primaryVariant,
  topCategories
} from "./data";

const PRODUCT_HREF = "/design-lab/d5/product";

type SortKey = "featured" | "price-low" | "price-high";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-low", label: "Price low" },
  { key: "price-high", label: "Price high" }
];

export default function D5Category() {
  const [activeSlug, setActiveSlug] = useState(featuredCategorySlug);
  const [sort, setSort] = useState<SortKey>("featured");

  const baseProducts = useMemo(() => {
    if (activeSlug === featuredCategorySlug) return featuredCategoryProducts;
    return getCategoryProducts(activeSlug);
  }, [activeSlug]);

  const products = useMemo(() => {
    const list = [...baseProducts];
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [baseProducts, sort]);

  const activeCategory =
    topCategories.find((category) => category.slug === activeSlug) ??
    featuredCategoryProducts[0]?.category;
  const lowest = products.length
    ? Math.min(...products.map((product) => product.price))
    : 0;

  return (
    <Shell crumb="Catalog" wide>
      {/* Header */}
      <section
        className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7"
        style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
      >
        <div>
          <Stamp>Catalog</Stamp>
          <h1
            className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl"
            style={{ color: FO.ink }}
          >
            {activeCategory?.name ?? "All gear"}
          </h1>
          <p
            className="mt-2 text-[12px] font-bold uppercase tracking-[0.12em]"
            style={{ color: FO.dim }}
          >
            {products.length} SKUs · From {money(lowest)}
          </p>
        </div>
        <div
          className="flex items-center gap-2.5 self-start px-3.5 py-2.5 sm:self-auto"
          style={{ background: FO.panelHi, border: `2px solid ${FO.line}` }}
        >
          <Beacon tone="go" />
          <span
            className="text-[11px] font-black uppercase tracking-[0.12em]"
            style={{ color: FO.ink }}
          >
            Stocked for will-call
          </span>
        </div>
      </section>

      <div className="mt-6 grid gap-px lg:grid-cols-[260px_1fr]" style={{ background: FO.line }}>
        {/* Facets */}
        <aside className="flex flex-col gap-px" style={{ background: FO.line }}>
          <div className="p-4" style={{ background: FO.panel }}>
            <div className="mb-3 flex items-center gap-2">
              <Filter size={15} strokeWidth={2.75} style={{ color: FO.hi }} />
              <span
                className="text-[12px] font-black uppercase tracking-[0.16em]"
                style={{ color: FO.ink }}
              >
                Departments
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {topCategories.map((category) => {
                const active = category.slug === activeSlug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => setActiveSlug(category.slug)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                    style={{
                      background: active ? FO.hi : FO.panelHi,
                      color: active ? FO.black : FO.ink
                    }}
                  >
                    <span className="truncate text-[12px] font-black uppercase tracking-[0.04em]">
                      {category.name}
                    </span>
                    <span
                      className="shrink-0 text-[11px] font-black"
                      style={{ color: active ? FO.black : FO.faint }}
                    >
                      {categoryCount(category.slug)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4" style={{ background: FO.panel }}>
            <span
              className="mb-3 block text-[12px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.ink }}
            >
              Sort
            </span>
            <div className="flex flex-col gap-1.5">
              {SORTS.map((option) => {
                const active = option.key === sort;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSort(option.key)}
                    className="px-3 py-2.5 text-left text-[12px] font-black uppercase tracking-[0.06em]"
                    style={{
                      background: active ? FO.hiSoft : FO.panelHi,
                      color: active ? FO.hi : FO.dim
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="p-4 sm:p-5" style={{ background: FO.panel }}>
          <div className="mb-4 flex items-center gap-2">
            <LayoutGrid size={15} strokeWidth={2.75} style={{ color: FO.hi }} />
            <span
              className="text-[11px] font-black uppercase tracking-[0.14em]"
              style={{ color: FO.dim }}
            >
              Showing {products.length} of {categoryCount(activeSlug)}
            </span>
          </div>

          {products.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((product) => {
                const variant = primaryVariant(product);
                const image = product.images[0]?.url ?? variant?.image;
                const inStock = variant?.inventory === "in_stock";
                return (
                  <Link
                    key={product.id}
                    href={PRODUCT_HREF}
                    className="group flex flex-col"
                    style={{ background: FO.panelHi, border: `2px solid ${FO.line}` }}
                  >
                    <div
                      className="relative flex aspect-square items-center justify-center"
                      style={{ background: "#f4f1e9" }}
                    >
                      {image ? (
                        <Image
                          alt={product.title}
                          src={image}
                          width={360}
                          height={360}
                          quality={75}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <span
                          className="text-4xl font-black"
                          style={{ color: "rgba(22,20,15,0.12)" }}
                        >
                          GW
                        </span>
                      )}
                      <span className="absolute right-1.5 top-1.5">
                        <Chip tone={inStock ? "go" : "stop"}>
                          {inStock ? "In stock" : "Backorder"}
                        </Chip>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ color: FO.faint }}
                      >
                        {variant?.sku ?? product.id}
                      </span>
                      <span
                        className="line-clamp-2 flex-1 text-[12px] font-black uppercase leading-tight"
                        style={{ color: FO.ink }}
                      >
                        {product.title}
                      </span>
                      <div className="mt-1.5 flex items-end justify-between">
                        <span className="text-lg font-black" style={{ color: FO.hi }}>
                          {money(product.price)}
                        </span>
                        <span
                          className="flex h-8 w-8 items-center justify-center transition-colors group-hover:bg-[#ff5a1f] group-hover:text-[#16140f]"
                          style={{ background: FO.steel, color: FO.ink }}
                        >
                          <ArrowRight size={15} strokeWidth={2.75} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-4 px-6 py-16 text-center"
              style={{ border: `2px dashed ${FO.line}` }}
            >
              <p
                className="text-lg font-black uppercase tracking-[0.06em]"
                style={{ color: FO.ink }}
              >
                No gear in this aisle yet
              </p>
              <Button onClick={() => setActiveSlug(featuredCategorySlug)} variant="primary">
                Back to {featuredCategoryProducts[0]?.category.name ?? "catalog"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <Panel className="mt-6" title="Need it staged?" kicker="// will-call">
        <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <p className="text-[13px] font-bold" style={{ color: FO.dim }}>
            Build your order and we will have it pulled and ready at the counter.
          </p>
          <Button href="/design-lab/d5/cart" variant="primary">
            Go to cart <ArrowRight size={15} strokeWidth={2.75} />
          </Button>
        </div>
      </Panel>
    </Shell>
  );
}
