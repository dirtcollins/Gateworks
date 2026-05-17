"use client";

/**
 * DESIGN 2 — "WAREHOUSE DARK"
 * Shared design kit: dark industrial-control-room UI primitives.
 * Wired to real catalog/cart/order/reports data — visual design unchanged.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  Boxes,
  ClipboardList,
  Cpu,
  Home,
  LineChart,
  ShoppingCart
} from "lucide-react";

/* ----------------------------------------------------------------------- */
/* Tokens                                                                  */
/* ----------------------------------------------------------------------- */

export const D2 = {
  /** vivid electric-green accent */
  accent: "#3df58a",
  accentDim: "#1f3d2e",
  bg: "#0a0d0f",
  panel: "#11161a",
  panelHi: "#161d22",
  line: "#222b32",
  text: "#e6edf2",
  muted: "#6f7d87"
} as const;

export const mono =
  "font-mono [font-feature-settings:'tnum'] tabular-nums";

/* ----------------------------------------------------------------------- */
/* Shell                                                                   */
/* ----------------------------------------------------------------------- */

const NAV = [
  { href: "/design-lab/d2/home", label: "Storefront", icon: Home },
  { href: "/design-lab/d2/category", label: "Catalog", icon: Boxes },
  { href: "/design-lab/d2/product", label: "Product", icon: Cpu },
  { href: "/design-lab/d2/cart", label: "Cart", icon: ShoppingCart },
  { href: "/design-lab/d2/orders", label: "Orders", icon: ClipboardList },
  { href: "/design-lab/d2/reports", label: "Reports", icon: LineChart }
];

