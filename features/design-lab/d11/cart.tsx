// d11 "Wayfinder" — Cart ("Selected products").
// Ported from prototype/cart.jsx (standard variant) with checkout-summary
// elements folded in from checkout.jsx. Wired to the shared cart store:
// real line items, working quantity stepper + remove, real subtotal/tax/total.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  Qty,
  Tag,
  d11,
  fmt,
  monoFont,
  wayfinding
} from "./kit";

const TAX_RATE = 0.0875;
const PRO_DISCOUNT = 0.06;

function variantSummary(item: CartItem) {
  const parts = [item.options?.length, item.options?.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" / ") : "Standard";
}

function SummaryRow({
  label,
  value,
  color,
  bold,
  large
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
  large?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0"
      }}
    >
      <span
        style={{
          fontSize: large ? 14 : 13,
          fontWeight: bold ? 900 : 600,
          color: bold ? d11.ink : d11.steel,
          textTransform: bold ? "uppercase" : "none",
          letterSpacing: bold ? "0.06em" : "normal"
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: large ? 22 : 14,
          fontWeight: bold ? 900 : 700,
          color: color ?? d11.ink,
          fontFamily: monoFont
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function D11Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [hydrated, setHydrated] = useState(false);

  // The cart store uses skipHydration — rehydrate once on the client so SSR
  // and the first client render agree before persisted state loads.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const proDiscount = subtotal * PRO_DISCOUNT;
    const tax = (subtotal - proDiscount) * TAX_RATE;
    const total = subtotal - proDiscount + tax;
    return { subtotal, proDiscount, tax, total };
  }, [lines]);

  const unitCount = lines.reduce((sum, item) => sum + item.quantity, 0);

  if (hydrated && lines.length === 0) {
    return (
      <D11Shell active="cart" cartCount={0}>
        <div style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
          <Card style={{ padding: 40, textAlign: "center" }}>
            <span style={{ display: "inline-flex", color: d11.rail }}>
              <Ico.cart size={36} />
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 14 }}>
              Your cart is empty.
            </h2>
            <p
              style={{
                fontSize: 13,
                color: d11.steel,
                marginTop: 6,
                maxWidth: 380,
                margin: "6px auto 0"
              }}
            >
              Start from the catalog or a kit — every line item carries an aisle
              and bay code so the pick is fast.
            </p>
            <div style={{ marginTop: 18 }}>
              <Btn href="/design-lab/d11/category" variant="primary">
                <Ico.grid size={14} /> Browse catalog
              </Btn>
            </div>
          </Card>
        </div>
      </D11Shell>
    );
  }

  return (
    <D11Shell active="cart" cartCount={unitCount}>
      <div style={{ padding: "20px 24px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: `1px solid ${d11.rail}`
          }}
        >
          <div>
            <Eyebrow>Cart</Eyebrow>
            <h1 style={{ fontSize: 28, fontWeight: 900 }}>Selected products</h1>
            <Mono
              style={{ fontSize: 11, color: d11.muted, marginTop: 4, display: "block" }}
            >
              {lines.length} SKUs · {unitCount} units · Bakersfield
            </Mono>
          </div>
          {lines.length ? (
            <Btn variant="danger" size="sm" onClick={() => clearCart()}>
              Clear cart
            </Btn>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 24,
            marginTop: 18
          }}
        >
          {/* Line items */}
          <Card style={{ padding: 0 }}>
            {lines.map((item, index) => {
              const way = wayfinding(item.variantId || item.productId);
              return (
                <div
                  key={item.variantId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "112px 1fr auto",
                    gap: 16,
                    padding: 16,
                    borderBottom:
                      index < lines.length - 1
                        ? `1px solid ${d11.hairline}`
                        : "none"
                  }}
                >
                  <Link
                    href="/design-lab/d11/product"
                    style={{ alignSelf: "start" }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        border: `1px solid ${d11.rail}`,
                        position: "relative",
                        aspectRatio: "1",
                        overflow: "hidden"
                      }}
                    >
                      <img
                        src={item.image || "/assets/logo.svg"}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: "8%"
                        }}
                      />
                    </div>
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <Mono style={{ fontSize: 10, color: d11.muted }}>
                      SKU {item.sku} · Aisle {way.aisle} · Bay {way.bay}
                    </Mono>
                    <Link
                      href="/design-lab/d11/product"
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        display: "block",
                        marginTop: 2,
                        color: d11.ink
                      }}
                    >
                      {item.title}
                    </Link>
                    <div style={{ fontSize: 12, color: d11.steel, marginTop: 4 }}>
                      {variantSummary(item)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Tag tone="in">
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: d11.pine,
                            display: "inline-block"
                          }}
                        />
                        {way.stock} in stock · Aisle {way.aisle}
                      </Tag>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 8,
                      justifyItems: "end",
                      alignContent: "space-between"
                    }}
                  >
                    <Qty
                      value={item.quantity}
                      onChange={(next) => updateQuantity(item.variantId, next)}
                    />
                    <div style={{ fontSize: 20, fontWeight: 900 }}>
                      {fmt(item.price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      aria-label="Remove"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 28,
                        padding: "0 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        border: `1px solid ${d11.rail}`,
                        background: "transparent",
                        color: d11.steel,
                        cursor: "pointer"
                      }}
                    >
                      <Ico.trash size={14} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Order summary */}
          <aside style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Card style={{ padding: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 12 }}>
                Order summary
              </h2>
              <SummaryRow label="Subtotal" value={fmt(totals.subtotal)} />
              <SummaryRow
                label="Pro discount"
                value={`− ${fmt(totals.proDiscount)}`}
                color={d11.pine}
              />
              <SummaryRow label="Tax (8.75%)" value={fmt(totals.tax)} />
              <hr
                style={{
                  height: 1,
                  background: d11.rail,
                  border: "none",
                  margin: "14px 0"
                }}
              />
              <SummaryRow label="Total" value={fmt(totals.total)} bold large />
              <div style={{ marginTop: 18 }}>
                <Btn variant="primary" block style={{ height: 52 }}>
                  <Ico.arrowRight size={16} /> Checkout
                </Btn>
              </div>
            </Card>

            {/* Reassurance — folded in from checkout.jsx */}
            <Card style={{ padding: 14 }}>
              <Eyebrow style={{ marginBottom: 8 }}>Will-call pickup</Eyebrow>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: 6,
                  fontSize: 12
                }}
              >
                {[
                  "Free pickup · today by 4p",
                  "90-day returns on unused stock",
                  "Pro price-match within 30 days"
                ].map((line) => (
                  <li
                    key={line}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <span style={{ color: d11.pine }}>
                      <Ico.check size={14} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </D11Shell>
  );
}
