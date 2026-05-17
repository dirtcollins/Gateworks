"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin customer purchase-order approvals. Lists
 * orders that carry a `poNumber` / `poStatus`, and lets an admin
 * approve, reject, or mark fulfilled via PATCH /api/orders.
 * ------------------------------------------------------------------ */

type PoStatus = "none" | "submitted" | "approved" | "rejected" | "fulfilled";

type PoOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  companyName: string;
  email: string;
  total: number;
  status: string;
  poNumber: string;
  poStatus: PoStatus;
  createdAt: string;
};

type PoTab = "all" | "submitted" | "approved" | "rejected" | "fulfilled";

const TABS: Array<{ id: PoTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "fulfilled", label: "Fulfilled" }
];

const PO_TONE: Record<PoStatus, "neutral" | "amber" | "pine" | "red" | "ink"> = {
  none: "neutral",
  submitted: "amber",
  approved: "pine",
  rejected: "red",
  fulfilled: "ink"
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type OrdersResponse = {
  orders?: Array<Record<string, unknown>>;
  persisted?: boolean;
};

export function IndustrialAdminPurchaseOrders() {
  const [orders, setOrders] = useState<PoOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [tab, setTab] = useState<PoTab>("submitted");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    try {
      const response = await fetch("/api/orders?limit=250&includeItems=false", {
        cache: "no-store"
      });
      if (!response.ok) {
        setConfigured(false);
        return;
      }
      const payload = (await response.json()) as OrdersResponse;
      setConfigured(Boolean(payload.persisted));
      const poOrders = (payload.orders || [])
        .map((raw) => ({
          id: String(raw.id || ""),
          orderNumber: String(raw.orderNumber || ""),
          customerName: String(raw.customerName || ""),
          companyName: String(raw.companyName || ""),
          email: String(raw.email || ""),
          total: Number(raw.total || 0),
          status: String(raw.status || ""),
          poNumber: String(raw.poNumber || ""),
          poStatus: (String(raw.poStatus || "none") as PoStatus),
          createdAt: String(raw.createdAt || "")
        }))
        .filter((order) => order.poNumber && order.poStatus !== "none");
      setOrders(poOrders);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const filtered = useMemo(
    () =>
      orders.filter((order) => tab === "all" || order.poStatus === tab),
    [orders, tab]
  );

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? orders.length
        : orders.filter((order) => order.poStatus === entry.id).length
  }));

  const stats = [
    { label: "Customer POs", value: String(orders.length) },
    {
      label: "Awaiting approval",
      value: String(
        orders.filter((order) => order.poStatus === "submitted").length
      )
    },
    {
      label: "Approved",
      value: String(
        orders.filter((order) => order.poStatus === "approved").length
      )
    },
    {
      label: "PO value",
      value: formatUsd(orders.reduce((sum, order) => sum + order.total, 0))
    }
  ];

  async function updatePoStatus(order: PoOrder, poStatus: PoStatus) {
    if (busyId) return;
    setBusyId(order.id);
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          poStatus,
          // Reflect approval in the order status so the warehouse can act.
          ...(poStatus === "approved" ? { status: "confirmed" } : {}),
          ...(poStatus === "fulfilled" ? { status: "completed" } : {}),
          ...(poStatus === "rejected" ? { status: "cancelled" } : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | { persisted?: boolean; reason?: string }
        | null;
      if (!response.ok || !payload?.persisted) {
        setMessage(payload?.reason || "Could not update the purchase order.");
        return;
      }
      setOrders((current) =>
        current.map((entry) =>
          entry.id === order.id ? { ...entry, poStatus } : entry
        )
      );
      setMessage(`PO ${order.poNumber} marked ${poStatus}.`);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Operations console"
        title="Customer purchase orders"
        description="Review net-terms orders placed against a customer PO — approve, reject, or mark fulfilled."
      />

      {!configured ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          Orders are not yet persisted — Supabase is not configured.
        </p>
      ) : null}
      {message ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          {message}
        </p>
      ) : null}

      <AdminStatGrid stats={stats} />

      <section className="border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
      </section>

      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">PO / Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">PO status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.map((order) => (
                <tr className="transition hover:bg-d1-paper" key={order.id}>
                  <td className="px-4 py-3.5">
                    <span className="block text-sm font-extrabold text-d1-ink">
                      {order.poNumber}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                      {order.orderNumber} ·{" "}
                      {order.createdAt
                        ? dateFormatter.format(new Date(order.createdAt))
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block text-sm font-bold text-d1-ink">
                      {order.companyName || order.customerName || "Walk-in"}
                    </span>
                    <span className="text-[11px] text-d1-steel">
                      {order.email}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminPill tone={PO_TONE[order.poStatus]}>
                      {order.poStatus}
                    </AdminPill>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                    {formatUsd(order.total)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {order.poStatus === "submitted" ? (
                        <>
                          <button
                            className="border border-d1-pine bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-pine transition hover:bg-d1-pine hover:text-d1-paper disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => updatePoStatus(order, "approved")}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="border border-d1-red bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-red transition hover:bg-d1-red hover:text-d1-paper disabled:opacity-50"
                            disabled={busyId === order.id}
                            onClick={() => updatePoStatus(order, "rejected")}
                            type="button"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {order.poStatus === "approved" ? (
                        <button
                          className="border border-d1-ink bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:opacity-50"
                          disabled={busyId === order.id}
                          onClick={() => updatePoStatus(order, "fulfilled")}
                          type="button"
                        >
                          Mark fulfilled
                        </button>
                      ) : null}
                      <Link
                        className="bg-d1-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-paper transition hover:bg-d1-pine"
                        href={`/industrial/admin/orders/${order.id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          icon={<ClipboardList className="h-9 w-9" />}
          title={loaded ? "No customer purchase orders" : "Loading purchase orders…"}
          description={
            loaded
              ? "Orders placed at checkout with a PO number appear here."
              : undefined
          }
        />
      )}
    </div>
  );
}