export function D2Shell({
  active,
  children,
  kicker = "WAREHOUSE TERMINAL"
}: {
  active: string;
  children: ReactNode;
  kicker?: string;
}) {
  return (
    <div
      className="min-h-screen w-full font-sans antialiased"
      style={{ background: D2.bg, color: D2.text }}
    >
      {/* fine grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "44px 44px"
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1440px] flex-col">
        <D2Header kicker={kicker} />
        <D2Nav active={active} />
        <main className="flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">{children}</main>
        <D2Footer />
      </div>
    </div>
  );
}

function D2Header({ kicker }: { kicker: string }) {
  return (
    <header
      className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6 lg:px-8"
      style={{ borderColor: D2.line, background: D2.panel }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-[3px]"
          style={{
            background: D2.accent,
            boxShadow: `0 0 22px ${D2.accent}55`
          }}
        >
          <Cpu className="h-5 w-5" style={{ color: D2.bg }} strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">
            GATEWORKS<span style={{ color: D2.accent }}>/</span>OPS
          </div>
          <div
            className={`${mono} text-[10px] uppercase tracking-[0.22em]`}
            style={{ color: D2.muted }}
          >
            {kicker}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: D2.accent }}
          />
          <span
            className={`${mono} text-[11px] uppercase tracking-wider`}
            style={{ color: D2.muted }}
          >
            Yard live
          </span>
        </div>
        <div
          className={`${mono} hidden text-[11px] tabular-nums md:block`}
          style={{ color: D2.muted }}
        >
          17 MAY 2026 · 08:42 MT
        </div>
        <div
          className="grid h-8 w-8 place-items-center rounded-[3px] text-[11px] font-bold"
          style={{ background: D2.panelHi, color: D2.accent, border: `1px solid ${D2.line}` }}
        >
          NS
        </div>
      </div>
    </header>
  );
}

function D2Nav({ active }: { active: string }) {
  return (
    <nav
      className="flex items-center gap-1 overflow-x-auto border-b px-2 py-1.5 sm:px-4 lg:px-6"
      style={{ borderColor: D2.line, background: D2.panel }}
    >
      {NAV.map((item) => {
        const Icon = item.icon;
        const on = item.label.toLowerCase() === active.toLowerCase();
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${mono} group flex shrink-0 items-center gap-2 rounded-[3px] px-3 py-2 text-[11px] uppercase tracking-wider transition`}
            style={{
              color: on ? D2.bg : D2.muted,
              background: on ? D2.accent : "transparent"
            }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function D2Footer() {
  return (
    <footer
      className="border-t px-4 py-5 sm:px-6 lg:px-8"
      style={{ borderColor: D2.line, background: D2.panel }}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div
          className={`${mono} text-[11px] uppercase tracking-wider`}
          style={{ color: D2.muted }}
        >
          GATEWORKS/OPS · Steel & Gate Hardware Supply · Design Lab — Concept 2
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" style={{ color: D2.accent }} />
          <span
            className={`${mono} text-[11px] uppercase tracking-wider`}
            style={{ color: D2.muted }}
          >
            Warehouse Dark
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------- */
/* Primitives                                                              */
/* ----------------------------------------------------------------------- */

export function Panel({
  children,
  className = "",
  glow = false
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-[5px] ${className}`}
      style={{
        background: D2.panel,
        border: `1px solid ${D2.line}`,
        boxShadow: glow ? `0 0 0 1px ${D2.accent}22, 0 18px 40px -24px #000` : undefined
      }}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  meta,
  action
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-4 py-3"
      style={{ borderColor: D2.line }}
    >
      <div className="flex items-baseline gap-3">
        <span className="h-3 w-[3px]" style={{ background: D2.accent }} />
        <h2 className="text-[13px] font-bold uppercase tracking-[0.14em]">{title}</h2>
        {meta ? (
          <span className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
            {meta}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Tag({
  children,
  tone = "muted"
}: {
  children: ReactNode;
  tone?: "accent" | "muted" | "warn" | "bad";
}) {
  const map = {
    accent: { fg: D2.accent, bg: `${D2.accent}18`, bd: `${D2.accent}55` },
    muted: { fg: D2.muted, bg: D2.panelHi, bd: D2.line },
    warn: { fg: "#f5b53d", bg: "#3a2d10", bd: "#6b5318" },
    bad: { fg: "#ff6b6b", bg: "#3a1717", bd: "#6b2424" }
  }[tone];
  return (
    <span
      className={`${mono} inline-flex items-center gap-1 rounded-[3px] px-2 py-0.5 text-[10px] uppercase tracking-wider`}
      style={{ color: map.fg, background: map.bg, border: `1px solid ${map.bd}` }}
    >
      {children}
    </span>
  );
}

export function AccentButton({
  children,
  href,
  onClick,
  className = "",
  ghost = false,
  type = "button"
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  ghost?: boolean;
  type?: "button" | "submit";
}) {
  const base = `${mono} inline-flex items-center justify-center gap-2 rounded-[3px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition active:translate-y-px`;
  const style = ghost
    ? { color: D2.text, background: "transparent", border: `1px solid ${D2.line}` }
    : {
        color: D2.bg,
        background: D2.accent,
        boxShadow: `0 0 22px ${D2.accent}40`
      };
  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} style={style}>
      {children}
    </button>
  );
}

/** Color-block product image — no remote deps. */
export function PartImage({
  seed,
  className = "",
  label
}: {
  seed: string;
  className?: string;
  label?: string;
}) {
  const hue = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={`relative overflow-hidden rounded-[4px] ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 14% 14%), hsl(${
          (hue + 40) % 360
        } 16% 9%))`,
        border: `1px solid ${D2.line}`
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg,rgba(255,255,255,0.06) 0 2px,transparent 2px 11px)"
        }}
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-[3px]"
        style={{ border: `2px solid ${D2.accent}66`, boxShadow: `0 0 30px ${D2.accent}22` }}
      />
      {label ? (
        <span
          className={`${mono} absolute bottom-1.5 left-2 text-[9px] uppercase tracking-wider`}
          style={{ color: D2.muted }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Real-photo product image inside the same dark, scan-lined frame as
 * PartImage. Falls back to the color block when no usable image url exists.
 */
export function PartPhoto({
  src,
  alt,
  seed,
  className = "",
  label,
  quality = 75
}: {
  src?: string;
  alt: string;
  seed: string;
  className?: string;
  label?: string;
  quality?: number;
}) {
  const usable = src && src !== "/assets/logo.svg" && !src.includes("noimage");

  if (!usable) {
    return <PartImage seed={seed} className={className} label={label} />;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[4px] ${className}`}
      style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
    >
      <Image
        alt={alt}
        src={src}
        fill
        quality={quality}
        sizes="(max-width: 768px) 50vw, 320px"
        className="object-contain p-2"
      />
      {label ? (
        <span
          className={`${mono} absolute bottom-1.5 left-2 z-10 text-[9px] uppercase tracking-wider`}
          style={{ color: D2.muted }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function StatCell({
  label,
  value,
  delta,
  good
}: {
  label: string;
  value: string;
  delta?: string;
  good?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3.5"
      style={{ borderLeft: `2px solid ${D2.line}` }}
    >
      <span
        className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
        style={{ color: D2.muted }}
      >
        {label}
      </span>
      <span className={`${mono} text-[24px] font-bold leading-none`}>{value}</span>
      {delta ? (
        <span
          className={`${mono} text-[11px]`}
          style={{ color: good ? D2.accent : "#ff6b6b" }}
        >
          {good ? "▲" : "▼"} {delta}
        </span>
      ) : null}
    </div>
  );
}
