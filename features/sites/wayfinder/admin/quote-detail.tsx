// Wayfinder admin — quote admin detail. Reads and writes the real quote store
// (lib/quote-store, useQuoteStore): edit customer, terms and notes, advance the
// quote status (draft → sent → accepted → invoiced), adjust line-item
// quantities, remove items, and save. Totals use the platform tax rate.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import { fmt } from "../kit";
import {
  AdminBtn,
  Field,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  SelectInput,
  TextArea,
  TextInput,
  monoFont,
  wf
} from "./admin-kit";
import { formatDate } from "./order-helpers";
import { quoteSubtotal } from "./quotes-list";

type QuoteStatus = QuoteRecord["status"];

const STATUS_FLOW: QuoteStatus[] = ["draft", "sent", "accepted", "invoiced"];
const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  invoiced: "Invoiced"
};
const STATUS_TONE: Record<QuoteStatus, "open" | "warn" | "active" | "done"> = {
  draft: "open",
  sent: "warn",
  accepted: "active",
  invoiced: "done"
};

export function WayfinderQuoteDetail({ quoteId }: { quoteId: string }) {
  const quotes = useQuoteStore((state) => state.quotes);
  const renameQuote = useQuoteStore((state) => state.renameQuote);
  const updateQuoteDetails = useQuoteStore((state) => state.updateQuoteDetails);
  const updateQuantity = useQuoteStore((state) => state.updateQuantity);
  const removeItem = useQuoteStore((state) => state.removeItem);
  const saveQuote = useQuoteStore((state) => state.saveQuote);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    useQuoteStore.persist.rehydrate();
    setReady(true);
  }, []);

  const quote = useMemo(
    () => quotes.find((q) => q.id === quoteId),
    [quotes, quoteId]
  );

  if (!quote) {
    return (
      <>
        <PageHead
          eyebrow="Operations"
          title="Quote not found"
          action={<AdminBtn href="/wayfinder/admin/quotes">Back to quotes</AdminBtn>}
        />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            {ready
              ? `No quote matches ${quoteId}.`
              : "Loading quote…"}
          </p>
        </Panel>
      </>
    );
  }

  const subtotal = quoteSubtotal(quote);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const nextStatusIndex = STATUS_FLOW.indexOf(quote.status) + 1;
  const nextStatus =
    nextStatusIndex < STATUS_FLOW.length ? STATUS_FLOW[nextStatusIndex] : null;

  function advance() {
    if (!quote || !nextStatus) return;
    updateQuoteDetails(quote.id, { status: nextStatus });
    setMessage(`Quote moved to ${STATUS_LABEL[nextStatus]}.`);
  }

  function save() {
    if (!quote) return;
    saveQuote(quote.id);
    setMessage("Quote saved.");
  }

  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/wayfinder/admin/quotes" style={{ color: wf.steel }}>
            ← Quotes
          </Link>
        }
        title={<Mono style={{ fontSize: 24 }}>{quote.quoteNumber}</Mono>}
        desc={`${quote.name} · ${quote.items.length} line items`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            {nextStatus ? (
              <AdminBtn onClick={advance}>
                Mark {STATUS_LABEL[nextStatus]}
              </AdminBtn>
            ) : null}
            <AdminBtn variant="primary" onClick={save}>
              <Ico.check size={14} /> Save quote
            </AdminBtn>
          </div>
        }
      />

      {message ? <Notice tone="good">{message}</Notice> : null}

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Pill tone={STATUS_TONE[quote.status]}>{STATUS_LABEL[quote.status]}</Pill>
        <span style={{ fontSize: 11, color: wf.muted, fontFamily: monoFont }}>
          Created {formatDate(quote.createdAt)} · updated{" "}
          {formatDate(quote.updatedAt || quote.createdAt)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-quote-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Line items" meta={`${quote.items.length} SKUs`} pad={false}>
            {quote.items.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
                >
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
                    {quote.items.map((item) => (
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
                              updateQuantity(
                                quote.id,
                                item.variantId,
                                Number(event.target.value) || 1
                              )
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
                            onClick={() => removeItem(quote.id, item.variantId)}
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
                No line items. Add products from the storefront quote builder.
              </div>
            )}
            <div
              style={{
                borderTop: `1px solid ${wf.hairline}`,
                padding: "12px 16px",
                display: "grid",
                gap: 6,
                justifyItems: "end"
              }}
            >
              <TotalRow label="Subtotal" value={subtotal} />
              <TotalRow label="Tax" value={tax} />
              <TotalRow label="Total" value={total} strong />
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Quote details">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Quote name">
                <TextInput
                  value={quote.name}
                  onChange={(event) => renameQuote(quote.id, event.target.value)}
                />
              </Field>
              <Field label="Customer">
                <SelectInput
                  value={
                    customerDirectory.some((c) => c.name === quote.customerName)
                      ? quote.customerName
                      : ""
                  }
                  onChange={(event) => {
                    const picked = customerDirectory.find(
                      (c) => c.name === event.target.value
                    );
                    if (picked) {
                      updateQuoteDetails(quote.id, {
                        customerId: picked.id,
                        customerName: picked.name,
                        customerEmail: picked.email,
                        billingAddress: picked.billingAddress,
                        jobsiteAddress: picked.jobsiteAddress,
                        terms: picked.terms
                      });
                    }
                  }}
                >
                  <option value="">Custom / unassigned</option>
                  {customerDirectory.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Customer email">
                <TextInput
                  value={quote.customerEmail}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { customerEmail: event.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={quote.status}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      status: event.target.value as QuoteStatus
                    })
                  }
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Terms">
                <TextInput
                  value={quote.terms}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { terms: event.target.value })
                  }
                />
              </Field>
              <Field label="Notes">
                <TextArea
                  value={quote.notes}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { notes: event.target.value })
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Addresses">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Billing address">
                <TextArea
                  value={quote.billingAddress}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { billingAddress: event.target.value })
                  }
                />
              </Field>
              <Field label="Jobsite address">
                <TextArea
                  value={quote.jobsiteAddress}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { jobsiteAddress: event.target.value })
                  }
                />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-quote-grid { grid-template-columns: 1fr !important; }
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

function TotalRow({
  label,
  value,
  strong
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 28, fontSize: strong ? 14 : 12 }}>
      <span style={{ color: strong ? wf.ink : wf.steel, fontWeight: strong ? 800 : 600 }}>
        {label}
      </span>
      <Mono style={{ fontWeight: strong ? 800 : 600, minWidth: 90, textAlign: "right" }}>
        {fmt(value)}
      </Mono>
    </div>
  );
}
