"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Menu, Phone, X } from "lucide-react";

/* ------------------------------------------------------------------ *
 * DESIGN 9 — "SHOWROOM"
 * An immersive, gallery-grade luxury brand boutique. Warm cream and
 * bone grounds, deep espresso ink, and a refined bronze accent.
 * Generous vertical rhythm, slow confident pacing, large-format
 * imagery, elegant serif display type. Hardware treated as covetable
 * premium objects — aspiration that justifies premium positioning.
 * Self-contained: arbitrary Tailwind values + inline styles only.
 * ------------------------------------------------------------------ */

export const d9 = {
  bone: "#f3ede1", // warm cream / bone primary ground
  linen: "#ece3d3", // slightly deeper panel ground
  card: "#faf6ee", // raised card surface
  ink: "#221c14", // deep espresso ink
  espresso: "#2e261b", // softer espresso for surfaces
  graphite: "#5b5040", // warm body text
  haze: "#8c8068", // muted captions
  bronze: "#9c6f3a", // refined metallic accent
  bronzeLite: "#bd9259", // lighter bronze
  rule: "#ddd0ba", // hairline divider
  ruleDark: "#3a3024" // divider on dark
} as const;

export const serif: CSSProperties = {
  fontFamily: '"Hoefler Text", "Times New Roman", Georgia, serif'
};

export const D9_NAV = [
  { label: "Showroom", href: "/design-lab/d9/home" },
  { label: "The Collection", href: "/design-lab/d9/category" },
  { label: "Flagship", href: "/design-lab/d9/product" },
  { label: "Cart", href: "/design-lab/d9/cart" }
];

export const D9_ADMIN_NAV = [
  { label: "Orders", href: "/design-lab/d9/orders" },
  { label: "Reports", href: "/design-lab/d9/reports" }
];

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

/* ---- Eyebrow — small bronze gallery label ------------------------- */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-3 text-[0.66rem] font-semibold uppercase tracking-[0.34em]"
      style={{ color: d9.bronze }}
    >
      <span className="h-px w-8" style={{ background: d9.bronze }} />
      {children}
    </span>
  );
}

