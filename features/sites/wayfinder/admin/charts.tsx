// Wayfinder admin — chart primitives. Lightweight SVG/CSS visualizations built
// on the warehouse palette, no chart library. Strokes use non-scaling-stroke so
// the area chart can stretch fluidly without distortion; hover markers and
// labels are HTML overlays positioned by percentage for the same reason.
"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { monoFont } from "../kit";
import { RADIUS, wf } from "./admin-theme";

// ─── Delta — period-over-period change indicator ─────────────────────────────
export function Delta({
  current,
  previous,
  inverse = false,
  suffix = "vs prev"
}: {
  current: number;
  previous: number;
  inverse?: boolean; // when true, a decrease is "good" (e.g. outstanding AR)
  suffix?: string;
}) {
  let body: ReactNode;
  let color: string = wf.steel;

  if (previous <= 0 && current <= 0) {
    body = "—";
  } else if (previous <= 0) {
    body = "NEW";
    color = inverse ? wf.red : wf.pine;
  } else {
    const pct = ((current - previous) / Math.abs(previous)) * 100;
    const flat = Math.abs(pct) < 0.1;
    const up = pct >= 0;
    const good = inverse ? !up : up;
    color = flat ? wf.steel : good ? wf.pine : wf.red;
    body = `${flat ? "→" : up ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}%`;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 5,
        fontFamily: monoFont,
        fontSize: 11
      }}
    >
      <span style={{ fontWeight: 700, color }}>{body}</span>
      {suffix ? <span style={{ color: wf.muted, fontSize: 10 }}>{suffix}</span> : null}
    </span>
  );
}

