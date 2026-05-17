"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { getPaymentStatusTone } from "@/lib/order-status";
import type { PaymentStatus } from "@/lib/platform-backend";
import { formatCurrency } from "@/lib/utils";

export type ReportPaymentBreakdown = {
  status: string;
  count: number;
  total: number;
};

export type ReportOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  total: number;
  paymentStatus: string;
  margin: number | null;
};

export type ReportAgingBucket = {
  bucket: string;
  total: number;
};

export type ReportData = {
  configured: boolean;
  hasCostData: boolean;
  revenue30: number;
  orders30: number;
  avgOrderValue: number;
  grossProfit: number;
  grossMarginPct: number;
  billed: number;
  collected: number;
  outstanding: number;
  paymentBreakdown: ReportPaymentBreakdown[];
  aging: ReportAgingBucket[];
  recentOrders: ReportOrderRow[];
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function ReportsDashboard({ data }: { data: ReportData }) {
  const columns: DataTableColumn<ReportOrderRow>[] = [
    {
      key: "orderNumber",
      header: "Order",
      sortable: true,
      sortValue: (row) => row.orderNumber,
      render: (row) => (
        <span className="font-black text-industrial-ink">{row.orderNumber}</span>
      )
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      sortValue: (row) => row.createdAt,
      render: (row) => <span className="text-industrial-steel">{formatDate(row.createdAt)}</span>
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      sortValue: (row) => row.customerName.toLowerCase(),
      render: (row) => <span className="text-industrial-ink">{row.customerName}</span>
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      sortable: true,
      sortValue: (row) => row.total,
      render: (row) => (
        <span className="font-semibold text-industrial-ink">{formatCurrency(row.total)}</span>
      )
    },
    {
      key: "payment",
      header: "Payment",
      sortable: true,
      sortValue: (row) => row.paymentStatus,
      render: (row) => (
        <Badge tone={getPaymentStatusTone(row.paymentStatus as PaymentStatus)}>
          {titleCase(row.paymentStatus)}
        </Badge>
      )
    },
    {
      key: "margin",
      header: "Gross margin",
      className: "text-right",
      sortable: true,
      sortValue: (row) => row.margin ?? -1,
      render: (row) => (
        <span className="font-semibold text-industrial-ink">
          {row.margin === null ? "—" : formatCurrency(row.margin)}
        </span>
      )
    }
  ];

  return (
    <PageShell
      description="Revenue, order value, payment status, and gross margin across recent orders."
      eyebrow="Operations"
      title="Financial reports"
    >
      {!data.configured ? (
        <div
          className="mb-5 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          role="alert"
        >
          Supabase is not configured, so live financial data is unavailable. Add the Supabase keys
          to <code>.env.local</code> to populate this report.
        </div>
      ) : null}

      <StatGrid
        stats={[
          { label: "Revenue (30 days)", value: formatCurrency(data.revenue30) },
          { label: "Orders (30 days)", value: data.orders30 },
          { label: "Avg order value", value: formatCurrency(data.avgOrderValue) },
          {
            label: "Gross margin",
            value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data"
          }
        ]}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
              Accounts receivable
            </p>
          </CardHeader>
          <CardBody className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-industrial-steel">Total billed</span>
              <span className="font-black text-industrial-ink">{formatCurrency(data.billed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-industrial-steel">Collected</span>
              <span className="font-black text-industrial-ink">
                {formatCurrency(data.collected)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-industrial-rail pt-2">
              <span className="font-black text-industrial-ink">Outstanding</span>
              <span className="font-black text-industrial-red">
                {formatCurrency(data.outstanding)}
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
              Outstanding by age
            </p>
          </CardHeader>
          <CardBody className="grid gap-2 text-sm">
            {data.aging.map((bucket) => (
              <div className="flex items-center justify-between" key={bucket.bucket}>
                <span className="text-industrial-steel">{bucket.bucket} days</span>
                <span className="font-black text-industrial-ink">
                  {formatCurrency(bucket.total)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
              Payment status
            </p>
          </CardHeader>
          <CardBody className="grid gap-2 text-sm">
            {data.paymentBreakdown.length ? (
              data.paymentBreakdown.map((row) => (
                <div className="flex items-center justify-between" key={row.status}>
                  <span className="flex items-center gap-2">
                    <Badge tone={getPaymentStatusTone(row.status as PaymentStatus)}>
                      {titleCase(row.status)}
                    </Badge>
                    <span className="text-industrial-muted">{row.count} orders</span>
                  </span>
                  <span className="font-black text-industrial-ink">
                    {formatCurrency(row.total)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-industrial-muted">No orders in range.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {data.hasCostData ? (
        <p className="mt-4 text-sm text-industrial-steel">
          Gross profit across recent orders:{" "}
          <span className="font-black text-industrial-ink">
            {formatCurrency(data.grossProfit)}
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-industrial-steel">
          Gross margin is hidden until product costs are entered. Add unit costs in the catalog
          manager so margin can be calculated from real cost data.
        </p>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
          Recent orders
        </p>
        <DataTable
          caption="Recent orders with revenue and gross margin"
          columns={columns}
          emptyDescription="Orders will appear here once they are placed."
          emptyTitle="No orders yet"
          getRowKey={(row) => row.id}
          pageSize={25}
          rows={data.recentOrders}
        />
      </div>
    </PageShell>
  );
}
