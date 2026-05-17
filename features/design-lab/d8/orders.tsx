"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Search } from "lucide-react";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  usd
} from "./kit";

type Stage = "Drafted" | "In build" | "Staged" | "Closed";

function toStage(status: OrderRecord["status"]): Stage {
  if (status === "completed") return "Closed";
  if (status === "ready_for_pickup" || status === "out_for_delivery")
    return "Staged";
  if (status === "confirmed" || status === "picking") return "In build";
  return "Drafted";
}

const STAGE_COLOR: Record<Stage, string> = {
  Drafted: ink.chalkFaint,
  "In build": ink.cyan,
  Staged: ink.amber,
  Closed: ink.cyanDeep
};

const TABS: Array<"All" | Stage> = [
  "All",
  "Drafted",
  "In build",
  "Staged",
  "Closed"
];

function shortDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "2-digit"
  }).format(date);
}

export function D8Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<"All" | Stage>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.companyName || order.customerName || "Unassigned",
        job: order.jobName || "Untitled build",
        units: order.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        ),
        lines: order.items.length,
        total: order.total,
        stage: toStage(order.status),
        channel: order.isQuoteRequest
          ? "Quote"
          : order.fulfillmentMethod === "pickup"
            ? "Pickup"
            : "Delivery",
        placed: order.createdAt
      })),
    [orders]
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesTab = tab === "All" || row.stage === tab;
        const needle = query.toLowerCase();
        const matchesQuery =
          row.customer.toLowerCase().includes(needle) ||
          row.orderNumber.toLowerCase().includes(needle) ||
          row.job.toLowerCase().includes(needle);
        return matchesTab && matchesQuery;
      }),
    [rows, tab, query]
  );

  const totals = useMemo(() => {
    const revenue = rows.reduce((sum, row) => sum + row.total, 0);
    const units = rows.reduce((sum, row) => sum + row.units, 0);
    return {
      open: rows.filter((row) => row.stage !== "Closed").length,
      revenue,
      units,
      avg: rows.length ? revenue / rows.length : 0
    };
  }, [rows]);

  return (
    <D8Shell active="orders">
      {/* Header */}
      <section
        className="border-b"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto max-w-6xl px-5 py-9">
          <DraftingMark label="Register — issued builds" />
          <h1
            className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: ink.chalk }}
          >
            Build Log
          </h1>
          <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
            Every bill of materials issued to the floor, tracked stage by stage.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Stat strip */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Open builds", value: String(totals.open) },
            {
              label: "Logged revenue",
              value: usd(totals.revenue, false)
            },
            { label: "Units issued", value: String(totals.units) },
            { label: "Avg BOM value", value: usd(totals.avg, false) }
          ].map((stat) => (
            <BlueprintCard key={stat.label}>
              <div className="px-4 py-4">
                <p
                  className={`${mono} text-[10px] uppercase tracking-[0.22em]`}
                  style={{ color: ink.chalkFaint }}
                >
                  {stat.label}
                </p>
                <p
                  className={`${mono} mt-1.5 text-2xl font-semibold`}
                  style={{ color: ink.cyan }}
                >
                  {stat.value}
                </p>
              </div>
            </BlueprintCard>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((option) => {
              const count =
                option === "All"
                  ? rows.length
                  : rows.filter((row) => row.stage === option).length;
              const isActive = tab === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTab(option)}
                  className={`${mono} rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition`}
                  style={{
                    borderColor: isActive ? ink.cyan : ink.line,
                    color: isActive ? ink.cyan : ink.chalkDim,
                    backgroundColor: isActive ? ink.panel : "transparent"
                  }}
                >
                  {option}{" "}
                  <span style={{ color: ink.chalkFaint }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div
            className="ml-auto flex items-center gap-2 rounded-sm border px-3 py-1.5"
            style={{ borderColor: ink.line }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: ink.chalkFaint }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search build / customer"
              className={`${mono} w-44 bg-transparent text-[12px] outline-none`}
              style={{ color: ink.chalk }}
            />
          </div>
        </div>

        {/* Register */}
        <BlueprintCard className="mt-4 overflow-hidden">
          {isLoading ? (
            <div className="grid place-items-center px-5 py-20 text-center">
              <p
                className={`${mono} text-sm uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkFaint }}
              >
                Reading build register…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center px-5 py-20 text-center">
              <span
                className="grid h-14 w-14 place-items-center rounded-sm border"
                style={{ borderColor: ink.cyanDeep, color: ink.cyan }}
              >
                <ClipboardList className="h-6 w-6" />
              </span>
              <p
                className="mt-4 text-sm font-semibold"
                style={{ color: ink.chalk }}
              >
                No builds on this sheet
              </p>
              <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
                Issued bills of materials will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr
                    className="border-b text-left"
                    style={{ borderColor: ink.lineSoft }}
                  >
                    {[
                      "Doc",
                      "Build",
                      "Customer",
                      "Lines",
                      "Units",
                      "Value",
                      "Stage"
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`${mono} px-4 py-2.5 text-[10px] uppercase tracking-[0.18em]`}
                        style={{ color: ink.chalkFaint }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b transition last:border-0"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <td className="px-4 py-3.5">
                        <p
                          className={`${mono} text-sm font-semibold`}
                          style={{ color: ink.chalk }}
                        >
                          {row.orderNumber}
                        </p>
                        <p
                          className={`${mono} text-[10px] uppercase tracking-[0.12em]`}
                          style={{ color: ink.chalkFaint }}
                        >
                          {shortDate(row.placed)} · {row.channel}
                        </p>
                      </td>
                      <td
                        className="px-4 py-3.5 text-sm"
                        style={{ color: ink.chalkDim }}
                      >
                        {row.job}
                      </td>
                      <td
                        className="px-4 py-3.5 text-sm"
                        style={{ color: ink.chalk }}
                      >
                        {row.customer}
                      </td>
                      <td
                        className={`${mono} px-4 py-3.5 text-sm`}
                        style={{ color: ink.chalkDim }}
                      >
                        {row.lines}
                      </td>
                      <td
                        className={`${mono} px-4 py-3.5 text-sm`}
                        style={{ color: ink.chalkDim }}
                      >
                        {row.units}
                      </td>
                      <td
                        className={`${mono} px-4 py-3.5 text-sm font-semibold`}
                        style={{ color: ink.cyan }}
                      >
                        {usd(row.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`${mono} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em]`}
                          style={{ color: STAGE_COLOR[row.stage] }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: STAGE_COLOR[row.stage]
                            }}
                          />
                          {row.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </BlueprintCard>

        <div className="mt-4 flex items-center justify-between">
          <Dimension
            value={`${filtered.length} / ${rows.length}`}
            hint="builds shown"
          />
          <Link
            href="/design-lab/d8/reports"
            className={`${mono} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]`}
            style={{ color: ink.cyan }}
          >
            Yield report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </D8Shell>
  );
}
