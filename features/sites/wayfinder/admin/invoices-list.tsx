"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchInvoices, type DbInvoice } from "@/lib/invoices-data";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Field,
  Ico,
  Kpi,
  Mono,
  PageHead,
  Panel,
  Pill,
  SelectInput,
  TextInput,
  wf,
  type Column
} from "./admin-kit";
import { formatDate } from "./order-helpers";

type StatusFilter = "all" | DbInvoice["status"];
type PaymentFilter = "all" | DbInvoice["paymentStatus"];

const statusLabels: Record<DbInvoice["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Approved",
  converted: "Converted",
  void: "Void"
};

const paymentLabels: Record<DbInvoice["paymentStatus"], string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overpaid: "Overpaid",
  refunded: "Refunded",
  failed: "Failed"
};

function paymentTone(status: DbInvoice["paymentStatus"]) {
  if (status === "paid" || status === "overpaid") return "done" as const;
  if (status === "partial") return "warn" as const;
  if (status === "failed") return "stop" as const;
  if (status === "refunded") return "neutral" as const;
  return "open" as const;
}

function statusTone(status: DbInvoice["status"]) {
  if (status === "void") return "stop" as const;
  if (status === "converted" || status === "accepted") return "done" as const;
  if (status === "sent") return "active" as const;
  return "open" as const;
}

export function WayfinderInvoicesList() {
  const [invoices, setInvoices] = useState<DbInvoice[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");

  useEffect(() => {
    async function load() {
      const result = await fetchInvoices();
      setInvoices(result.invoices);
      setConfigured(result.configured);
      setLoaded(true);
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((invoice) => {
        const hit =
          !q ||
          invoice.invoiceNumber.toLowerCase().includes(q) ||
          invoice.customerName.toLowerCase().includes(q) ||
          invoice.customerEmail.toLowerCase().includes(q);
        return (
          hit &&
          (status === "all" || invoice.status === status) &&
          (payment === "all" || invoice.paymentStatus === payment)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, payment, query, status]);

  const openTotal = invoices
    .filter((invoice) => invoice.paymentStatus !== "paid")
    .reduce((sum, invoice) => sum + Math.max(0, invoice.total - invoice.amountPaid), 0);
  const paidTotal = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);

  const columns: Column<DbInvoice>[] = [
    {
      key: "invoice",
      header: "Invoice",
      render: (invoice) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700 }}>{invoice.invoiceNumber}</Mono>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {formatDate(invoice.createdAt)}
          </span>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (invoice) => (
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800 }}>{invoice.customerName || "Unknown"}</span>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {invoice.customerEmail || "No email"}
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => (
        <Pill tone={statusTone(invoice.status)}>{statusLabels[invoice.status]}</Pill>
      )
    },
    {
      key: "payment",
      header: "Payment",
      render: (invoice) => (
        <Pill tone={paymentTone(invoice.paymentStatus)}>
          {paymentLabels[invoice.paymentStatus]}
        </Pill>
      )
    },
    {
      key: "due",
      header: "Due",
      render: (invoice) => (
        <span style={{ fontSize: 12, color: wf.steel }}>
          {invoice.dueAt ? formatDate(invoice.dueAt) : "No due date"}
        </span>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (invoice) => (
        <div style={{ display: "grid", gap: 2, justifyItems: "end" }}>
          <Mono style={{ fontWeight: 700 }}>{fmt(invoice.total)}</Mono>
          <span style={{ fontSize: 10, color: wf.muted }}>
            paid {fmt(invoice.amountPaid)}
          </span>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Accounts receivable"
        title="Invoices"
        desc="Real invoice records with customer, due date, payment state, and line-item totals."
        action={
          <AdminBtn href="/admin/invoices/new" variant="primary">
            <Ico.plus size={14} /> New invoice
          </AdminBtn>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))"
        }}
      >
        <Kpi label="Invoices" value={invoices.length} hint="Persisted invoice records" />
        <Kpi label="Open AR" value={fmt(openTotal)} tone="red" />
        <Kpi label="Paid" value={fmt(paidTotal)} tone="pine" />
      </div>

      <Panel
        title="Invoice register"
        meta={
          configured
            ? loaded
              ? `${filtered.length} of ${invoices.length} invoices`
              : "Loading invoices..."
            : "Supabase invoice tables are not configured yet."
        }
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search invoice or customer..."
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            padding: "12px 16px",
            borderBottom: `1px solid ${wf.hairline}`
          }}
        >
          <Field label="Status">
            <SelectInput value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="all">All statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Payment">
            <SelectInput value={payment} onChange={(event) => setPayment(event.target.value as PaymentFilter)}>
              <option value="all">All payment states</option>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(invoice) => invoice.id}
          onRowHref={(invoice) => `/admin/invoices/${encodeURIComponent(invoice.id)}`}
          empty={
            loaded
              ? "No invoices match the current filters."
              : "Loading invoices from accounts receivable..."
          }
        />
      </Panel>
    </>
  );
}
