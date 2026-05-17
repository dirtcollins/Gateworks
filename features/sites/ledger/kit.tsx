"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Building2,
  ChevronRight,
  ReceiptText,
  Search,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

/* ------------------------------------------------------------------ *
 * LEDGER — standalone storefront site
 * A B2B procurement & finance portal for purchasing managers and
 * account buyers. Modern fintech aesthetic (Ramp / Mercury / Brex)
 * applied to a hardware supplier: airy paper-white surface, generous
 * whitespace, deep institutional indigo accent, data presented with
 * confidence. Ported from Design Lab Concept 7 and evolved into a
 * fully-routed site at the /ledger prefix.
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

/* Primary site navigation — all links route inside /ledger. */
export const LEDGER_NAV = [
  { label: "Overview", href: "/ledger" },
  { label: "Catalog", href: "/ledger/search" },
  { label: "Purchase order", href: "/ledger/cart" },
  { label: "Quotes", href: "/ledger/quotes" },
  { label: "Account", href: "/ledger/account" }
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

/* ---- Search field — routes to /ledger/search --------------------- */
export function LedgerSearch({
  initialQuery = "",
  className = ""
}: {
  initialQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/ledger/search?q=${encodeURIComponent(trimmed)}` : "/ledger/search");
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div
        className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
        style={{
          backgroundColor: LEDGER.surface,
          border: `1px solid ${LEDGER.line}`
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: LEDGER.muted }} />
        <input
          aria-label="Search the catalog"
          className="w-full bg-transparent text-sm outline-none"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search by product, category, or SKU"
          style={{ color: LEDGER.ink }}
          value={value}
        />
        <button
          className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition"
          style={{ backgroundColor: LEDGER.indigo }}
          type="submit"
        >
          Search
        </button>
      </div>
    </form>
  );
}

/* ---- Cart link with live count ----------------------------------- */
function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setCount(
      useCartStore
        .getState()
        .items.reduce((total, item) => total + item.quantity, 0)
    );
    const unsubscribe = useCartStore.subscribe((state) => {
      setCount(state.items.reduce((total, item) => total + item.quantity, 0));
    });
    return unsubscribe;
  }, []);

  return (
    <Link
      className="relative hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition sm:flex"
      href="/ledger/cart"
      style={{ color: LEDGER.body, border: `1px solid ${LEDGER.line}` }}
    >
      <ReceiptText className="h-4 w-4" />
      Current PO
      {count > 0 ? (
        <span
          className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white"
          style={{ backgroundColor: LEDGER.indigo }}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

/* ---- Header ------------------------------------------------------- */
export function LedgerHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const initialQuery = pathname === "/ledger/search" ? searchParams.get("q") ?? "" : "";

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

      <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-3.5">
        <Link className="flex shrink-0 items-center gap-2.5" href="/ledger">
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

        <nav className="hidden items-center gap-0.5 lg:flex">
          {LEDGER_NAV.map((item) => {
            const active =
              item.href === "/ledger"
                ? pathname === "/ledger"
                : pathname.startsWith(item.href);
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

        <LedgerSearch className="ml-auto hidden w-72 md:block" initialQuery={initialQuery} />

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <CartLink />
          <Link
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-white transition"
            href="/ledger/account"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">My account</span>
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg lg:hidden"
            onClick={() => setOpen((value) => !value)}
            style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
            type="button"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="px-6 py-2 lg:hidden"
          style={{ borderTop: `1px solid ${LEDGER.line}` }}
        >
          <LedgerSearch className="my-2.5" initialQuery={initialQuery} />
          {LEDGER_NAV.map((item) => (
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
export function LedgerFooter() {
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
            links: [
              { label: "Browse catalog", href: "/ledger/search" },
              { label: "Current PO", href: "/ledger/cart" },
              { label: "Request a quote", href: "/ledger/quote" },
              { label: "All quotes", href: "/ledger/quotes" }
            ]
          },
          {
            head: "Account",
            links: [
              { label: "My account", href: "/ledger/account" },
              { label: "Order ledger", href: "/ledger/account" },
              { label: "Saved purchase orders", href: "/ledger/account" },
              { label: "Reorder lists", href: "/ledger/account" }
            ]
          },
          {
            head: "Company",
            links: [
              { label: "Overview", href: "/ledger" },
              { label: "Trade program", href: "/ledger" },
              { label: "Support", href: "/ledger" },
              { label: "Contact", href: "/ledger" }
            ]
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
                <li key={link.label}>
                  <Link
                    className="text-sm transition hover:underline"
                    href={link.href}
                    style={{ color: LEDGER.body }}
                  >
                    {link.label}
                  </Link>
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
          <span>Ledger &mdash; Procurement Portal</span>
        </div>
      </div>
    </footer>
  );
}

/* ---- Page wrapper ------------------------------------------------- */
export function LedgerPage({
  children,
  wide
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto px-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
      {children}
    </main>
  );
}

/* ---- Breadcrumb --------------------------------------------------- */
export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
      {trail.map((node, index) => (
        <span key={`${node.label}-${index}`} className="flex items-center gap-1.5">
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

/* ---- Small inline link with arrow -------------------------------- */
export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
      href={href}
      style={{ color: LEDGER.indigo }}
    >
      {children} <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}
