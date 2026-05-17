"use client";

/**
 * DESIGN 5 — "COMPACT UTILITY"
 * A terminal for steel. Ultra information-dense, keyboard-forward, minimal chrome.
 * Shared identity kit: tokens, chrome, and primitives used across all 6 previews.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Boxes,
  ClipboardList,
  Command,
  Cuboid,
  Gauge,
  Keyboard,
  LayoutGrid,
  type LucideIcon,
  PanelsTopLeft,
  Search,
  ShoppingCart,
  Terminal
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tokens                                                             */
/* ------------------------------------------------------------------ */

export const D5 = {
  bg: "#0c0d10",
  panel: "#131419",
  panelHi: "#181a20",
  line: "#242630",
  lineHi: "#33363f",
  ink: "#e8e9ed",
  dim: "#9a9da8",
  faint: "#646773",
  accent: "#5ee6a8",
  accentDim: "#1d4536",
  amber: "#f5c451",
  red: "#f6685e",
  blue: "#6aa6ff"
} as const;

export const mono =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

/* ------------------------------------------------------------------ */
/* Nav                                                                */
/* ------------------------------------------------------------------ */

type NavItem = { href: string; label: string; key: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { href: "/design-lab/d5/home", label: "Home", key: "H", icon: Terminal },
  { href: "/design-lab/d5/category", label: "Catalog", key: "C", icon: LayoutGrid },
  { href: "/design-lab/d5/product", label: "Product", key: "P", icon: Cuboid },
  { href: "/design-lab/d5/cart", label: "Cart", key: "B", icon: ShoppingCart },
  { href: "/design-lab/d5/orders", label: "Orders", key: "O", icon: ClipboardList },
  { href: "/design-lab/d5/reports", label: "Reports", key: "R", icon: Gauge }
];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex min-w-[1.05rem] items-center justify-center rounded border px-1 text-[9px] font-semibold leading-none"
      style={{
        fontFamily: mono,
        borderColor: D5.lineHi,
        background: D5.bg,
        color: D5.dim,
        height: "1.05rem"
      }}
    >
      {children}
    </span>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

