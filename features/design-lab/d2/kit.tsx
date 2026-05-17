"use client";

/**
 * DESIGN 2 — "MONO"
 * Pure monochrome minimalism. Black, white, and a precise gray scale.
 * Hairline borders, a visible Swiss/editorial grid, type-driven hierarchy.
 * Wired to the real Design Lab data layer.
 */

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ----------------------------------------------------------------------- */
/* Tokens — monochrome scale only                                          */
/* ----------------------------------------------------------------------- */

export const MONO = {
  ink: "#0a0a0a",
  paper: "#ffffff",
  /** page surface — barely-off-white */
  shell: "#f4f4f3",
  /** mid surface for cards / product wells */
  mist: "#fafafa",
  line: "#e3e3e1",
  lineStrong: "#0a0a0a",
  /** secondary text */
  steel: "#6b6b69",
  /** tertiary text / labels */
  muted: "#9a9a98"
} as const;

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0
  );
}

/* ----------------------------------------------------------------------- */
/* Shell                                                                   */
/* ----------------------------------------------------------------------- */

const NAV = [
  { href: "/design-lab/d2/home", label: "Index" },
  { href: "/design-lab/d2/category", label: "Catalogue" },
  { href: "/design-lab/d2/product", label: "Object" },
  { href: "/design-lab/d2/cart", label: "Cart" },
  { href: "/design-lab/d2/orders", label: "Orders" },
  { href: "/design-lab/d2/reports", label: "Reports" }
] as const;

