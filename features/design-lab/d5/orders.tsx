"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Search } from "lucide-react";
import { Beacon, Chip, FO, Panel, Shell, Stamp } from "./kit";
import { money } from "./data";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";

/* Display buckets mapped from the real OrderStatus enum. */
type Bucket = "Queued" | "Picking" | "Ready" | "Closed";

const STATUS_BUCKET: Record<OrderRecord["status"], Bucket> = {
  draft: "Queued",
  submitted: "Queued",
  confirmed: "Picking",
  picking: "Picking",
  ready_for_pickup: "Ready",
  out_for_delivery: "Ready",
  completed: "Closed",
  cancelled: "Closed"
};

const BUCKET_TONE: Record<Bucket, "hi" | "warn" | "go" | "steel"> = {
  Queued: "warn",
  Picking: "hi",
  Ready: "go",
  Closed: "steel"
};

const TABS: ("All" | Bucket)[] = ["All", "Queued", "Picking", "Ready", "Closed"];

function timeAgo(iso: string): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return "—";
  const minutes = Math.round((Date.now() - created) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function unitCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export default function D5Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        order,
        ref: order.orderNumber,
        customer: order.companyName || order.customerName || "Walk-in customer",
        account: order.companyName ? "Trade" : "Retail",
        units: unitCount(order),
        total: order.total,
        channel: order.fulfillmentMethod === "delivery" ? "Delivery" : "Will-call",
        placed: timeAgo(order.createdAt),
        bucket: STATUS_BUCKET[order.status] ?? "Queued"
      })),
    [orders]
  );

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const matchesTab = tab === "All" || row.bucket === tab;
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          row.customer.toLowerCase().includes(q) ||
          row.ref.toLowerCase().includes(q);
        return matchesTab && matchesQuery;
      }),
    [rows, tab, query]
  );

  const stats = useMemo(() => {
    const open = rows.filter((row) => row.bucket !== "Closed").length;
    const ready = rows.filter((row) => row.bucket === "Ready").length;
    const picking = rows.filter((row) => row.bucket === "Picking").length;
    return [
      { label: "Open orders", value: open },
      { label: "On the bench", value: picking },
      { label: "Ready for pickup", value: ready },
      { label: "Total tracked", value: rows.length }
    ];
  }, [rows]);

  return (
    <Shell crumb="Ops / order desk" wide>
      <header
        className="flex flex-wrap items-end justify-between gap-4 p-6"
        style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
      >
        <div>
          <Stamp>Operations</Stamp>
          <h1
            className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl"
            style={{ color: FO.ink }}
          >
            Order desk
          </h1>
        </div>
        <Link
          href="/design-lab/d5/reports"
          className="flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em]"
          style={{ background: FO.panelHi, color: FO.ink, border: `2px solid ${FO.line}` }}
        >
          Reports <ArrowRight size={14} strokeWidth={2.75} />
        </Link>
      </header>

      {/* Stats */}
      <section
        className="mt-6 grid gap-px sm:grid-cols-2 lg:grid-cols-4"
        style={{ background: FO.line, border: `2px solid ${FO.line}` }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="p-5" style={{ background: FO.panel }}>
            <p
              className="text-[10px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.faint }}
            >
              {stat.label}
            </p>
            <p className="mt-1.5 text-4xl font-black" style={{ color: FO.hi }}>
              {isLoading ? "—" : stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-px" style={{ background: FO.line }}>
          {TABS.map((option) => {
            const active = tab === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className="px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em]"
                style={{
                  background: active ? FO.hi : FO.panel,
                  color: active ? FO.black : FO.dim
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
        <div
          className="ml-auto flex items-center gap-2.5 px-3.5"
          style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
        >
          <Search size={15} strokeWidth={2.75} style={{ color: FO.faint }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order or customer"
            className="h-11 w-52 bg-transparent text-[12px] font-bold outline-none placeholder:font-bold"
            style={{ color: FO.ink }}
          />
        </div>
      </section>

      {/* Order list */}
      <Panel
        className="mt-6"
        title="Live queue"
        kicker={`// ${visible.length} shown`}
        right={
          <span
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color: FO.go }}
          >
            <Beacon tone="go" /> Live
          </span>
        }
      >
        {/* desktop header */}
        <div
          className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr_0.9fr] gap-3 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] lg:grid"
          style={{ color: FO.faint, borderBottom: `2px solid ${FO.line}` }}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Channel</span>
          <span className="text-center">Units</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
        </div>

        {isLoading ? (
          <p
            className="px-4 py-16 text-center text-[12px] font-black uppercase tracking-[0.14em]"
            style={{ color: FO.dim }}
          >
            Loading live orders…
          </p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <span
              className="grid h-14 w-14 place-items-center"
              style={{ background: FO.hiSoft, color: FO.hi }}
            >
              <ClipboardList size={26} strokeWidth={2.25} />
            </span>
            <p
              className="text-[13px] font-black uppercase tracking-[0.1em]"
              style={{ color: FO.ink }}
            >
              No orders match this view
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-px" style={{ background: FO.line }}>
            {visible.map((row) => (
              <div
                key={row.order.id}
                className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr_0.9fr] lg:items-center lg:py-3"
                style={{ background: FO.panel }}
              >
                <div>
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.16em] lg:hidden"
                    style={{ color: FO.faint }}
                  >
                    Order
                  </span>
                  <p className="text-[14px] font-black" style={{ color: FO.ink }}>
                    {row.ref}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: FO.faint }}
                  >
                    {row.placed}
                  </p>
                </div>
                <div className="min-w-0">
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.16em] lg:hidden"
                    style={{ color: FO.faint }}
                  >
                    Customer
                  </span>
                  <p
                    className="truncate text-[13px] font-black uppercase"
                    style={{ color: FO.ink }}
                  >
                    {row.customer}
                  </p>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: FO.faint }}
                  >
                    {row.account}
                  </p>
                </div>
                <div>
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.16em] lg:hidden"
                    style={{ color: FO.faint }}
                  >
                    Channel
                  </span>
                  <p
                    className="text-[12px] font-black uppercase"
                    style={{ color: FO.dim }}
                  >
                    {row.channel}
                  </p>
                </div>
                <div className="lg:text-center">
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.16em] lg:hidden"
                    style={{ color: FO.faint }}
                  >
                    Units
                  </span>
                  <p className="text-[14px] font-black" style={{ color: FO.ink }}>
                    {row.units}
                  </p>
                </div>
                <div className="lg:text-right">
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.16em] lg:hidden"
                    style={{ color: FO.faint }}
                  >
                    Total
                  </span>
                  <p className="text-[15px] font-black" style={{ color: FO.hi }}>
                    {money(row.total)}
                  </p>
                </div>
                <div className="flex lg:justify-end">
                  <Chip tone={BUCKET_TONE[row.bucket]}>{row.bucket}</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {!isLoading ? (
        <p
          className="mt-3 text-[10px] font-black uppercase tracking-[0.14em]"
          style={{ color: FO.faint }}
        >
          Showing {visible.length} of {rows.length} orders · Live will-call queue
        </p>
      ) : null}
    </Shell>
  );
}
