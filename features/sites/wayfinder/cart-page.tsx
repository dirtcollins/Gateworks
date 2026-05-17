// Wayfinder — cart. Real line items from @/lib/cart-store with quantity edit,
// remove, clear, and live subtotal / tax / total. Saved carts read & write the
// real /api/saved-carts route plus @/lib/saved-cart-store, scoped to the
// current user (@/lib/user-store). Restyled in the Wayfinder identity — paper
// palette, hairline cards, mono SKUs, aisle/bay wayfinding.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";
import {
  Btn,
  Card,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  Qty,
  Tag,
  fmt,
  monoFont,
  wayfinding,
  wf
} from "./kit";
import type { CartItem, Product } from "@/lib/types";

// CartItem only carries an image url, not a full Product — wrap it so the kit's
// ProductImage helper (which expects a Product) can render the stored image.
function cartItemImage(item: CartItem) {
  const shim = {
    title: item.title,
    images: item.image ? [{ url: item.image }] : [],
    variants: [{ sku: item.sku, image: item.image }]
  } as unknown as Product;
  return shim;
}

export function WayfinderCart() {
  const { items, removeItem, updateQuantity, clearCart, replaceCart } = useCartStore();
  const { carts, deleteCart, saveCart, setCarts } = useSavedCartStore();
  const userId = useUserStore((state) => state.userId);

  const [ready, setReady] = useState(false);
  const [cartName, setCartName] = useState("");
  const [jobName, setJobName] = useState("");
  const [message, setMessage] = useState("");

  // Stores use skipHydration — rehydrate once so we read the persisted,
  // user-scoped cart rather than an empty in-memory copy.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useSavedCartStore.persist.rehydrate();
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
      if (payload?.persisted && payload.carts) setCarts(payload.carts);
    }
    void loadSavedCarts();
  }, [setCarts, userId]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const totalWeight = useMemo(
    () => items.reduce((total, item) => total + (item.weightLbs || 0) * item.quantity, 0),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const lineCount = items.reduce((count, item) => count + item.quantity, 0);

  async function handleSaveCart() {
    if (!items.length) return;
    const name = cartName || `Cart ${new Date().toLocaleDateString()}`;
    const response = await fetch("/api/saved-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, jobName, items })
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

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading cart…</Mono>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      {/* Page head */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: `1px solid ${wf.rail}`,
          paddingBottom: 18,
          marginBottom: 20
        }}
      >
        <div>
          <Eyebrow>Will-call cart</Eyebrow>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "6px 0 0"
            }}
          >
            Staging list
          </h1>
          <Mono style={{ fontSize: 12, color: wf.steel }}>
            {lineCount} unit{lineCount === 1 ? "" : "s"} · {items.length} SKU
            {items.length === 1 ? "" : "s"}
          </Mono>
        </div>
        {items.length ? (
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!window.confirm("Clear all items from the cart?")) return;
              clearCart();
            }}
          >
            <Ico.x size={14} /> Clear cart
          </Btn>
        ) : null}
      </div>

      {!items.length ? (
        <Card style={{ padding: 56, textAlign: "center" }}>
          <div style={{ display: "inline-flex", color: wf.muted, marginBottom: 12 }}>
            <Ico.cart size={40} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Your cart is empty.</p>
          <p style={{ fontSize: 13, color: wf.steel, margin: "8px 0 18px" }}>
            Add hardware, tube, fence, or welding supply to stage a will-call order.
          </p>
          <Btn variant="primary" href="/wayfinder/search">
            Browse the catalog <Ico.arrowRight size={14} />
          </Btn>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 20,
            alignItems: "start"
          }}
        >
          {/* Line items */}
          <Card style={{ padding: 0 }}>
            {items.map((item, index) => {
              const way = wayfinding(item.variantId);
              return (
                <div
                  key={item.variantId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "96px minmax(0, 1fr) auto",
                    gap: 16,
                    padding: 16,
                    borderBottom:
                      index < items.length - 1 ? `1px solid ${wf.hairline}` : "none"
                  }}
                >
                  <div style={{ border: `1px solid ${wf.rail}` }}>
                    <ProductImage product={cartItemImage(item)} ratio={1} sizes="96px" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/wayfinder/products/${item.productId}`}
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: wf.ink,
                        display: "block",
                        lineHeight: 1.3
                      }}
                    >
                      {item.title}
                    </Link>
                    <Mono style={{ fontSize: 11, color: wf.muted, display: "block", marginTop: 4 }}>
                      SKU {item.sku}
                    </Mono>
                    {Object.entries(item.options || {}).filter(([, v]) => v).length ? (
                      <p style={{ fontSize: 12, color: wf.steel, margin: "6px 0 0" }}>
                        {Object.entries(item.options || {})
                          .filter(([, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                    <div style={{ marginTop: 8 }}>
                      <Tag tone="in">
                        <Ico.pin size={11} /> Aisle {way.aisle} · Bay {way.bay}
                      </Tag>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      justifyItems: "end",
                      alignContent: "start"
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 900 }}>
                      {fmt(item.price * item.quantity)}
                    </span>
                    <Mono style={{ fontSize: 11, color: wf.steel }}>
                      {fmt(item.price)} ea
                    </Mono>
                    <Qty
                      value={item.quantity}
                      onChange={(next) => updateQuantity(item.variantId, next)}
                      height={36}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeItem(item.variantId)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: wf.red,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      <Ico.x size={13} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Summary + saved carts */}
          <div style={{ display: "grid", gap: 16 }}>
            <Card style={{ padding: 18 }}>
              <Eyebrow>Order summary</Eyebrow>
              <div style={{ display: "grid", gap: 8, marginTop: 14, fontSize: 13 }}>
                <Row label="Subtotal" value={fmt(subtotal)} />
                {totalWeight > 0 ? (
                  <Row label="Material weight" value={`${totalWeight.toFixed(1)} lb`} />
                ) : null}
                <Row label={`Estimated tax`} value={fmt(tax)} />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderTop: `1px solid ${wf.rail}`,
                  marginTop: 12,
                  paddingTop: 12
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800 }}>Total</span>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
                  {fmt(total)}
                </span>
              </div>
              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                <Btn variant="primary" href="/wayfinder/checkout" block style={{ height: 48 }}>
                  Proceed to checkout <Ico.arrowRight size={14} />
                </Btn>
                <Btn variant="ghost" href="/wayfinder/search" block size="sm">
                  Keep shopping
                </Btn>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 11,
                  color: wf.steel
                }}
              >
                <Ico.truck size={14} />
                <Mono>Order before 11A for same-day will-call · Bay 7</Mono>
              </div>
            </Card>

            {/* Save cart for repeat orders */}
            <Card style={{ padding: 18 }}>
              <Eyebrow>Save for repeat order</Eyebrow>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <WfInput
                  placeholder="Cart name"
                  value={cartName}
                  onChange={setCartName}
                />
                <WfInput
                  placeholder="Job name (optional)"
                  value={jobName}
                  onChange={setJobName}
                />
                <Btn variant="default" size="sm" block onClick={handleSaveCart}>
                  <Ico.clipboard size={13} /> Save cart
                </Btn>
                {message ? (
                  <Mono style={{ fontSize: 11, color: wf.pine }}>{message}</Mono>
                ) : null}
              </div>
            </Card>

            {carts.length ? (
              <Card style={{ padding: 18 }}>
                <Eyebrow>Saved carts</Eyebrow>
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {carts.slice(0, 4).map((cart) => (
                    <div
                      key={cart.id}
                      style={{ border: `1px solid ${wf.hairline}`, padding: 10 }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{cart.name}</p>
                      <Mono style={{ fontSize: 11, color: wf.muted }}>
                        {cart.items.length} SKUs
                        {cart.jobName ? ` · ${cart.jobName}` : ""}
                      </Mono>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <Btn
                          size="xs"
                          variant="default"
                          onClick={() => replaceCart(cart.items)}
                          style={{ flex: 1 }}
                        >
                          Restore
                        </Btn>
                        <Btn
                          size="xs"
                          variant="danger"
                          onClick={() => {
                            deleteCart(cart.id);
                            void fetch(
                              `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                              { method: "DELETE" }
                            ).catch(() => null);
                          }}
                        >
                          <Ico.x size={12} />
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: wf.steel }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: monoFont }}>{value}</span>
    </div>
  );
}

export function WfInput({
  placeholder,
  value,
  onChange,
  type = "text"
}: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        height: 40,
        border: `1px solid ${wf.rail}`,
        background: "#fff",
        padding: "0 12px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        outline: "none",
        color: wf.ink,
        width: "100%"
      }}
    />
  );
}
