"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, PackagePlus, Search, Truck } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { formatLedgerDate } from "@/features/sites/ledger/quote-helpers";
import {
  fetchProcurementOrders,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementStatus
} from "@/lib/quotes-data";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill,
  titleCase
} from "./admin-kit";

type StatusFilter = "all" | ProcurementStatus;

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "partial", label: "Partial" },
  { id: "received", label: "Received" },
  { id: "closed", label: "Closed" }
];

function procurementTone(
  status: ProcurementStatus
): "indigo" | "amber" | "mint" | "neutral" {
  if (status === "draft") return "amber";
  if (status === "sent") return "indigo";
  if (status === "partial") return "amber";
  if (status === "closed") return "neutral";
  return "mint";
}

/* Ledger admin procurement — supplier purchase orders backed by the
 * procurement_orders resource. List, filter, search, and create. */
export function LedgerAdminProcurement() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchProcurementOrders();
    setOrders(result.orders);
    setConfigured(result.configured);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!search) return true;
      return [order.poNumber, order.supplierName, order.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [orders, filter, query]);

  const summary = useMemo(() => {
    const open = orders.filter(
      (order) => order.status !== "closed" && order.status !== "received"
    ).length;
    const value = orders.reduce((sum, order) => sum + order.total, 0);
    const onOrder = orders
      .filter((order) => order.status === "sent" || order.status === "partial")
      .reduce((sum, order) => sum + order.total, 0);
    return { open, value, onOrder };
  }, [orders]);

  async function handleNewOrder() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveProcurementOrder({
        supplierName: "New supplier",
        status: "draft",
        notes: "",
        items: []
      });
      if (result.order) {
        router.push(`/ledger/admin/procurement/${result.order.id}`);
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Procurement"
        description="Supplier purchase orders — order stock from vendors, send POs, and receive inbound material."
        action={
          <AdminPrimaryButton disabled={busy} onClick={handleNewOrder}>
            <PackagePlus className="h-4 w-4" /> New supplier PO
          </AdminPrimaryButton>
        }
      />

      {loaded && !configured ? (
        <div
          className="rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          The procurement database is not configured. Supplier POs are not yet
          persisted.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Open POs"
          value={String(summary.open)}
          sub="Not yet received"
        />
        <StatTile
          label="On order"
          value={formatUsd0(summary.onOrder)}
          sub="Sent or partial"
        />
        <StatTile
          label="Total PO value"
          value={formatUsd0(summary.value)}
          sub="All supplier POs"
        />
      </section>

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setFilter(option.id)}
                  style={{
                    backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                    color: active ? "#ffffff" : LEDGER.body
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ border: `1px solid ${LEDGER.line}` }}
          >
            <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
            <input
              aria-label="Search supplier POs"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-56"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PO # or supplier"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        {!loaded ? (
          <p
            className="px-5 py-14 text-center text-sm font-medium"
            style={{ color: LEDGER.muted }}
          >
            Loading supplier POs…
          </p>
        ) : visible.length === 0 ? (
          <AdminEmpty
            icon={<Truck className="h-9 w-9" />}
            title="No supplier POs in this view"
            description="Create a supplier purchase order to start ordering stock."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: LEDGER.muted,
                    borderBottom: `1px solid ${LEDGER.line}`
                  }}
                >
                  <th className="px-5 py-3">PO</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Expected</th>
                  <th className="px-5 py-3 text-right">Lines</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      borderTop:
                        index === 0 ? "none" : `1px solid ${LEDGER.line}`
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        className="text-[13px] font-semibold transition hover:underline"
                        href={`/ledger/admin/procurement/${order.id}`}
                        style={{ color: LEDGER.indigo }}
                      >
                        {order.poNumber || "Draft PO"}
                      </Link>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.supplierName || "Unassigned"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {order.expectedAt
                        ? formatLedgerDate(order.expectedAt)
                        : "—"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.items.length}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={procurementTone(order.status)}>
                        {titleCase(order.status)}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                        href={`/ledger/admin/procurement/${order.id}`}
                        style={{
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.ink
                        }}
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