/* ---- Serif display heading --------------------------------------- */
export function Display({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-semibold leading-[1.05] tracking-[-0.015em] ${className}`}
      style={{ ...serif, color: d9.ink }}
    >
      {children}
    </h2>
  );
}

/* ---- Top boutique header ------------------------------------------ */
export function D9Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{ background: "rgba(243,237,225,0.92)", borderBottom: `1px solid ${d9.rule}` }}
    >
      <div
        className="hidden md:block"
        style={{ background: d9.ink, color: d9.bone }}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-2 text-[0.64rem] font-medium uppercase tracking-[0.28em]">
          <span style={{ color: "rgba(243,237,225,0.62)" }}>
            Complimentary white-glove delivery on flagship orders
          </span>
          <span className="flex items-center gap-6">
            <span
              className="flex items-center gap-2"
              style={{ color: "rgba(243,237,225,0.62)" }}
            >
              <Phone className="h-3 w-3" />
              By appointment · (555) 902-7740
            </span>
            <span style={{ color: d9.bronzeLite }}>The Gateworks Atelier</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1240px] items-center gap-8 px-6 py-5 sm:px-8">
        <Link className="flex items-center gap-3" href="/design-lab/d9/home">
          <span
            className="grid h-11 w-11 place-items-center text-lg"
            style={{ ...serif, background: d9.ink, color: d9.bronzeLite }}
          >
            G
          </span>
          <span className="leading-none">
            <span
              className="block text-xl tracking-[0.02em]"
              style={{ ...serif, color: d9.ink }}
            >
              GATEWORKS
            </span>
            <span
              className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.42em]"
              style={{ color: d9.bronze }}
            >
              Atelier &amp; Showroom
            </span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-8 lg:flex">
          {[...D9_NAV, ...D9_ADMIN_NAV].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors"
                href={item.href}
                style={{ color: active ? d9.ink : d9.haze }}
              >
                {item.label}
                <span
                  className="mt-1.5 block h-px w-full"
                  style={{ background: active ? d9.bronze : "transparent" }}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            className="hidden items-center gap-2 px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] transition-colors sm:inline-flex"
            href="/design-lab/d9/category"
            style={{ border: `1px solid ${d9.ink}`, color: d9.ink }}
          >
            View collection
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center lg:hidden"
            onClick={() => setOpen((value) => !value)}
            style={{ border: `1px solid ${d9.ink}`, color: d9.ink }}
            type="button"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          className="px-6 py-3 lg:hidden"
          style={{ borderTop: `1px solid ${d9.rule}`, background: d9.bone }}
        >
          {[...D9_NAV, ...D9_ADMIN_NAV].map((item) => (
            <Link
              key={item.href}
              className="block py-3 text-[0.74rem] font-semibold uppercase tracking-[0.18em]"
              href={item.href}
              onClick={() => setOpen(false)}
              style={{ color: d9.ink, borderBottom: `1px solid ${d9.rule}` }}
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
export function D9Footer() {
  return (
    <footer className="mt-28" style={{ background: d9.ink, color: d9.bone }}>
      <div className="mx-auto grid max-w-[1240px] gap-12 px-6 py-20 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center text-base"
              style={{ ...serif, background: d9.bone, color: d9.ink }}
            >
              G
            </span>
            <span className="text-lg tracking-[0.02em]" style={serif}>
              GATEWORKS
            </span>
          </div>
          <p
            className="mt-5 max-w-xs text-sm leading-relaxed"
            style={{ color: "rgba(243,237,225,0.56)" }}
          >
            An atelier for architectural hardware. Flagship gate latches,
            structural steel, and ornamental ironwork — presented as the
            covetable objects they are.
          </p>
        </div>
        {[
          {
            head: "The Collection",
            links: ["Flagship Hardware", "Structural Steel", "Ornamental Iron", "Atelier Editions"]
          },
          {
            head: "Atelier",
            links: ["Private Appointments", "Trade Concierge", "Specification Service", "White-Glove Delivery"]
          },
          {
            head: "House",
            links: ["The Gateworks Story", "Showroom Visits", "Press", "Contact"]
          }
        ].map((col) => (
          <div key={col.head}>
            <p
              className="text-[0.62rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d9.bronzeLite }}
            >
              {col.head}
            </p>
            <ul className="mt-5 space-y-3">
              {col.links.map((link) => (
                <li key={link}>
                  <span
                    className="cursor-pointer text-sm transition-colors"
                    style={{ color: "rgba(243,237,225,0.62)" }}
                  >
                    {link}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(243,237,225,0.1)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-[0.62rem] font-medium uppercase tracking-[0.24em] sm:px-8">
          <span style={{ color: "rgba(243,237,225,0.4)" }}>
            &copy; 2026 Gateworks Atelier
          </span>
          <span style={{ color: "rgba(243,237,225,0.4)" }}>
            Design Lab — Concept 9 / Showroom
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ---- Page wrapper ------------------------------------------------- */
export function D9Page({
  children,
  ground = d9.bone
}: {
  children: ReactNode;
  ground?: string;
}) {
  return (
    <div
      className="min-h-screen antialiased"
      style={{ background: ground, color: d9.ink }}
    >
      <D9Header />
      <main>{children}</main>
      <D9Footer />
    </div>
  );
}

/* ---- Cross-design switcher chip ----------------------------------- */
export function D9DesignBadge() {
  return (
    <div
      className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] sm:px-8"
      style={{ borderBottom: `1px solid ${d9.rule}`, color: d9.haze }}
    >
      <span>Design Lab · Concept 9 — Showroom</span>
      <Link
        className="flex items-center gap-1.5"
        href="/design-lab/d9/home"
        style={{ color: d9.bronze }}
      >
        Restart tour <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ---- Shared product card — gallery presentation ------------------- */
export function GalleryCard({
  title,
  sku,
  price,
  image,
  badge,
  href,
  index
}: {
  title: string;
  sku: string;
  price: number;
  image?: string;
  badge?: string;
  href: string;
  index: number;
}) {
  return (
    <Link
      className="group flex flex-col"
      href={href}
      style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
    >
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden"
        style={{ background: d9.linen }}
      >
        {image ? (
          <Image
            alt={title}
            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            src={image}
          />
        ) : (
          <span className="text-6xl" style={{ ...serif, color: d9.rule }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
        {badge ? (
          <span
            className="absolute left-4 top-4 px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.22em]"
            style={{ background: d9.ink, color: d9.bronzeLite }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-6 py-6">
        <span
          className="text-[0.6rem] font-semibold uppercase tracking-[0.24em]"
          style={{ color: d9.haze }}
        >
          {sku}
        </span>
        <p
          className="mt-2 flex-1 text-lg leading-snug"
          style={{ ...serif, color: d9.ink }}
        >
          {title}
        </p>
        <div
          className="mt-5 flex items-end justify-between pt-4"
          style={{ borderTop: `1px solid ${d9.rule}` }}
        >
          <span className="text-lg" style={{ ...serif, color: d9.ink }}>
            {formatUsd(price)}
          </span>
          <span
            className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition-colors group-hover:opacity-70"
            style={{ color: d9.bronze }}
          >
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
