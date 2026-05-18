// Wayfinder admin — shared back-office primitives. Every admin page is built
// from these, so their styling IS the admin design system: a calm warm-paper
// surface, white panels lifted with a soft shadow, a consistent type scale, and
// uniform spacing. Refining anything here propagates across the whole console.
"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Ico, Mono, monoFont, wf } from "../kit";

export { Ico, Mono, monoFont, wf };

// ─── Design tokens ───────────────────────────────────────────────────────────
// Soft elevation so panels read as surfaces on the paper background rather than
// flat outlined boxes — the single biggest lever away from a "plain" feel.
const ELEVATION = "0 1px 2px rgba(28,22,10,0.05), 0 6px 16px rgba(28,22,10,0.05)";

// ─── Section panel ───────────────────────────────────────────────────────────
export function Panel({
  title,
  meta,
  action,
  children,
  style,
  pad = true
}: {
  title?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  pad?: boolean;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: `1px solid ${wf.hairline}`,
        boxShadow: ELEVATION,
        ...style
      }}
    >
      {title || action ? (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: "13px 18px",
            borderBottom: `1px solid ${wf.hairline}`
          }}
        >
          <div style={{ minWidth: 0 }}>
            {title ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: wf.ink
                }}
              >
                {title}
              </p>
            ) : null}
            {meta ? (
              <p style={{ margin: "3px 0 0", fontSize: 12, color: wf.muted }}>{meta}</p>
            ) : null}
          </div>
          {action ? <div style={{ flexShrink: 0, maxWidth: "100%" }}>{action}</div> : null}
        </header>
      ) : null}
      <div style={pad ? { padding: 18 } : undefined}>{children}</div>
    </section>
  );
}

// ─── KPI tile ────────────────────────────────────────────────────────────────
export function Kpi({
  label,
  value,
  hint,
  tone = "ink"
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "ink" | "pine" | "red" | "safety";
}) {
  const accent =
    tone === "pine" ? wf.pine : tone === "red" ? wf.red : tone === "safety" ? wf.safety : wf.ink;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${wf.hairline}`,
        borderTop: `3px solid ${accent}`,
        boxShadow: ELEVATION,
        padding: "15px 17px",
        display: "grid",
        gap: 7
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: monoFont,
          fontSize: 27,
          fontWeight: 700,
          color: wf.ink,
          lineHeight: 1.1,
          letterSpacing: "-0.01em"
        }}
      >
        {value}
      </p>
      {hint ? (
        <p style={{ margin: 0, fontSize: 11, color: wf.muted, fontFamily: monoFont }}>{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────────────
type PillTone = "neutral" | "open" | "active" | "done" | "warn" | "stop";

const pillColors: Record<PillTone, { fg: string; bg: string; bd: string }> = {
  neutral: { fg: wf.steel, bg: wf.bone, bd: wf.rail },
  open: { fg: "#1d4ed8", bg: "#eef2ff", bd: "#c7d2fe" },
  active: { fg: wf.pineDeep, bg: "#e7f0ea", bd: "#bcd6c6" },
  done: { fg: "#fff", bg: wf.pine, bd: wf.pine },
  warn: { fg: "#92500a", bg: wf.amber, bd: wf.amberDeep },
  stop: { fg: wf.red, bg: "#fbeae8", bd: "#e9c3bf" }
};

export function Pill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  const c = pillColors[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        fontFamily: monoFont,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`
      }}
    >
      {children}
    </span>
  );
}

// ─── Button (admin-scaled) ───────────────────────────────────────────────────
type AdminBtnProps = {
  children: ReactNode;
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  block?: boolean;
  title?: string;
  style?: CSSProperties;
};

function adminBtnStyle(
  variant: AdminBtnProps["variant"],
  size: AdminBtnProps["size"],
  block?: boolean
): CSSProperties {
  const h = size === "sm" ? 32 : 38;
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: h,
    padding: size === "sm" ? "0 12px" : "0 16px",
    fontSize: size === "sm" ? 11 : 12,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    border: `1px solid ${wf.rail}`,
    background: "#fff",
    color: wf.ink,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
    width: block ? "100%" : undefined
  };
  if (variant === "primary") {
    return { ...base, background: wf.ink, color: "#fff", borderColor: wf.ink, fontWeight: 900 };
  }
  if (variant === "ghost") return { ...base, background: "transparent" };
  if (variant === "danger") return { ...base, color: wf.red, borderColor: "#e9c3bf" };
  return base;
}

