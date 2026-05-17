"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Menu,
  Phone,
  Search,
  ShoppingCart,
  Truck,
  X
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — standalone storefront shell.
 * Warm off-white + ink-black, restrained pine-green accent.
 * A confident editorial grid, hairline dividers, decisive headers.
 * Ported from features/design-lab/d1/kit.tsx and evolved into a
 * real, navigable site rooted at the /industrial route prefix.
 * ------------------------------------------------------------------ */

export const INDUSTRIAL_NAV = [
  { label: "Home", href: "/industrial" },
  { label: "Catalog", href: "/industrial/search" },
  { label: "Quote", href: "/industrial/quote" },
  { label: "Account", href: "/industrial/account" }
];

export function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  });
}

/* ---- Eyebrow label ------------------------------------------------ */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-d1-pine">
      <span className="h-px w-6 bg-d1-pine" />
      {children}
    </span>
  );
}

/* ---- Section header ---------------------------------------------- */
export function SectionHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-d1-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/* ---- Hook: live cart count (handles skipHydration) ---------------- */
export function useCartCount(): number {
  const items = useCartStore((state) => state.items);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  if (!ready) return 0;
  return items.reduce((total, item) => total + item.quantity, 0);
}

/* ---- Top utility + nav bar --------------------------------------- */
export function IndustrialHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const cartCount = useCartCount();

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = term.trim();
    router.push(query ? `/industrial/search?q=${encodeURIComponent(query)}` : "/industrial/search");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-d1-line bg-d1-paper/95 backdrop-blur">
      <div className="hidden border-b border-d1-line bg-d1-ink text-d1-paper md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
          <span className="flex items-center gap-2 text-d1-paper/70">
            <Truck className="h-3.5 w-3.5" />
            Same-day pickup &middot; Free delivery over $750
          </span>
          <span className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-d1-paper/70">
              <Phone className="h-3.5 w-3.5" />
              (555) 240-8100
            </span>
            <span className="text-d1-amber">Contractor pricing active</span>
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link className="flex items-center gap-2.5" href="/industrial">
          <span className="grid h-9 w-9 place-items-center bg-d1-ink text-base font-black text-d1-paper">
            G
          </span>
          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-tight text-d1-ink">
              GATEWORKS
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-d1-pine">
              Industrial Supply
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {INDUSTRIAL_NAV.map((item) => {
            const active =
              item.href === "/industrial"
                ? pathname === "/industrial"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                className={`px-3 py-2 text-[13px] font-bold uppercase tracking-[0.1em] transition ${
                  active ? "text-d1-ink" : "text-d1-steel hover:text-d1-ink"
                }`}
                href={item.href}
              >
                {item.label}
                <span
                  className={`mt-1 block h-0.5 w-full ${
                    active ? "bg-d1-pine" : "bg-transparent"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            className="hidden items-center gap-2 border border-d1-line bg-white px-3 py-2 lg:flex"
            onSubmit={submitSearch}
          >
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              className="w-44 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search SKU or part"
              value={term}
            />
          </form>
          <Link
            aria-label="Cart"
            className="relative grid h-10 w-10 place-items-center border border-d1-ink bg-white text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
            href="/industrial/cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center bg-d1-pine text-[11px] font-bold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center border border-d1-ink bg-white text-d1-ink md:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-d1-line bg-d1-paper px-6 py-3 md:hidden">
          <form
            className="mb-2 flex items-center gap-2 border border-d1-line bg-white px-3 py-2"
            onSubmit={submitSearch}
          >
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              className="w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search SKU or part"
              value={term}
            />
          </form>
          {INDUSTRIAL_NAV.map((item) => (
            <Link
              key={item.href}
              className="block border-b border-d1-line py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-ink last:border-b-0"
              href={item.href}
              onClick={() => setOpen(false)}
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
export function IndustrialFooter() {
  return (
    <footer className="mt-20 border-t-2 border-d1-ink bg-d1-ink text-d1-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center bg-d1-paper text-base font-black text-d1-ink">
              G
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              GATEWORKS
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-d1-paper/60">
            Gate hardware, structural steel, ornamental iron and welding
            supply. Built for crews that need it right and need it today.
          </p>
        </div>
        {[
          {
            head: "Shop",
            links: [
              { label: "Browse catalog", href: "/industrial/search" },
              { label: "All departments", href: "/industrial/search" },
              { label: "New arrivals", href: "/industrial/search" }
            ]
          },
          {
            head: "Trade",
            links: [
              { label: "Request a quote", href: "/industrial/quote" },
              { label: "Will-call pickup", href: "/industrial/cart" },
              { label: "Your account", href: "/industrial/account" }
            ]
          },
          {
            head: "Company",
            links: [
              { label: "About Gateworks", href: "/industrial" },
              { label: "Contact", href: "/industrial" },
              { label: "Locations", href: "/industrial" }
            ]
          }
        ].map((col) => (
          <div key={col.head}>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-d1-amber">
              {col.head}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-sm text-d1-paper/70 transition hover:text-d1-paper"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-d1-paper/50">
          <span>&copy; 2026 Gateworks Industrial Supply</span>
          <Link
            className="flex items-center gap-1 text-d1-paper/50 transition hover:text-d1-paper"
            href="/design-lab"
          >
            Design Lab <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

/* ---- Page wrapper ------------------------------------------------- */
export function IndustrialPage({
  children,
  wide
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className={`mx-auto px-6 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
      {children}
    </main>
  );
}
