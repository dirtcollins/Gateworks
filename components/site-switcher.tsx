"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Compass, LayoutGrid, Shield, Store } from "lucide-react";

const COLLAPSE_KEY = "gateworks-site-switcher-collapsed";
const POS_KEY = "gateworks-site-switcher-pos";

const SITES = [
  { id: "ledger", name: "Ledger" },
  { id: "industrial", name: "Industrial Pro" },
  { id: "wayfinder", name: "Wayfinder" }
];

const SITE_IDS = SITES.map((site) => site.id);

// A floating, draggable navigation utility — deliberately styled as a tool,
// not site chrome — for jumping between the three full sites, their admin
// portals, and the Design Lab. Drag it by the header (or the collapsed pill).
export function SiteSwitcher() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    setInIframe(window.self !== window.top);
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
      const saved = localStorage.getItem(POS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos({
            x: Math.min(Math.max(8, parsed.x), window.innerWidth - 80),
            y: Math.min(Math.max(8, parsed.y), window.innerHeight - 48)
          });
        }
      }
    } catch {
      // ignore unreadable storage
    }
    setReady(true);
  }, []);

  function setCollapsedPersisted(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // ignore storage failures
    }
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>) {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      sx: event.clientX,
      sy: event.clientY,
      ox: rect.left,
      oy: rect.top,
      moved: false
    };
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state) return;
    const dx = event.clientX - state.sx;
    const dy = event.clientY - state.sy;
    if (!state.moved && Math.abs(dx) + Math.abs(dy) > 4) state.moved = true;
    if (!state.moved) return;
    const el = rootRef.current;
    const w = el?.offsetWidth ?? 240;
    const h = el?.offsetHeight ?? 56;
    setPos({
      x: Math.min(Math.max(8, state.ox + dx), window.innerWidth - w - 8),
      y: Math.min(Math.max(8, state.oy + dy), window.innerHeight - h - 8)
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>): boolean {
    const state = drag.current;
    drag.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer was never captured
    }
    if (state?.moved) {
      setPos((current) => {
        if (current) {
          try {
            localStorage.setItem(POS_KEY, JSON.stringify(current));
          } catch {
            // ignore storage failures
          }
        }
        return current;
      });
    }
    return state?.moved ?? false;
  }

  const segments = pathname.split("/").filter(Boolean);
  const seg0 = segments[0] ?? "";
  const onSite = SITE_IDS.includes(seg0);
  const onDesignLab = seg0 === "design-lab";

  if (!ready || inIframe) return null;
  if (!onSite && !onDesignLab) return null;

  const currentSite = onSite ? seg0 : null;
  const rest = onSite ? segments.slice(1).join("/") : "";
  const inAdmin = onSite && segments[1] === "admin";

  function siteHref(siteId: string) {
    return onSite && rest ? `/${siteId}/${rest}` : `/${siteId}`;
  }

  // Default position is the bottom-right corner (clear of the dev indicator
  // in the bottom-left); a dragged position overrides it.
  const positionStyle: CSSProperties = pos
    ? { left: pos.x, top: pos.y }
    : { right: 12, bottom: 12 };

  const chipBase = "rounded px-2 py-1 text-[11px] font-bold transition";

  return (
    <div className="pointer-events-none fixed z-[90]" ref={rootRef} style={positionStyle}>
      {collapsed ? (
        <div
          aria-label="Open Gateworks navigator"
          className="pointer-events-auto flex cursor-grab touch-none select-none items-center gap-2 rounded-md border-2 border-emerald-400 bg-[#15181d] px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-xl active:cursor-grabbing"
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={(event) => {
            if (!endDrag(event)) setCollapsedPersisted(false);
          }}
          role="button"
          tabIndex={0}
        >
          <Compass className="h-4 w-4 text-emerald-400" />
          Nav
        </div>
      ) : (
        <div className="pointer-events-auto w-60 overflow-hidden rounded-lg border-2 border-emerald-400/70 bg-[#15181d] text-white shadow-2xl">
          {/* Header doubles as the drag handle. */}
          <div
            className="flex cursor-grab touch-none select-none items-center justify-between gap-2 border-b border-white/20 bg-black/40 px-3 py-2 active:cursor-grabbing"
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
          >
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              Gateworks Nav
            </span>
            <button
              aria-label="Collapse navigator"
              className="grid h-6 w-6 place-items-center rounded bg-white/10 text-white transition hover:bg-white/25"
              onClick={() => setCollapsedPersisted(true)}
              onPointerDown={(event) => event.stopPropagation()}
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
                  className={`${chipBase} ${
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
