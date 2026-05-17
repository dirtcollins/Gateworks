"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Heart,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
  X
} from "lucide-react";

/** Shared DESIGN 4 — "Modern Marketplace" building blocks. */

export const brandClasses = {
  /** Primary cheerful CTA button. */
  btn:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]",
  /** Soft secondary button. */
  btnSoft:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50 font-bold text-orange-600 transition hover:bg-orange-100",
  /** Card surface. */
  card: "rounded-2xl bg-white ring-1 ring-slate-100"
};

type NavKey = "home" | "category" | "product" | "cart" | "orders" | "reports";

const shopNav: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/design-lab/d4/home" },
  { key: "category", label: "Shop", href: "/design-lab/d4/category" },
  { key: "product", label: "Featured", href: "/design-lab/d4/product" },
  { key: "cart", label: "Cart", href: "/design-lab/d4/cart" }
];

const adminNav: { key: NavKey; label: string; href: string }[] = [
  { key: "orders", label: "Orders", href: "/design-lab/d4/orders" },
  { key: "reports", label: "Reports", href: "/design-lab/d4/reports" }
];

export function D4Stars({
  value,
  size = "sm"
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          className={cls}
          viewBox="0 0 20 20"
          fill={i < Math.round(value) ? "#fb923c" : "#e2e8f0"}
        >
          <path d="M10 1.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L10 15.9 4.75 17.7l1-5.86L1.5 7.66l5.9-.86z" />
        </svg>
      ))}
    </span>
  );
}

function D4Header({ active }: { active: NavKey }) {
  const [open, setOpen] = useState(false);
  const isAdmin = active === "orders" || active === "reports";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      {/* announcement bar */}
      <div className="bg-slate-900 px-5 py-1.5 text-center text-xs font-semibold text-white">
        Free pickup today on 2,000+ items · Net-30 trade accounts available
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link
          href="/design-lab/d4/home"
          className="flex shrink-0 items-center gap-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-sm font-black text-white">
            G
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Gateworks
          </span>
        </Link>

        {/* desktop search */}
        <div className="hidden flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 md:flex">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            placeholder="Search products, SKUs, brands..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {(isAdmin ? adminNav : shopNav).map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                active === n.key
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={isAdmin ? "/design-lab/d4/home" : "/design-lab/d4/orders"}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 sm:flex"
            title={isAdmin ? "Storefront" : "Admin dashboard"}
          >
            <LayoutDashboard className="h-4 w-4" />
            {isAdmin ? "Storefront" : "Admin"}
          </Link>
          <button
            type="button"
            aria-label="Saved items"
            className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50 sm:grid"
          >
            <Heart className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Account"
            className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50 sm:grid"
          >
            <User className="h-5 w-5" />
          </button>
          <Link
            href="/design-lab/d4/cart"
            aria-label="Cart"
            className="relative grid h-9 w-9 place-items-center rounded-lg bg-orange-500 text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
              3
            </span>
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-100 px-5 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {[...shopNav, ...adminNav].map((n) => (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  active === n.key
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-600"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function D4Footer() {
  return (
    <footer className="mt-auto border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500 text-sm font-black text-white">
              G
            </span>
            <span className="font-extrabold text-slate-900">Gateworks</span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Contractor-grade supply with a checkout that respects your time.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <MapPin className="h-3.5 w-3.5" /> 6 yards · open 6am–7pm
          </p>
        </div>
        {[
          { h: "Shop", l: ["Gate Hardware", "Steel & Tube", "Fasteners", "Power Tools"] },
          { h: "For Pros", l: ["Trade Accounts", "Volume Pricing", "Bulk Quotes", "Job Lists"] },
          { h: "Support", l: ["Track Order", "Returns", "Price Match", "Contact"] }
        ].map((col) => (
          <div key={col.h}>
            <p className="text-sm font-bold text-slate-900">{col.h}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              {col.l.map((item) => (
                <li key={item}>
                  <Link href="/design-lab/d4/category" className="hover:text-orange-600">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-400">
        DESIGN 4 — "Modern Marketplace" preview · Sample data only
      </div>
    </footer>
  );
}

export function D4Shell({
  children,
  active
}: {
  children: ReactNode;
  active: NavKey;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-800 antialiased">
      <D4Header active={active} />
      <main className="flex-1">{children}</main>
      <D4Footer />
    </div>
  );
}
