"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";
import type { CartItem } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Cart. Real line items from useCartStore with live
 * quantity edit, removal, and an order summary that runs the real tax
 * helper. Saved carts read/write the real /api/saved-carts route.
 * ------------------------------------------------------------------ */

function QtyStepper({
  value,
  onChange
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center border border-d1-ink">
      <button
        aria-label="Decrease quantity"
        className="grid h-10 w-10 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
        onClick={() => onChange(Math.max(1, value - 1))}
        type="button"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        aria-label="Quantity"
        className="h-10 w-12 border-x border-d1-ink bg-white text-center text-sm font-extrabold text-d1-ink outline-none"
        inputMode="numeric"
        onChange={(event) => {
          const next = Number(event.target.value.replace(/\D/g, ""));
          onChange(Number.isFinite(next) && next > 0 ? next : 1);
        }}
        value={value}
      />
      <button
        aria-label="Increase quantity"
        className="grid h-10 w-10 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
        onClick={() => onChange(value + 1)}
        type="button"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function IndustrialCart() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const replaceCart = useCartStore((state) => state.replaceCart);
  const carts = useSavedCartStore((state) => state.carts);
  const saveCart = useSavedCartStore((state) => state.saveCart);
  const deleteCart = useSavedCartStore((state) => state.deleteCart);
  const setCarts = useSavedCartStore((state) => state.setCarts);
  const userId = useUserStore((state) => state.userId);

  const [ready, setReady] = useState(false);
  const [cartName, setCartName] = useState("");
  const [jobName, setJobName] = useState("");
  const [message, setMessage] = useState("");

  // Cart + saved-cart stores skipHydration — rehydrate once on mount.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useSavedCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  useEffect(() => {
    async function loadSavedCarts() {
      const response = await fetch(
        `/api/saved-carts?userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      ).catch(() => null);
      if (!response?.ok) return;
      const payload = (await response.json().catch(() => null)) as {
        carts?: typeof carts;
        persisted?: boolean;
      } | null;
      if (payload?.persisted && payload.carts) {
        setCarts(payload.carts);
      }
    }

    void loadSavedCarts();
  }, [setCarts, userId]);

  const lineItems = ready ? items : [];
  const subtotal = lineItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const unitCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  async function handleSaveCart() {
    if (!lineItems.length) return;
    const name = cartName || `Cart ${new Date().toLocaleDateString()}`;
    const response = await fetch("/api/saved-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, jobName, items: lineItems })
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { cartId?: string; persisted?: boolean; reason?: string }
      | null;

    if (!response?.ok || !payload?.persisted) {
      setMessage(payload?.reason || "Saved cart could not be stored. Try again.");
      return;
    }

    const id = saveCart(name, jobName, lineItems);
    setMessage(`Saved as ${payload.cartId || id}.`);
    setCartName("");
    setJobName("");
  }

  function restoreCart(cartItems: CartItem[]) {
    replaceCart(cartItems);
    setMessage("Cart restored from a saved list.");
  }

  return (
    <IndustrialPage>
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
          <div>
            <Eyebrow>Will-call &amp; delivery</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              Your cart
            </h1>
          </div>
          {lineItems.length ? (
            <button
              className="border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={() => {
                if (!window.confirm("Clear all items from the cart?")) return;
                clearCart();
              }}
              type="button"
            >
              Clear cart
            </button>
          ) : null}
        </div>

        {!lineItems.length ? (
          <div className="mt-8 border border-dashed border-d1-line bg-d1-card px-6 py-20 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-d1-line" />
            <p className="mt-4 text-sm font-bold text-d1-ink">
              Your cart is empty.
            </p>
            <p className="mt-1 text-[13px] text-d1-steel">
              Browse the catalog to stage material for pickup or delivery.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/industrial/search"
            >
              Browse catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Line items */}
            <div className="grid gap-px border border-d1-line bg-d1-line">
              {lineItems.map((item) => (
                <div
                  className="grid gap-4 bg-d1-card p-4 sm:grid-cols-[96px_1fr_auto]"
                  key={item.variantId}
                >
                  <div className="flex h-24 items-center justify-center border border-d1-line bg-white">
                    {item.image ? (
                      <Image
                        alt={item.title}
                        className="h-full w-full object-contain p-2"
                        height={160}
                        quality={60}
                        src={item.image}
                        width={160}
                      />
                    ) : (
                      <span className="text-2xl font-black text-d1-line">GW</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      SKU {item.sku}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-snug text-d1-ink">
                      {item.title}
                    </p>
                    {Object.values(item.options).some(Boolean) ? (
                      <p className="mt-1 text-[12px] text-d1-steel">
                        {Object.entries(item.options)
                          .filter(([, value]) => Boolean(value))
                          .map(([key, value]) => `${key}: ${value}`)
                          .join("  ·  ")}
                      </p>
                    ) : null}
                    <p className="mt-2 text-base font-extrabold text-d1-ink">
                      {formatUsd(item.price)}
                      <span className="ml-1 text-[12px] font-semibold text-d1-steel">
                        each
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-between">
                    <QtyStepper
                      value={item.quantity}
                      onChange={(quantity) =>
                        updateQuantity(item.variantId, quantity)
                      }
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-d1-ink">
                        {formatUsd(item.price * item.quantity)}
                      </span>
                      <button
                        aria-label={`Remove ${item.title}`}
                        className="grid h-10 w-10 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                        onClick={() => removeItem(item.variantId)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary + saved carts */}
            <aside className="h-fit">
              <div className="border-2 border-d1-ink bg-white p-5">
                <h2 className="text-lg font-extrabold tracking-tight text-d1-ink">
                  Order summary
                </h2>
                <dl className="mt-4 grid gap-2.5 border-t border-d1-line pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Subtotal ({unitCount} units)</dt>
                    <dd className="font-bold text-d1-ink">{formatUsd(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Estimated tax</dt>
                    <dd className="font-bold text-d1-ink">{formatUsd(tax)}</dd>
                  </div>
                  <div className="flex items-end justify-between border-t-2 border-d1-ink pt-3">
                    <dt className="text-sm font-bold uppercase tracking-[0.1em] text-d1-ink">
                      Total
                    </dt>
                    <dd className="text-2xl font-extrabold text-d1-ink">
                      {formatUsd(total)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[12px] text-d1-steel">
                  Delivery fees are calculated at checkout based on fulfillment.
                </p>
                <Link
                  className="mt-4 flex items-center justify-center gap-2 bg-d1-ink px-5 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                  href="/industrial/checkout"
                >
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  className="mt-2 flex items-center justify-center border border-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                  href="/industrial/search"
                >
                  Keep shopping
                </Link>
              </div>

              {/* Save cart */}
              <div className="mt-5 border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Save for repeat orders
                </p>
                <div className="mt-3 grid gap-2">
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setCartName(event.target.value)}
                    placeholder="Cart name"
                    value={cartName}
                  />
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setJobName(event.target.value)}
                    placeholder="Job name (optional)"
                    value={jobName}
                  />
                  <button
                    className="h-10 border border-d1-ink bg-white px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                    onClick={handleSaveCart}
                    type="button"
                  >
                    Save cart
                  </button>
                  {message ? (
                    <p className="text-[12px] font-bold text-d1-pine">{message}</p>
                  ) : null}
                </div>
              </div>

              {/* Saved carts */}
              {carts.length ? (
                <div className="mt-5 border border-d1-line bg-d1-card p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                    Saved carts
                  </p>
                  <div className="mt-3 grid gap-2">
                    {carts.slice(0, 5).map((cart) => (
                      <div className="border border-d1-line bg-white p-3" key={cart.id}>
                        <p className="text-sm font-bold text-d1-ink">{cart.name}</p>
                        <p className="mt-0.5 text-[12px] text-d1-steel">
                          {cart.items.length} SKUs
                          {cart.jobName ? `  ·  ${cart.jobName}` : ""}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            className="h-9 flex-1 border border-d1-ink text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                            onClick={() => restoreCart(cart.items)}
                            type="button"
                          >
                            Restore
                          </button>
                          <button
                            aria-label={`Delete ${cart.name}`}
                            className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                            onClick={() => {
                              deleteCart(cart.id);
                              void fetch(
                                `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                                { method: "DELETE" }
                              ).catch(() => null);
                            }}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </IndustrialPage>
  );
}
