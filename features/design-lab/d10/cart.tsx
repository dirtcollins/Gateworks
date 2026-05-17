"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";
import { Card, Kbd, Pill, SIGNAL, SignalShell, formatUsd } from "./kit";

// d10 "Signal" — cart. Wired to the real cart store. Cart uses skipHydration,
// so rehydrate once on mount. Working quantity / remove, real totals.

const TAX_RATE = 0.0825;

function variantSummary(item: CartItem): string {
  const parts = [item.options?.length, item.options?.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : `SKU ${item.sku}`;
}

export function D10Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [lines]
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const unitCount = lines.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SignalShell active="cart">
      <div className="mx-auto max-w-5xl px-5 py-7">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Cart</Pill>
          <span className="text-[12px]" style={{ color: SIGNAL.sub }}>
            Prices locked 24h · changes save instantly
          </span>
        </div>
        <h1
          className="mt-3 text-[26px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          Your cart
        </h1>

        {lines.length === 0 ? (
          <Card className="mt-6 px-6 py-20 text-center">
            <div
              className="mx-auto grid h-12 w-12 place-items-center rounded-[10px]"
              style={{ background: SIGNAL.accentSoft }}
            >
              <span style={{ color: SIGNAL.accent }} className="text-[20px]">
                ▢
              </span>
            </div>
            <p
              className="mt-4 text-[15px] font-semibold"
              style={{ color: SIGNAL.ink }}
            >
              Your cart is empty
            </p>
            <p
              className="mx-auto mt-1 max-w-sm text-[12px]"
              style={{ color: SIGNAL.sub }}
            >
              Press <Kbd>⌘K</Kbd> anywhere to search the catalog, or browse by
              category to start a build.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link
                href="/design-lab/d10/category"
                className="rounded-[8px] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: SIGNAL.accent }}
              >
                Browse catalog
              </Link>
              <Link
                href="/design-lab/d10/home"
                className="rounded-[8px] border px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[#fafbfc]"
                style={{ borderColor: SIGNAL.line, color: SIGNAL.ink }}
              >
                Search
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
            {/* lines */}
            <div className="space-y-2.5">
              {lines.map((item) => (
                <Card key={item.variantId} className="flex gap-3.5 p-3.5">
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[9px]"
                    style={{ background: SIGNAL.canvas }}
                  >
                    <Image
                      src={item.image || "/assets/logo.svg"}
                      alt={item.title}
                      fill
                      quality={60}
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href="/design-lab/d10/product"
                          className="line-clamp-2 text-[13px] font-medium hover:underline"
                          style={{ color: SIGNAL.ink }}
                        >
                          {item.title}
                        </Link>
                        <p
                          className="mt-0.5 text-[11px]"
                          style={{ color: SIGNAL.sub }}
                        >
                          {variantSummary(item)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Remove item"
                        className="rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium transition-colors hover:bg-[#fdecec]"
                        style={{ color: "#c2410c" }}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-2.5">
                      <div
                        className="flex items-center rounded-[8px] border"
                        style={{ borderColor: SIGNAL.line }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            updateQuantity(
                              item.variantId,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="grid h-8 w-8 place-items-center text-[15px]"
                          style={{ color: SIGNAL.sub }}
                        >
                          −
                        </button>
                        <span
                          className="w-8 text-center text-[12px] font-semibold tabular-nums"
                          style={{ color: SIGNAL.ink }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="grid h-8 w-8 place-items-center text-[15px]"
                          style={{ color: SIGNAL.sub }}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[14px] font-semibold tabular-nums"
                          style={{ color: SIGNAL.ink }}
                        >
                          {formatUsd(item.price * item.quantity)}
                        </p>
                        <p
                          className="text-[11px] tabular-nums"
                          style={{ color: SIGNAL.sub }}
                        >
                          {formatUsd(item.price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* summary */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <Card className="p-4">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: SIGNAL.ink }}
                >
                  Order summary
                </p>
                <dl
                  className="mt-3 space-y-2 text-[12px]"
                  style={{ color: SIGNAL.sub }}
                >
                  <div className="flex justify-between">
                    <dt>
                      Subtotal · {unitCount} unit{unitCount === 1 ? "" : "s"}
                    </dt>
                    <dd
                      className="font-semibold tabular-nums"
                      style={{ color: SIGNAL.ink }}
                    >
                      {formatUsd(subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Pickup</dt>
                    <dd className="font-semibold" style={{ color: "#1a7f3c" }}>
                      Free
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Est. tax (8.25%)</dt>
                    <dd
                      className="font-semibold tabular-nums"
                      style={{ color: SIGNAL.ink }}
                    >
                      {formatUsd(tax)}
                    </dd>
                  </div>
                  <div
                    className="flex justify-between border-t pt-2.5 text-[14px]"
                    style={{ borderColor: SIGNAL.line }}
                  >
                    <dt
                      className="font-semibold"
                      style={{ color: SIGNAL.ink }}
                    >
                      Total
                    </dt>
                    <dd
                      className="font-semibold tabular-nums"
                      style={{ color: SIGNAL.ink }}
                    >
                      {formatUsd(total)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="mt-4 w-full rounded-[8px] py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: SIGNAL.accent }}
                >
                  Checkout
                </button>
                <Link
                  href="/design-lab/d10/category"
                  className="mt-2 block text-center text-[12px] font-medium"
                  style={{ color: SIGNAL.sub }}
                >
                  Continue shopping
                </Link>
              </Card>
              <p
                className="mt-3 px-1 text-[11px] leading-relaxed"
                style={{ color: SIGNAL.sub }}
              >
                Net-30 trade terms available at checkout for verified pro
                accounts.
              </p>
            </aside>
          </div>
        )}
      </div>
    </SignalShell>
  );
}
