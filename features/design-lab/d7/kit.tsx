"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  FileText,
  Menu,
  ReceiptText,
  ShieldCheck,
  X
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * DESIGN 7 — "LEDGER"
 * A B2B procurement & finance portal for purchasing managers and
 * account buyers. Modern fintech aesthetic (Ramp / Mercury / Brex)
 * applied to a hardware supplier: airy paper-white surface, generous
 * whitespace, deep institutional indigo accent, data presented with
 * confidence. The storefront reframed as a procurement platform.
 * ------------------------------------------------------------------ */

/* ---- Palette (self-contained, no tailwind.config edits) ----------- */
export const LEDGER = {
  canvas: "#f5f6f8", // app background — cool airy paper
  surface: "#ffffff", // card surface
  ink: "#15181f", // primary text — near-black slate
  body: "#41475a", // secondary text
  muted: "#8b91a3", // tertiary / labels
  line: "#e4e6ec", // hairline borders
  indigo: "#2f3aa3", // institutional accent
  indigoSoft: "#eef0fb", // accent tint surface
  mint: "#0f7a52", // positive / collected
  mintSoft: "#e6f4ee",
  amber: "#9a6b14", // attention / outstanding
  amberSoft: "#fbf2dd",
  rose: "#a8324a", // overdue / negative
  roseSoft: "#fbe9ec"
} as const;

export const D7_NAV = [
  { label: "Overview", href: "/design-lab/d7/home" },
  { label: "Catalog", href: "/design-lab/d7/category" },
  { label: "Product", href: "/design-lab/d7/product" },
  { label: "Purchase order", href: "/design-lab/d7/cart" }
];

export const D7_ADMIN_NAV = [
  { label: "Order ledger", href: "/design-lab/d7/orders" },
  { label: "Spend reports", href: "/design-lab/d7/reports" }
];

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

export function formatUsd0(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

/* ---- Eyebrow ------------------------------------------------------ */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.18em]"
      style={{ color: LEDGER.indigo }}
    >
      {children}
    </span>
  );
}

/* ---- Pill (account / status badge) -------------------------------- */
export function Pill({
  children,
  bg,
  fg
}: {
  children: ReactNode;
  bg: string;
  fg: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </span>
  );
}

/* ---- Card --------------------------------------------------------- */
export function Card({
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

/* ---- Section header ---------------------------------------------- */
export function SectionHeader({
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
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2
          className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl"
          style={{ color: LEDGER.ink }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm" style={{ color: LEDGER.body }}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* ---- Header ------------------------------------------------------- */
export function D7Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [...D7_NAV, ...D7_ADMIN_NAV];

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        borderBottom: `1px solid ${LEDGER.line}`
      }}
    >
      {/* account utility strip */}
      <div style={{ backgroundColor: LEDGER.ink }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-1.5 text-[11px] font-medium">
          <span
            className="flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Net-30 terms active &middot; Approved trade account
          </span>
          <span className="hidden items-center gap-4 sm:flex">
            <span style={{ color: "rgba(255,255,255,0.62)" }}>
              Account #GW-40128
            </span>
            <span style={{ color: "#aab1ff" }}>Tier 2 volume pricing</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3.5">
        <Link className="flex items-center gap-2.5" href="/design-lab/d7/home">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            G
          </span>
          <span className="leading-none">
            <span
              className="block text-[15px] font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              Gateworks
            </span>
            <span
              className="block text-[10px] font-medium uppercase tracking-[0.2em]"
              style={{ color: LEDGER.muted }}
            >
              Procurement Portal
            </span>
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-0.5 md:flex">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium transition"
                href={item.href}
                style={{
                  color: active ? LEDGER.ink : LEDGER.body,
                  backgroundColor: active ? LEDGER.indigoSoft : "transparent"
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition sm:flex"
            href="/design-lab/d7/cart"
            style={{ color: LEDGER.body, border: `1px solid ${LEDGER.line}` }}
          >
            <ReceiptText className="h-4 w-4" />
            Current PO
          </Link>
          <Link
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition"
            href="/design-lab/d7/orders"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            <Building2 className="h-4 w-4" />
            My account
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg md:hidden"
            onClick={() => setOpen((value) => !value)}
            style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
            type="button"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="px-6 py-2 md:hidden"
          style={{ borderTop: `1px solid ${LEDGER.line}` }}
        >
          {links.map((item) => (
            <Link
              key={item.href}
              className="block py-2.5 text-sm font-medium"
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ color: LEDGER.ink }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

/* ---- Footer ------------------------------------------------------- */
export function D7Footer() {
  return (
    <footer
      className="mt-20"
      style={{
        backgroundColor: LEDGER.surface,
        borderTop: `1px solid ${LEDGER.line}`
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: LEDGER.indigo }}
            >
              G
            </span>
            <span
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              Gateworks
            </span>
          </div>
          <p
            className="mt-3 max-w-xs text-sm leading-relaxed"
            style={{ color: LEDGER.body }}
          >
            The procurement platform for businesses that buy gate hardware,
            structural steel, and welding supply on terms.
          </p>
        </div>
        {[
          {
            head: "Procurement",
            links: ["Catalog", "Volume pricing", "Reorder lists", "Request a quote"]
          },
          {
            head: "Account",
            links: ["Net-30 terms", "Spend reports", "Approvers & users", "Statements"]
          },
          {
            head: "Company",
            links: ["About Gateworks", "Trade program", "Support", "Contact"]
          }
        ].map((col) => (
          <div key={col.head}>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: LEDGER.muted }}
            >
              {col.head}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li
                  key={link}
                  className="cursor-pointer text-sm transition"
                  style={{ color: LEDGER.body }}
                >
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${LEDGER.line}` }}>
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-[11px] font-medium"
          style={{ color: LEDGER.muted }}
        >
          <span>&copy; 2026 Gateworks Supply Co.</span>
          <span>Design Lab &mdash; Concept 7 / Ledger</span>
        </div>
      </div>
    </footer>
  );
}

/* ---- Page wrapper ------------------------------------------------- */
export function D7Page({
  children,
  wide
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="min-h-screen antialiased"
      style={{
        backgroundColor: LEDGER.canvas,
        color: LEDGER.ink,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <D7Header />
      <main className={`mx-auto px-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        {children}
      </main>
      <D7Footer />
    </div>
  );
}

/* ---- Concept badge ----------------------------------------------- */
export function D7DesignBadge() {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-[11px] font-medium"
      style={{
        backgroundColor: LEDGER.indigoSoft,
        color: LEDGER.indigo
      }}
    >
      <span className="flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        Design Lab &middot; Concept 7 &mdash; Ledger procurement portal
      </span>
      <Link
        className="flex items-center gap-1 font-semibold hover:underline"
        href="/design-lab/d7/home"
      >
        Restart tour <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ---- Breadcrumb --------------------------------------------------- */
export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
      {trail.map((node, index) => (
        <span key={node.label} className="flex items-center gap-1.5">
          {node.href ? (
            <Link
              className="transition hover:underline"
              href={node.href}
              style={{ color: LEDGER.muted }}
            >
              {node.label}
            </Link>
          ) : (
            <span style={{ color: LEDGER.ink }}>{node.label}</span>
          )}
          {index < trail.length - 1 ? (
            <ChevronRight className="h-3 w-3" style={{ color: LEDGER.muted }} />
          ) : null}
        </span>
      ))}
    </nav>
  );
}
