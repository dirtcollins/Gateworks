// d11 "Wayfinder" — shared shell, primitives, and design system.
// Ported faithfully from the Gateworks storefront prototype
// (prototype/index.html + shell.jsx + icons.jsx). Industrial Pro palette,
// Inter (UI) + JetBrains Mono (technical / SKU), hairline cards,
// cross-hatch placeholders, and the black context bar.
"use client";

import Link from "next/link";
import Image from "next/image";
import { Inter, JetBrains_Mono } from "next/font/google";
import {
  useId,
  type CSSProperties,
  type ReactNode,
  type SVGProps
} from "react";
import type { Product } from "@/lib/types";

// ─── Fonts (self-contained — no global config edits) ─────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--d11-sans"
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--d11-mono"
});

// ─── Palette (from the prototype's :root) ────────────────────────────────────
export const d11 = {
  ink: "#111111",
  steel: "#5c5a54",
  muted: "#7c786f",
  rail: "#d8d3ca",
  hairline: "#e6e1d6",
  paper: "#f3f0e9",
  bone: "#faf8f2",
  pine: "#2f6f4e",
  pineDeep: "#235039",
  amber: "#eee6d8",
  amberDeep: "#e7d9b8",
  red: "#b42318",
  safety: "#f4a300"
} as const;

export const monoFont = "var(--d11-mono), ui-monospace, SFMono-Regular, Menlo, monospace";
export const sansFont = "var(--d11-sans), ui-sans-serif, -apple-system, 'Segoe UI', sans-serif";

// ─── Currency / helper ───────────────────────────────────────────────────────
export function fmt(value: number, opts: { cents?: boolean } = {}): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const cents = opts.cents ?? true;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0
  })}`;
}

// Deterministic warehouse wayfinding values derived from a product id, so the
// design's aisle/bay/stock tags render with stable, representative values
// (the real catalog has no aisle/bay data — these are presentational only).
export function wayfinding(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const aisle = String(8 + (hash % 40)).padStart(2, "0");
  const bay = String(1 + (hash % 18)).padStart(3, "0");
  const stock = 12 + (hash % 220);
  return { aisle, bay, stock };
}

// ─── Icon set (Lucide-style, 1.6 stroke — ported from icons.jsx) ─────────────
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Ico = {
  search: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  ),
  cart: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 4h2l2.4 12.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L21 8H6" />
      <circle cx="10" cy="21" r="1.2" />
      <circle cx="18" cy="21" r="1.2" />
    </Icon>
  ),
  user: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  ),
  pin: (p: IconProps) => (
    <Icon {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  ),
  phone: (p: IconProps) => (
    <Icon {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
    </Icon>
  ),
  check: (p: IconProps) => (
    <Icon {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  ),
  x: (p: IconProps) => (
    <Icon {...p}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  ),
  plus: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  ),
  arrowRight: (p: IconProps) => (
    <Icon {...p}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  ),
  chevronDown: (p: IconProps) => (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  ),
  chevronRight: (p: IconProps) => (
    <Icon {...p}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  ),
  grid: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </Icon>
  ),
  hammer: (p: IconProps) => (
    <Icon {...p}>
      <path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
      <path d="m17.64 15 3.5-3.5a2.12 2.12 0 0 0 0-3l-1.4-1.4a2.12 2.12 0 0 0-3 0L13.24 10.6" />
      <path d="M15 5 9.5 10.5" />
    </Icon>
  ),
  clipboard: (p: IconProps) => (
    <Icon {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </Icon>
  ),
  bookmark: (p: IconProps) => (
    <Icon {...p}>
      <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </Icon>
  ),
  trash: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Icon>
  ),
  star: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </Icon>
  ),
  truck: (p: IconProps) => (
    <Icon {...p}>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-3.34a1 1 0 0 0-.3-.7L18 8.5V17h-3" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </Icon>
  ),
  map: (p: IconProps) => (
    <Icon {...p}>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </Icon>
  ),
  receipt: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </Icon>
  ),
  layers: (p: IconProps) => (
    <Icon {...p}>
      <path d="m12 2 9 4.9-9 4.9-9-4.9 9-4.9z" />
      <path d="m3 12.1 9 4.9 9-4.9" />
      <path d="m3 17.1 9 4.9 9-4.9" />
    </Icon>
  ),
  pkg: (p: IconProps) => (
    <Icon {...p}>
      <path d="M16.5 9.4 7.5 4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <path d="M12 22.08V12" />
    </Icon>
  ),
  zap: (p: IconProps) => (
    <Icon {...p}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </Icon>
  )
};

// ─── Type primitives ─────────────────────────────────────────────────────────
export function Eyebrow({
  children,
  style
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: d11.steel,
        margin: 0,
        ...style
      }}
    >
      {children}
    </p>
  );
}

export function Mono({
  children,
  style
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span style={{ fontFamily: monoFont, fontFeatureSettings: '"calt" off', ...style }}>
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  style
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${d11.rail}`, ...style }}>
      {children}
    </div>
  );
}

