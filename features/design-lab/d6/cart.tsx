"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2, Truck } from "lucide-react";
import {
  ApexButton,
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  apex,
  formatUsd
} from "./kit";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";

const TAX_RATE = 0.0725;
const FREE_DELIVERY_THRESHOLD = 750;
const DELIVERY_FEE = 49;

function variantSummary(item: CartItem): string {
  const parts = [item.options.length, item.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : "Standard";
}

export function D6Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hydrated, setHydrated] = useState(false);

  // Cart store uses skipHydration; rehydrate once on the client.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );
  const tax = subtotal * TAX_RATE;
  const delivery =
    subtotal > FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + tax + delivery;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      <header
        className="border-y py-12"
        style={{ borderColor: apex.line }}
      >
        <Eyebrow>Will-call · Order</Eyebrow>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <h1
            className="text-[2.8rem] font-medium leading-[1.02] tracking-[-0.04em] sm:text-[4rem]"
            style={{ color: apex.text }}
          >
            Your Cart
          </h1>
          <span
            className="rounded-full border px-4 py-2"
            style={{ borderColor: apex.line }}
          >
            <Mono style={{ color: apex.accent }}>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </Mono>
          </span>
        </div>
      </header>

      {lines.length === 0 ? (
        <div className="py-20">
          <Panel className="px-8 py-24 text-center" glow>
            <span
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
              style={{
                background: "rgba(91,157,255,0.1)",
                border: `1px solid ${apex.line}`
              }}
            >
              <Truck className="h-7 w-7" style={{ color: apex.accent }} />
            </span>
            <h2
              className="mt-7 text-[1.7rem] font-medium tracking-[-0.03em]"
              style={{ color: apex.text }}
            >
              Your cart is empty
            </h2>
            <p
              className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed"
              style={{ color: apex.mute }}
            >
              Nothing staged for will-call yet. Browse the catalog to add
              precision hardware to your order.
            </p>
            <div className="mt-8 flex justify-center">
              <ApexButton href="/design-lab/d6/category">
                Browse the catalog <ArrowRight className="h-4 w-4" />
              </ApexButton>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="grid gap-8 py-12 lg:grid-cols-[1.55fr_1fr]">
          {/* Lines */}
          <div className="space-y-3">
            {lines.map((line) => (
              <Panel key={line.variantId} className="p-5">
                <div className="flex items-center gap-5">
                  <div
                    className="grid h-24 w-24 shrink-0 place-items-center rounded-xl border"
                    style={{
                      borderColor: apex.line,
                      background:
                        "radial-gradient(70% 70% at 50% 45%, rgba(91,157,255,0.1), transparent 75%)"
                    }}
                  >
                    {line.image ? (
                      <Image
                        alt={line.title}
                        className="h-full w-full object-contain p-2.5"
                        height={200}
                        quality={75}
                        src={line.image}
                        width={200}
                      />
                    ) : (
                      <span
                        className="text-xl font-semibold"
                        style={{ color: "rgba(255,255,255,0.08)" }}
                      >
                        GW
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Mono style={{ color: apex.faint }}>{line.sku}</Mono>
                    <Link
                      className="mt-1 block text-[15px] font-medium leading-snug transition-colors hover:opacity-80"
                      href="/design-lab/d6/product"
                      style={{ color: apex.text }}
                    >
                      {line.title}
                    </Link>
                    <p
                      className="mt-0.5 text-[12px]"
                      style={{ color: apex.mute }}
                    >
                      {variantSummary(line)} · {formatUsd(line.price)} ea
                    </p>
                    <button
                      className="mt-2 flex items-center gap-1.5 transition-colors hover:opacity-80"
                      onClick={() => removeItem(line.variantId)}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" style={{ color: apex.mute }} />
                      <Mono style={{ color: apex.mute }}>Remove</Mono>
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span
                      className="text-lg font-medium tracking-[-0.02em]"
                      style={{ color: apex.text }}
                    >
                      {formatUsd(line.price * line.quantity)}
                    </span>
                    <div
                      className="flex items-center rounded-full border"
                      style={{ borderColor: apex.line }}
                    >
                      <button
                        aria-label="Decrease"
                        className="grid h-9 w-9 place-items-center rounded-l-full transition-colors hover:bg-white/5"
                        onClick={() =>
                          updateQuantity(
                            line.variantId,
                            Math.max(1, line.quantity - 1)
                          )
                        }
                        style={{ color: apex.text }}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="grid h-9 w-10 place-items-center text-[13px] font-medium"
                        style={{ color: apex.text }}
                      >
                        {line.quantity}
                      </span>
                      <button
                        aria-label="Increase"
                        className="grid h-9 w-9 place-items-center rounded-r-full transition-colors hover:bg-white/5"
                        onClick={() =>
                          updateQuantity(line.variantId, line.quantity + 1)
                        }
                        style={{ color: apex.text }}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
            <Link
              className="inline-flex items-center gap-2 pt-2 transition-colors hover:opacity-80"
              href="/design-lab/d6/category"
              style={{ color: apex.accent }}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              <Mono style={{ color: apex.accent }}>Continue shopping</Mono>
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Panel glow>
              <div
                className="border-b px-6 py-5"
                style={{ borderColor: apex.line }}
              >
                <Mono style={{ color: apex.accent }}>Order summary</Mono>
              </div>
              <div className="space-y-3.5 px-6 py-6">
                <SummaryRow
                  label="Subtotal"
                  value={formatUsd(subtotal)}
                />
                <SummaryRow
                  label="Tax (7.25%)"
                  value={formatUsd(tax)}
                />
                <SummaryRow
                  label="Pickup / delivery"
                  value={delivery === 0 ? "Free" : formatUsd(delivery)}
                  accent={delivery === 0}
                />
                <div
                  className="mt-4 flex items-end justify-between border-t pt-4"
                  style={{ borderColor: apex.line }}
                >
                  <Mono style={{ color: apex.faint }}>Order total</Mono>
                  <span
                    className="text-[2rem] font-medium leading-none tracking-[-0.03em]"
                    style={{ color: apex.text }}
                  >
                    {formatUsd(total)}
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6">
                <ApexButton className="w-full" href="/design-lab/d6/orders">
                  Proceed to checkout <ArrowRight className="h-4 w-4" />
                </ApexButton>
              </div>
            </Panel>

            <div
              className="mt-4 grid gap-px overflow-hidden rounded-2xl border"
              style={{ borderColor: apex.line, background: apex.line }}
            >
              {[
                {
                  icon: Truck,
                  text: "Free delivery on orders over $750"
                },
                {
                  icon: ShieldCheck,
                  text: "Secure trade checkout & net terms"
                }
              ].map((row) => (
                <p
                  key={row.text}
                  className="flex items-center gap-3 px-5 py-3.5 text-[13px]"
                  style={{ background: apex.surface, color: apex.text }}
                >
                  <row.icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: apex.accent }}
                  />
                  {row.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </D6Page>
  );
}

function SummaryRow({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: apex.mute }}>
        {label}
      </span>
      <span
        className="text-[14px] font-medium"
        style={{ color: accent ? apex.accent : apex.text }}
      >
        {value}
      </span>
    </div>
  );
}