// ─── Sparkline — inline trend for KPI tiles ──────────────────────────────────
export function Sparkline({
  values,
  color = wf.ink,
  width = 104,
  height = 30
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map(
    (v, i) => `${i * step},${height - 2 - ((v - min) / range) * (height - 4)}`
  );
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        points={`0,${height} ${pts.join(" ")} ${width},${height}`}
        fill={color}
        opacity={0.1}
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ─── TrendChart — interactive area chart over a daily series ─────────────────
export type TrendPoint = { label: string; value: number; caption?: string };

export function TrendChart({
  points,
  height = 210,
  accent = wf.pine,
  format = (n) => String(Math.round(n))
}: {
  points: TrendPoint[];
  height?: number;
  accent?: string;
  format?: (value: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;

  if (n < 2) {
    return (
      <div
        style={{
          height,
          display: "grid",
          placeItems: "center",
          color: wf.muted,
          fontFamily: monoFont,
          fontSize: 12
        }}
      >
        Not enough data to chart yet.
      </div>
    );
  }

  const W = 1000;
  const top = 12;
  const max = Math.max(...points.map((p) => p.value), 1);
  const px = (i: number) => (i / (n - 1)) * W;
  const py = (v: number) => top + (1 - v / max) * (height - top);
  const linePts = points.map((p, i) => `${px(i)},${py(p.value)}`);
  const areaPath = `M0,${height} L${linePts.join(" L")} L${W},${height} Z`;
  const gridValues = [max, max / 2];

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  }

  const active = hover === null ? null : points[hover];
  const hoverPct = hover === null ? 0 : (hover / (n - 1)) * 100;

  return (
    <div>
      <div
        style={{ position: "relative", height, cursor: "crosshair" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          {gridValues.map((v) => (
            <line
              key={v}
              x1={0}
              x2={W}
              y1={py(v)}
              y2={py(v)}
              stroke={wf.hairline}
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={0}
            x2={W}
            y1={height - 0.5}
            y2={height - 0.5}
            stroke={wf.rail}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <path d={areaPath} fill={accent} opacity={0.12} />
          <polyline
            points={linePts.join(" ")}
            fill="none"
            stroke={accent}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* y-axis value labels */}
        {gridValues.map((v) => (
          <span
            key={v}
            style={{
              position: "absolute",
              right: 4,
              top: `${(py(v) / height) * 100}%`,
              transform: "translateY(-50%)",
              fontFamily: monoFont,
              fontSize: 9,
              color: wf.muted,
              background: "rgba(255,255,255,0.8)",
              padding: "0 3px"
            }}
          >
            {format(v)}
          </span>
        ))}

        {/* hover marker + guide */}
        {active ? (
          <>
            <div
              style={{
                position: "absolute",
                left: `${hoverPct}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: wf.rail,
                pointerEvents: "none"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${hoverPct}%`,
                top: `${(py(active.value) / height) * 100}%`,
                width: 9,
                height: 9,
                marginLeft: -5,
                marginTop: -5,
                borderRadius: "50%",
                background: "#fff",
                border: `2px solid ${accent}`,
                pointerEvents: "none"
              }}
            />
            <div
              style={{
                position: "absolute",
                left: `${hoverPct}%`,
                top: 4,
                transform: `translateX(${hoverPct > 65 ? "-100%" : hoverPct < 35 ? "0" : "-50%"})`,
                background: wf.ink,
                color: "#fff",
                padding: "5px 8px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                lineHeight: 1.35
              }}
            >
              <div style={{ fontFamily: monoFont, fontSize: 9, opacity: 0.7 }}>
                {active.label}
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700 }}>
                {format(active.value)}
              </div>
              {active.caption ? (
                <div style={{ fontFamily: monoFont, fontSize: 9, opacity: 0.7 }}>
                  {active.caption}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {/* x-axis labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontFamily: monoFont,
          fontSize: 9,
          color: wf.muted
        }}
      >
        <span>{points[0].label}</span>
        <span>{points[Math.floor(n / 2)].label}</span>
        <span>{points[n - 1].label}</span>
      </div>
    </div>
  );
}

// ─── BarList — ranked horizontal bars (top products, customers, aging) ───────
export type BarItem = {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  value: number;
  display: ReactNode;
  href?: string;
};

export function BarList({
  items,
  accent = wf.pine,
  empty = "No data in range."
}: {
  items: BarItem[];
  accent?: string;
  empty?: ReactNode;
}) {
  if (!items.length) {
    return (
      <p style={{ margin: 0, color: wf.muted, fontFamily: monoFont, fontSize: 12 }}>
        {empty}
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "grid", gap: 11 }}>
      {items.map((item) => {
        const row = (
          <div style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "baseline"
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: wf.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: monoFont,
                  fontSize: 12,
                  fontWeight: 700,
                  color: wf.ink,
                  flexShrink: 0
                }}
              >
                {item.display}
              </span>
            </div>
            <div style={{ height: 6, background: wf.hairline }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(2, (item.value / max) * 100)}%`,
                  background: accent
                }}
              />
            </div>
            {item.sub ? (
              <span style={{ fontFamily: monoFont, fontSize: 10, color: wf.muted }}>
                {item.sub}
              </span>
            ) : null}
          </div>
        );
        return (
          <div key={item.key}>
            {item.href ? (
              <a href={item.href} style={{ display: "block" }}>
                {row}
              </a>
            ) : (
              row
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── StackBar — single proportional stacked bar (payment mix) ────────────────
export function StackBar({
  segments,
  height = 12
}: {
  segments: { key: string; value: number; color: string }[];
  height?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div style={{ display: "flex", height, overflow: "hidden", background: wf.hairline }}>
      {segments.map((seg) => (
        <div
          key={seg.key}
          style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
          title={seg.key}
        />
      ))}
    </div>
  );
}

// ─── TrendKpi — KPI tile with delta + sparkline ──────────────────────────────
export function TrendKpi({
  label,
  value,
  accent = wf.ink,
  delta,
  spark,
  hint
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  delta?: ReactNode;
  spark?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${wf.rail}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: RADIUS,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 14px rgba(15,23,42,0.06)",
        padding: "15px 17px",
        display: "grid",
        gap: 8
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
          fontSize: 26,
          fontWeight: 700,
          color: wf.ink,
          lineHeight: 1.1
        }}
      >
        {value}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 30
        }}
      >
        <span>
          {delta || (
            <span style={{ fontFamily: monoFont, fontSize: 10, color: wf.muted }}>
              {hint}
            </span>
          )}
        </span>
        {spark || null}
      </div>
    </div>
  );
}

// ─── Gauge — labeled progress meter (collection rate) ────────────────────────
export function Meter({
  pct,
  accent = wf.pine,
  style
}: {
  pct: number;
  accent?: string;
  style?: CSSProperties;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height: 8, background: wf.hairline, ...style }}>
      <div style={{ height: "100%", width: `${clamped}%`, background: accent }} />
    </div>
  );
}