// ─── Cross-hatch placeholder (.ph) — used behind real product imagery ────────
export function CrossHatch({
  ratio = 1,
  sku,
  label,
  children,
  style
}: {
  ratio?: number;
  sku?: string;
  label?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: String(ratio),
        backgroundColor: "#fff",
        backgroundImage:
          `linear-gradient(135deg, ${d11.hairline} 0 1px, transparent 1px 8px),` +
          `linear-gradient(45deg, ${d11.hairline} 0 1px, transparent 1px 8px)`,
        overflow: "hidden",
        ...style
      }}
    >
      {children}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(255,255,255,0.85) 95%)",
          pointerEvents: "none"
        }}
      />
      {sku ? (
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontFamily: monoFont,
            fontSize: 9,
            letterSpacing: "0.04em",
            color: d11.muted,
            textTransform: "uppercase",
            zIndex: 1
          }}
        >
          SKU {sku}
        </span>
      ) : null}
      {label ? (
        <span
          style={{
            position: "absolute",
            inset: "auto 8px 6px 8px",
            fontFamily: monoFont,
            fontSize: 10,
            lineHeight: 1.2,
            color: d11.steel,
            textAlign: "center",
            zIndex: 1
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

// ─── Product image — real photo over the cross-hatch placeholder ─────────────
export function ProductImage({
  product,
  src,
  ratio = 1,
  sku,
  sizes = "320px",
  priority
}: {
  product: Product;
  src?: string;
  ratio?: number;
  sku?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const url =
    src || product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg";
  return (
    <CrossHatch ratio={ratio} sku={sku ?? product.variants[0]?.sku}>
      <Image
        alt={product.title}
        src={url}
        fill
        quality={75}
        sizes={sizes}
        priority={priority}
        style={{ objectFit: "contain", padding: "8%", zIndex: 1 }}
      />
    </CrossHatch>
  );
}

// ─── Tag (stock state) ───────────────────────────────────────────────────────
export function Tag({
  tone = "steel",
  children,
  style
}: {
  tone?: "steel" | "in" | "out" | "solid";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const color =
    tone === "in" ? d11.pine : tone === "out" ? d11.red : tone === "solid" ? "#fff" : d11.steel;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        border: `1px solid ${tone === "solid" ? d11.ink : "currentColor"}`,
        color,
        background: tone === "solid" ? d11.ink : "transparent",
        ...style
      }}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "rail" }: { tone?: "rail" | "in" | "out" | "low" }) {
  const bg =
    tone === "in" ? d11.pine : tone === "out" ? d11.red : tone === "low" ? d11.safety : d11.rail;
  return (
    <span
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: bg }}
    />
  );
}

// Stock label that mirrors the prototype's StockLabel, with derived values.
export function StockTag({ product }: { product: Product }) {
  const { aisle, bay, stock } = wayfinding(product.id);
  if (stock < 18) {
    return (
      <Tag tone="steel" style={{ color: d11.safety }}>
        <Dot tone="low" /> Low · {stock} left
      </Tag>
    );
  }
  return (
    <Tag tone="in">
      <Dot tone="in" /> {stock} in stock · Aisle {aisle}, Bay {bay}
    </Tag>
  );
}

// ─── Buttons (.btn family) ───────────────────────────────────────────────────
type BtnProps = {
  children: ReactNode;
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "md" | "sm" | "xs";
  block?: boolean;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
  title?: string;
};

function btnStyle(
  variant: BtnProps["variant"],
  size: BtnProps["size"],
  block?: boolean
): CSSProperties {
  const h = size === "xs" ? 28 : size === "sm" ? 36 : 44;
  const fs = size === "xs" ? 11 : size === "sm" ? 12 : 13;
  const pad = size === "xs" ? "0 10px" : size === "sm" ? "0 12px" : "0 18px";
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: h,
    padding: pad,
    fontSize: fs,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border: `1px solid ${d11.rail}`,
    background: "#fff",
    color: d11.ink,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease",
    width: block ? "100%" : undefined
  };
  if (variant === "primary") {
    return {
      ...base,
      background: d11.ink,
      color: "#fff",
      borderColor: d11.ink,
      fontWeight: 900,
      letterSpacing: "0.08em"
    };
  }
  if (variant === "ghost") return { ...base, background: "transparent" };
  if (variant === "danger") return { ...base, color: d11.red };
  return base;
}

