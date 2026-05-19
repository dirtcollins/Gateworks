// Wayfinder — shared design system: palette, fonts, icons, primitives.
// A warehouse-wayfinding storefront: warm paper/bone palette, Inter (UI) +
// JetBrains Mono (technical / SKU), hairline cards, cross-hatch placeholders,
// and the black aisle-map context bar. Self-contained styling — fonts loaded
// via next/font, no global Tailwind config edits.
"use client";

import Image from "next/image";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { CSSProperties, ReactNode, SVGProps } from "react";
import type { Product } from "@/lib/types";

// ─── Fonts (self-contained) ──────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--wf-sans"
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--wf-mono"
});

export const wfFontVars = `${inter.variable} ${mono.variable}`;

// ─── Palette ─────────────────────────────────────────────────────────────────
export const wf = {
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

export const monoFont = "var(--wf-mono), ui-monospace, SFMono-Regular, Menlo, monospace";
export const sansFont = "var(--wf-sans), ui-sans-serif, -apple-system, 'Segoe UI', sans-serif";

// ─── Currency helper ─────────────────────────────────────────────────────────
export function fmt(value: number, opts: { cents?: boolean } = {}): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const cents = opts.cents ?? true;
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0
  })}`;
}

// Deterministic warehouse wayfinding values derived from a product/variant id.
// The real catalog has no aisle/bay data — these are presentational only, but
// stable so the same product always maps to the same aisle/bay.
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

// Aisle code for a category — stable across the whole site.
export function aisleFor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return String(8 + (hash % 40)).padStart(2, "0");
}

// ─── Icon set (Lucide-style, 1.6 stroke) ─────────────────────────────────────
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
  mail: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
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
  clipboard: (p: IconProps) => (
    <Icon {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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
        color: wf.steel,
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
    <div style={{ background: "#fff", border: `1px solid ${wf.rail}`, ...style }}>
      {children}
    </div>
  );
}

// ─── Cross-hatch placeholder — used behind real product imagery ──────────────
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
          `linear-gradient(135deg, ${wf.hairline} 0 1px, transparent 1px 8px),` +
          `linear-gradient(45deg, ${wf.hairline} 0 1px, transparent 1px 8px)`,
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
            color: wf.muted,
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
            color: wf.steel,
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
    tone === "in" ? wf.pine : tone === "out" ? wf.red : tone === "solid" ? "#fff" : wf.steel;
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
        border: `1px solid ${tone === "solid" ? wf.ink : "currentColor"}`,
        color,
        background: tone === "solid" ? wf.ink : "transparent",
        ...style
      }}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "rail" }: { tone?: "rail" | "in" | "out" | "low" }) {
  const bg =
    tone === "in" ? wf.pine : tone === "out" ? wf.red : tone === "low" ? wf.safety : wf.rail;
  return (
    <span
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: bg }}
    />
  );
}

// Stock label mirroring the warehouse aisle/bay system, with derived values.
export function StockTag({ product }: { product: Product }) {
  const { aisle, bay, stock } = wayfinding(product.id);
  if (stock < 18) {
    return (
      <Tag tone="steel" style={{ color: wf.safety }}>
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

// ─── Buttons ─────────────────────────────────────────────────────────────────
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
    border: `1px solid ${wf.rail}`,
    background: "#fff",
    color: wf.ink,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease",
    width: block ? "100%" : undefined
  };
  if (variant === "primary") {
    return {
      ...base,
      background: wf.ink,
      color: "#fff",
      borderColor: wf.ink,
      fontWeight: 900,
      letterSpacing: "0.08em"
    };
  }
  if (variant === "ghost") return { ...base, background: "transparent" };
  if (variant === "danger") return { ...base, color: wf.red };
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
      <Link href={href} style={merged} title={title} onClick={onClick}>
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

// ─── Quantity stepper ────────────────────────────────────────────────────────
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
        border: `1px solid ${wf.rail}`,
        height,
        background: "#fff"
      }}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        style={{
          width: 36,
          fontSize: 18,
          fontWeight: 700,
          color: wf.ink,
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
        aria-label="Quantity"
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
        style={{
          width: 52,
          textAlign: "center",
          border: "none",
          borderLeft: `1px solid ${wf.rail}`,
          borderRight: `1px solid ${wf.rail}`,
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 14,
          background: "transparent",
          outline: "none"
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        style={{
          width: 36,
          fontSize: 18,
          fontWeight: 700,
          color: wf.ink,
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
        color: wf.steel,
        fontSize: 11,
        fontWeight: 700
      }}
    >
      <span style={{ display: "inline-flex", color: wf.ink }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Ico.star
            key={i}
            size={size}
            style={{ fill: i < Math.round(value) ? wf.ink : "transparent", stroke: wf.ink }}
          />
        ))}
      </span>
      <Mono>{value.toFixed(1)}</Mono>
      <span style={{ opacity: 0.7 }}>({count.toLocaleString()})</span>
    </span>
  );
}
