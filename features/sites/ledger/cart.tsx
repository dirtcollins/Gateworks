"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Minus,
  Package,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2
} from "lucide-react";
import {
  ArrowLink,
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LEDGER,
  formatUsd
} from "./kit";
import { useLedgerScope } from "./scope";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";

/* Ledger purchase order — the cart restyled as a working PO draft.
 * Real cart-store line items, live quantity editing, removal, and a
 * Supabase-backed "save for repeat order" workflow. */
export function LedgerCartView() {
  const hydrated = useLedgerScope();
  const { items, removeItem, updateQuantity, clearCart, replaceCart } =
    useCartStore();
  const { carts, deleteCart, saveCart } = useSavedCartStore();
  const userId = useUserStore((state) => state.userId);
  const [poName, setPoName] = useState("");
  const [jobName, setJobName] = useState("");
  const [message, setMessage] = useState("");

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const lineCount = items.reduce((total, item) => total + item.quantity, 0);
  const weight = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (item.weightLbs || 0) * item.quantity,
        0
      ),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  async function handleSavePo() {
    if (!items.length) return;
    const name = poName.trim() || `Draft PO ${new Date().toLocaleDateString()}`;
    const response = await fetch("/api/saved-carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name, jobName, items })
    }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as
      | { cartId?: string; persisted?: boolean; reason?: string }
      | null;

    if (!response?.ok || !payload?.persisted) {
      setMessage(payload?.reason || "Could not save this purchase order.");
      return;
    }

    saveCart(name, jobName, items);
    setMessage(`Saved as “${name}”.`);
    setPoName("");
    setJobName("");
  }

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            { label: "Purchase order" }
          ]}
        />
      </div>

      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <Eyebrow>Working purchase order</Eyebrow>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Draft PO
            </h1>
            <p
              className="mt-2 max-w-xl text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {lineCount} unit{lineCount === 1 ? "" : "s"} across{" "}
              {items.length} line item{items.length === 1 ? "" : "s"}. Review
              quantities, then submit to checkout for fulfillment and terms.
            </p>
          </div>
          {items.length ? (
            <button
              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold transition"
              onClick={() => {
                if (!window.confirm("Clear every line from this purchase order?")) {
                  return;
                }
                clearCart();
              }}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)"
              }}
              type="button"
            >
              Clear PO
            </button>
          ) : null}
        </div>
      </header>

      {hydrated && !items.length ? (
        <Card className="my-8 p-14 text-center">
          <Package className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
            This purchase order has no line items.
          </p>
          <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
            Add SKUs from the catalog to start building an order.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
            href="/ledger/search"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            Browse the catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 py-8 lg:grid-cols-12">
          {/* Line items */}
          <div className="lg:col-span-8">
            <Card>
              <div
                className="hidden grid-cols-[1fr_150px_130px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] sm:grid"
                style={{
                  color: LEDGER.muted,
                  borderBottom: `1px solid ${LEDGER.line}`
                }}
              >
                <span>Item</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Line total</span>
              </div>
              <div>
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="grid gap-4 p-5 sm:grid-cols-[1fr_150px_130px] sm:items-center"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="flex gap-4">
                      <div
                        className="grid h-20 w-20 shrink-0 place-items-center rounded-xl"
                        style={{ backgroundColor: LEDGER.canvas }}
                      >
                        <Image
                          alt={item.title}
                          className="h-full w-full object-contain p-2"
                          height={160}
                          quality={75}
                          src={item.image}
                          width={160}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[14px] font-semibold leading-snug"
                          style={{ color: LEDGER.ink }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em]"
                          style={{ color: LEDGER.muted }}
                        >
                          SKU {item.sku}
                        </p>
                        {Object.values(item.options).filter(Boolean).length ? (
                          <p
                            className="mt-1 text-[12px]"
                            style={{ color: LEDGER.body }}
                          >
                            {Object.entries(item.options)
                              .filter(([, value]) => value)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(" · ")}
                          </p>
                        ) : null}
                        <p
                          className="mt-1.5 text-[13px] font-semibold"
                          style={{ color: LEDGER.body }}
                        >
                          {formatUsd(item.price)} each
                          {item.weightLbs
                            ? ` · ${item.weightLbs.toFixed(2)} lb`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-start sm:justify-center">
                      <div
                        className="flex items-center rounded-xl"
                        style={{ border: `1px solid ${LEDGER.line}` }}
                      >
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-9 w-9 place-items-center"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          aria-label={`Quantity for ${item.title}`}
                          className="h-9 w-12 bg-transparent text-center text-[13px] font-semibold outline-none"
                          inputMode="numeric"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isFinite(next)) {
                              updateQuantity(item.variantId, next);
                            }
                          }}
                          style={{ color: LEDGER.ink }}
                          value={item.quantity}
                        />
                        <button
                          aria-label="Increase quantity"
                          className="grid h-9 w-9 place-items-center"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(item.price * item.quantity)}
                      </span>
                      <button
                        aria-label={`Remove ${item.title}`}
                        className="grid h-9 w-9 place-items-center rounded-lg transition"
                        onClick={() => removeItem(item.variantId)}
                        style={{
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.muted
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <ArrowLink href="/ledger/search">Add more items</ArrowLink>
              </div>
            </Card>

            {/* Save for repeat order */}
            <Card className="mt-3 p-5">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" style={{ color: LEDGER.indigo }} />
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: LEDGER.muted }}
                >
                  Save for repeat order
                </p>
              </div>
              <p className="mt-2 text-[13px]" style={{ color: LEDGER.body }}>
                Store this PO as a template — restore it any time to reorder the
                same materials for a recurring job.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  aria-label="Purchase order name"
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setPoName(event.target.value)}
                  placeholder="PO name"
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={poName}
                />
                <input
                  aria-label="Job name"
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setJobName(event.target.value)}
                  placeholder="Job or project"
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={jobName}
                />
              </div>
              <button
                className="mt-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
                disabled={!items.length}
                onClick={handleSavePo}
                style={{
                  border: `1px solid ${LEDGER.indigo}`,
                  color: LEDGER.indigo,
                  opacity: items.length ? 1 : 0.5
                }}
                type="button"
              >
                Save purchase order
              </button>
              {message ? (
                <p
                  className="mt-2 text-[12px] font-semibold"
                  style={{ color: LEDGER.mint }}
                >
                  {message}
                </p>
              ) : null}

              {carts.length ? (
                <div
                  className="mt-4 space-y-2"
                  style={{ borderTop: `1px solid ${LEDGER.line}`, paddingTop: 16 }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: LEDGER.muted }}
                  >
                    Saved purchase orders
                  </p>
                  {carts.slice(0, 5).map((cart) => (
                    <div
                      key={cart.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: LEDGER.canvas }}
                    >
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {cart.name}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: LEDGER.muted }}
                        >
                          {cart.items.length} SKU
                          {cart.items.length === 1 ? "" : "s"}
                          {cart.jobName ? ` · ${cart.jobName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition"
                          onClick={() => replaceCart(cart.items)}
                          style={{
                            backgroundColor: LEDGER.indigoSoft,
                            color: LEDGER.indigo
                          }}
                          type="button"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                        <button
                          aria-label={`Delete ${cart.name}`}
                          className="grid h-8 w-8 place-items-center rounded-lg"
                          onClick={() => {
                            deleteCart(cart.id);
                            void fetch(
                              `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                              { method: "DELETE" }
                            ).catch(() => null);
                          }}
                          style={{
                            border: `1px solid ${LEDGER.line}`,
                            color: LEDGER.muted
                          }}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4">
            <Card className="sticky top-28 p-5">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4" style={{ color: LEDGER.indigo }} />
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: LEDGER.muted }}
                >
                  Order summary
                </p>
              </div>
              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <dt style={{ color: LEDGER.body }}>Subtotal</dt>
                  <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                    {formatUsd(subtotal)}
                  </dd>
                </div>
                {weight > 0 ? (
                  <div className="flex justify-between">
                    <dt style={{ color: LEDGER.body }}>Material weight</dt>
                    <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                      {weight.toFixed(2)} lb
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt style={{ color: LEDGER.body }}>Estimated tax</dt>
                  <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                    {formatUsd(tax)}
                  </dd>
                </div>
                <div
                  className="flex justify-between pt-2.5"
                  style={{ borderTop: `1px solid ${LEDGER.line}` }}
                >
                  <dt
                    className="text-[14px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    Estimated total
                  </dt>
                  <dd
                    className="text-[20px] font-semibold tracking-tight"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(total)}
                  </dd>
                </div>
              </dl>
              <Link
                className="mt-5 flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition"
                href="/ledger/checkout"
                style={{
                  backgroundColor: items.length ? LEDGER.indigo : LEDGER.muted,
                  pointerEvents: items.length ? "auto" : "none"
                }}
              >
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="mt-2 flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
                href="/ledger/quote"
                style={{
                  border: `1px solid ${LEDGER.line}`,
                  color: LEDGER.body
                }}
              >
                Request a formal quote instead
              </Link>
              <p
                className="mt-4 text-[11px] leading-relaxed"
                style={{ color: LEDGER.muted }}
              >
                Net-30 terms and Tier 2 volume pricing apply at checkout. Tax is
                estimated and finalized against the delivery address.
              </p>
            </Card>
          </aside>
        </div>
      )}
    </LedgerPage>
  );
}
