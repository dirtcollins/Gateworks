import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import "./globals.css";
import { CartLink } from "@/components/cart-link";
import { LoginButton } from "@/components/login-button";
import { ListLink } from "@/components/list-link";
import { QuoteLink } from "@/components/quote-link";
import { UserStorageScope } from "@/components/user-storage-scope";

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
        <UserStorageScope />
        <header className="sticky top-0 z-40 border-b border-jobsite-rail bg-white text-jobsite-ink shadow-sm">
          <div className="grid grid-cols-1 bg-jobsite-black text-[11px] font-extrabold uppercase tracking-[0.16em] text-white sm:grid-cols-2">
            <Link className="px-4 py-2 text-center hover:bg-white/10" href="/">
              Save up to 25% | Final Few
            </Link>
            <Link className="hidden border-l border-white/15 px-4 py-2 text-center hover:bg-white/10 sm:block" href="/">
              Free shipping on orders $100+
            </Link>
          </div>
          <div className="mx-auto grid max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr]">
            <button
              aria-label="Open menu"
              className="grid size-10 shrink-0 place-items-center border border-jobsite-rail lg:hidden"
              type="button"
            >
              <Menu size={22} />
            </button>
            <nav className="hidden items-center gap-7 text-sm font-extrabold uppercase tracking-[0.08em] lg:flex">
              <Link href="/">Men</Link>
              <Link href="/">Women</Link>
              <Link href="/">Gear</Link>
              <Link href="/">Workwear System</Link>
              <Link href="/">Mission</Link>
            </nav>
            <Link className="justify-self-center text-2xl font-black uppercase tracking-[0.18em]" href="/">
              TrueWerk
            </Link>
            <nav className="flex items-center justify-end gap-2">
              <form className="relative hidden min-w-[240px] xl:block" action="/">
                <input
                  className="h-10 w-full border border-jobsite-rail bg-jobsite-paper pl-4 pr-10 text-sm text-jobsite-ink outline-none focus:border-jobsite-ink"
                  name="q"
                  placeholder="Search"
                  type="search"
                />
                <button
                  aria-label="Search"
                  className="absolute right-0 top-0 grid h-10 w-10 place-items-center text-jobsite-ink"
                  type="submit"
                >
                  <Search size={19} />
                </button>
              </form>
              <button
                aria-label="Open search"
                className="grid size-10 place-items-center border border-transparent hover:border-jobsite-rail xl:hidden"
                type="button"
              >
                <Search size={20} />
              </button>
              <LoginButton />
              <Link
                className="hidden px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-jobsite-ink hover:bg-jobsite-paper sm:block"
                href="/admin"
              >
                Admin
              </Link>
              <ListLink />
              <QuoteLink />
              <CartLink />
            </nav>
          </div>
          <div className="border-t border-jobsite-rail lg:hidden">
            <div className="mx-auto flex max-w-[1500px] gap-6 overflow-x-auto px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-jobsite-steel">
              <Link href="/">Men</Link>
              <Link href="/">Women</Link>
              <Link href="/">Gear</Link>
              <Link href="/">Workwear System</Link>
              <Link href="/">Mission</Link>
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
