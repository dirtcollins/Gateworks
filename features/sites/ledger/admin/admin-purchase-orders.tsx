"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Search } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { formatLedgerDate } from "@/features/sites/ledger/quote-helpers";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  StatTile,
  StatusPill
} from "./admin-kit";

/* The PO-status workflow for customer purchase orders (orders carrying a
 * poNumber). Mirrors the orders API `po_status` column. */
type PoStatus = "none" | "submitted" | "approved" | "rejected" | "fulfilled";

type PurchaseOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  companyName: string;
  email: string;
  total: number;
  poNumber: string;
  poStatus: PoStatus;
  createdAt: string;
};

type StatusFilter = "all" | PoStatus;

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "fulfilled", label: "Fulfilled" }
];

function poTone(status: PoStatus): "indigo" | "amber" | "mint" | "rose" | "neutral" {
  if (status === "submitted") return "amber";
  if (status === "approved") return "indigo";
  if (status === "fulfilled") return "mint";
  if (status === "rejected") return "rose";
  return "neutral";
}

/* Ledger admin — customer purchase-order approvals. Lists orders that
 * carry a poNumber and lets operations approve / reject / mark fulfilled
 * via PATCH /api/orders. */
export function LedgerAdminPurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [persisted, setPersisted] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/orders?limit=250&includeItems=false", {
        cache: "no-store"
      });
      if (!response.ok) {
        setPersisted(false);
        setLoaded(true);
        return;
      }
      const payload = (await response.json()) as {
        orders?: Array<{
          id: string;
          orderNumber: string;
          customerName: string;
          companyName: string;
          email: string;
          total: number;
          poNumber?: string;
          poStatus?: string;
          createdAt: string;
        }>;
        persisted?: boolean;
      };
      setPersisted(Boolean(payload.persisted));
      const pos = (payload.orders || [])
        .filter((order) => Boolean(order.poNumber))
        .map<PurchaseOrder>((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          companyName: order.companyName,
          email: order.email,
          total: order.total,
          poNumber: order.poNumber || "",
          poStatus: (order.poStatus as PoStatus) || "submitted",
          createdAt: order.createdAt
        }));
      setOrders(pos);
    } catch {
      setPersisted(false);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(handle);
  }, [message]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.poStatus !== filter) return false;
      if (!search) return true;
      return [
        order.poNumber,
        order.orderNumber,
        order.customerName,
        order.companyName
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [orders, filter, query]);

  const summary = useMemo(() => {
    const pending = orders.filter(
      (order) => order.poStatus === "submitted"
    ).length;
    const approvedValue = orders
      .filter(
        (order) =>
          order.poStatus === "approved" || order.poStatus === "fulfilled"
      )
      .reduce((sum, order) => sum + order.total, 0);
    return { pending, approvedValue, total: orders.length };
  }, [orders]);

  async function updatePoStatus(order: PurchaseOrder, next: PoStatus) {
    if (busyId) return;
    setBusyId(order.id);
    setOrders((current) =>
      current.map((entry) =>
        entry.id === order.id ? { ...entry, poStatus: next } : entry
      )
    );
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          poStatus: next,
          ...(next === "approved" ? { status: "confirmed" } : {}),
          ...(next === "fulfilled" ? { status: "completed" } : {}),
          ...(next === "rejected" ? { status: "cancelled" } : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { persisted?: boolean }
        | null;
      if (!response.ok || !payload?.persisted) {
        setMessage("PO status update was not persisted.");
        await load();
      } else {
        setMessage(`PO ${order.poNumber} marked ${next}.`);
      }
    } catch {
      setMessage("Could not reach the order service.");
      await load();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Customer purchase orders"
        description="Customer-submitted purchase orders awaiting approval. Approve, reject, or mark POs fulfilled."
      />

      {loaded && !persisted ? (
        <div
          className="rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          Orders are not persisted — the order database is not configured.
        </div>
      ) : null}
      {message ? (
        <div
          className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
        >
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Awaiting approval"
          value={String(summary.pending)}
          sub="Submitted POs"
          accent={summary.pending > 0 ? LEDGER.amber : LEDGER.ink}
        />
        <StatTile
          label="Approved value"
          value={formatUsd0(summary.approvedValue)}
          sub="Approved or fulfilled"
        />
        <StatTile
          label="Total POs"
          value={String(summary.total)}
          sub="All customer POs"
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
              aria-label="Search purchase orders"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-56"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PO #, order, or customer"
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
            Loading purchase orders…
          </p>
        ) : visible.length === 0 ? (
          <AdminEmpty
            icon={<ClipboardCheck className="h-9 w-9" />}
            title="No customer purchase orders"
            description="Customer POs submitted at checkout appear here for approval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: LEDGER.muted,
                    borderBottom: `1px solid ${LEDGER.line}`
                  }}
                >
                  <th className="px-5 py-3">PO number</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
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
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {order.poNumber}
                      </p>
                      <p
                        className="text-[11px] font-medium"
                        style={{ color: LEDGER.muted }}
                      >
                        {formatLedgerDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        className="text-[13px] font-semibold transition hover:underline"
                        href={`/ledger/admin/orders/${order.id}`}
                        style={{ color: LEDGER.indigo }}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {order.companyName || order.customerName || "—"}
                      </p>
                      <p
                        className="text-[12px]"
                        style={{ color: LEDGER.body }}
                      >
                        {order.email || "—"}
                      </p>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={poTone(order.poStatus)}>
                        {order.poStatus.charAt(0).toUpperCase() +
                          order.poStatus.slice(1)}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.poStatus === "submitted" ? (
                          <>
                            <button
                              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50"
                              disabled={busyId === order.id}
                              onClick={() =>
                                updatePoStatus(order, "approved")
                              }
                              style={{
                                backgroundColor: LEDGER.indigoSoft,
                                color: LEDGER.indigo
                              }}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50"
                              disabled={busyId === order.id}
                              onClick={() =>
                                updatePoStatus(order, "rejected")
                              }
                              style={{
                                backgroundColor: LEDGER.roseSoft,
                                color: LEDGER.rose
                              }}
                              type="button"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        {order.poStatus === "approved" ? (
                          <button
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => updatePoStatus(order, "fulfilled")}
                            style={{
                              backgroundColor: LEDGER.mintSoft,
                              color: LEDGER.mint
                            }}
                            type="button"
                          >
                            Mark fulfilled
                          </button>
                        ) : null}
                        {order.poStatus === "rejected" ||
                        order.poStatus === "fulfilled" ? (
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: LEDGER.muted }}
                          >
                            No actions
                          </span>
                        ) : null}
                      </div>
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
