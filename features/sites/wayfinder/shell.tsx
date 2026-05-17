// Wayfinder — site shell: black aisle-map context bar, header with nav +
// search + cart link, aisle-coded department strip, and footer. This component
// provides the entire chrome for every /wayfinder/* route (the app's global
// sidebar is suppressed for this prefix).
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { useCartStore } from "@/lib/cart-store";
import { departments } from "./data";
import { Ico, Mono, monoFont, sansFont, wf, wfFontVars } from "./kit";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Catalog", href: "/wayfinder/search" },
  { label: "Quote", href: "/wayfinder/quote" },
  { label: "Account", href: "/wayfinder/account" }
];

// Cart count — reads the real cart store. The store uses skipHydration, so we
// rehydrate once on mount and only render the badge after that to avoid an
// SSR/CSR mismatch.
function useCartCount() {
  const [ready, setReady] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  if (!ready) return 0;
  return items.reduce((total, item) => total + item.quantity, 0);
}

function HeaderSearch() {
  const router = useRouter();
  const searchId = useId();
  const [query, setQuery] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed ? `/wayfinder/search?q=${encodeURIComponent(trimmed)}` : "/wayfinder/search"
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        border: `1px solid ${wf.rail}`,
        background: "#fff",
        height: 44
      }}
    >
      <label
        htmlFor={searchId}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          alignItems: "center",
          padding: "0 12px"
        }}
      >
        <Ico.search size={18} />
        <input
          id={searchId}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search hardware, tube, fence, welding…"
          style={{
            border: "none",
            background: "transparent",
            padding: "0 12px",
            height: "100%",
            fontSize: 14,
            fontWeight: 600,
            outline: "none"
          }}
        />
      </label>
      <button
        type="submit"
        style={{
          padding: "0 22px",
          background: wf.ink,
          color: "#fff",
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          border: "none",
          cursor: "pointer"
        }}
      >
        Search
      </button>
    </form>
  );
}

export function WayfinderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/wayfinder";
  const cartCount = useCartCount();
  const depts = departments(8);

  // The admin back-office (/wayfinder/admin/*) ships its own operations-console
  // chrome via app/wayfinder/admin/layout.tsx, so the storefront shell steps
  // aside for those routes to avoid double-wrapping the header/footer.
  if (pathname === "/wayfinder/admin" || pathname.startsWith("/wayfinder/admin/")) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === "/wayfinder"
      ? pathname === "/wayfinder"
      : pathname === href || pathname.startsWith(`${href}/`);
  const catalogActive =
    pathname.startsWith("/wayfinder/search") ||
    pathname.startsWith("/wayfinder/categories");

  return (
    <div
      className={wfFontVars}
      style={{
        fontFamily: sansFont,
        background: wf.paper,
        color: wf.ink,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${wf.rail}`,
          position: "sticky",
          top: 0,
          zIndex: 30
        }}
      >
        {/* Black aisle-map context bar */}
        <div
          style={{
            background: wf.ink,
            color: "#fff",
            padding: "6px 24px",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.pin size={12} /> Bakersfield · Aisle map · 48 aisles
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.phone size={12} /> 661-555-0100
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>·</span>
            <span style={{ color: wf.amber }}>11A will-call cutoff</span>
          </div>
          <Link
            href="/wayfinder/account"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: wf.pine,
              color: "#fff",
              fontWeight: 800
            }}
          >
            <Ico.user size={12} /> Pro · Henderson Iron
          </Link>
        </div>

        {/* Main nav row */}
        <div
          style={{
            padding: "14px 24px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            alignItems: "center",
            gap: 24
          }}
        >
          <Link href="/wayfinder" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image
              src="/assets/logo.svg"
              alt="Gateworks Wayfinder"
              width={120}
              height={26}
              style={{ height: 26, width: "auto", display: "block" }}
            />
          </Link>

          <HeaderSearch />

          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/wayfinder/search" ? catalogActive : isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: wf.ink,
                    border: `1px solid ${active ? wf.ink : "transparent"}`,
                    background: active ? wf.paper : "transparent"
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/wayfinder/cart"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: wf.ink,
                border: `1px solid ${isActive("/wayfinder/cart") ? wf.ink : "transparent"}`,
                background: isActive("/wayfinder/cart") ? wf.paper : "transparent"
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                <Ico.cart size={16} />
                {cartCount > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      padding: "0 4px",
                      background: wf.pine,
                      color: "#fff",
                      borderRadius: 8,
                      fontFamily: monoFont,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "grid",
                      placeItems: "center"
                    }}
                  >
                    {cartCount}
                  </span>
                ) : null}
              </span>
              Cart
            </Link>
          </nav>
        </div>

        {/* Aisle-coded department strip */}
        <div
          style={{
            borderTop: `1px solid ${wf.hairline}`,
            background: wf.bone,
            padding: "0 24px",
            display: "flex",
            alignItems: "stretch",
            overflowX: "auto"
          }}
        >
          <Link
            href="/wayfinder/search"
            style={{
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: catalogActive && !pathname.includes("/categories/") ? wf.ink : wf.steel,
              borderBottom: `2px solid ${
                catalogActive && !pathname.includes("/categories/") ? wf.ink : "transparent"
              }`,
              whiteSpace: "nowrap"
            }}
          >
            All
          </Link>
          {depts.map((dept) => {
            const active = pathname === `/wayfinder/categories/${dept.slug}`;
            return (
              <Link
                key={dept.slug}
                href={`/wayfinder/categories/${dept.slug}`}
                style={{
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: active ? wf.ink : wf.steel,
                  borderBottom: `2px solid ${active ? wf.ink : "transparent"}`,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {dept.name}
                <Mono style={{ fontSize: 9, color: wf.muted, fontWeight: 500 }}>
                  A{dept.aisle}
                </Mono>
              </Link>
            );
          })}
        </div>
      </header>

      <main style={{ background: wf.paper, flex: 1 }}>{children}</main>

      <footer
        style={{
          borderTop: `1px solid ${wf.rail}`,
          background: wf.bone,
          padding: "26px 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <Image
            src="/assets/logo.svg"
            alt="Gateworks Wayfinder"
            width={120}
            height={26}
            style={{ height: 24, width: "auto" }}
          />
          <Mono style={{ fontSize: 11, color: wf.muted, lineHeight: 1.6 }}>
            Gateworks Supply · Bakersfield Warehouse
            <br />
            2210 Pegasus Dr · 661-555-0100
          </Mono>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: wf.steel,
              margin: 0
            }}
          >
            Shop
          </p>
          {[
            { label: "Full catalog", href: "/wayfinder/search" },
            { label: "Departments", href: "/wayfinder" },
            { label: "Request a quote", href: "/wayfinder/quote" }
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ fontSize: 12, fontWeight: 600, color: wf.ink }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: wf.steel,
              margin: 0
            }}
          >
            Will-call
          </p>
          <Mono style={{ fontSize: 11, color: wf.muted, lineHeight: 1.7 }}>
            Mon–Fri 6A–4P · Sat 7A–noon
            <br />
            Same-day pickup before 11A
            <br />
            Bay 7 · staged in aisle order
          </Mono>
        </div>
      </footer>
    </div>
  );
}