export function AdminBtn({
  children,
  variant = "default",
  size = "md",
  href,
  onClick,
  disabled,
  type = "button",
  block,
  title,
  style
}: AdminBtnProps) {
  const merged = { ...adminBtnStyle(variant, size, block), ...style };
  const className = `wf-abtn wf-abtn-${variant}`;
  if (href && !disabled) {
    return (
      <Link href={href} className={className} style={merged} title={title} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ ...merged, opacity: disabled ? 0.45 : 1 }}
    >
      {children}
    </button>
  );
}

// ─── Text input / select / textarea ─────────────────────────────────────────
const fieldBase: CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 11px",
  border: `1px solid ${wf.rail}`,
  background: "#fff",
  color: wf.ink,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 120ms ease, box-shadow 120ms ease"
};

export function Field({
  label,
  children
}: {
  label?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      {label ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: wf.steel
          }}
        >
          {label}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={className ? `wf-field ${className}` : "wf-field"}
      style={{ ...fieldBase, ...style }}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { style, className, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={className ? `wf-field ${className}` : "wf-field"}
      style={{ ...fieldBase, ...style }}
    >
      {children}
    </select>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={className ? `wf-field ${className}` : "wf-field"}
      style={{
        ...fieldBase,
        height: undefined,
        minHeight: 76,
        padding: "9px 11px",
        resize: "vertical",
        ...style
      }}
    />
  );
}

// ─── Data table ──────────────────────────────────────────────────────────────
export type Column<T> = {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  width?: number | string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty = "No records found.",
  onRowHref
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  empty?: ReactNode;
  onRowHref?: (row: T) => string;
}) {
  if (!rows.length) {
    return (
      <div
        style={{
          padding: "44px 16px",
          textAlign: "center",
          color: wf.muted,
          fontSize: 13,
          fontFamily: monoFont
        }}
      >
        {empty}
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: wf.bone }}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{
                  textAlign: col.align || "left",
                  padding: "10px 16px",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: wf.steel,
                  borderBottom: `1px solid ${wf.rail}`,
                  width: col.width,
                  whiteSpace: "nowrap"
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const href = onRowHref?.(row);
            const last = index === rows.length - 1;
            const content = columns.map((col) => (
              <td
                key={col.key}
                style={{
                  textAlign: col.align || "left",
                  padding: "12px 16px",
                  borderBottom: last ? undefined : `1px solid ${wf.hairline}`,
                  color: wf.ink,
                  verticalAlign: "middle"
                }}
              >
                {col.render(row)}
              </td>
            ));
            return (
              <tr
                key={getKey(row)}
                className="wf-trow"
                style={href ? { cursor: "pointer" } : undefined}
                onClick={
                  href
                    ? (event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("a,button,select,input")) return;
                        window.location.assign(href);
                      }
                    : undefined
                }
              >
                {content}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Toolbar / filter chips ──────────────────────────────────────────────────
export function FilterChips<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="wf-abtn"
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              border: `1px solid ${active ? wf.ink : wf.rail}`,
              background: active ? wf.ink : "#fff",
              color: active ? "#fff" : wf.steel,
              cursor: "pointer",
              transition: "background 120ms ease, border-color 120ms ease"
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page heading ────────────────────────────────────────────────────────────
export function PageHead({
  eyebrow,
  title,
  desc,
  action
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        paddingBottom: 4,
        borderBottom: `1px solid ${wf.hairline}`
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: wf.steel
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            margin: "5px 0 0",
            fontSize: 25,
            fontWeight: 900,
            letterSpacing: "-0.018em",
            color: wf.ink,
            lineHeight: 1.15
          }}
        >
          {title}
        </h1>
        {desc ? (
          <p style={{ margin: "6px 0 0", fontSize: 13, color: wf.muted, maxWidth: 580 }}>{desc}</p>
        ) : null}
      </div>
      {action ? <div style={{ flexShrink: 0, paddingBottom: 2 }}>{action}</div> : null}
    </div>
  );
}

// ─── Notice banner ───────────────────────────────────────────────────────────
export function Notice({
  tone = "info",
  children
}: {
  tone?: "info" | "warn" | "good";
  children: ReactNode;
}) {
  const c =
    tone === "warn"
      ? { bg: "#fdf4e3", bd: wf.amberDeep, fg: "#92500a", bar: wf.safety }
      : tone === "good"
        ? { bg: "#e7f0ea", bd: "#bcd6c6", fg: wf.pineDeep, bar: wf.pine }
        : { bg: wf.bone, bd: wf.rail, fg: wf.steel, bar: wf.steel };
  return (
    <div
      style={{
        padding: "11px 14px",
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderLeft: `3px solid ${c.bar}`,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600
      }}
    >
      {children}
    </div>
  );
}
