"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import { Card, Kbd, Pill, SIGNAL, SignalShell, formatUsd } from "./kit";

// d10 "Signal" — orders. Real orders via useLiveOrders(), with a fast
// keyboard-first filter and status facets. Loading + empty states.

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function paymentTone(
  status: string
): "good" | "warn" | "neutral" | "accent" {
  if (status === "paid" || status === "overpaid") return "good";
  if (status === "partial") return "accent";
  if (status === "unpaid" || status === "failed") return "warn";
  return "neutral";
}

function titleCase(value: string): string {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ")
    : value;
}

export function D10Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order) => {
      map.set(order.status, (map.get(order.status) || 0) + 1);
    });
    return map;
  }, [orders]);

  const filtered = useMemo<OrderRecord[]>(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesQuery =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        (order.companyName || "").toLowerCase().includes(q) ||
        (order.jobName || "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const totalValue = useMemo(
    () => filtered.reduce((sum, order) => sum + (order.total || 0), 0),
    [filtered]
  );

  const statusOptions = useMemo(
    () => ["all", ...Array.from(statusCounts.keys())],
    [statusCounts]
  );

  return (
    <SignalShell active="orders">
      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Orders</Pill>
          <span className="text-[12px]" style={{ color: SIGNAL.sub }}>
            Live order feed · filter instantly
          </span>
        </div>
        <h1
          className="mt-3 text-[26px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          Order workspace
        </h1>

        {/* summary tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="px-4 py-3">
            <p
              className="text-[20px] font-semibold tabular-nums"
              style={{ color: SIGNAL.ink }}
            >
              {isLoading ? "—" : orders.length}
            </p>
            <p className="text-[11px]" style={{ color: SIGNAL.sub }}>
              Total orders
            </p>
          </Card>
          <Card className="px-4 py-3">
            <p
              className="text-[20px] font-semibold tabular-nums"
              style={{ color: SIGNAL.ink }}
            >
              {isLoading ? "—" : filtered.length}
            </p>
            <p className="text-[11px]" style={{ color: SIGNAL.sub }}>
              Matching filter
            </p>
          </Card>
          <Card className="px-4 py-3">
            <p
              className="text-[20px] font-semibold tabular-nums"
              style={{ color: SIGNAL.accent }}
            >
              {isLoading ? "—" : formatUsd(totalValue)}
            </p>
            <p className="text-[11px]" style={{ color: SIGNAL.sub }}>
              Filtered value
            </p>
          </Card>
        </div>

        {/* toolbar */}
        <Card className="mt-4 flex flex-wrap items-center gap-3 p-2.5">
          <div
            className="flex flex-1 items-center gap-2 rounded-[8px] border px-2.5 py-1.5"
            style={{ borderColor: SIGNAL.line, background: SIGNAL.canvas }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke={SIGNAL.accent}
              strokeWidth={2.4}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order #, customer, company, job…"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0ac]"
              style={{ color: SIGNAL.ink }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[11px] font-medium"
                style={{ color: SIGNAL.sub }}
              >
                Clear
              </button>
            ) : (
              <Kbd>/</Kbd>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {statusOptions.map((status) => {
              const on = status === statusFilter;
              const count =
                status === "all" ? orders.length : statusCounts.get(status) || 0;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className="rounded-[7px] px-2 py-1.5 text-[11px] font-medium transition-colors"
                  style={{
                    background: on ? SIGNAL.accentSoft : "transparent",
                    color: on ? SIGNAL.accent : SIGNAL.sub
                  }}
                >
                  {status === "all" ? "All" : titleCase(status)} ({count})
                </button>
              );
            })}
          </div>
        </Card>

        {/* table */}
        <Card className="mt-4 overflow-hidden">
          <div
            className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.8fr] gap-3 border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ borderColor: SIGNAL.line, color: SIGNAL.sub }}
          >
            <span>Order</span>
            <span>Customer</span>
            <span>Date</span>
            <span className="text-right">Total</span>
            <span className="text-right">Payment</span>
          </div>

          {isLoading ? (
            <div className="divide-y" style={{ borderColor: SIGNAL.line }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.8fr] gap-3 px-4 py-3"
                >
                  {Array.from({ length: 5 }).map((__, cell) => (
                    <div
                      key={cell}
                      className="h-3.5 animate-pulse rounded"
                      style={{ background: SIGNAL.canvas }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p
                className="text-[14px] font-semibold"
                style={{ color: SIGNAL.ink }}
              >
                {orders.length === 0
                  ? "No orders yet"
                  : "No orders match your filter"}
              </p>
              <p className="mt-1 text-[12px]" style={{ color: SIGNAL.sub }}>
                {orders.length === 0
                  ? "Live orders from the API will appear here as they come in."
                  : "Adjust the search or status filter to widen results."}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: SIGNAL.line }}>
              {filtered.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-[1.1fr_1.4fr_1fr_0.9fr_0.8fr] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fafbfc]"
                >
                  <div>
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: SIGNAL.ink }}
                    >
                      {order.orderNumber}
                    </p>
                    <p className="text-[10px]" style={{ color: SIGNAL.sub }}>
                      {titleCase(order.status)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate text-[12px] font-medium"
                      style={{ color: SIGNAL.ink }}
                    >
                      {order.companyName || order.customerName || "—"}
                    </p>
                    <p
                      className="truncate text-[10px]"
                      style={{ color: SIGNAL.sub }}
                    >
                      {order.jobName || order.customerName || "—"}
                    </p>
                  </div>
                  <span className="text-[11px]" style={{ color: SIGNAL.sub }}>
                    {formatDate(order.createdAt)}
                  </span>
                  <span
                    className="text-right text-[12px] font-semibold tabular-nums"
                    style={{ color: SIGNAL.ink }}
                  >
                    {formatUsd(order.total || 0)}
                  </span>
                  <span className="flex justify-end">
                    <Pill tone={paymentTone(order.paymentStatus)}>
                      {titleCase(order.paymentStatus)}
                    </Pill>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <p className="mt-4 text-[12px]" style={{ color: SIGNAL.sub }}>
          Need numbers?{" "}
          <Link
            href="/design-lab/d10/reports"
            className="font-semibold"
            style={{ color: SIGNAL.accent }}
          >
            Open the financial reports →
          </Link>
        </p>
      </div>
    </SignalShell>
  );
}
