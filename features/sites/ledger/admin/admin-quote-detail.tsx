"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileX, Minus, Plus, Trash2 } from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import {
  AdminCard,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatusPill,
  formatAdminDate,
  titleCase
} from "./admin-kit";

const STATUS_FLOW: QuoteRecord["status"][] = ["draft", "sent", "accepted", "invoiced"];

function quoteStatusTone(status: QuoteRecord["status"]): "indigo" | "amber" | "mint" {
  if (status === "draft") return "amber";
  if (status === "sent") return "indigo";
  return "mint";
}

/* Ledger admin quote detail — reads one quote from the real quote store
 * and writes back to it: edit customer / terms / notes, adjust line
 * quantities, advance status, and mark the quote invoiced. */
export function LedgerAdminQuoteDetail({ quoteId }: { quoteId: string }) {
  const quotes = useQuoteStore((state) => state.quotes);
  const updateQuoteDetails = useQuoteStore((state) => state.updateQuoteDetails);
  const updateQuantity = useQuoteStore((state) => state.updateQuantity);
  const removeItem = useQuoteStore((state) => state.removeItem);
  const saveQuote = useQuoteStore((state) => state.saveQuote);
  const renameQuote = useQuoteStore((state) => state.renameQuote);
  const [hydrated, setHydrated] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    void useQuoteStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const quote = useMemo(
    () => quotes.find((record) => record.id === quoteId),
    [quotes, quoteId]
  );

  const subtotal = useMemo(
    () =>
      quote
        ? quote.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        : 0,
    [quote]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  if (!quote) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Quote detail" />
        <AdminCard className="px-5 py-16 text-center">
          <FileX className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
          <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
            {hydrated ? "Quote not found" : "Loading quote…"}
          </p>
          {hydrated ? (
            <Link
              className="mt-4 inline-block text-[13px] font-semibold transition hover:underline"
              href="/ledger/admin/quotes"
              style={{ color: LEDGER.indigo }}
            >
              Back to quotes
            </Link>
          ) : null}
        </AdminCard>
      </div>
    );
  }

  function applyStatus(next: QuoteRecord["status"]) {
    if (!quote) return;
    updateQuoteDetails(quote.id, { status: next });
  }

  function applyCustomer(customerId: string) {
    if (!quote) return;
    const customer = customerDirectory.find((entry) => entry.id === customerId);
    if (!customer) return;
    updateQuoteDetails(quote.id, {
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      billingAddress: customer.billingAddress,
      jobsiteAddress: customer.jobsiteAddress,
      terms: customer.terms
    });
  }

  function handleSave() {
    if (!quote) return;
    saveQuote(quote.id);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2600);
  }

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
        href="/ledger/admin/quotes"
        style={{ color: LEDGER.muted }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All quotes
      </Link>

      <AdminHeading
        eyebrow="Quote"
        title={quote.quoteNumber}
        description={`Created ${formatAdminDate(quote.createdAt)} · ${
          quote.customerName || "No customer"
        }`}
        action={
          <div className="flex gap-2">
            <AdminGhostButton onClick={handleSave}>
              {savedNotice ? "Saved" : "Save quote"}
            </AdminGhostButton>
            {quote.status !== "invoiced" ? (
              <AdminPrimaryButton onClick={() => applyStatus("invoiced")}>
                Mark invoiced
              </AdminPrimaryButton>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: line items */}
        <div className="grid gap-4">
          <AdminCard>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p className="text-[13px] font-semibold" style={{ color: LEDGER.ink }}>
                Line items ({quote.items.length})
              </p>
              <StatusPill tone={quoteStatusTone(quote.status)}>
                {titleCase(quote.status)}
              </StatusPill>
            </div>
            {quote.items.length ? (
              <div>
                {quote.items.map((item) => (
                  <div
                    key={item.variantId}
                    className="grid gap-2 px-5 py-3 sm:grid-cols-[1.5fr_auto_auto] sm:items-center"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-[11px] font-medium"
                        style={{ color: LEDGER.muted }}
                      >
                        {item.sku} · {formatUsd(item.price)} each
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-lg p-0.5 sm:justify-self-end"
                      style={{ border: `1px solid ${LEDGER.line}` }}
                    >
                      <button
                        aria-label="Decrease quantity"
                        className="grid h-6 w-6 place-items-center rounded-md"
                        onClick={() =>
                          updateQuantity(quote.id, item.variantId, item.quantity - 1)
                        }
                        style={{ color: LEDGER.body }}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="w-8 text-center text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        className="grid h-6 w-6 place-items-center rounded-md"
                        onClick={() =>
                          updateQuantity(quote.id, item.variantId, item.quantity + 1)
                        }
                        style={{ color: LEDGER.body }}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-self-end">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(item.price * item.quantity)}
                      </span>
                      <button
                        aria-label="Remove line"
                        className="grid h-7 w-7 place-items-center rounded-lg transition"
                        onClick={() => removeItem(quote.id, item.variantId)}
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
            ) : (
              <p
                className="px-5 py-10 text-center text-[13px]"
                style={{ color: LEDGER.body }}
              >
                This quote has no line items yet.
              </p>
            )}
            <div className="grid gap-1.5 px-5 py-4 text-[13px]">
              <Row label="Subtotal" value={formatUsd(subtotal)} />
              <Row label="Tax" value={formatUsd(tax)} />
              <div
                className="mt-1 flex items-center justify-between pt-2"
                style={{ borderTop: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  Quote total
                </span>
                <span
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(total)}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* Notes */}
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Internal notes
            </p>
            <textarea
              className="mt-2 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
              onChange={(event) =>
                updateQuoteDetails(quote.id, { notes: event.target.value })
              }
              rows={3}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={quote.notes}
            />
          </AdminCard>
        </div>

        {/* Right: status + details */}
        <div className="grid gap-4">
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Quote status
            </p>
            <div className="mt-3 grid gap-1.5">
              {STATUS_FLOW.map((status) => {
                const active = quote.status === status;
                return (
                  <button
                    key={status}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition"
                    onClick={() => applyStatus(status)}
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {titleCase(status)}
                    {active ? <span className="text-[11px]">Current</span> : null}
                  </button>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Quote details
            </p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Quote name
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => renameQuote(quote.id, event.target.value)}
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={quote.name}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Account
                </span>
                <select
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => applyCustomer(event.target.value)}
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={quote.customerId ?? ""}
                >
                  <option value="">Select an account</option>
                  {customerDirectory.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.company}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Customer email
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { customerEmail: event.target.value })
                  }
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={quote.customerEmail}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Terms
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { terms: event.target.value })
                  }
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={quote.terms}
                />
              </label>
            </div>
            <p className="mt-3 text-[12px]" style={{ color: LEDGER.muted }}>
              Due {formatAdminDate(quote.dueAt || quote.expiresAt)} · Updated{" "}
              {formatAdminDate(quote.updatedAt)}
            </p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: LEDGER.body }}>{label}</span>
      <span className="font-semibold" style={{ color: LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
