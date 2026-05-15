import Link from "next/link";
import { ClipboardList, Heart, Search, ShoppingBag, User } from "lucide-react";
import { GateworksLogo } from "@/components/gateworks-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-industrial-rail bg-white text-industrial-ink shadow-sm">
      <div className="mx-auto grid max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 lg:grid-cols-[auto_minmax(260px,1fr)_auto]">
        <div className="flex items-center gap-2">
          <Link className="justify-self-start" href="/">
            <GateworksLogo className="h-7 w-[186px]" height={28} width={186} />
          </Link>
          <Link
            aria-label="Open operations"
            className="flex h-10 items-center rounded-md border border-jobsite-rail bg-white px-3 text-sm font-medium text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper"
            href="/admin"
          >
            Operations
          </Link>
        </div>
        <form className="relative mx-auto w-full max-w-[720px]" action="/search">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-ink">
            <Search size={19} />
          </div>
          <input
            className="h-10 w-full rounded-md border border-industrial-rail bg-industrial-paper pl-10 pr-10 text-sm text-industrial-ink outline-none focus:border-industrial-ink"
            name="q"
            placeholder="Search products, SKUs, materials"
            type="search"
          />
          <button
            aria-label="Search"
            className="absolute right-0 top-0 grid h-10 w-10 place-items-center text-industrial-ink"
            type="submit"
          >
            <Search size={19} />
          </button>
        </form>
        <nav className="flex items-center justify-end gap-2">
          <Link
            aria-label="Open account"
            className="grid size-10 place-items-center border border-transparent text-jobsite-ink transition hover:border-jobsite-rail hover:bg-jobsite-paper"
            href="/account"
          >
            <User size={20} />
          </Link>
          <Link
            aria-label="Open lists"
            className="grid size-10 place-items-center border border-jobsite-rail bg-white text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper"
            href="/lists"
          >
            <Heart size={20} />
          </Link>
          <Link
            aria-label="Open quote"
            className="grid size-10 place-items-center border border-jobsite-rail bg-white text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper"
            href="/quotes"
          >
            <ClipboardList size={20} />
          </Link>
          <Link
            aria-label="Open cart"
            className="grid size-10 place-items-center border border-jobsite-ink bg-jobsite-ink text-white transition hover:bg-white hover:text-jobsite-ink"
            href="/cart"
          >
            <ShoppingBag size={20} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
