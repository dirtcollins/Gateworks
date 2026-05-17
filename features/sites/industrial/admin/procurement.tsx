"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, PackagePlus, Search, Trash2, Warehouse } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
import {
  deleteProcurementOrder,
  fetchProcurementOrders,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementStatus
} from "@/lib/quotes-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin procurement (supplier purchase orders).
 * Lists supplier POs from `/api/procurement`, creates a new draft PO,
 * and links into the detail view for editing / receiving.
 * ------------------------------------------------------------------ */

type ProcurementTab = "all" | "draft" | "sent" | "partial" | "received" | "closed";

const TABS: Array<{ id: ProcurementTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "partial", label: "Partial" },
  { id: "received", label: "Received" },
  { id: "closed", label: "Closed" }
];

const STATUS_TONE: Record<
  ProcurementStatus,
  "neutral" | "amber" | "pine" | "ink"
> = {
  draft: "amber",
  sent: "neutral",
  partial: "amber",
  received: "pine",
  closed: "ink"
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function IndustrialAdminProcurement() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [tab, setTab] = useState<ProcurementTab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function reload() {
    const result = await fetchProcurementOrders();
    setOrders(result.orders);
    setConfigured(result.configured);
    setReady(true);
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== "all" && order.status !== tab) return false;
      if (!term) return true;
      return [order.poNumber, order.supplierName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [orders, tab, query]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? orders.length
        : orders.filter((order) => order.status === entry.id).length
  }));

  const stats = [
    { label: "Supplier POs", value: String(orders.length) },
    {
      label: "Open POs",
      value: String(
        orders.filter(
          (order) => order.status !== "received" && order.status !== "closed"
        ).length
      )
    },
    {
      label: "Awaiting receipt",
      value: String(
        orders.filter(
          (order) => order.status === "sent" || order.status === "partial"
        ).length
      )
    },
    {
      label: "PO value",
      value: formatUsd(orders.reduce((sum, order) => sum + order.total, 0))
    }
  ];

  async function handleNewPo() {
    if (busy) return;
    setBusy(true);
    try {
      const { order, persisted } = await saveProcurementOrder({
        supplierName: "New supplier",
        status: "draft",
        items: []
      });
      if (persisted && order?.id) {
        router.push(`/industrial/admin/procurement/${order.id}`);
        return;
      }
      setMessage("Supabase / procurement tables are not configured — PO not created.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    const { persisted } = await deleteProcurementOrder(id);
    if (persisted) {
      setOrders((current) => current.filter((order) => order.id !== id));
    }
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Supply chain"
        title="Procurement"
        description="Supplier purchase orders — create, send, and receive inbound material."
        action={
          <button
            className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy}
            onClick={handleNewPo}
            type="button"
          >
            <PackagePlus className="h-4 w-4" /> New PO
          </button>
        }
      />

      {!configured ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          Procurement is not yet persisted — Supabase / the procurement tables
          are not configured.
        </p>
      ) : null}
      {message ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          {message}
        </p>
      ) : null}

      <AdminStatGrid stats={stats} />

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
          <Search className="h-4 w-4 text-d1-steel" />
          <input
            aria-label="Search purchase orders"
            className="h-9 w-56 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search PO or supplier"
            value={query}
          />
        </div>
      </section>

      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">PO</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.map((order) => {
                const orderedUnits = order.items.reduce(
                  (sum, item) => sum + item.quantityOrdered,
                  0
                );
                const receivedUnits = order.items.reduce(
                  (sum, item) => sum + item.quantityReceived,
                  0
                );
                return (
                  <tr className="transition hover:bg-d1-paper" key={order.id}>
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-extrabold text-d1-ink">
                        {order.poNumber || "Draft PO"}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-d1-ink">
                      {order.supplierName || "Unassigned"}
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminPill tone={STATUS_TONE[order.status]}>
                        {order.status}
                      </AdminPill>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                      {receivedUnits}/{orderedUnits}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          className="inline-flex items-center gap-1 bg-d1-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-paper transition hover:bg-d1-pine"
                          href={`/industrial/admin/procurement/${order.id}`}
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          aria-label={`Delete ${order.poNumber}`}
                          className="grid h-8 w-8 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                          onClick={() => handleDelete(order.id)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          icon={<Warehouse className="h-9 w-9" />}
          title={ready ? "No purchase orders in this view" : "Loading purchase orders…"}
          description={
            ready ? "Create a supplier PO or adjust the filters." : undefined
          }
        />
      )}
    </div>
  );
}
