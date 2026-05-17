"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, ChevronDown, Layers, LayoutGrid } from "lucide-react";
import { designLabDesigns, designLabPages } from "@/features/design-lab/registry";

const COLLAPSE_KEY = "gateworks-design-dock-collapsed";

// A floating switcher shown on every individual design page. It lets you flip
// to another concept on the same page, jump to a different page of the same
// concept, or open the side-by-side comparison — without returning to the hub.
export function DesignDock() {
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
  const design = designLabDesigns.find((item) => item.id === segments[1]);
  const page = designLabPages.find((item) => item.slug === segments[2]);

  // Hide inside preview/compare iframes and on non-design-detail routes.
  if (!ready || inIframe) return null;
  if (segments[0] !== "design-lab" || !design || !page) return null;

  const chipBase =
    "rounded px-2 py-1 text-[11px] font-bold transition";
  const chipActive = "bg-white text-[#0c0c0e]";
  const chipIdle = "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-3">
      {collapsed ? (
        <button
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-[#0c0c0e]/95 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur transition hover:bg-[#0c0c0e]"
          onClick={toggle}
          type="button"
        >
          <Layers className="h-3.5 w-3.5" />
          Design Lab
          <span className="font-medium text-white/50">
            {design.name} &middot; {page.label}
          </span>
        </button>
      ) : (
        <div className="pointer-events-auto w-full max-w-3xl rounded-xl border border-white/10 bg-[#0c0c0e]/95 p-3 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs">
              <span className="text-white/45">Viewing</span>{" "}
              <span className="font-bold">{design.name}</span>
              <span className="text-white/40"> &middot; {page.label}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2.5 text-[11px] font-bold text-[#0c0c0e] transition hover:bg-white/85"
                href={`/design-lab/compare/${page.slug}`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Compare this page
              </Link>
              <Link
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/15 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/10"
                href="/design-lab"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Hub
              </Link>
              <button
                aria-label="Collapse design switcher"
                className="grid h-7 w-7 place-items-center rounded-md border border-white/15 text-white transition hover:bg-white/10"
                onClick={toggle}
                type="button"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            Switch concept — keeps this page
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {designLabDesigns.map((item) => (
              <Link
                className={`${chipBase} ${
                  item.id === design.id ? chipActive : chipIdle
                }`}
                href={`/design-lab/${item.id}/${page.slug}`}
                key={item.id}
                title={item.note}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            Jump to page — this concept
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {designLabPages.map((item) => (
              <Link
                className={`${chipBase} ${
                  item.slug === page.slug ? chipActive : chipIdle
                }`}
                href={`/design-lab/${design.id}/${item.slug}`}
                key={item.slug}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
