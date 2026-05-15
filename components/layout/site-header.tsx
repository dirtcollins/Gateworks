import Link from "next/link";
import { ClipboardList, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformNav, productFamilies } from "@/lib/platform";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-industrial-rail bg-white text-industrial-ink shadow-sm">
      <div className="bg-industrial-ink px-4 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
        Contractor supply, ordering, inventory, quoting, and warehouse operations
      </div>
      <div className="mx-auto grid max-w-[1500px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr]">
        <Button aria-label="Open menu" className="lg:hidden" size="icon" variant="secondary">
          <Menu size={22} />
        </Button>
        <nav className="hidden items-center gap-6 text-sm font-extrabold uppercase tracking-[0.08em] lg:flex">
          {platformNav.map((item) => (
            <Link className="hover:text-industrial-pine" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="justify-self-center text-2xl font-black uppercase tracking-[0.14em]" href="/">
          Gateworks
        </Link>
        <nav className="flex items-center justify-end gap-2">
          <form className="relative hidden min-w-[260px] xl:block" action="/search">
            <input
              className="h-10 w-full border border-industrial-rail bg-industrial-paper pl-4 pr-10 text-sm text-industrial-ink outline-none focus:border-industrial-ink"
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
          <Button aria-label="Open search" className="xl:hidden" size="icon" variant="ghost">
            <Search size={20} />
          </Button>
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
      <div className="border-t border-industrial-rail">
        <div className="mx-auto flex max-w-[1500px] gap-6 overflow-x-auto px-4 py-3 text-xs font-extrabold uppercase tracking-[0.08em] text-industrial-steel">
          {productFamilies.map((family) => (
            <Link href="/" key={family}>
              {family}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
