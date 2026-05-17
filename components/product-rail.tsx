"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductRailProps = {
  title: string;
  products: Product[];
};

export function ProductRail({ title, products }: ProductRailProps) {
  const [activeTab, setActiveTab] = useState("all");
  const railRef = useRef<HTMLDivElement>(null);

  const tabs = useMemo(() => {
    const categories = Array.from(
      new Map(
        products.map((product) => [
          product.category.slug,
          {
            label: product.category.name,
            value: product.category.slug
          }
        ])
      ).values()
    );

    return [{ label: "All Items", value: "all" }, ...categories];
  }, [products]);

  const visibleProducts =
    activeTab === "all"
      ? products
      : products.filter((product) => product.category.slug === activeTab);

  function scrollRail(direction: "left" | "right") {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === "left" ? -rail.clientWidth : rail.clientWidth,
      behavior: "smooth"
    });
  }

  if (!products.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6">
      <h2 className="text-2xl font-bold text-jobsite-ink">{title}</h2>

      <div className="mt-3 flex gap-8 overflow-x-auto border-b border-jobsite-rail text-sm text-jobsite-steel">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "shrink-0 border-b-2 px-1 pb-3 font-medium",
              activeTab === tab.value
                ? "border-jobsite-safety text-jobsite-ink"
                : "border-transparent hover:text-jobsite-ink"
            )}
            type="button"
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <button
          aria-label={`Scroll ${title} left`}
          className="absolute left-0 top-1/2 z-10 hidden size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-jobsite-safety text-white shadow-toolbar sm:grid"
          type="button"
          onClick={() => scrollRail("left")}
        >
          <ChevronLeft size={24} />
        </button>

        <div
          ref={railRef}
          className="grid grid-flow-col auto-cols-[220px] grid-rows-1 gap-3 overflow-x-auto pb-4"
        >
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} layout="rail" />
          ))}
        </div>

        <button
          aria-label={`Scroll ${title} right`}
          className="absolute right-0 top-1/2 z-10 hidden size-10 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full bg-jobsite-ink text-white shadow-toolbar sm:grid"
          type="button"
          onClick={() => scrollRail("right")}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
