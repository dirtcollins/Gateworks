"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Menu, ShoppingBag, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * DESIGN 6 — "APEX"
 * Cinematic dark. Deep near-black surfaces, glassmorphism, vignettes,
 * a single electric-blue accent used with restraint. Big confident
 * type, monospace technical labels, reverential product presentation.
 * ------------------------------------------------------------------ */

/* ---- Signature palette -------------------------------------------- */
export const apex = {
  void: "#08080b",
  base: "#0a0a0c",
  surface: "#101015",
  raised: "#16161d",
  line: "rgba(255,255,255,0.08)",
  lineSoft: "rgba(255,255,255,0.045)",
  text: "#f4f5f8",
  mute: "#9a9caa",
  faint: "#5e606e",
  accent: "#5b9dff",
  accentDeep: "#3a78e0",
  accentGlow: "rgba(91,157,255,0.5)"
};

export const mono =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

export const D6_NAV = [
  { label: "Home", href: "/design-lab/d6/home" },
  { label: "Catalog", href: "/design-lab/d6/category" },
  { label: "Hardware", href: "/design-lab/d6/product" },
  { label: "Cart", href: "/design-lab/d6/cart" }
];

export const D6_ADMIN_NAV = [
  { label: "Orders", href: "/design-lab/d6/orders" },
  { label: "Reports", href: "/design-lab/d6/reports" }
];

/* ---- Monospace technical label ------------------------------------ */
export function Mono({
  children,
  className,
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`text-[10.5px] uppercase tracking-[0.32em] ${className ?? ""}`}
      style={{ fontFamily: mono, ...style }}
    >
      {children}
    </span>
  );
}

/* ---- Eyebrow — accent tick + mono label --------------------------- */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="h-[5px] w-[5px] rotate-45"
        style={{
          background: apex.accent,
          boxShadow: `0 0 10px ${apex.accentGlow}`
        }}
      />
      <Mono style={{ color: apex.accent }}>{children}</Mono>
    </span>
  );
}

