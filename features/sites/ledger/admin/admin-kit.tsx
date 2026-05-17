"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LEDGER } from "@/features/sites/ledger/kit";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";

/* Shared presentational primitives for the Ledger admin surface.
 * Built on the storefront kit palette so the back-office stays in the
 * same calm institutional language. */

const usDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const usTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit"
});

export function formatAdminDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : usDate.format(date);
}

export function formatAdminTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : usTime.format(date);
}

export function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ") : value;
}

/* ---- Page heading -------------------------------------------------- */
export function AdminHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: LEDGER.indigo }}
          >
            {eyebrow}
          </span>
        ) : null}
        <h1
          className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
          style={{ color: LEDGER.ink }}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm" style={{ color: LEDGER.body }}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ---- Card surface -------------------------------------------------- */
export function AdminCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        backgroundColor: LEDGER.surface,
        border: `1px solid ${LEDGER.line}`,
        boxShadow: "0 1px 2px rgba(21,24,31,0.04)"
      }}
    >
      {children}
    </div>
  );
}

/* ---- KPI stat tile ------------------------------------------------- */
export function StatTile({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <AdminCard className="p-5">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: LEDGER.muted }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={{ color: accent ?? LEDGER.ink }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[12px] font-medium" style={{ color: LEDGER.body }}>
          {sub}
        </p>
      ) : null}
    </AdminCard>
  );
}

/* ---- Status pill --------------------------------------------------- */
export function StatusPill({
  children,
  tone
}: {
  children: ReactNode;
  tone: "indigo" | "amber" | "mint" | "rose" | "neutral";
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    indigo: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
    amber: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
    mint: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
    rose: { bg: LEDGER.roseSoft, fg: LEDGER.rose },
    neutral: { bg: "#eef0f3", fg: LEDGER.body }
  };
  const { bg, fg } = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </span>
  );
}

export function orderStatusTone(status: OrderStatus): "indigo" | "amber" | "mint" | "rose" | "neutral" {
  switch (status) {
    case "submitted":
    case "draft":
      return "amber";
    case "confirmed":
    case "picking":
    case "out_for_delivery":
      return "indigo";
    case "ready_for_pickup":
    case "completed":
      return "mint";
    case "cancelled":
      return "rose";
    default:
      return "neutral";
  }
}

export function paymentStatusTone(status: PaymentStatus | string): "indigo" | "amber" | "mint" | "rose" | "neutral" {
  switch (status) {
    case "paid":
    case "overpaid":
      return "mint";
    case "partial":
      return "amber";
    case "refunded":
      return "neutral";
    case "unpaid":
    case "failed":
      return "rose";
    default:
      return "neutral";
  }
}

/* ---- Buttons ------------------------------------------------------- */
export function AdminPrimaryButton({
  children,
  onClick,
  type = "button",
  disabled
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-50 sm:w-auto"
      disabled={disabled}
      onClick={onClick}
      style={{ backgroundColor: LEDGER.indigo }}
      type={type}
    >
      {children}
    </button>
  );
}

export function AdminGhostButton({
  children,
  onClick,
  type = "button",
  disabled
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 sm:w-auto"
      disabled={disabled}
      onClick={onClick}
      style={{
        backgroundColor: LEDGER.surface,
        border: `1px solid ${LEDGER.line}`,
        color: LEDGER.ink
      }}
      type={type}
    >
      {children}
    </button>
  );
}

export function AdminLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
      href={href}
      style={{
        backgroundColor: LEDGER.surface,
        border: `1px solid ${LEDGER.line}`,
        color: LEDGER.ink
      }}
    >
      {children}
    </Link>
  );
}

/* ---- Empty state --------------------------------------------------- */
export function AdminEmpty({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto" style={{ color: LEDGER.muted }}>
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
