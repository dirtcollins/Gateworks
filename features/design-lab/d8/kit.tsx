"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Compass, Crosshair, Layers, Ruler } from "lucide-react";
import {
  getCategoryProducts,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * d8 "Blueprint" — project-led / solution selling.
 * The store is organised around what the customer is *building*.
 * "Projects" are a merchandising layer defined here, but every
 * project is populated with REAL catalog products via the shared
 * live-data layer (topCategories / getCategoryProducts / popular).
 * ------------------------------------------------------------------ */

export const ink = {
  /* deep blueprint navy ground */
  ground: "#0a1f3c",
  groundDeep: "#071730",
  panel: "#0e2a4f",
  panelSoft: "#12356180",
  line: "#1d4a82",
  lineSoft: "#163a68",
  grid: "rgba(108,166,232,0.10)",
  gridBold: "rgba(108,166,232,0.20)",
  cyan: "#6cc6ff",
  cyanDeep: "#3fa3e6",
  chalk: "#eaf2fb",
  chalkDim: "#9fb6d4",
  chalkFaint: "#5f7ba0",
  amber: "#f4b860"
} as const;

/* A fine drafting grid applied as the page background. */
export const blueprintGridStyle: CSSProperties = {
  backgroundColor: ink.ground,
  backgroundImage: `
    linear-gradient(${ink.grid} 1px, transparent 1px),
    linear-gradient(90deg, ${ink.grid} 1px, transparent 1px),
    linear-gradient(${ink.gridBold} 1px, transparent 1px),
    linear-gradient(90deg, ${ink.gridBold} 1px, transparent 1px)
  `,
  backgroundSize: "22px 22px, 22px 22px, 110px 110px, 110px 110px"
};

export const mono =
  "font-mono [font-feature-settings:'tnum'] tracking-tight";

/* ------------------------------------------------------------------ *
 * PROJECTS — the merchandising layer.
 * Each project maps to a REAL catalog category slug; its component
 * set / bill-of-materials is the real products in that category.
 * ------------------------------------------------------------------ */

export type Project = {
  id: string;
  code: string;
  name: string;
  brief: string;
  stage: string;
  categorySlug: string;
  spec: string;
};

/* Pick real category slugs that have products, in priority order. */
function pickSlug(preferred: string, fallbackIndex: number): string {
  const match = topCategories.find((category) => category.slug === preferred);
  if (match) return match.slug;
  return (
    topCategories[fallbackIndex % Math.max(topCategories.length, 1)]?.slug ??
    topCategories[0]?.slug ??
    "all"
  );
}

const projectBlueprints: Array<Omit<Project, "categorySlug"> & { prefer: string }> =
  [
    {
      id: "sliding-gate",
      code: "PRJ-01",
      name: "Sliding Gate Build",
      brief: "Track, rollers and latch hardware for a rolling driveway gate.",
      stage: "Stage A · Hardware",
      spec: "Span up to 24 ft",
      prefer: "gate-hardware"
    },
    {
      id: "perimeter-fence",
      code: "PRJ-02",
      name: "Perimeter Fence Line",
      brief: "Hinges, posts and fasteners to close off a property line.",
      stage: "Stage B · Structure",
      spec: "Run 100–400 ft",
      prefer: "gate-hinges"
    },
    {
      id: "welding-setup",
      code: "PRJ-03",
      name: "Weld & Fabrication Bay",
      brief: "Steel tubing stock cut, welded and finished into frames.",
      stage: "Stage C · Raw Stock",
      spec: "20 ft mill lengths",
      prefer: "square-steel-tubing"
    },
    {
      id: "ornamental-railing",
      code: "PRJ-04",
      name: "Ornamental Railing",
      brief: "Decorative hinges and trim for a finished architectural look.",
      stage: "Stage D · Finish",
      spec: "Custom profile",
      prefer: "gate-latches"
    }
  ];

export const projects: Project[] = projectBlueprints.map((blueprint, index) => ({
  id: blueprint.id,
  code: blueprint.code,
  name: blueprint.name,
  brief: blueprint.brief,
  stage: blueprint.stage,
  spec: blueprint.spec,
  categorySlug: pickSlug(blueprint.prefer, index)
}));

export function getProjectProducts(project: Project): Product[] {
  const set = getCategoryProducts(project.categorySlug);
  return set.length ? set : popularProducts;
}

export function projectComponentCount(project: Project): number {
  return getProjectProducts(project).length;
}

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

const NAV: Array<{ label: string; href: string; key: NavKey }> = [
  { label: "Projects", href: "/design-lab/d8/home", key: "home" },
  { label: "Component Set", href: "/design-lab/d8/category", key: "category" },
  { label: "Spec Sheet", href: "/design-lab/d8/product", key: "product" },
  { label: "Bill of Materials", href: "/design-lab/d8/cart", key: "cart" },
  { label: "Build Log", href: "/design-lab/d8/orders", key: "orders" },
  { label: "Yield Report", href: "/design-lab/d8/reports", key: "reports" }
];

export type NavKey =
  | "home"
  | "category"
  | "product"
  | "cart"
  | "orders"
  | "reports";

export function DraftingMark({ label }: { label: string }) {
  return (
    <span
      className={`${mono} inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em]`}
      style={{ color: ink.cyan }}
    >
      <Crosshair className="h-3 w-3" />
      {label}
    </span>
  );
}

/* A measured dimension line — the signature blueprint element. */
export function Dimension({
  value,
  hint
}: {
  value: string;
  hint?: string;
}) {
  return (
    <span className={`${mono} inline-flex items-center gap-2 text-[11px]`}>
      <span
        className="inline-block h-px w-5"
        style={{ backgroundColor: ink.cyanDeep }}
      />
      <span style={{ color: ink.cyan }}>{value}</span>
      {hint ? (
        <span style={{ color: ink.chalkFaint }} className="uppercase tracking-[0.2em]">
          {hint}
        </span>
      ) : null}
      <span
        className="inline-block h-px w-5"
        style={{ backgroundColor: ink.cyanDeep }}
      />
    </span>
  );
}

export function BlueprintCard({
  children,
  className = "",
  style
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-sm border ${className}`}
      style={{
        borderColor: ink.line,
        backgroundColor: ink.panel,
        ...style
      }}
    >
      {/* corner registration marks */}
      <span
        className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t"
        style={{ borderColor: ink.cyanDeep }}
      />
      <span
        className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t"
        style={{ borderColor: ink.cyanDeep }}
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l"
        style={{ borderColor: ink.cyanDeep }}
      />
      <span
        className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r"
        style={{ borderColor: ink.cyanDeep }}
      />
      {children}
    </div>
  );
}

export function D8Shell({
  active,
  children
}: {
  active: NavKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen" style={blueprintGridStyle}>
      {/* Title block / header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{
          borderColor: ink.line,
          backgroundColor: "rgba(7,23,48,0.92)"
        }}
      >
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex items-center justify-between py-3">
            <Link href="/design-lab/d8/home" className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-sm border"
                style={{ borderColor: ink.cyanDeep, color: ink.cyan }}
              >
                <Compass className="h-5 w-5" />
              </span>
              <span className="leading-none">
                <span
                  className={`${mono} block text-sm font-semibold uppercase tracking-[0.28em]`}
                  style={{ color: ink.chalk }}
                >
                  Gateworks
                </span>
                <span
                  className={`${mono} block text-[10px] uppercase tracking-[0.34em]`}
                  style={{ color: ink.cyan }}
                >
                  Blueprint · Build Desk
                </span>
              </span>
            </Link>
            <span
              className={`${mono} hidden items-center gap-2 text-[10px] uppercase tracking-[0.28em] sm:inline-flex`}
              style={{ color: ink.chalkFaint }}
            >
              <Ruler className="h-3.5 w-3.5" />
              Rev. D8 / Scale 1:1
            </span>
          </div>
          <nav className="-mb-px flex flex-wrap gap-x-1 gap-y-0 overflow-x-auto">
            {NAV.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`${mono} whitespace-nowrap border-b-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.18em] transition`}
                  style={{
                    borderColor: isActive ? ink.cyan : "transparent",
                    color: isActive ? ink.cyan : ink.chalkDim
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      {/* Title-block footer */}
      <footer
        className="border-t"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-7 sm:grid-cols-4">
          {[
            { k: "Drawing", v: "Gateworks Blueprint" },
            { k: "Concept", v: "d8 · Project-led commerce" },
            { k: "Discipline", v: "Solution selling" },
            { k: "Status", v: "Issued for build" }
          ].map((cell) => (
            <div key={cell.k}>
              <p
                className={`${mono} text-[10px] uppercase tracking-[0.3em]`}
                style={{ color: ink.chalkFaint }}
              >
                {cell.k}
              </p>
              <p
                className={`${mono} mt-1 flex items-center gap-1.5 text-xs`}
                style={{ color: ink.chalkDim }}
              >
                <Layers className="h-3.5 w-3.5" style={{ color: ink.cyanDeep }} />
                {cell.v}
              </p>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* Shared currency formatter for monospace dimension display. */
export function usd(value: number, exact = true): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: exact ? 2 : 0,
    maximumFractionDigits: exact ? 2 : 0
  });
}
