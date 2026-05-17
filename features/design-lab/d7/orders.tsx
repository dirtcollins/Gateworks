"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Receipt, Search, TrendingUp } from "lucide-react";
import {
  Card,
  D7DesignBadge,
  D7Page,
  Eyebrow,
  LEDGER,
  Pill,
  formatUsd,
  formatUsd0
} from "./kit";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";

/* d7 "Ledger" order ledger — an account procurement history.
 * Marketing: reorder access keeps repeat buyers in the funnel.
 * Finance: every row is dual-coded for fulfillment + payment status
 * so a buyer can audit open AP exposure at a glance. Live orders. */

type FulfillBucket = "Submitted" | "In progress" | "Ready" | "Completed";
type PayBucket = "Open" | "Partial" | "Paid";

const FULFILL_LABEL: Record<OrderRecord["status"], FulfillBucket> = {
  draft: "Submitted",
  submitted: "Submitted",
  confirmed: "In progress",
  picking: "In progress",
  ready_for_pickup: "Ready",
  out_for_delivery: "Ready",
  completed: "Completed",
  cancelled: "Completed"
};

const FULFILL_META: Record<FulfillBucket, { bg: string; fg: string }> = {
  Submitted: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
  "In progress": { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  Ready: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  Completed: { bg: "#eef0f3", fg: LEDGER.body }
};

function payBucket(status: OrderRecord["paymentStatus"]): PayBucket {
  if (status === "paid") return "Paid";
  if (status === "partial") return "Partial";
  return "Open";
}

const PAY_META: Record<PayBucket, { bg: string; fg: string }> = {
  Open: { bg: LEDGER.roseSoft, fg: LEDGER.rose },
  Partial: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  Paid: { bg: LEDGER.mintSoft, fg: LEDGER.mint }
};

const TABS: ("All" | FulfillBucket)[] = [
  "All",
  "Submitted",
  "In progress",
  "Ready",
  "Completed"
];

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function itemCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function D7Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        order,
        id: order.orderNumber,
        ref: order.jobName || order.companyName || order.customerName || "Account order",
        date: formatDate(order.createdAt),
        units: itemCount(order),
        total: order.total,
        fulfill: FULFILL_LABEL[order.status] ?? "Submitted",
        pay: payBucket(order.paymentStatus)
      })),
    [orders]
  );

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (tab === "All" || row.fulfill === tab) &&
          (query.trim() === "" ||
            row.id.toLowerCase().includes(query.trim().toLowerCase()) ||
            row.ref.toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [rows, tab, query]
  );

  const stats = useMemo(() => {
    const totalSpend = rows.reduce((sum, row) => sum + row.total, 0);
    const outstanding = rows
      .filter((row) => row.pay !== "Paid")
      .reduce((sum, row) => sum + row.total, 0);
    const open = rows.filter((row) => row.fulfill !== "Completed").length;
    const avg = rows.length ? totalSpend / rows.length : 0;
    return [
      { label: "Lifetime spend", value: formatUsd0(totalSpend) },
      { label: "Open AP balance", value: formatUsd0(outstanding), accent: LEDGER.amber },
      { label: "Orders in progress", value: String(open) },
      { label: "Avg order value", value: formatUsd0(avg) }
    ];
  }, [rows]);

  return (
    <D7Page wide>
      <div className="pt-5">
        <D7DesignBadge />
      </div>

      <header className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Account ledger</Eyebrow>
            <h1
              className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: LEDGER.ink }}
            >
              Order ledger
            </h1>
            <p
              className="mt-1.5 max-w-xl text-sm"
              style={{ color: LEDGER.body }}
            >
              Every purchase order placed on account #GW-40128, with
              fulfillment and accounts-payable status.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            href="/design-lab/d7/reports"
            style={{
              color: LEDGER.ink,
              backgroundColor: LEDGER.surface,
              border: `1px solid ${LEDGER.line}`
            }}
          >
            <TrendingUp className="h-4 w-4" /> Spend reports
          </Link>
        </div>
      </header>

      {/* Stat row */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              {stat.label}
            </p>
            <p
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{ color: stat.accent ?? LEDGER.ink }}
            >
              {isLoading ? "—" : stat.value}
            </p>
          </Card>
        ))}
      </section>

      {/* Toolbar */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-1 rounded-xl p-1"
          style={{
            backgroundColor: LEDGER.surface,
            border: `1px solid ${LEDGER.line}`
          }}
        >
          {TABS.map((option) => {
            const active = tab === option;
            return (
              <button
                key={option}
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition"
                onClick={() => setTab(option)}
                style={{
                  backgroundColor: active ? LEDGER.indigo : "transparent",
                  color: active ? "#ffffff" : LEDGER.body
                }}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            backgroundColor: LEDGER.surface,
            border: `1px solid ${LEDGER.line}`
          }}
        >
          <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
          <input
            className="w-52 bg-transparent text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search PO or job name"
            style={{ color: LEDGER.ink }}
            value={query}
          />
        </div>
      </section>

      {/* Ledger table */}
      <section className="mt-4">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: LEDGER.muted,
                    borderBottom: `1px solid ${LEDGER.line}`
                  }}
                >
                  <th className="px-5 py-3">Purchase order</th>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Placed</th>
                  <th className="px-5 py-3 text-center">Units</th>
                  <th className="px-5 py-3 text-right">PO total</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => {
                  const fulfill = FULFILL_META[row.fulfill];
                  const pay = PAY_META[row.pay];
                  return (
                    <tr
                      key={row.order.id}
                      style={{
                        borderTop:
                          index === 0 ? "none" : `1px solid ${LEDGER.line}`
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {row.id}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-[13px] font-medium"
                        style={{ color: LEDGER.body }}
                      >
                        {row.ref}
                      </td>
                      <td
                        className="px-5 py-3.5 text-[13px] font-medium"
                        style={{ color: LEDGER.body }}
                      >
                        {row.date}
                      </td>
                      <td
                        className="px-5 py-3.5 text-center text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {row.units}
                      </td>
                      <td
                        className="px-5 py-3.5 text-right text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(row.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Pill bg={fulfill.bg} fg={fulfill.fg}>
                          {row.fulfill}
                        </Pill>
                      </td>
                      <td className="px-5 py-3.5">
                        <Pill bg={pay.bg} fg={pay.fg}>
                          {row.pay}
                        </Pill>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          className="inline-flex items-center gap-1 text-[12px] font-semibold transition hover:underline"
                          href="/design-lab/d7/cart"
                          style={{ color: LEDGER.indigo }}
                        >
                          Reorder <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isLoading ? (
            <p
              className="px-5 py-14 text-center text-sm font-medium"
              style={{ color: LEDGER.muted }}
            >
              Loading account order history…
            </p>
          ) : visible.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Receipt
                className="mx-auto h-9 w-9"
                style={{ color: LEDGER.muted }}
              />
              <p
                className="mt-3 text-sm font-semibold"
                style={{ color: LEDGER.ink }}
              >
                No orders in this view.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
                Orders placed on this account will appear here.
              </p>
            </div>
          ) : null}
        </Card>
      </section>

      {!isLoading ? (
        <p
          className="mt-4 text-[12px] font-medium"
          style={{ color: LEDGER.muted }}
        >
          Showing {visible.length} of {rows.length} purchase orders &middot;
          Account #GW-40128
        </p>
      ) : null}
    </D7Page>
  );
}
