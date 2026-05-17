import Link from "next/link";
import type { ReactNode } from "react";

/**
 * DESIGN 3 — "Editorial Catalog"
 * Shared chrome + tokens for the d3 design-lab previews.
 *
 * Identity: magazine-grade retail. Generous whitespace, expressive serif
 * display type, asymmetric layouts, calm tactile palette. Steel and hardware
 * presented like a premium designer-goods catalog.
 */

// Calm, tactile palette — warm paper, deep ink, a single brass accent.
export const d3 = {
  paper: "#f4f1ea",
  card: "#ffffff",
  ink: "#1a1814",
  graphite: "#56524a",
  haze: "#8d887d",
  rule: "#ddd7ca",
  brass: "#9a7b3f",
  brassDeep: "#6f5829"
} as const;

// Serif display stack — gives every heading the editorial voice.
export const serif =
  "[font-family:Georgia,'Times_New_Roman',ui-serif,serif]";

export const d3Nav = [
  { label: "Home", href: "/design-lab/d3/home" },
  { label: "Catalog", href: "/design-lab/d3/category" },
  { label: "Product", href: "/design-lab/d3/product" },
  { label: "Cart", href: "/design-lab/d3/cart" },
  { label: "Orders", href: "/design-lab/d3/orders" },
  { label: "Reports", href: "/design-lab/d3/reports" }
];

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block text-[0.7rem] font-semibold uppercase tracking-[0.34em]"
      style={{ color: d3.brass }}
    >
      {children}
    </span>
  );
}

export function D3Shell({
  active,
  children,
  variant = "site"
}: {
  active: string;
  children: ReactNode;
  variant?: "site" | "admin";
}) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: d3.paper, color: d3.ink }}
    >
      <D3Header active={active} variant={variant} />
      <main>{children}</main>
      <D3Footer />
    </div>
  );
}

function D3Header({
  active,
  variant
}: {
  active: string;
  variant: "site" | "admin";
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ borderColor: d3.rule, background: "rgba(244,241,234,0.92)", backdropFilter: "blur(8px)" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/design-lab/d3/home" className="flex items-baseline gap-2">
          <span className={`${serif} text-2xl font-semibold tracking-tight`}>
            Gateworks
          </span>
          <span
            className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.3em] sm:inline"
            style={{ color: d3.brass }}
          >
            {variant === "admin" ? "Studio" : "Catalog"}
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {d3Nav.map((item) => {
            const isActive = item.label.toLowerCase() === active.toLowerCase();
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-[0.78rem] font-medium uppercase tracking-[0.16em] transition-colors"
                style={{ color: isActive ? d3.ink : d3.haze }}
              >
                {item.label}
                {isActive ? (
                  <span
                    className="absolute -bottom-1.5 left-0 h-px w-full"
                    style={{ background: d3.brass }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/design-lab/d3/cart"
            className="rounded-full border px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors"
            style={{ borderColor: d3.ink, color: d3.ink }}
          >
            Cart · 3
          </Link>
        </div>
      </div>
    </header>
  );
}

function D3Footer() {
  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: d3.rule, background: d3.ink, color: d3.paper }}
    >
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className={`${serif} text-3xl`}>Gateworks</p>
            <p
              className="mt-4 max-w-xs text-sm leading-relaxed"
              style={{ color: "rgba(244,241,234,0.62)" }}
            >
              Steel, gate hardware, and jobsite supply — assembled with the care
              of a catalog and the speed of a yard.
            </p>
            <p
              className="mt-6 text-[0.7rem] uppercase tracking-[0.3em]"
              style={{ color: d3.brass }}
            >
              Issue 03 — Editorial Catalog
            </p>
          </div>
          {[
            { head: "Shop", links: ["Steel & Tube", "Gate Hardware", "Fasteners", "Tools"] },
            { head: "Trade", links: ["Account Pricing", "Quotes", "Will-Call", "Delivery"] },
            { head: "Studio", links: ["Orders", "Reports", "Catalog Index", "Contact"] }
          ].map((col) => (
            <div key={col.head}>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em]" style={{ color: d3.brass }}>
                {col.head}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li
                    key={l}
                    className="text-sm"
                    style={{ color: "rgba(244,241,234,0.7)" }}
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-14 flex flex-col justify-between gap-3 border-t pt-6 text-[0.72rem] uppercase tracking-[0.18em] sm:flex-row"
          style={{ borderColor: "rgba(244,241,234,0.16)", color: "rgba(244,241,234,0.5)" }}
        >
          <span>© 2026 Gateworks Supply Co.</span>
          <span>Design Lab — Concept 3 of 5</span>
        </div>
      </div>
    </footer>
  );
}

/** A tactile color-block "image" — no remote assets. */
export function MaterialBlock({
  tone,
  label,
  className = ""
}: {
  tone: "steel" | "brass" | "ink" | "rust" | "paper";
  label?: string;
  className?: string;
}) {
  const tones: Record<string, string> = {
    steel: "linear-gradient(135deg,#9ea1a4 0%,#6f7377 45%,#43474b 100%)",
    brass: "linear-gradient(135deg,#cdab66 0%,#9a7b3f 50%,#5e4a23 100%)",
    ink: "linear-gradient(135deg,#3a3631 0%,#211f1b 60%,#111010 100%)",
    rust: "linear-gradient(135deg,#b07a4e 0%,#8a5230 55%,#5c3318 100%)",
    paper: "linear-gradient(135deg,#efe9da 0%,#ddd4bf 100%)"
  };
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: tones[tone] }}
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg,#ffffff 0 2px,transparent 2px 16px)"
        }}
      />
      {label ? (
        <span
          className="absolute bottom-3 left-3 text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