export function Btn({
  children,
  variant = "default",
  size = "md",
  block,
  href,
  onClick,
  disabled,
  type = "button",
  style,
  title
}: BtnProps) {
  const merged = { ...btnStyle(variant, size, block), ...style };
  if (href && !disabled) {
    return (
      <Link href={href} style={merged} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...merged, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────
export function Chip({
  children,
  on,
  onClick,
  style
}: {
  children: ReactNode;
  on?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 36,
        padding: "0 12px",
        fontSize: 12,
        fontWeight: 700,
        color: d11.ink,
        cursor: "pointer",
        border: on ? `2px solid ${d11.ink}` : `1px solid ${d11.rail}`,
        background: on ? d11.amber : "#fff",
        ...style
      }}
    >
      {children}
    </button>
  );
}

// ─── Quantity stepper (.qty) ─────────────────────────────────────────────────
export function Qty({
  value,
  onChange,
  height = 40
}: {
  value: number;
  onChange: (next: number) => void;
  height?: number;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        border: `1px solid ${d11.rail}`,
        height,
        background: "#fff"
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        style={{
          width: 36,
          fontSize: 18,
          fontWeight: 700,
          color: d11.ink,
          background: "none",
          border: "none",
          cursor: "pointer"
        }}
      >
        −
      </button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
        style={{
          width: 52,
          textAlign: "center",
          border: "none",
          borderLeft: `1px solid ${d11.rail}`,
          borderRight: `1px solid ${d11.rail}`,
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 14,
          background: "transparent",
          outline: "none"
        }}
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{
          width: 36,
          fontSize: 18,
          fontWeight: 700,
          color: d11.ink,
          background: "none",
          border: "none",
          cursor: "pointer"
        }}
      >
        +
      </button>
    </div>
  );
}

// ─── Rating ──────────────────────────────────────────────────────────────────
export function Rating({
  value = 4.7,
  count = 0,
  size = 12
}: {
  value?: number;
  count?: number;
  size?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: d11.steel,
        fontSize: 11,
        fontWeight: 700
      }}
    >
      <span style={{ display: "inline-flex", color: d11.ink }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Ico.star
            key={i}
            size={size}
            style={{ fill: i < Math.round(value) ? d11.ink : "transparent", stroke: d11.ink }}
          />
        ))}
      </span>
      <Mono>{value.toFixed(1)}</Mono>
      <span style={{ opacity: 0.7 }}>({count.toLocaleString()})</span>
    </span>
  );
}

// ─── Shared shell — top nav, context bar, department strip ───────────────────
type NavKey = "home" | "category" | "product" | "cart" | "orders" | "reports";

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "category", label: "Catalog", href: "/design-lab/d11/category" },
  { key: "orders", label: "Orders", href: "/design-lab/d11/orders" },
  { key: "reports", label: "Reports", href: "/design-lab/d11/reports" }
];

