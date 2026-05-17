"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient() {
  const { items, removeItem, updateQuantity, clearCart, replaceCart } = useCartStore();
  const { carts, deleteCart, saveCart, setCarts } = useSavedCartStore();
  const userId = useUserStore((state) => state.userId);
  const [cartName, setCartName] = useState("");
  const [jobName, setJobName] = useState("");
  const [message, setMessage] = useState("");
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  useEffect(() => {
    async function loadSavedCarts() {
      const response = await fetch(`/api/saved-carts?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        carts?: typeof carts;
        persisted?: boolean;
      };
      if (payload.persisted && payload.carts) {
        setCarts(payload.carts);
      }
    }

    void loadSavedCarts();
  }, [setCarts, userId]);

  async function handleSaveCart() {
    if (!items.length) return;
    const name = cartName || `Cart ${new Date().toLocaleDateString()}`;
    const response = await fetch("/api/saved-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name,
        jobName,
        items
      })
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { cartId?: string; persisted?: boolean; reason?: string }
      | null;

    if (!response?.ok || !payload?.persisted) {
      setMessage(payload?.reason || "Saved cart could not be saved to Supabase.");
      return;
    }

    const id = saveCart(name, jobName, items);
    setMessage(`Saved cart ${payload.cartId || id}`);
    setCartName("");
    setJobName("");
  }

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
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
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
                    quality={60}
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
                  {item.weightLbs ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-jobsite-steel">
                      {item.weightLbs.toFixed(2)} lb each
                    </p>
                  ) : null}
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
            <Link
              className="truewerk-cta mt-5 flex h-12 w-full items-center justify-center bg-jobsite-ink px-6 text-sm font-black uppercase tracking-[0.1em] text-white"
              href="/checkout"
            >
              Checkout
            </Link>
            <div className="mt-5 grid gap-3 border-t border-jobsite-rail pt-5">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-jobsite-steel">
                Save cart
              </h3>
              <input
                className="h-10 border border-jobsite-rail px-3 text-sm font-bold outline-none focus:border-jobsite-ink"
                onChange={(event) => setCartName(event.target.value)}
                placeholder="Cart name"
                value={cartName}
              />
              <input
                className="h-10 border border-jobsite-rail px-3 text-sm font-bold outline-none focus:border-jobsite-ink"
                onChange={(event) => setJobName(event.target.value)}
                placeholder="Job name"
                value={jobName}
              />
              <button
                className="h-10 border border-jobsite-ink px-4 text-xs font-black uppercase tracking-[0.08em] text-jobsite-ink hover:bg-jobsite-paper"
                onClick={handleSaveCart}
                type="button"
              >
                Save for repeat order
              </button>
              {message && <p className="text-xs font-bold text-jobsite-pine">{message}</p>}
            </div>
            {carts.length ? (
              <div className="mt-5 grid gap-3 border-t border-jobsite-rail pt-5">
                <h3 className="text-sm font-black uppercase tracking-[0.12em] text-jobsite-steel">
                  Saved carts
                </h3>
                {carts.slice(0, 4).map((cart) => (
                  <div className="border border-jobsite-rail p-3" key={cart.id}>
                    <p className="text-sm font-black text-jobsite-ink">{cart.name}</p>
                    <p className="mt-1 text-xs font-semibold text-jobsite-steel">
                      {cart.items.length} SKUs {cart.jobName ? `/ ${cart.jobName}` : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        className="h-9 flex-1 border border-jobsite-ink text-xs font-black uppercase tracking-[0.08em]"
                        onClick={() => replaceCart(cart.items)}
                        type="button"
                      >
                        Restore
                      </button>
                      <button
                        aria-label={`Delete ${cart.name}`}
                        className="grid size-9 place-items-center border border-jobsite-rail text-jobsite-steel hover:border-red-700 hover:text-red-700"
                        onClick={() => {
                          deleteCart(cart.id);
                          void fetch(`/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`, {
                            method: "DELETE"
                          }).catch(() => null);
                        }}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </main>
  );
}
