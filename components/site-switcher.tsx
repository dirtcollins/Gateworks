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
          className="pointer-events-auto flex items-center gap-2 rounded-md border border-white/15 bg-[#101216]/95 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-xl backdrop-blur transition hover:bg-[#101216]"
          onClick={toggle}
          type="button"
        >
          <Compass className="h-4 w-4 text-emerald-400" />
          Nav
        </button>
      ) : (
        <div className="pointer-events-auto w-60 overflow-hidden rounded-lg border border-white/15 bg-[#101216]/97 text-white shadow-2xl backdrop-blur">
          {/* Tool header — deliberately not site chrome */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/40 px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              Gateworks Nav
            </span>
            <button
              aria-label="Collapse navigator"
              className="grid h-6 w-6 place-items-center rounded text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={toggle}
              type="button"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="p-2.5">
            <p className="px-1 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
              Sites
            </p>
            <div className="flex flex-col gap-1">
              {SITES.map((site) => (
                <Link
                  className={`rounded px-2.5 py-1.5 text-xs font-bold transition ${
                    site.id === currentSite
                      ? "bg-emerald-500 text-[#101216]"
                      : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
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
                className="mt-2 flex items-center gap-2 rounded border border-white/15 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/10"
                href={inAdmin ? `/${currentSite}` : `/${currentSite}/admin`}
              >
                {inAdmin ? (
                  <>
                    <Store className="h-3.5 w-3.5 text-emerald-400" />
                    Storefront
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    Admin portal
                  </>
                )}
              </Link>
            ) : null}

            <Link
              className={`mt-1.5 flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-bold transition ${
                onDesignLab
                  ? "bg-emerald-500 text-[#101216]"
                  : "border border-white/15 text-white hover:bg-white/10"
              }`}
              href="/design-lab"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Design Lab
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
