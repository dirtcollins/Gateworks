import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, Menu, Search, ShieldCheck } from "lucide-react";
import "./globals.css";
import { CartLink } from "@/components/cart-link";

export const metadata: Metadata = {
  title: "Construction Commerce Phase 1",
  description: "Simple product, variant, cart, search, and admin system."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 bg-jobsite-black text-white shadow-sm">
          <div className="bg-jobsite-safety px-4 py-1 text-center text-xs font-bold">
            Phase 1 Product System
          </div>
          <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
            <button
              aria-label="Open menu"
              className="grid size-10 shrink-0 place-items-center border border-white/20 lg:hidden"
              type="button"
            >
              <Menu size={22} />
            </button>
            <Link className="flex shrink-0 items-center gap-2" href="/">
              <span className="grid size-10 place-items-center bg-jobsite-safety text-white">
                <ShieldCheck size={22} />
              </span>
              <span className="hidden text-lg font-extrabold tracking-tight sm:block">
                GateWorks Pro
              </span>
            </Link>
            <form className="relative min-w-0 flex-1" action="/">
              <input
                className="h-11 w-full border-0 bg-white pl-4 pr-12 text-sm text-jobsite-ink outline-none"
                name="q"
                placeholder="What can we help you find today?"
                type="search"
              />
              <button
                aria-label="Search"
                className="absolute right-0 top-0 grid h-11 w-12 place-items-center bg-jobsite-safety text-white"
                type="submit"
              >
                <Search size={20} />
              </button>
            </form>
            <div className="hidden items-center gap-2 border-l border-white/20 pl-4 text-xs md:flex">
              <MapPin size={18} />
              <span>
                <strong className="block text-white">Bakersfield</strong>
                93313
              </span>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                className="hidden px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:block"
                href="/admin"
              >
                Admin
              </Link>
              <CartLink />
            </nav>
          </div>
          <div className="border-t border-white/10 bg-[#2b2b2b]">
            <div className="mx-auto flex max-w-[1500px] gap-5 overflow-x-auto px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/85">
              <Link href="/">Products</Link>
              <span>Gate Hardware</span>
              <span>Fence Hardware</span>
              <span>Bulk Pricing</span>
              <span>Jobsite Pickup</span>
            </div>
          </div>
        </header>
        {children}
        <footer className="border-t border-jobsite-rail bg-white">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 py-8 text-sm text-jobsite-steel sm:flex-row sm:items-center sm:justify-between">
            <p>Phase 1 product system with 50 seeded construction products.</p>
            <p>Next.js, TypeScript, Tailwind, Zustand, Supabase-ready.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