export function D11Shell({
  active,
  cartCount = 0,
  departments,
  children
}: {
  active: NavKey;
  cartCount?: number;
  departments?: { slug: string; name: string; aisle: string }[];
  children: ReactNode;
}) {
  const searchId = useId();
  return (
    <div
      className={`${inter.variable} ${mono.variable}`}
      style={{
        fontFamily: sansFont,
        background: d11.paper,
        color: d11.ink,
        minHeight: "100vh"
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${d11.rail}`,
          position: "sticky",
          top: 0,
          zIndex: 30
        }}
      >
        {/* Black context bar */}
        <div
          style={{
            background: d11.ink,
            color: "#fff",
            padding: "6px 24px",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.pin size={12} /> Bakersfield · Aisle map · 48 aisles
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.phone size={12} /> 661-555-0100
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
            <span style={{ color: d11.amber }}>11A will-call cutoff</span>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: d11.pine,
              fontWeight: 800
            }}
          >
            <Ico.user size={12} /> Pro · Henderson Iron
          </span>
        </div>

        {/* Main nav row */}
        <div
          style={{
            padding: "14px 24px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: 24
          }}
        >
          <Link
            href="/design-lab/d11/home"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <Image
              src="/assets/logo.svg"
              alt="Gateworks"
              width={120}
              height={26}
              style={{ height: 26, width: "auto", display: "block" }}
            />
          </Link>

          <form
            action="/design-lab/d11/category"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              border: `1px solid ${d11.rail}`,
              background: "#fff",
              height: 44
            }}
          >
            <label
              htmlFor={searchId}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                alignItems: "center",
                padding: "0 12px"
              }}
            >
              <Ico.search size={18} />
              <input
                id={searchId}
                name="q"
                type="search"
                placeholder="Search hardware, tube, fence, welding…"
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "0 12px",
                  height: "100%",
                  fontSize: 14,
                  fontWeight: 600,
                  outline: "none"
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                padding: "0 22px",
                background: d11.ink,
                color: "#fff",
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                border: "none",
                cursor: "pointer"
              }}
            >
              Search
            </button>
          </form>

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: d11.ink,
                    border: `1px solid ${isActive ? d11.ink : "transparent"}`,
                    background: isActive ? d11.paper : "transparent"
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/design-lab/d11/cart"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: d11.ink,
                border: `1px solid ${active === "cart" ? d11.ink : "transparent"}`,
                background: active === "cart" ? d11.paper : "transparent"
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                <Ico.cart size={16} />
                {cartCount > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      background: d11.pine,
                      color: "#fff",
                      borderRadius: 8,
                      fontFamily: monoFont,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    {cartCount}
                  </span>
                ) : null}
              </span>
              Cart
            </Link>
          </nav>
        </div>

        {/* Department strip with aisle codes */}
        {departments && departments.length ? (
          <div
            style={{
              borderTop: `1px solid ${d11.hairline}`,
              background: d11.bone,
              padding: "0 24px",
              display: "flex",
              alignItems: "stretch",
              overflowX: "auto"
            }}
          >
            <Link
              href="/design-lab/d11/category"
              style={{
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: active === "category" ? d11.ink : d11.steel,
                borderBottom: `2px solid ${active === "category" ? d11.ink : "transparent"}`,
                whiteSpace: "nowrap"
              }}
            >
              All
            </Link>
            {departments.map((dept, index) => (
              <Link
                key={dept.slug}
                href={{ pathname: "/design-lab/d11/category", query: { c: dept.slug } }}
                style={{
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: d11.steel,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {dept.name}
                <Mono
                  style={{ fontSize: 9, color: d11.muted, fontWeight: 500 }}
                >
                  A{dept.aisle ?? String(8 + index)}
                </Mono>
              </Link>
            ))}
          </div>
        ) : null}
      </header>

      <main style={{ background: d11.paper }}>{children}</main>

      <footer
        style={{
          borderTop: `1px solid ${d11.rail}`,
          background: d11.bone,
          padding: "22px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <Mono style={{ fontSize: 11, color: d11.muted, textTransform: "uppercase" }}>
          Gateworks Supply · Bakersfield Warehouse · 2210 Pegasus Dr
        </Mono>
        <Mono style={{ fontSize: 11, color: d11.muted, textTransform: "uppercase" }}>
          Design Lab · d11 Wayfinder
        </Mono>
      </footer>
    </div>
  );
}
