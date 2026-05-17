"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Minus,
  Package,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2
} from "lucide-react";
import {
  Card,
  D7DesignBadge,
  D7Page,
  Eyebrow,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";

/* d7 "Ledger" cart — framed as building a purchase order.
 * Marketing: reorder-friendly, low-friction PO assembly. Finance:
 * Net-30 terms, available credit, and a clear cost breakdown make
 * the spend legible before submission. Wired to the real cart store. */

const TAX_RATE = 0.0725;
const FREE_DELIVERY_THRESHOLD = 750;
const DELIVERY_FEE = 49;
const CREDIT_LIMIT = 50000;
const OPEN_BALANCE = 11600;

function variantSummary(item: CartItem): string {
  const parts = [item.options.length, item.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : "Standard configuration";
}

export function D7Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [hydrated, setHydrated] = useState(false);

  // Cart store uses skipHydration — rehydrate once on the client so SSR
  // and first client render agree (empty) before live data arrives.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + delivery;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const availableCredit = Math.max(0, CREDIT_LIMIT - OPEN_BALANCE - total);

  return (
    <D7Page>
      <div className="pt-5">
        <D7DesignBadge />
      </div>

      <header className="py-8">
        <Eyebrow>Draft purchase order</Eyebrow>
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
          <h1
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: LEDGER.ink }}
          >
            Purchase order
          </h1>
          <span className="text-sm font-medium" style={{ color: LEDGER.muted }}>
            PO-DRAFT-40128 &middot; {itemCount}{" "}
            {itemCount === 1 ? "unit" : "units"}
          </span>
        </div>
      </header>

      {lines.length === 0 ? (
        <Card className="my-8 p-16 text-center">
          <span
            className="mx-auto grid h-14 w-14 place-items-center rounded-full"
            style={{ backgroundColor: LEDGER.indigoSoft }}
          >
            <ReceiptText className="h-6 w-6" style={{ color: LEDGER.indigo }} />
          </span>
          <p
            className="mt-4 text-lg font-semibold"
            style={{ color: LEDGER.ink }}
          >
            This purchase order is empty.
          </p>
          <p
            className="mx-auto mt-1 max-w-sm text-sm"
            style={{ color: LEDGER.body }}
          >
            Add catalog SKUs to start building a purchase order against your
            Net-30 account.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
            href="/design-lab/d7/category"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            Browse the catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 pb-8 lg:grid-cols-12">
          {/* Line items */}
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <div
                className="hidden grid-cols-12 gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] sm:grid"
                style={{
                  color: LEDGER.muted,
                  borderBottom: `1px solid ${LEDGER.line}`
                }}
              >
                <span className="col-span-6">Line item</span>
                <span className="col-span-3 text-center">Quantity</span>
                <span className="col-span-3 text-right">Extended</span>
              </div>
              {lines.map((line, index) => (
                <div
                  key={line.variantId}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-4"
                  style={{
                    borderTop:
                      index === 0 ? "none" : `1px solid ${LEDGER.line}`
                  }}
                >
                  <div className="col-span-12 flex items-center gap-3.5 sm:col-span-6">
                    <div
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-xl"
                      style={{ backgroundColor: LEDGER.canvas }}
                    >
                      {line.image ? (
                        <Image
                          alt={line.title}
                          className="h-full w-full object-contain p-1.5"
                          height={140}
                          quality={75}
                          src={line.image}
                          width={140}
                        />
                      ) : (
                        <Package
                          className="h-6 w-6"
                          style={{ color: LEDGER.muted }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: LEDGER.muted }}
                      >
                        SKU {line.sku}
                      </p>
                      <p
                        className="truncate text-[14px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {line.title}
                      </p>
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: LEDGER.body }}
                      >
                        {variantSummary(line)} &middot; {formatUsd(line.price)} ea
                      </p>
                      <button
                        className="mt-1 flex items-center gap-1 text-[11px] font-semibold transition hover:underline"
                        onClick={() => removeItem(line.variantId)}
                        style={{ color: LEDGER.rose }}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" /> Remove line
                      </button>
                    </div>
                  </div>
                  <div className="col-span-7 sm:col-span-3 sm:justify-self-center">
                    <div
                      className="flex w-fit items-center rounded-lg"
                      style={{ border: `1px solid ${LEDGER.line}` }}
                    >
                      <button
                        aria-label="Decrease"
                        className="grid h-9 w-9 place-items-center"
                        onClick={() =>
                          updateQuantity(
                            line.variantId,
                            Math.max(1, line.quantity - 1)
                          )
                        }
                        style={{ color: LEDGER.body }}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="grid h-9 w-11 place-items-center text-sm font-semibold"
                        style={{
                          color: LEDGER.ink,
                          borderLeft: `1px solid ${LEDGER.line}`,
                          borderRight: `1px solid ${LEDGER.line}`
                        }}
                      >
                        {line.quantity}
                      </span>
                      <button
                        aria-label="Increase"
                        className="grid h-9 w-9 place-items-center"
                        onClick={() =>
                          updateQuantity(line.variantId, line.quantity + 1)
                        }
                        style={{ color: LEDGER.body }}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-5 text-right sm:col-span-3">
                    <span
                      className="text-base font-semibold tracking-tight"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(line.price * line.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </Card>
            <Link
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition hover:underline"
              href="/design-lab/d7/category"
              style={{ color: LEDGER.indigo }}
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Add more SKUs
            </Link>
          </div>

          {/* PO summary */}
          <div className="lg:col-span-4">
            <Card>
              <div
                className="px-5 py-3.5"
                style={{ borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[12px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: LEDGER.muted }}
                >
                  PO summary
                </span>
              </div>
              <div className="space-y-2.5 px-5 py-4 text-sm">
                <Row label="Subtotal" value={formatUsd(subtotal)} />
                <Row label="Estimated tax (7.25%)" value={formatUsd(tax)} />
                <Row
                  label="Delivery"
                  value={delivery === 0 ? "Included" : formatUsd(delivery)}
                />
                <div
                  className="mt-3 flex items-center justify-between pt-3"
                  style={{ borderTop: `1px solid ${LEDGER.line}` }}
                >
                  <span
                    className="text-[12px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: LEDGER.ink }}
                  >
                    PO total
                  </span>
                  <span
                    className="text-2xl font-semibold tracking-tight"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(total)}
                  </span>
                </div>
              </div>

              {/* Net terms panel */}
              <div
                className="mx-5 mb-4 rounded-xl p-4"
                style={{ backgroundColor: LEDGER.indigoSoft }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex items-center gap-1.5 text-[12px] font-semibold"
                    style={{ color: LEDGER.indigo }}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Billing to Net-30
                  </span>
                  <Pill bg={LEDGER.mintSoft} fg={LEDGER.mint}>
                    Approved
                  </Pill>
                </div>
                <p
                  className="mt-2 text-[12px] leading-relaxed"
                  style={{ color: LEDGER.indigo }}
                >
                  This PO bills to account #GW-40128 and appears on your June 1
                  statement. No payment is due at submission.
                </p>
                <div
                  className="mt-3 flex items-center justify-between border-t pt-2 text-[12px]"
                  style={{ borderColor: "rgba(47,58,163,0.18)" }}
                >
                  <span style={{ color: LEDGER.indigo }}>Credit remaining</span>
                  <span className="font-semibold" style={{ color: LEDGER.indigo }}>
                    {formatUsd(availableCredit)}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <Link
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition"
                  href="/design-lab/d7/orders"
                  style={{ backgroundColor: LEDGER.indigo }}
                >
                  Submit purchase order <ArrowRight className="h-4 w-4" />
                </Link>
                <p
                  className="mt-2 text-center text-[11px] font-medium"
                  style={{ color: LEDGER.muted }}
                >
                  Routes to your approver before fulfillment.
                </p>
              </div>
            </Card>

            <div className="mt-3 grid gap-2">
              {[
                { icon: ShieldCheck, text: "Secured trade checkout — no card required" },
                {
                  icon: ReceiptText,
                  text:
                    subtotal >= FREE_DELIVERY_THRESHOLD
                      ? "Free delivery threshold met"
                      : `Add ${formatUsd(FREE_DELIVERY_THRESHOLD - subtotal)} for free delivery`
                }
              ].map((row) => (
                <div
                  key={row.text}
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                  style={{
                    backgroundColor: LEDGER.surface,
                    border: `1px solid ${LEDGER.line}`
                  }}
                >
                  <row.icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: LEDGER.indigo }}
                  />
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: LEDGER.body }}
                  >
                    {row.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </D7Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium" style={{ color: LEDGER.body }}>
        {label}
      </span>
      <span className="font-semibold" style={{ color: LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