/* ---- Glass panel -------------------------------------------------- */
export function Panel({
  children,
  className,
  glow,
  style
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl ${className ?? ""}`}
      style={{
        borderColor: apex.line,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))",
        boxShadow: glow
          ? `0 0 0 1px ${apex.line}, 0 30px 80px -40px rgba(91,157,255,0.3)`
          : "0 24px 60px -48px rgba(0,0,0,0.9)",
        ...style
      }}
    >
      {children}
    </div>
  );
}

/* ---- Primary action ----------------------------------------------- */
export function ApexButton({
  children,
  href,
  onClick,
  variant = "primary",
  type = "button",
  className
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-300";
  const styled: CSSProperties =
    variant === "primary"
      ? {
          color: apex.void,
          background: `linear-gradient(135deg, ${apex.accent}, ${apex.accentDeep})`,
          boxShadow: `0 8px 30px -8px ${apex.accentGlow}`
        }
      : {
          color: apex.text,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${apex.line}`
        };

  const inner = <span className="flex items-center gap-2">{children}</span>;

  if (href) {
    return (
      <Link
        className={`${base} hover:-translate-y-0.5 ${className ?? ""}`}
        href={href}
        style={styled}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      className={`${base} hover:-translate-y-0.5 ${className ?? ""}`}
      onClick={onClick}
      style={styled}
      type={type}
    >
      {inner}
    </button>
  );
}

/* ---- Section header ----------------------------------------------- */
export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2
          className="mt-3 text-[2rem] font-medium leading-[1.05] tracking-[-0.03em] sm:text-[2.6rem]"
          style={{ color: apex.text }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/* ---- Header ------------------------------------------------------- */
function D6Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [...D6_NAV, ...D6_ADMIN_NAV];

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-2xl"
      style={{
        borderColor: apex.line,
        background: "rgba(8,8,11,0.78)"
      }}
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-8 px-6 py-4">
        <Link className="flex items-center gap-3" href="/design-lab/d6/home">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold"
            style={{
              color: apex.void,
              background: `linear-gradient(135deg, ${apex.accent}, ${apex.accentDeep})`,
              boxShadow: `0 0 22px -4px ${apex.accentGlow}`
            }}
          >
            G
          </span>
          <span className="leading-none">
            <span
              className="block text-[15px] font-semibold tracking-[0.16em]"
              style={{ color: apex.text }}
            >
              GATEWORKS
            </span>
            <Mono style={{ color: apex.faint }}>Apex System</Mono>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className="rounded-full px-3.5 py-2 text-[12px] font-medium tracking-[0.06em] transition-colors"
                href={item.href}
                style={{
                  color: active ? apex.text : apex.mute,
                  background: active ? "rgba(255,255,255,0.06)" : "transparent"
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            className="relative grid h-10 w-10 place-items-center rounded-full border transition-colors"
            href="/design-lab/d6/cart"
            style={{ borderColor: apex.line, color: apex.text }}
          >
            <ShoppingBag className="h-4 w-4" />
            <span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
              style={{
                background: apex.accent,
                boxShadow: `0 0 8px ${apex.accentGlow}`
              }}
            />
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-full border md:hidden"
            onClick={() => setOpen((value) => !value)}
            style={{ borderColor: apex.line, color: apex.text }}
            type="button"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="border-t px-6 py-3 md:hidden"
          style={{ borderColor: apex.line, background: apex.base }}
        >
          {links.map((item) => (
            <Link
              key={item.href}
              className="block border-b py-3 text-sm font-medium last:border-b-0"
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ borderColor: apex.lineSoft, color: apex.text }}
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
function D6Footer() {
  return (
    <footer
      className="mt-28 border-t"
      style={{ borderColor: apex.line, background: apex.void }}
    >
      <div className="mx-auto max-w-[1320px] px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold"
                style={{
                  color: apex.void,
                  background: `linear-gradient(135deg, ${apex.accent}, ${apex.accentDeep})`
                }}
              >
                G
              </span>
              <span
                className="text-sm font-semibold tracking-[0.16em]"
                style={{ color: apex.text }}
              >
                GATEWORKS
              </span>
            </div>
            <p
              className="mt-5 max-w-xs text-[13px] leading-relaxed"
              style={{ color: apex.mute }}
            >
              Precision gate hardware and structural steel, engineered for the
              trade and presented like the instruments they are.
            </p>
          </div>
          {[
            { head: "Catalog", links: ["Gate Hardware", "Steel Tubing", "Ornamental Iron", "Welding Supply"] },
            { head: "Operations", links: ["Order Console", "Financial Reports", "Will-Call", "Logistics"] },
            { head: "Company", links: ["The Apex Standard", "Engineering", "Locations", "Contact"] }
          ].map((col) => (
            <div key={col.head}>
              <Mono style={{ color: apex.accent }}>{col.head}</Mono>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <span
                      className="cursor-pointer text-[13px] transition-colors hover:text-white"
                      style={{ color: apex.mute }}
                    >
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t pt-6"
          style={{ borderColor: apex.line }}
        >
          <Mono style={{ color: apex.faint }}>
            © 2026 Gateworks — Apex System
          </Mono>
          <Mono style={{ color: apex.faint }}>
            Design Lab · Concept 6 / Apex
          </Mono>
        </div>
      </div>
    </footer>
  );
}

/* ---- Design badge ------------------------------------------------- */
export function D6DesignBadge() {
  return (
    <div
      className="flex items-center justify-between rounded-full border px-5 py-2.5 backdrop-blur-xl"
      style={{
        borderColor: apex.line,
        background: "rgba(255,255,255,0.03)"
      }}
    >
      <Mono style={{ color: apex.mute }}>
        Design Lab · Concept 6 — Apex
      </Mono>
      <Link
        className="flex items-center gap-1.5 transition-colors hover:opacity-80"
        href="/design-lab/d6/home"
        style={{ color: apex.accent }}
      >
        <Mono style={{ color: apex.accent }}>Restart tour</Mono>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/* ---- Page shell --------------------------------------------------- */
export function D6Page({
  children,
  wide
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="relative min-h-screen antialiased"
      style={{ background: apex.base, color: apex.text }}
    >
      {/* Ambient cinematic glows */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 520px at 78% -6%, rgba(91,157,255,0.16), transparent 62%), radial-gradient(760px 600px at 6% 108%, rgba(91,157,255,0.07), transparent 60%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, transparent 55%, rgba(0,0,0,0.7) 100%)"
        }}
      />
      <div className="relative z-10">
        <D6Header />
        <main
          className={`mx-auto px-6 ${wide ? "max-w-[1320px]" : "max-w-[1180px]"}`}
        >
          {children}
        </main>
        <D6Footer />
      </div>
    </div>
  );
}
