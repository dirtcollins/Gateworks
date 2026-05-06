"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-jobsite-rail pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-jobsite-pine">
            Cart
          </p>
          <h1 className="text-3xl font-bold text-jobsite-ink md:text-4xl">
            Selected products
          </h1>
        </div>
        {items.length ? (
          <button
            className="h-11 border border-jobsite-rail bg-white px-4 text-sm font-bold text-jobsite-ink hover:border-jobsite-ink"
            type="button"
            onClick={clearCart}
          >
            Clear cart
          </button>
        ) : null}
      </div>

      {!items.length ? (
        <div className="border border-dashed border-jobsite-rail bg-white p-10 text-center">
          <p className="text-lg font-semibold text-jobsite-ink">Your cart is empty.</p>
          <Link
            className="mt-5 inline-flex h-12 items-center bg-jobsite-ink px-6 font-bold text-white"
            href="/"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="divide-y divide-jobsite-rail border border-jobsite-rail bg-white">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="grid gap-4 p-4 sm:grid-cols-[112px_1fr_auto]"
              >
                <div className="relative aspect-square border border-jobsite-rail bg-white">
                  <Image
                    alt={item.title}
                    className="object-contain p-2"
                    fill
                    sizes="112px"
                    src={item.image}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-jobsite-ink">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-jobsite-steel">
                    SKU {item.sku}
                  </p>
                  <p className="mt-2 text-sm text-jobsite-steel">
                    {Object.entries(item.options)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" / ")}
                  </p>
                  <p className="mt-3 text-lg font-bold text-jobsite-ink">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(quantity) => updateQuantity(item.variantId, quantity)}
                  />
                  <button
                    aria-label={`Remove ${item.title}`}
                    className="grid size-11 place-items-center border border-jobsite-rail text-jobsite-steel hover:border-red-700 hover:text-red-700"
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 size={19} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-jobsite-rail bg-white p-5">
            <h2 className="text-xl font-bold text-jobsite-ink">Order Summary</h2>
            <div className="mt-5 flex items-center justify-between border-t border-jobsite-rail pt-5">
              <span className="font-semibold text-jobsite-steel">Subtotal</span>
              <span className="text-2xl font-bold text-jobsite-ink">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <button
              className="mt-5 h-12 w-full bg-jobsite-safety px-6 text-base font-bold text-white"
              type="button"
            >
              Checkout Later
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
