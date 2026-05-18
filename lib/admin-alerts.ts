"use client";

import { useEffect, useState } from "react";

// Counts of admin items that need attention right now. State-based (not
// "since last visit"): an item drops off the count once it's acted on.
export type AdminAlerts = {
  newOrders: number; // placed orders not yet confirmed
  pendingPOs: number; // customer purchase orders awaiting approval
  openQuotes: number; // customer-submitted quotes awaiting a response
  total: number;
  loading: boolean;
};

type OrderLite = {
  status?: string;
  isQuoteRequest?: boolean;
  poNumber?: string;
  poStatus?: string;
};

type QuoteLite = { status?: string };

const EMPTY: AdminAlerts = {
  newOrders: 0,
  pendingPOs: 0,
  openQuotes: 0,
  total: 0,
  loading: true
};

// Polls the orders + quotes APIs so admin sidebar badges stay live.
export function useAdminAlerts(): AdminAlerts {
  const [alerts, setAlerts] = useState<AdminAlerts>(EMPTY);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [ordersRes, quotesRes] = await Promise.all([
          fetch("/api/orders?limit=250&includeItems=false", { cache: "no-store" }),
          fetch("/api/quotes", { cache: "no-store" })
        ]);
        const ordersJson = ordersRes.ok
          ? ((await ordersRes.json()) as { orders?: OrderLite[] })
          : { orders: [] };
        const quotesJson = quotesRes.ok
          ? ((await quotesRes.json()) as { quotes?: QuoteLite[] })
          : { quotes: [] };

        const orders = ordersJson.orders || [];
        const quotes = quotesJson.quotes || [];

        const pendingPOs = orders.filter(
          (order) => Boolean(order.poNumber) && order.poStatus === "submitted"
        ).length;
        const newOrders = orders.filter(
          (order) =>
            !order.isQuoteRequest &&
            !order.poNumber &&
            order.status === "submitted"
        ).length;
        const openQuotes = quotes.filter((quote) => quote.status === "sent").length;

        if (!active) return;
        setAlerts({
          newOrders,
          pendingPOs,
          openQuotes,
          total: newOrders + pendingPOs + openQuotes,
          loading: false
        });
      } catch {
        if (active) setAlerts((current) => ({ ...current, loading: false }));
      }
    }

    void load();
    const handle = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(handle);
    };
  }, []);

  return alerts;
}

// Maps an admin nav href to its attention count. Works across all sites
// because it matches on the path suffix.
export function alertCountForHref(href: string, alerts: AdminAlerts): number {
  if (/\/admin\/orders$/.test(href)) return alerts.newOrders;
  if (/\/admin\/purchase-orders$/.test(href)) return alerts.pendingPOs;
  if (/\/admin\/quotes$/.test(href)) return alerts.openQuotes;
  if (/\/admin$/.test(href)) return alerts.total;
  return 0;
}
