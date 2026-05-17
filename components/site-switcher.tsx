"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, LayoutGrid, Shield, Store } from "lucide-react";

const COLLAPSE_KEY = "gateworks-site-switcher-collapsed";

const SITES = [
  { id: "ledger", name: "Ledger" },
  { id: "industrial", name: "Industrial Pro" },
  { id: "wayfinder", name: "Wayfinder" }
];

const SITE_IDS = SITES.map((site) => site.id);

// A floating navigation utility — deliberately styled as a tool, not site
// chrome — for jumping between the three full sites, their admin portals,
// and the Design Lab. Not part of any site's design.
export function SiteSwitcher() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInIframe(window.self !== window.top);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore unreadable storage
    }
    setReady(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  const segments = pathname.split("/").filter(Boolean);
  const seg0 = segments[0] ?? "";
  const onSite = SITE_IDS.includes(seg0);
  const onDesignLab = seg0 === "design-lab";

  // Show on the three full sites and anywhere in the Design Lab.
  if (!ready || inIframe) return null;
  if (!onSite && !onDesignLab) return null;

  const currentSite = onSite ? seg0 : null;
  const rest = onSite ? segments.slice(1).join("/") : "";
  const inAdmin = onSite && segments[1] === "admin";

  function siteHref(siteId: string) {
    return onSite && rest ? `/${siteId}/${rest}` : `/${siteId}`;
  }

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-[90] flex justify-start">
      {collapsed ? (
        <button
          className="pointer-events-auto flex items-center gap-2 rounded-md border-2 border-emerald-400 bg-[#15181d] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-2xl transition hover:bg-[#1f242b]"
          onClick={toggle}
          type="button"
        >
          <Compass className="h-4 w-4 text-emerald-400" />
          Nav
        </button>
      ) : (
        <div className="pointer-events-auto w-60 overflow-hidden rounded-lg border-2 border-emerald-400/70 bg-[#15181d] text-white shadow-2xl">
          {/* Tool header — deliberately not site chrome */}
          <div className="flex items-center justify-between gap-2 border-b border-white/20 bg-black/70 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              Gateworks Nav
            </span>
            <button
              aria-label="Collapse navigator"
              className="grid h-6 w-6 place-items-center rounded bg-white/10 text-white transition hover:bg-white/25"
              onClick={toggle}
              type="button"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="p-2.5">
            <p className="px-1 pb-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/60">
              Sites
            </p>
            <div className="flex flex-col gap-1.5">
              {SITES.map((site) => (
                <Link
                  className={`rounded px-2.5 py-1.5 text-xs font-extrabold transition ${
                    site.id === currentSite
                      ? "bg-emerald-400 text-[#0a0b0d]"
                      : "bg-[#2c323b] text-white hover:bg-[#3a424d]"
                  }`}
                  href={siteHref(site.id)}
                  key={site.id}
                >
                  {site.name}
                </Link>
              ))}
            </div>

            {currentSite ? (
              <Link
                className="mt-2.5 flex items-center gap-2 rounded bg-[#2c323b] px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#3a424d]"
                href={inAdmin ? `/${currentSite}` : `/${currentSite}/admin`}
              >
                {inAdmin ? (
                  <>
                    <Store className="h-4 w-4 text-emerald-400" />
                    Storefront
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Admin portal
                  </>
                )}
              </Link>
            ) : null}

            <Link
              className={`mt-1.5 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-extrabold transition ${
                onDesignLab
                  ? "bg-emerald-400 text-[#0a0b0d]"
                  : "bg-[#2c323b] text-white hover:bg-[#3a424d]"
              }`}
              href="/design-lab"
            >
              <LayoutGrid className="h-4 w-4" />
              Design Lab
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