export function MonoPage({
  active,
  children
}: {
  active: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full antialiased"
      style={{
        background: MONO.shell,
        color: MONO.ink,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      <div
        className="mx-auto flex min-h-screen max-w-[1320px] flex-col"
        style={{
          borderLeft: `1px solid ${MONO.line}`,
          borderRight: `1px solid ${MONO.line}`,
          background: MONO.paper
        }}
      >
        <MonoHeader />
        <MonoNav active={active} />
        <main className="flex-1">{children}</main>
        <MonoFooter />
      </div>
    </div>
  );
}

function MonoHeader() {
  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10"
      style={{ borderBottom: `1px solid ${MONO.line}` }}
    >
      <Link className="flex items-baseline gap-3" href="/design-lab/d2/home">
        <span
          className="grid h-8 w-8 place-items-center text-[15px] font-bold"
          style={{ background: MONO.ink, color: MONO.paper }}
        >
          G
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[17px] font-semibold tracking-[-0.02em]">
            Gateworks
          </span>
          <span
            className="mt-1 text-[9px] font-medium uppercase tracking-[0.34em]"
            style={{ color: MONO.muted }}
          >
            Mono Edition
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <span
          className="hidden text-[10px] font-medium uppercase tracking-[0.28em] sm:block"
          style={{ color: MONO.muted }}
        >
          Steel &amp; Gate Hardware
        </span>
        <span
          className="grid h-8 w-8 place-items-center text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ border: `1px solid ${MONO.lineStrong}` }}
        >
          NS
        </span>
      </div>
    </header>
  );
}

function MonoNav({ active }: { active: string }) {
  return (
    <nav
      className="flex items-stretch overflow-x-auto"
      style={{ borderBottom: `1px solid ${MONO.line}` }}
    >
      {NAV.map((item, index) => {
        const on = item.label.toLowerCase() === active.toLowerCase();
        return (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors"
            style={{
              color: on ? MONO.paper : MONO.steel,
              background: on ? MONO.ink : "transparent",
              borderLeft: index === 0 ? undefined : `1px solid ${MONO.line}`
            }}
          >
            <span
              className="mr-2 text-[9px] tabular-nums"
              style={{ color: on ? "rgba(255,255,255,0.45)" : MONO.muted }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MonoFooter() {
  return (
    <footer
      className="mt-auto px-6 py-8 sm:px-10"
      style={{ borderTop: `1px solid ${MONO.line}` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[18px] font-semibold tracking-[-0.02em]">
            Gateworks
          </p>
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.22em]"
            style={{ color: MONO.muted }}
          >
            Design Lab — Concept 02 / Mono
          </p>
        </div>
        <p
          className="max-w-xs text-[12px] leading-relaxed"
          style={{ color: MONO.steel }}
        >
          A disciplined, type-driven storefront. Monochrome by intent — the
          grid does the work.
        </p>
      </div>
    </footer>
  );
}

/* ----------------------------------------------------------------------- */
/* Primitives                                                              */
/* ----------------------------------------------------------------------- */

/** Section block with editorial side-padding. */
export function Section({
  children,
  className = "",
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`px-6 sm:px-10 ${className}`} style={style}>
      {children}
    </section>
  );
}

/** Small uppercase label / kicker. */
export function Label({
  children,
  className = "",
  index
}: {
  children: ReactNode;
  className?: string;
  index?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] ${className}`}
      style={{ color: MONO.muted }}
    >
      {index ? (
        <span
          className="tabular-nums"
          style={{ color: MONO.ink }}
        >
          {index}
        </span>
      ) : null}
      {children}
    </p>
  );
}

/** Section header: kicker + big headline + optional rule. */
export function SectionHead({
  kicker,
  title,
  action,
  index
}: {
  kicker: string;
  title: string;
  action?: ReactNode;
  index?: string;
}) {
  return (
    <div
      className="flex flex-wrap items-end justify-between gap-4 pb-5"
      style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
    >
      <div>
        <Label index={index}>{kicker}</Label>
        <h2 className="mt-2.5 text-[26px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[32px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/** Hairline-bordered button. */
export function MonoButton({
  children,
  href,
  onClick,
  type = "button",
  variant = "solid",
  full = false,
  disabled = false
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "outline";
  full?: boolean;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors";
  const style: CSSProperties =
    variant === "solid"
      ? { background: MONO.ink, color: MONO.paper }
      : {
          background: MONO.paper,
          color: MONO.ink,
          border: `1px solid ${MONO.lineStrong}`
        };
  const cls = `${base} ${full ? "w-full" : ""} ${
    disabled ? "cursor-not-allowed opacity-40" : ""
  } ${variant === "outline" ? "hover:bg-[#0a0a0a] hover:text-white" : "hover:bg-[#333333]"}`;

  if (href && !disabled) {
    return (
      <Link className={cls} href={href} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button
      className={cls}
      disabled={disabled}
      onClick={onClick}
      style={style}
      type={type}
    >
      {children}
    </button>
  );
}

/**
 * Product image in a calm, light well. Falls back to a typographic monogram
 * tile when no usable image url exists.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 50vw, 320px",
  priority = false,
  pad = "p-6"
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  pad?: string;
}) {
  const usable = src && src !== "/assets/logo.svg" && !src.includes("noimage");
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: MONO.mist }}
    >
      {usable ? (
        <Image
          alt={alt}
          src={src as string}
          fill
          priority={priority}
          quality={75}
          sizes={sizes}
          className={`object-contain ${pad}`}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span
            className="text-[44px] font-semibold tracking-[-0.04em]"
            style={{ color: MONO.line }}
          >
            GW
          </span>
        </div>
      )}
    </div>
  );
}

/** Mono status pill — hairline outline, no color. */
export function Pill({
  children,
  filled = false
}: {
  children: ReactNode;
  filled?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
      style={
        filled
          ? { background: MONO.ink, color: MONO.paper }
          : { border: `1px solid ${MONO.lineStrong}`, color: MONO.ink }
      }
    >
      {children}
    </span>
  );
}

/** Big editorial statistic. */
export function Stat({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-5">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: MONO.muted }}
      >
        {label}
      </span>
      <span className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}
      </span>
      {note ? (
        <span className="text-[11px]" style={{ color: MONO.steel }}>
          {note}
        </span>
      ) : null}
    </div>
  );
}
