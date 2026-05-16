"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
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
  const { lists, addList, removeItemFromList } = useListStore();
  const [listName, setListName] = useState("");
  const [createdListId, setCreatedListId] = useState("");

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const listId = addList(listName);
    if (!listId) return;

    setCreatedListId(listId);
    setListName("");
  }

  return (
    <main className="min-h-full bg-[#fbfbf8] px-4 py-5 md:px-6">
      <section className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-industrial-muted">
              Shopping workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-industrial-ink">
              Saved lists
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-industrial-steel">
              Keep repeat materials, job carts, and favorites ready for ordering.
            </p>
          </div>
          <form
            className="flex w-full gap-2 rounded-lg border border-black/10 bg-[#f7f7f4] p-2 md:max-w-md"
            onSubmit={handleCreateList}
          >
            <label className="sr-only" htmlFor="new-list-name">
              New saved list name
            </label>
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-transparent bg-white px-3 text-sm text-industrial-ink outline-none focus:border-black/10"
              id="new-list-name"
              placeholder="New list name"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-industrial-ink px-3 text-sm font-semibold text-white transition hover:bg-jobsite-pine disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!listName.trim()}
              type="submit"
            >
              <Plus size={17} />
              Create list
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-3 py-4">
        {lists.map((list) => {
          const itemCount = list.items.reduce(
            (total, item) => total + item.quantity,
            0
          );

          return (
            <article
              key={list.id}
              className={`overflow-hidden rounded-xl border bg-white ${
                createdListId === list.id ? "border-jobsite-pine" : "border-black/10"
              }`}
            >
              <div className="flex flex-col gap-3 border-b border-black/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-industrial-muted">
                    <Heart size={15} className="text-red-700" />
                    <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                    <span className="text-black/20">|</span>
                    <span>Created {formatDate(list.createdAt)}</span>
                  </div>
                  <h2 className="mt-1 text-lg font-semibold text-industrial-ink">
                    {list.name}
                  </h2>
                </div>
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-semibold text-industrial-ink transition hover:bg-[#f7f7f4]"
                  href="/"
                >
                  <Plus size={15} />
                  Add Product
                </Link>
              </div>

              {list.items.length ? (
                <div className="divide-y divide-black/10">
                  {list.items.map((item) => {
                    const productSlug = getListItemProductSlug(item);

                    return (
                      <div
                        key={item.variantId}
                        className="grid gap-4 p-4 transition hover:bg-[#f7f7f4] sm:grid-cols-[72px_1fr_auto]"
                      >
                        <Link
                          aria-label={`Open ${item.title}`}
                          className="relative aspect-square rounded-lg border border-black/10 bg-[#fafaf8]"
                          href={`/products/${productSlug}`}
                        >
                          <Image
                            alt={item.title}
                            className="object-contain p-2"
                            fill
                            quality={60}
                            sizes="72px"
                            src={item.image}
                          />
                        </Link>
                        <Link
                          className="min-w-0 underline-offset-4 hover:underline"
                          href={`/products/${productSlug}`}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-industrial-muted">
                            SKU {item.sku}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-industrial-ink">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium capitalize text-industrial-muted">
                            {Object.entries(item.options)
                              .filter(([, value]) => Boolean(value))
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" / ")}
                          </p>
                        </Link>
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-xs font-medium text-industrial-muted">
                              Saved price
                            </p>
                            <p className="text-lg font-semibold text-industrial-ink">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${item.title} from ${list.name}`}
                            className="grid size-9 place-items-center rounded-md border border-black/10 text-industrial-muted transition hover:border-red-700 hover:text-red-700"
                            type="button"
                            onClick={() => removeItemFromList(list.id, item.variantId)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid place-items-center p-10 text-center">
                  <div className="grid size-12 place-items-center rounded-xl border border-black/10 bg-[#f7f7f4] text-industrial-ink">
                    <Heart size={22} />
                  </div>
                  <p className="mt-4 text-base font-semibold text-industrial-ink">
                    This list is empty.
                  </p>
                  <Link
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-industrial-ink px-4 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                    href="/"
                  >
                    Browse products
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
