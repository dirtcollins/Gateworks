import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Admin reports. Real Supabase report data. */

const ranges = ["30 days"];
const agingTones = ["steel", "rust", "ink"] as const;

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function Delta({ value }: { value: number }) {
  const flat = value === 0;
  const up = value > 0;
  const color = flat ? d3.haze : up ? "#2f6f4e" : "#b42318";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.74rem] font-semibold"
      style={{ color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function D3Reports({ data }: { data: ReportData }) {
  const headline = [
    { k: "Revenue", v: formatCurrency(data.revenue30), n: "Trailing 30 days" },
    { k: "Orders", v: String(data.orders30), n: "Trailing 30 days" },
    { k: "Avg. order", v: formatCurrency(data.avgOrderValue), n: "Across all channels" },
    {
      k: "Gross margin",
      v: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data",
      n: data.hasCostData ? "From entered costs" : "Add product costs"
    }
  ];

  const collectedShare = data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const paymentPeak = Math.max(1, ...data.paymentBreakdown.map((row) => row.total));

  return (
    <D3Shell active="Reports" variant="admin">
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>The Studio — Editorial Review</Eyebrow>
            <h1
              className={`${serif} mt-3 text-[2.6rem] font-semibold leading-none tracking-[-0.02em] sm:text-[3.4rem]`}
            >
              The month in figures
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: d3.graphite }}>
              A standing column on how the catalog is performing — revenue,
              receivables, and the orders earning their cover spot.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ranges.map((r) => (
              <span
                key={r}
                className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-white"
                style={{ background: d3.ink }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {!data.configured ? (
          <div
            className="mt-7 border p-6"
            style={{ borderColor: d3.brass, background: d3.card }}
          >
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d3.brass }}
            >
              Press note
            </span>
            <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
              This issue is awaiting figures.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: d3.graphite }}>
              Supabase is not configured, so live financial data is unavailable.
              Add the Supabase keys to <code>.env.local</code> to populate this
              report.
            </p>
          </div>
        ) : null}

        {/* headline figures */}
        <div
          className="mt-9 grid grid-cols-2 divide-y border lg:grid-cols-4 lg:divide-x lg:divide-y-0"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          {headline.map((h) => (
            <div key={h.k} className="p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: d3.haze }}>
                {h.k}
              </p>
              <p className={`${serif} mt-2 text-4xl font-semibold`}>{h.v}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[0.7rem]" style={{ color: d3.haze }}>
                  {h.n}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* receivables + payment mix — editorial feature */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* accounts receivable */}
          <div
            className="border p-7 sm:p-9"
            style={{ borderColor: d3.rule, background: d3.card }}
          >
            <div className="flex items-end justify-between">
              <div>
                <Eyebrow>Figure 1</Eyebrow>
                <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
                  Accounts receivable
                </h2>
              </div>
              <span className="text-[0.72rem] uppercase tracking-[0.14em]" style={{ color: d3.haze }}>
                Billed vs. collected
              </span>
            </div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Total billed", data.billed, d3.ink],
                ["Collected", data.collected, d3.ink],
                ["Outstanding", data.outstanding, "#b42318"]
              ].map(([k, v, color]) => (
                <div key={k as string}>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em]" style={{ color: d3.haze }}>
                    {k}
                  </p>
                  <p
                    className={`${serif} mt-1 text-3xl font-semibold`}
                    style={{ color: color as string }}
                  >
                    {formatCurrency(v as number)}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-7">
              <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em]" style={{ color: d3.haze }}>
                <span>Collected share</span>
                <span>{collectedShare.toFixed(0)}%</span>
              </div>
              <div
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: d3.rule }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, collectedShare)}%`,
                    background: `linear-gradient(90deg,${d3.brass},${d3.brassDeep})`
                  }}
                />
              </div>
            </div>

            {/* outstanding by age */}
            <div className="mt-9 flex items-end gap-3 sm:gap-5" style={{ height: 180 }}>
              {data.aging.map((bucket, i) => {
                const peak = Math.max(1, ...data.aging.map((b) => b.total));
                return (
                  <div key={bucket.bucket} className="flex flex-1 flex-col items-center gap-3">
                    <span className={`${serif} text-sm font-semibold`}>
                      {formatCurrency(bucket.total)}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full"
                        style={{ height: `${Math.max(2, (bucket.total / peak) * 100)}%` }}
                      >
                        <MaterialBlock
                          tone={agingTones[i % agingTones.length]}
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                    <span
                      className="text-[0.7rem] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: d3.haze }}
                    >
                      {bucket.bucket} days
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className="mt-7 border-t pt-5 text-sm leading-relaxed"
              style={{ borderColor: d3.rule, color: d3.graphite }}
            >
              <span className="font-semibold" style={{ color: d3.ink }}>
                {formatCurrency(data.outstanding)} outstanding
              </span>{" "}
              across {data.recentOrders.length} recent orders — the aging
              columns above show where collection effort should focus.
            </p>
          </div>

          {/* payment mix */}
          <div
            className="border p-7"
            style={{ borderColor: d3.rule, background: d3.card }}
          >
            <Eyebrow>Figure 2</Eyebrow>
            <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
              Payment status
            </h2>
            {data.paymentBreakdown.length ? (
              <ul className="mt-6 space-y-5">
                {data.paymentBreakdown.map((row) => (
                  <li key={row.status}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {titleCase(row.status)}
                        </span>
                        <span className="text-[0.7rem]" style={{ color: d3.haze }}>
                          {row.count} {row.count === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <span className={`${serif} text-base font-semibold`}>
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 w-full overflow-hidden rounded-full"
                      style={{ background: d3.rule }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.total / paymentPeak) * 100}%`,
                          background: d3.ink
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm" style={{ color: d3.haze }}>
                No orders in range.
              </p>
            )}

            <p
              className="mt-7 border-t pt-5 text-[0.78rem] leading-relaxed"
              style={{ borderColor: d3.rule, color: d3.graphite }}
            >
              {data.hasCostData ? (
                <>
                  Gross profit across recent orders:{" "}
                  <span className="font-semibold" style={{ color: d3.ink }}>
                    {formatCurrency(data.grossProfit)}
                  </span>
                  .
                </>
              ) : (
                <>
                  Gross margin stays hidden until product costs are entered in
                  the catalog manager.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* recent orders — editorial list */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div
          className="border p-7 sm:p-9"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Figure 3</Eyebrow>
              <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
                Recent orders
              </h2>
            </div>
            <Link
              href="/design-lab/d3/orders"
              className="hidden text-[0.76rem] font-semibold uppercase tracking-[0.14em] underline underline-offset-[6px] sm:inline"
            >
              Open orders desk
            </Link>
          </div>

          {data.recentOrders.length ? (
            <ul className="mt-6">
              {data.recentOrders.map((order, i) => (
                <li
                  key={order.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-5 border-t py-5 sm:grid-cols-[auto_1fr_auto_auto_auto]"
                  style={{ borderColor: d3.rule }}
                >
                  <span className={`${serif} text-3xl`} style={{ color: d3.brass }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className={`${serif} block text-lg font-semibold`}>
                      {order.customerName}
                    </span>
                    <span className="text-[0.72rem] uppercase tracking-[0.12em]" style={{ color: d3.haze }}>
                      {order.orderNumber} · {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <span className="hidden text-right text-sm sm:block" style={{ color: d3.graphite }}>
                    {titleCase(order.paymentStatus)}
                  </span>
                  <span className="hidden text-right text-sm sm:block" style={{ color: d3.graphite }}>
                    {order.margin === null ? "—" : formatCurrency(order.margin)}
                  </span>
                  <span className={`${serif} text-right text-xl font-semibold`}>
                    {formatCurrency(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm" style={{ color: d3.haze }}>
              Orders will appear here once they are placed.
            </p>
          )}
        </div>
      </section>

      {/* closing note */}
      <section className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8">
        <div
          className="grid items-center gap-6 p-8 sm:p-12 md:grid-cols-[0.65fr_0.35fr]"
          style={{ background: d3.ink, color: d3.paper }}
        >
          <div>
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d3.brass }}
            >
              Editor's note
            </span>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight`}>
              {data.outstanding > 0
                ? "Receivables carry the issue — chase the aging columns."
                : "A clean ledger this month — every order collected."}
            </h2>
          </div>
          <Link
            href="/design-lab/d3/orders"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full px-7 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
            style={{ background: d3.brass, color: "#fff" }}
          >
            Back to orders desk <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </D3Shell>
  );
}