export function Tag({
  children,
  tone = "dim"
}: {
  children: ReactNode;
  tone?: "dim" | "accent" | "amber" | "red" | "blue";
}) {
  const map = {
    dim: { bg: D5.panelHi, fg: D5.dim, bd: D5.line },
    accent: { bg: D5.accentDim, fg: D5.accent, bd: "transparent" },
    amber: { bg: "#3a300f", fg: D5.amber, bd: "transparent" },
    red: { bg: "#3a1916", fg: D5.red, bd: "transparent" },
    blue: { bg: "#16243f", fg: D5.blue, bd: "transparent" }
  } as const;
  const c = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}`, fontFamily: mono }}
    >
      {children}
    </span>
  );
}

export function Panel({
  title,
  hint,
  right,
  children,
  className = ""
}: {
  title?: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border ${className}`}
      style={{ borderColor: D5.line, background: D5.panel }}
    >
      {title ? (
        <header
          className="flex items-center justify-between border-b px-3 py-2"
          style={{ borderColor: D5.line }}
        >
          <div className="flex items-baseline gap-2">
            <h2
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: D5.ink }}
            >
              {title}
            </h2>
            {hint ? (
              <span className="text-[10px]" style={{ color: D5.faint, fontFamily: mono }}>
                {hint}
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

export function Btn({
  children,
  onClick,
  href,
  variant = "ghost",
  size = "sm"
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "xs";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded font-semibold transition-colors whitespace-nowrap";
  const sizing = size === "xs" ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-[11px]";
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: D5.accent, color: D5.bg, border: "1px solid transparent" },
    ghost: { background: D5.panelHi, color: D5.ink, border: `1px solid ${D5.line}` },
    danger: { background: "#3a1916", color: D5.red, border: `1px solid #5a2620` }
  };
  const cls = `${base} ${sizing} hover:brightness-110`;
  if (href) {
    return (
      <Link href={href} className={cls} style={styles[variant]}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={styles[variant]}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Command palette (Cmd/Ctrl+K)                                        */
/* ------------------------------------------------------------------ */

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;
  const rows = NAV.filter((n) => n.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(4,5,7,0.72)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border shadow-2xl"
        style={{ borderColor: D5.lineHi, background: D5.panel }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 border-b px-3 py-2.5"
          style={{ borderColor: D5.line }}
        >
          <Command size={14} style={{ color: D5.accent }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to page, search SKU, run command..."
            className="w-full bg-transparent text-[13px] outline-none"
            style={{ color: D5.ink }}
          />
          <Kbd>ESC</Kbd>
        </div>
        <div className="max-h-72 overflow-auto py-1">
          {rows.length === 0 ? (
            <p className="px-3 py-3 text-[12px]" style={{ color: D5.faint }}>
              No matches for &ldquo;{q}&rdquo;
            </p>
          ) : (
            rows.map((n) => {
              const active = pathname === n.href;
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onClose}
                  className="flex items-center gap-2.5 px-3 py-2 text-[12px] hover:brightness-125"
                  style={{ background: active ? D5.panelHi : "transparent", color: D5.ink }}
                >
                  <Icon size={13} style={{ color: D5.dim }} />
                  <span className="flex-1">Go to {n.label}</span>
                  <Kbd>{n.key}</Kbd>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function Shell({
  children,
  crumb
}: {
  children: ReactNode;
  crumb: string;
}) {
  const pathname = usePathname();
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (e.key === "Escape") setPalette(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="min-h-screen text-[13px]"
      style={{ background: D5.bg, color: D5.ink, fontFamily: mono }}
    >
      {/* top command bar */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ borderColor: D5.line, background: D5.panel }}
      >
        <div className="mx-auto flex h-11 max-w-[1480px] items-center gap-3 px-3">
          <Link href="/design-lab/d5/home" className="flex items-center gap-2">
            <span
              className="grid h-6 w-6 place-items-center rounded"
              style={{ background: D5.accent, color: D5.bg }}
            >
              <Boxes size={14} />
            </span>
            <span
              className="text-[12px] font-bold tracking-tight"
              style={{ color: D5.ink }}
            >
              GATEWORKS
              <span style={{ color: D5.faint }}> //d5</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setPalette(true)}
            className="flex h-7 flex-1 items-center gap-2 rounded border px-2.5"
            style={{ borderColor: D5.line, background: D5.bg, color: D5.faint }}
          >
            <Search size={13} />
            <span className="text-[11px]">Search SKU, spec, order, customer&hellip;</span>
            <span className="ml-auto flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-semibold transition-colors"
                  style={{
                    background: active ? D5.panelHi : "transparent",
                    color: active ? D5.ink : D5.dim,
                    border: `1px solid ${active ? D5.lineHi : "transparent"}`
                  }}
                >
                  <Icon size={13} style={{ color: active ? D5.accent : D5.faint }} />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="hidden items-center gap-1.5 rounded border px-2 py-1 sm:flex"
            style={{ borderColor: D5.line }}
          >
            <Dot color={D5.accent} />
            <span className="text-[10px]" style={{ color: D5.dim }}>
              PRO · Hoover Hardware
            </span>
          </div>
        </div>

        {/* mobile nav strip */}
        <nav
          className="flex items-center gap-0.5 overflow-x-auto border-t px-3 py-1.5 lg:hidden"
          style={{ borderColor: D5.line }}
        >
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="rounded px-2 py-1 text-[11px] font-semibold"
                style={{
                  background: active ? D5.panelHi : "transparent",
                  color: active ? D5.ink : D5.dim
                }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* breadcrumb / status strip */}
      <div
        className="border-b"
        style={{ borderColor: D5.line, background: D5.bg }}
      >
        <div className="mx-auto flex h-7 max-w-[1480px] items-center justify-between px-3">
          <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: D5.faint }}>
            <span style={{ color: D5.accent }}>~/gateworks</span> / {crumb}
          </span>
          <span
            className="hidden items-center gap-1 text-[10px] sm:flex"
            style={{ color: D5.faint }}
          >
            <Keyboard size={11} /> keyboard-first ·{" "}
            <span style={{ color: D5.dim }}>{new Date().toISOString().slice(0, 10)}</span>
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[1480px] px-3 py-4">{children}</main>

      <footer
        className="border-t"
        style={{ borderColor: D5.line, background: D5.panel }}
      >
        <div
          className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[10px]"
          style={{ color: D5.faint }}
        >
          <span className="flex items-center gap-1.5">
            <PanelsTopLeft size={11} /> Gateworks Compact Utility — design preview 5
          </span>
          <span>Press ⌘K anywhere · No fluff, maximum signal</span>
        </div>
      </footer>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function H({ children }: { children: ReactNode }) {
  return (
    <h1
      className="text-[15px] font-bold tracking-tight"
      style={{ color: D5.ink }}
    >
      {children}
    </h1>
  );
}
