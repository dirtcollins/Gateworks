import Link from "next/link";
import type { ReactNode } from "react";
import { CommandPalette } from "./command-palette";

// d10 "Signal" — fast, intelligent, command-driven storefront.
// Light, crisp, minimal-chrome productivity-app aesthetic with one vivid
// accent (electric indigo). Shared primitives keep every page consistent.

export const SIGNAL = {
  accent: "#4f46e5",
  accentSoft: "#eef2ff",
  accentRing: "#c7d2fe",
  ink: "#0f1117",
  sub: "#5b6170",
  line: "#e7e8ee",
  surface: "#ffffff",
  canvas: "#f7f8fa"
} as const;

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number.isFinite(value) ? value : 0);
}

const NAV: Array<{ key: string; label: string; href: string }> = [
  { key: "home", label: "Home", href: "/design-lab/d10/home" },
  { key: "category", label: "Catalog", href: "/design-lab/d10/category" },
  { key: "product", label: "Product", href: "/design-lab/d10/product" },
  { key: "cart", label: "Cart", href: "/design-lab/d10/cart" },
  { key: "orders", label: "Orders", href: "/design-lab/d10/orders" },
  { key: "reports", label: "Reports", href: "/design-lab/d10/reports" }
];

// A small keyboard-hint chip — a recurring Signal motif.
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[5px] border px-1.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        borderColor: SIGNAL.line,
        background: SIGNAL.canvas,
        color: SIGNAL.sub
      }}
    >
      {children}
    </kbd>
  );
}

export function SignalMark() {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid h-7 w-7 place-items-center rounded-[8px]"
        style={{ background: SIGNAL.ink }}
      >
        <span className="flex items-end gap-[2px]">
          <span className="block h-1.5 w-[3px] rounded-sm bg-white/60" />
          <span className="block h-2.5 w-[3px] rounded-sm bg-white/80" />
          <span
            className="block h-3.5 w-[3px] rounded-sm"
            style={{ background: SIGNAL.accent }}
          />
        </span>
      </div>
      <div className="leading-none">
        <p
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          Signal
        </p>
        <p className="text-[10px] font-medium" style={{ color: SIGNAL.sub }}>
          Gateworks
        </p>
      </div>
    </div>
  );
}

// The persistent top bar. Keeps a search-cue button so the command palette
// motif is always one keystroke away — speed is the brand.
function TopBar({ active }: { active: string }) {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: SIGNAL.line, background: "rgba(255,255,255,0.85)" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
        <Link href="/design-lab/d10/home" aria-label="Signal home">
          <SignalMark />
        </Link>
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const on = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  color: on ? SIGNAL.ink : SIGNAL.sub,
                  background: on ? SIGNAL.accentSoft : "transparent"
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-[210px] sm:block">
            <CommandPalette variant="modal" />
          </div>
          <Link
            href="/design-lab/d10/cart"
            className="rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: SIGNAL.accent }}
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SignalShell({
  active,
  children
}: {
  active: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: SIGNAL.canvas,
        color: SIGNAL.ink,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <TopBar active={active} />
      <main>{children}</main>
      <footer
        className="mt-16 border-t"
        style={{ borderColor: SIGNAL.line, background: SIGNAL.surface }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <SignalMark />
          <p className="text-[12px]" style={{ color: SIGNAL.sub }}>
            Design Lab concept d10 — Signal. Fast, intelligent, command-driven
            commerce on live catalog data.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Section heading with a tight productivity-app feel.
export function SectionHead({
  eyebrow,
  title,
  hint,
  action
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: SIGNAL.accent }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="text-[18px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          {title}
        </h2>
        {hint ? (
          <p className="mt-0.5 text-[12px]" style={{ color: SIGNAL.sub }}>
            {hint}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border ${className}`}
      style={{ borderColor: SIGNAL.line, background: SIGNAL.surface }}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "good" | "warn";
}) {
  const tones = {
    neutral: { bg: SIGNAL.canvas, fg: SIGNAL.sub },
    accent: { bg: SIGNAL.accentSoft, fg: SIGNAL.accent },
    good: { bg: "#e7f6ec", fg: "#1a7f3c" },
    warn: { bg: "#fdf0e3", fg: "#b5651d" }
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
}
