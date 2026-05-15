"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus, Trash2 } from "lucide-react";
import { products } from "@/lib/catalog";
import { useListStore } from "@/lib/list-store";
import { formatCurrency } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function getListItemProductSlug(item: {
  productId: string;
  variantId: string;
  sku: string;
}) {
  return (
    products.find(
      (product) =>
        product.id === item.productId ||
        product.slug === item.productId ||
        product.variants.some(
          (variant) => variant.id === item.variantId || variant.sku === item.sku
        )
    )?.slug || item.productId
  );
}

export function ListsPageClient() {
  const { lists, removeItemFromList } = useListStore();

  return (
    <main className="bg-jobsite-paper">
      <section className="border-b border-jobsite-rail bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
            <Link className="hover:text-jobsite-ink" href="/">
              Products
            </Link>
            <span>/</span>
            <span>Lists</span>
          </div>
          <h1 className="mt-3 text-3xl font-black text-jobsite-ink md:text-5xl">
            Lists
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-jobsite-steel">
            Saved products for jobs, favorites, and materials you want to revisit.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-5 px-4 py-6">
        {lists.map((list) => {
          const itemCount = list.items.reduce(
            (total, item) => total + item.quantity,
            0
          );

          return (
            <article key={list.id} className="border border-jobsite-rail bg-white">
              <div className="flex flex-col gap-3 border-b border-jobsite-rail p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
                    <Heart size={15} className="text-red-700" />
                    <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                    <span className="text-jobsite-rail">|</span>
                    <span>Created {formatDate(list.createdAt)}</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-jobsite-ink">
                    {list.name}
                  </h2>
                </div>
                <Link
                  className="inline-flex h-11 items-center justify-center gap-2 border border-jobsite-ink bg-white px-4 text-sm font-black uppercase tracking-[0.08em] text-jobsite-ink transition hover:bg-jobsite-ink hover:text-white"
                  href="/"
                >
                  <Plus size={17} />
                  Add Product
                </Link>
              </div>

              {list.items.length ? (
                <div className="divide-y divide-jobsite-rail">
                  {list.items.map((item) => {
                    const productSlug = getListItemProductSlug(item);

                    return (
                      <div
                        key={item.variantId}
                        className="grid gap-4 p-4 transition hover:bg-jobsite-paper sm:grid-cols-[92px_1fr_auto]"
                      >
                        <Link
                          aria-label={`Open ${item.title}`}
                          className="relative aspect-square border border-jobsite-rail bg-white"
                          href={`/products/${productSlug}`}
                        >
                          <Image
                            alt={item.title}
                            className="object-contain p-2"
                            fill
                            quality={60}
                            sizes="92px"
                            src={item.image}
                          />
                        </Link>
                        <Link
                          className="min-w-0 underline-offset-4 hover:underline"
                          href={`/products/${productSlug}`}
                        >
                          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-jobsite-steel">
                            SKU {item.sku}
                          </p>
                          <h3 className="mt-2 text-lg font-black text-jobsite-ink">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm font-semibold capitalize text-jobsite-steel">
                            {Object.entries(item.options)
                              .filter(([, value]) => Boolean(value))
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" / ")}
                          </p>
                        </Link>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-jobsite-steel">
                              Saved price
                            </p>
                            <p className="text-xl font-black text-jobsite-ink">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${item.title} from ${list.name}`}
                            className="grid size-11 place-items-center border border-jobsite-rail text-jobsite-steel transition hover:border-red-700 hover:text-red-700"
                            type="button"
                            onClick={() => removeItemFromList(list.id, item.variantId)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid place-items-center p-10 text-center">
                  <div className="grid size-14 place-items-center border border-jobsite-rail bg-jobsite-paper text-jobsite-ink">
                    <Heart size={24} />
                  </div>
                  <p className="mt-4 text-lg font-black text-jobsite-ink">
                    This list is empty.
                  </p>
                  <Link
                    className="truewerk-cta mt-5 inline-flex h-12 items-center justify-center bg-jobsite-ink px-6 text-sm font-black uppercase tracking-[0.1em] text-white"
                    href="/"
                  >
                    <span>Browse products</span>
                  </Link>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
