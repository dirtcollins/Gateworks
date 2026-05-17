"use client";

/**
 * DESIGN 5 — "FIELD OPS"
 * Rugged, field-ready storefront for a contractor on a jobsite. High-contrast
 * near-black + concrete grays with a hi-vis safety-orange accent. Chunky touch
 * targets, heavy uppercase type, sticky action bars. Built mobile-first.
 *
 * Shared identity kit: design tokens, app chrome, and UI primitives reused
 * across all six Field Ops pages.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ClipboardList,
  Grid3x3,
  Hammer,
  LineChart,
  Menu,
  Package,
  ShoppingCart,
  X,
  type LucideIcon
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tokens — hi-vis rugged palette                                      */
/* ------------------------------------------------------------------ */

export const FO = {
  /** near-black base */
  black: "#16140f",
  /** raised surface */
  panel: "#1f1d17",
  /** higher surface */
  panelHi: "#272420",
  /** concrete card on light sections */
  steel: "#2e2b25",
  line: "#3a352c",
  lineHi: "#4c4639",
  /** primary text */
  ink: "#f4f1e9",
  /** secondary text */
  dim: "#a8a292",
  /** tertiary text */
  faint: "#736d5e",
  /** hi-vis safety orange — the brand accent */
  hi: "#ff5a1f",
  hiDark: "#c8400f",
  hiSoft: "#3a1f10",
  /** status */
  go: "#3fd07a",
  goSoft: "#16301f",
  warn: "#f5b423",
  warnSoft: "#352a0f",
  stop: "#f5564a",
  stopSoft: "#3a1a17"
} as const;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/design-lab/d5/home", label: "Base", icon: Hammer },
  { href: "/design-lab/d5/category", label: "Catalog", icon: Grid3x3 },
  { href: "/design-lab/d5/product", label: "Gear", icon: Package },
  { href: "/design-lab/d5/cart", label: "Cart", icon: ShoppingCart },
  { href: "/design-lab/d5/orders", label: "Orders", icon: ClipboardList },
  { href: "/design-lab/d5/reports", label: "Reports", icon: LineChart }
];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/** Bold uppercase eyebrow tag with a hi-vis tick. */
export function Stamp({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]"
      style={{ color: FO.hi }}
    >
      <span className="h-2.5 w-2.5" style={{ background: FO.hi }} />
      {children}
    </span>
  );
}

type Tone = "hi" | "go" | "warn" | "stop" | "steel";

const TONE_MAP: Record<Tone, { bg: string; fg: string }> = {
  hi: { bg: FO.hiSoft, fg: FO.hi },
  go: { bg: FO.goSoft, fg: FO.go },
  warn: { bg: FO.warnSoft, fg: FO.warn },
  stop: { bg: FO.stopSoft, fg: FO.stop },
  steel: { bg: FO.panelHi, fg: FO.dim }
};

/** Strong status chip. */
export function Chip({
  children,
  tone = "steel"
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const c = TONE_MAP[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
      style={{ background: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}

/** Hi-vis status dot. */
export function Beacon({ tone = "go" }: { tone?: Tone }) {
  const c = TONE_MAP[tone];
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: c.fg, boxShadow: `0 0 8px ${c.fg}` }}
    />
  );
}

/** Chunky, glove-friendly button. Renders as a link when href is set. */
export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  full = false,
  type = "button",
  ariaLabel
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "dark" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  const sizing =
    size === "lg"
      ? "h-14 px-7 text-sm"
      : size === "sm"
        ? "h-10 px-4 text-[11px]"
        : "h-12 px-6 text-xs";
  const variants: Record<string, CSSProperties> = {
    primary: { background: FO.hi, color: FO.black },
    dark: { background: FO.panelHi, color: FO.ink, border: `2px solid ${FO.line}` },
    outline: { background: "transparent", color: FO.ink, border: `2px solid ${FO.lineHi}` },
    danger: { background: FO.stopSoft, color: FO.stop, border: `2px solid ${FO.stop}` }
  };
  const cls = `inline-flex items-center justify-center gap-2 font-black uppercase tracking-[0.12em] transition-[filter,transform] active:scale-[0.98] hover:brightness-110 ${sizing} ${
    full ? "w-full" : ""
  }`;
  if (href) {
    return (
      <Link aria-label={ariaLabel} href={href} className={cls} style={variants[variant]}>
        {children}
      </Link>
    );
  }
  return (
    <button
      aria-label={ariaLabel}
      type={type}
      onClick={onClick}
      className={cls}
      style={variants[variant]}
    >
      {children}
    </button>
  );
}

