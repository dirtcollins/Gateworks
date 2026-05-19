"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchInvoice, type DbInvoice } from "@/lib/invoices-data";
import { fmt } from "../kit";
import {
  AdminBtn,
  Ico,
  Mono,
  PageHead,
  Panel,
  Pill,
  monoFont,
  wf
} from "./admin-kit";
import { formatDate } from "./order-helpers";

function paymentTone(status: DbInvoice["paymentStatus"]) {
  if (status === "paid" || status === "overpaid") return "done" as const;
  if (status === "partial") return "warn" as const;
  if (status === "failed") return "stop" as const;
  if (status === "refunded") return "neutral" as const;
  return "open" as const;
}

export function WayfinderInvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<DbInvoice | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await fetchInvoice(invoiceId);
      setInvoice(result.invoice);
      setConfigured(result.configured);
      setLoaded(true);
    }
    void load();
  }, [invoiceId]);

  const balanceDue = useMemo(
    () => (invoice ? Math.max(0, invoice.total - invoice.amountPaid) : 0),
    [invoice]
  );

  if (!invoice) {
    return (
      <>
        <PageHead
          eyebrow="Accounts receivable"
          title={loaded ? "Invoice not found" : "Loading invoice"}
          action={<AdminBtn href="/admin/invoices">Back to invoices</AdminBtn>}
        />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            {configured
              ? loaded
                ? `No invoice matches ${invoiceId}.`
                : "Loading invoice from accounts receivable..."
              : "Supabase invoice tables are not configured yet."}
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Accounts receivable"
        title={<Mono style={{ fontSize: 24 }}>{invoice.invoiceNumber}</Mono>}
        desc={`${invoice.customerName || "Unknown customer"} · due ${
          invoice.dueAt ? formatDate(invoice.dueAt) : "not scheduled"
        }`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AdminBtn href="/admin/invoices">
              <Ico.arrowRight size={14} /> Back
            </AdminBtn>
            <AdminBtn onClick={() => window.print()}>
              <Ico.receipt size={14} /> Print
            </AdminBtn>
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-invoice-detail-grid"
      >
        <Panel title="Line items" meta={`${invoice.items.length} SKUs`} pad={false}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: wf.bone }}>
                  {["Item", "SKU", "Qty", "Unit", "Line total"].map((header, index) => (
                    <th
                      key={header}
                      style={{
                        textAlign: index >= 2 ? "right" : "left",
                        padding: "9px 14px",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: wf.steel,
                        borderBottom: `1px solid ${wf.rail}`
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td style={cell()}>
                      <span style={{ fontWeight: 700 }}>{item.title}</span>
                    </td>
                    <td style={cell()}>
                      <Mono style={{ fontSize: 11 }}>{item.sku}</Mono>
                    </td>
                    <td style={cell("right")}>
                      <Mono>{item.quantity}</Mono>
                    </td>
                    <td style={cell("right")}>
                      <Mono>{fmt(item.unitPrice)}</Mono>
                    </td>
                    <td style={cell("right")}>
                      <Mono style={{ fontWeight: 700 }}>{fmt(item.lineTotal)}</Mono>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Invoice summary">
            <div style={{ display: "grid", gap: 9 }}>
              <Pill tone={paymentTone(invoice.paymentStatus)}>
                {invoice.paymentStatus}
              </Pill>
              <Detail label="Customer" value={invoice.customerName || "—"} />
              <Detail label="Email" value={invoice.customerEmail || "—"} />
              <Detail label="Terms" value={invoice.terms || "—"} />
              <Detail label="Subtotal" value={fmt(invoice.subtotal)} />
              <Detail label="Tax" value={fmt(invoice.tax)} />
              <Detail label="Total" value={fmt(invoice.total)} strong />
              <Detail label="Paid" value={fmt(invoice.amountPaid)} />
              <Detail label="Balance" value={fmt(balanceDue)} strong />
            </div>
          </Panel>
          <Panel title="Notes">
            <p style={{ margin: 0, fontSize: 12, color: wf.steel, whiteSpace: "pre-wrap" }}>
              {invoice.notes || "No invoice notes."}
            </p>
          </Panel>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .wf-invoice-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function cell(align: "left" | "right" = "left"): React.CSSProperties {
  return {
    textAlign: align,
    padding: "10px 14px",
    borderBottom: `1px solid ${wf.hairline}`,
    color: wf.ink
  };
}

function Detail({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {label}
      </span>
      <span
        style={{
          textAlign: "right",
          fontWeight: strong ? 800 : 600,
          fontFamily: strong ? monoFont : undefined
        }}
      >
        {value}
      </span>
    </div>
  );
}
