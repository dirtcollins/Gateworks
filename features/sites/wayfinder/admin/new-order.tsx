// Wayfinder admin — counter order builder. Picks a customer from the real
// directory (lib/customers), searches the catalog for line items, computes
// subtotal/tax/total with the platform tax rate, and on submit calls the real
// createOrder store action plus POSTs /api/orders. Redirects to the new order
// detail on success.
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { CartItem, Product } from "@/lib/types";
import type { FulfillmentMethod } from "@/lib/platform-backend";
import { fmt } from "../kit";
import {
  AdminBtn,
  Field,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  SelectInput,
  TextArea,
  TextInput,
  monoFont,
  wf
} from "./admin-kit";

type SearchHit = {
  product: Product;
  variantId: string;
  sku: string;
  title: string;
  price: number;
  options: CartItem["options"];
};

const DELIVERY_FEE = 85;

function buildSearchIndex(products: Product[]): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const product of products) {
    for (const variant of product.variants) {
      hits.push({
        product,
        variantId: variant.id,
        sku: variant.sku,
        title: product.title,
        price: variant.price,
        options: variant.options
      });
    }
  }
  return hits;
}

export function WayfinderNewOrder({ catalogProducts }: { catalogProducts: Product[] }) {
  const router = useRouter();
  const createOrder = useOrderStore((state) => state.createOrder);
  const upsertOrder = useOrderStore((state) => state.upsertOrder);

  const [customerId, setCustomerId] = useState(customerDirectory[0]?.id || "");
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("pickup");
  const [requestedDate, setRequestedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [jobName, setJobName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchIndex = useMemo(
    () => buildSearchIndex(catalogProducts),
    [catalogProducts]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter(
        (hit) =>
          hit.sku.toLowerCase().includes(q) || hit.title.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, searchIndex]);

  const customer = customerDirectory.find((c) => c.id === customerId);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = fulfillment === "delivery" ? DELIVERY_FEE : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + deliveryFee + tax;

  function addItem(hit: SearchHit) {
    setItems((current) => {
      const existing = current.find((item) => item.variantId === hit.variantId);
      if (existing) {
        return current.map((item) =>
          item.variantId === hit.variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const newItem: CartItem = {
        productId: hit.product.id,
        variantId: hit.variantId,
        title: hit.title,
        sku: hit.sku,
        image: hit.product.images[0]?.url || "/assets/logo.svg",
        price: hit.price,
        quantity: 1,
        options: hit.options
      };
      return [newItem, ...current];
    });
    setQuery("");
  }

  function setQty(variantId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    setItems((current) => current.filter((item) => item.variantId !== variantId));
  }

  async function submit() {
    if (!customer) {
      setError("Select a customer.");
      return;
    }
    if (!items.length) {
      setError("Add at least one line item.");
      return;
    }
    setSubmitting(true);
    setError("");

    const created = createOrder({
      userId: "counter-staff",
      customerName: customer.name,
      companyName: customer.company,
      email: customer.email,
      phone: customer.phone,
      items,
      fulfillmentMethod: fulfillment,
      requestedDate,
      requestedWindow: fulfillment === "pickup" ? "Will-call · same day" : "10:00 AM - 1:00 PM",
      jobName: jobName.trim() || "Counter order",
      jobsiteAddress: {
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        addressLine1: customer.jobsiteAddress,
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        notes
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
      const res = await fetch("/api/orders", {
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
      const payload = (await res.json()) as {
        persisted?: boolean;
        orderId?: string;
        orderNumber?: string;
      };
      if (payload.persisted && payload.orderId) {
        const persisted: OrderRecord = {
          ...created,
          id: payload.orderId,
          orderNumber: payload.orderNumber || created.orderNumber
        };
        upsertOrder(persisted);
        router.push(`/wayfinder/admin/orders/${encodeURIComponent(payload.orderId)}`);
        return;
      }
    } catch {
      // Supabase not configured / offline — the order still lives in the store.
    }
    router.push(`/wayfinder/admin/orders/${encodeURIComponent(created.id)}`);
  }

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="New order"
        desc="Build a counter order — pick a customer, scan SKUs into the cart, and place it into the warehouse workflow."
        action={<AdminBtn href="/wayfinder/admin/orders">Cancel</AdminBtn>}
      />

      {error ? <Notice tone="warn">{error}</Notice> : null}

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-neworder-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Add line items">
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Search catalog by SKU or name">
                <TextInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="e.g. gate hinge, TUBE-SQ-2-11GA…"
                />
              </Field>
              {results.length ? (
                <div style={{ border: `1px solid ${wf.rail}`, background: wf.bone }}>
                  {results.map((hit) => (
                    <button
                      key={hit.variantId}
                      type="button"
                      onClick={() => addItem(hit)}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        padding: "9px 12px",
                        background: "none",
                        border: "none",
                        borderBottom: `1px solid ${wf.hairline}`,
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{hit.title}</span>
                        <br />
                        <Mono style={{ fontSize: 10, color: wf.muted }}>{hit.sku}</Mono>
                      </span>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          flexShrink: 0
                        }}
                      >
                        <Mono style={{ fontWeight: 700 }}>{fmt(hit.price)}</Mono>
                        <Ico.plus size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <p style={{ margin: 0, fontSize: 12, color: wf.muted }}>
                  No catalog matches for “{query}”.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Cart" meta={`${items.length} SKUs`} pad={false}>
            {items.length ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: wf.bone }}>
                      {["SKU", "Item", "Qty", "Unit", "Line", ""].map((h, i) => (
                        <th
                          key={h || "x"}
                          style={{
                            textAlign: i >= 2 && i <= 4 ? "right" : "left",
                            padding: "9px 14px",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: wf.steel,
                            borderBottom: `1px solid ${wf.rail}`
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.variantId}>
                        <td style={td()}>
                          <Mono style={{ fontSize: 11 }}>{item.sku}</Mono>
                        </td>
                        <td style={td()}>
                          <span style={{ fontWeight: 700 }}>{item.title}</span>
                        </td>
                        <td style={td("right")}>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              setQty(item.variantId, Number(event.target.value) || 1)
                            }
                            style={{
                              width: 56,
                              height: 30,
                              textAlign: "center",
                              border: `1px solid ${wf.rail}`,
                              fontFamily: monoFont,
                              fontWeight: 700,
                              fontSize: 12
                            }}
                          />
                        </td>
                        <td style={td("right")}>
                          <Mono>{fmt(item.price)}</Mono>
                        </td>
                        <td style={td("right")}>
                          <Mono style={{ fontWeight: 700 }}>
                            {fmt(item.price * item.quantity)}
                          </Mono>
                        </td>
                        <td style={td("right")}>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label="Remove item"
                            style={{
                              background: "none",
                              border: `1px solid ${wf.rail}`,
                              color: wf.red,
                              cursor: "pointer",
                              padding: 4,
                              lineHeight: 0
                            }}
                          >
                            <Ico.x size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "32px 14px",
                  textAlign: "center",
                  color: wf.muted,
                  fontSize: 13,
                  fontFamily: monoFont
                }}
              >
                No items yet — search the catalog above.
              </div>
            )}
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Order details">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Customer">
                <SelectInput
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  {customerDirectory.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Fulfillment">
                <SelectInput
                  value={fulfillment}
                  onChange={(event) =>
                    setFulfillment(event.target.value as FulfillmentMethod)
                  }
                >
                  <option value="pickup">Will-call pickup</option>
                  <option value="delivery">Delivery</option>
                </SelectInput>
              </Field>
              <Field label="Requested date">
                <TextInput
                  type="date"
                  value={requestedDate}
                  onChange={(event) => setRequestedDate(event.target.value)}
                />
              </Field>
              <Field label="Job name">
                <TextInput
                  value={jobName}
                  onChange={(event) => setJobName(event.target.value)}
                  placeholder="Counter order"
                />
              </Field>
              <Field label="Notes">
                <TextArea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Staging, contact, or delivery notes"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Summary">
            <div style={{ display: "grid", gap: 7 }}>
              <SummaryRow label="Subtotal" value={subtotal} />
              {deliveryFee ? <SummaryRow label="Delivery" value={deliveryFee} /> : null}
              <SummaryRow label="Tax" value={tax} />
              <div
                style={{
                  borderTop: `1px solid ${wf.hairline}`,
                  marginTop: 4,
                  paddingTop: 8
                }}
              >
                <SummaryRow label="Total" value={total} strong />
              </div>
              <AdminBtn
                variant="primary"
                block
                disabled={submitting || !items.length}
                onClick={submit}
                style={{ marginTop: 6 }}
              >
                {submitting ? "Placing…" : "Place order"}
              </AdminBtn>
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-neworder-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function td(align: "left" | "right" = "left"): React.CSSProperties {
  return {
    textAlign: align,
    padding: "9px 14px",
    borderBottom: `1px solid ${wf.hairline}`,
    color: wf.ink
  };
}

function SummaryRow({
  label,
  value,
  strong
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: strong ? 15 : 13
      }}
    >
      <span style={{ color: strong ? wf.ink : wf.steel, fontWeight: strong ? 800 : 600 }}>
        {label}
      </span>
      <Mono style={{ fontWeight: strong ? 800 : 600 }}>{fmt(value)}</Mono>
    </div>
  );
}