/** Hard-edged panel with a heavy header strip. */
export function Panel({
  title,
  kicker,
  right,
  children,
  className = ""
}: {
  title?: string;
  kicker?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={className}
      style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
    >
      {title ? (
        <header
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: `2px solid ${FO.line}` }}
        >
          <div className="flex items-baseline gap-2.5">
            <h2
              className="text-[13px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.ink }}
            >
              {title}
            </h2>
            {kicker ? (
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: FO.faint }}
              >
                {kicker}
              </span>
            ) : null}
          </div>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Heavy page heading. */
export function Title({ children }: { children: ReactNode }) {
  return (
    <h1
      className="text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl"
      style={{ color: FO.ink }}
    >
      {children}
    </h1>
  );
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */

export function Shell({
  children,
  crumb,
  wide = false
}: {
  children: ReactNode;
  crumb: string;
  wide?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const maxW = wide ? "max-w-[1440px]" : "max-w-[1200px]";

  return (
    <div className="min-h-screen" style={{ background: FO.black, color: FO.ink }}>
      {/* Hazard stripe accent */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, ${FO.hi} 0 14px, ${FO.black} 14px 28px)`
        }}
      />

      {/* Top bar */}
      <header
        className="sticky top-0 z-40"
        style={{ background: FO.black, borderBottom: `2px solid ${FO.line}` }}
      >
        <div className={`mx-auto flex h-16 items-center gap-3 px-4 ${maxW}`}>
          <Link href="/design-lab/d5/home" className="flex items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center"
              style={{ background: FO.hi, color: FO.black }}
            >
              <Hammer size={18} strokeWidth={2.75} />
            </span>
            <span className="leading-none">
              <span
                className="block text-base font-black uppercase tracking-[0.06em]"
                style={{ color: FO.ink }}
              >
                Gateworks
              </span>
              <span
                className="block text-[9px] font-black uppercase tracking-[0.34em]"
                style={{ color: FO.hi }}
              >
                Field Ops
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-10 items-center gap-2 px-3.5 text-[11px] font-black uppercase tracking-[0.12em] transition-colors"
                  style={{
                    background: active ? FO.hi : "transparent",
                    color: active ? FO.black : FO.dim
                  }}
                >
                  <Icon size={15} strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto grid h-11 w-11 place-items-center lg:hidden"
            style={{ background: FO.panelHi, color: FO.ink, border: `2px solid ${FO.line}` }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen ? (
          <nav
            className="grid grid-cols-2 gap-px lg:hidden"
            style={{ background: FO.line, borderTop: `2px solid ${FO.line}` }}
          >
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex h-14 items-center gap-2.5 px-4 text-[12px] font-black uppercase tracking-[0.12em]"
                  style={{
                    background: active ? FO.hi : FO.panel,
                    color: active ? FO.black : FO.ink
                  }}
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </header>

      {/* Breadcrumb strip */}
      <div style={{ background: FO.panel, borderBottom: `2px solid ${FO.line}` }}>
        <div
          className={`mx-auto flex h-9 items-center justify-between px-4 ${maxW}`}
        >
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: FO.faint }}
          >
            <span style={{ color: FO.hi }}>Gateworks</span>
            <span className="px-1.5">/</span>
            {crumb}
          </span>
          <span
            className="hidden items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] sm:flex"
            style={{ color: FO.faint }}
          >
            <Beacon tone="go" /> Jobsite ready
          </span>
        </div>
      </div>

      <main className={`mx-auto px-4 py-6 ${maxW}`}>{children}</main>

      {/* Footer */}
      <footer style={{ background: FO.panel, borderTop: `2px solid ${FO.line}` }}>
        <div
          className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-5 ${maxW}`}
        >
          <span className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 place-items-center"
              style={{ background: FO.hi, color: FO.black }}
            >
              <Hammer size={14} strokeWidth={2.75} />
            </span>
            <span
              className="text-[11px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.dim }}
            >
              Gateworks Field Ops — design preview 5
            </span>
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: FO.faint }}
          >
            Built for the jobsite · Gloves on
          </span>
        </div>
        <div
          className="h-1.5 w-full"
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, ${FO.hi} 0 14px, ${FO.black} 14px 28px)`
          }}
        />
      </footer>
    </div>
  );
}
