"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminHeader,
  AdminSection,
  adminInputClass,
  adminTextareaClass
} from "@/features/sites/industrial/admin/kit";
import { useOrderStore } from "@/lib/order-store";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { CartItem, Product } from "@/lib/types";
import type { FulfillmentMethod } from "@/lib/platform-backend";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin new order. A counter-sale builder: pick a
 * customer, search the real catalog, set quantities, choose
 * fulfillment, and create a genuine order via the order store +
 * the real /api/orders route.
 * ------------------------------------------------------------------ */

type CatalogHit = {
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  image: string;
  price: number;
};

const DELIVERY_FEE = 85;
const DELIVERY_THRESHOLD = 500;

function buildCatalogHits(products: Product[]): CatalogHit[] {
  const hits: CatalogHit[] = [];
  for (const product of products) {
    const image =
      product.images?.[0]?.sizes?.thumb ||
      product.images?.[0]?.url ||
      "/assets/logo.svg";
    for (const variant of product.variants) {
      hits.push({
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        sku: variant.sku,
        image: variant.image || image,
        price: variant.price
      });
    }
  }
  return hits;
}

type OrdersResponse = {
  persisted?: boolean;
  orderId?: string;
  orderNumber?: string;
  reason?: string;
};

export function IndustrialAdminNewOrder({
  catalogProducts
}: {
  catalogProducts: Product[];
}) {
  const router = useRouter();
  const createOrder = useOrderStore((state) => state.createOrder);

  const catalogHits = useMemo(
    () => buildCatalogHits(catalogProducts),
    [catalogProducts]
  );

  const [customerId, setCustomerId] = useState(customerDirectory[0]?.id || "");
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("pickup");
  const [requestedDate, setRequestedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [jobName, setJobName] = useState("");
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const customer = customerDirectory.find((entry) => entry.id === customerId);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return catalogHits
      .filter(
        (hit) =>
          hit.title.toLowerCase().includes(term) ||
          hit.sku.toLowerCase().includes(term)
      )
      .slice(0, 8);
  }, [catalogHits, query]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee =
    fulfillment === "delivery" && subtotal > 0 && subtotal < DELIVERY_THRESHOLD
      ? DELIVERY_FEE
      : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + tax + deliveryFee;

  function addItem(hit: CatalogHit) {
    setItems((current) => {
      const existing = current.find(
        (item) => item.variantId === hit.variantId
      );
      if (existing) {
        return current.map((item) =>
          item.variantId === hit.variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        {
          productId: hit.productId,
          variantId: hit.variantId,
          title: hit.title,
          sku: hit.sku,
          image: hit.image,
          price: hit.price,
          quantity: 1,
          options: {}
        },
        ...current
      ];
    });
    setQuery("");
  }

  function setQuantity(variantId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    setItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  }

  async function handleSubmit() {
    if (submitting || !items.length || !customer) return;
    setSubmitting(true);
    setMessage("");

    const created = createOrder({
      userId: "admin-counter",
      customerName: customer.name,
      companyName: customer.company || customer.name,
      email: customer.email,
      phone: customer.phone,
      items,
      fulfillmentMethod: fulfillment,
      requestedDate,
      requestedWindow: "Counter sale",
      jobName: jobName.trim() || "Counter order",
      jobsiteAddress: {
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        addressLine1:
          fulfillment === "delivery"
            ? customer.jobsiteAddress
            : customer.billingAddress,
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        notes: notes.trim()
      },
      drawings: [],
      pickupContact: customer.name,
      subtotal,
      tax,
      deliveryFee,
      total,
      status: "submitted",
      paymentStatus: "unpaid",
      isQuoteRequest: false
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: created.userId,
          orderNumber: created.orderNumber,
          customerName: created.customerName,
          companyName: created.companyName,
          email: created.email,
          phone: created.phone,
          items: created.items,
          fulfillmentMethod: created.fulfillmentMethod,
          requestedDate: created.requestedDate,
          requestedWindow: created.requestedWindow,
          jobName: created.jobName,
          jobsiteAddress: created.jobsiteAddress,
          drawings: created.drawings,
          pickupContact: created.pickupContact,
          subtotal: created.subtotal,
          tax: created.tax,
          deliveryFee: created.deliveryFee,
          total: created.total,
          status: created.status,
          paymentStatus: created.paymentStatus,
          isQuoteRequest: false
        })
      });
      const payload = (await response.json()) as OrdersResponse;

      if (payload.persisted && payload.orderId) {
        router.push(`/industrial/admin/orders/${payload.orderId}`);
        return;
      }
    } catch {
      // Fall through to local navigation below.
    }

    router.push(`/industrial/admin/orders/${created.id}`);
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/orders"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All orders
        </Link>
        <AdminHeader
          eyebrow="Counter sales"
          title="New order"
          description="Build a counter or phone order against the live catalog and create it in the order queue."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: item builder */}
        <div className="grid gap-8 lg:col-span-8">
          <AdminSection title="Add products">
            <div className="relative">
              <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
                <Search className="h-4 w-4 text-d1-steel" />
                <input
                  aria-label="Search the catalog"
                  className="h-11 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the catalog by name or SKU"
                  value={query}
                />
              </div>
              {searchResults.length ? (
                <div className="mt-1 divide-y divide-d1-line border border-d1-line bg-d1-card">
                  {searchResults.map((hit) => (
                    <button
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-d1-paper"
                      key={hit.variantId}
                      onClick={() => addItem(hit)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-d1-ink">
                          {hit.title}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                          {hit.sku}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-extrabold text-d1-ink">
                          {formatUsd(hit.price)}
                        </span>
                        <Plus className="h-4 w-4 text-d1-pine" />
                      </span>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <p className="mt-2 text-sm font-semibold text-d1-steel">
                  No catalog matches for &ldquo;{query}&rdquo;.
                </p>
              ) : null}
            </div>
          </AdminSection>

          <AdminSection title={`Line items (${items.length})`}>
            {items.length ? (
              <AdminCard className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-d1-line">
                    {items.map((item) => (
                      <tr key={item.variantId}>
                        <td className="px-4 py-3.5">
                          <span className="block text-sm font-bold text-d1-ink">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="mx-auto flex w-fit items-center border border-d1-line">
                            <button
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                              onClick={() =>
                                setQuantity(item.variantId, item.quantity - 1)
                              }
                              type="button"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              aria-label="Quantity"
                              className="h-8 w-12 border-x border-d1-line bg-white text-center text-sm font-bold text-d1-ink outline-none"
                              min={1}
                              onChange={(event) =>
                                setQuantity(
                                  item.variantId,
                                  Number(event.target.value) || 1
                                )
                              }
                              type="number"
                              value={item.quantity}
                            />
                            <button
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                              onClick={() =>
                                setQuantity(item.variantId, item.quantity + 1)
                              }
                              type="button"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                          {formatUsd(item.price)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(item.price * item.quantity)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            aria-label={`Remove ${item.title}`}
                            className="grid h-8 w-8 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                            onClick={() => removeItem(item.variantId)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminCard>
            ) : (
              <AdminEmptyState
                title="No items yet"
                description="Search the catalog above to add products to this order."
              />
            )}
          </AdminSection>
        </div>

        {/* Right: order setup + summary */}
        <div className="grid gap-8 lg:col-span-4">
          <AdminSection title="Order setup">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Customer">
                <select
                  className={adminInputClass}
                  onChange={(event) => setCustomerId(event.target.value)}
                  value={customerId}
                >
                  {customerDirectory.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.company || entry.name}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Fulfillment">
                <div className="flex border border-d1-line">
                  {(["pickup", "delivery"] as const).map((option) => (
                    <button
                      className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                        fulfillment === option
                          ? "bg-d1-ink text-d1-paper"
                          : "bg-white text-d1-steel hover:text-d1-ink"
                      }`}
                      key={option}
                      onClick={() => setFulfillment(option)}
                      type="button"
                    >
                      {option === "pickup" ? "Will-call" : "Delivery"}
                    </button>
                  ))}
                </div>
              </AdminField>
              <AdminField label="Requested date">
                <input
                  className={adminInputClass}
                  onChange={(event) => setRequestedDate(event.target.value)}
                  type="date"
                  value={requestedDate}
                />
              </AdminField>
              <AdminField label="Job name">
                <input
                  className={adminInputClass}
                  onChange={(event) => setJobName(event.target.value)}
                  placeholder="Optional job reference"
                  value={jobName}
                />
              </AdminField>
              <AdminField label="Notes">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Counter notes, delivery instructions"
                  rows={3}
                  value={notes}
                />
              </AdminField>
            </AdminCard>
          </AdminSection>

          <AdminSection title="Summary">
            <AdminCard className="grid gap-2.5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-d1-steel">Subtotal</span>
                <span className="font-bold text-d1-ink">
                  {formatUsd(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-d1-steel">Tax</span>
                <span className="font-bold text-d1-ink">{formatUsd(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-d1-steel">Delivery</span>
                <span className="font-bold text-d1-ink">
                  {formatUsd(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-d1-ink pt-2.5">
                <span className="text-base font-extrabold text-d1-ink">
                  Total
                </span>
                <span className="text-base font-extrabold text-d1-ink">
                  {formatUsd(total)}
                </span>
              </div>
              <button
                className="mt-2 w-full bg-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting || !items.length}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? "Creating order…" : "Create order"}
              </button>
              {!items.length ? (
                <p className="text-center text-[11px] font-semibold text-d1-steel">
                  Add at least one product to create the order.
                </p>
              ) : null}
              {message ? (
                <p className="text-center text-[11px] font-semibold text-d1-red">
                  {message}
                </p>
              ) : null}
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
