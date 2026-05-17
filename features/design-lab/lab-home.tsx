"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
  Star
} from "lucide-react";
import { designLabDesigns, designLabPages } from "@/features/design-lab/registry";

const STORAGE_KEY = "gateworks-design-lab-order";

const DEFAULT_ORDER = designLabDesigns.map((design) => design.id);

// Preview thumbnail geometry: a 1440x1125 render of the design's home page,
// scaled down to fit a fixed 384x300 box.
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 1125;
const PREVIEW_WIDTH = 384;
const PREVIEW_HEIGHT = 300;
const PREVIEW_SCALE = PREVIEW_WIDTH / FRAME_WIDTH;

// Positioning line for each concept — the "why you'd choose this" pitch.
const bestForById: Record<string, string> = {
  d1: "Trade counters that want a premium, established feel.",
  d2: "Brands that sell through restraint and typography.",
  d3: "Storytelling-led catalogs with strong photography.",
  d4: "High-velocity retail and the broadest consumer reach.",
  d5: "Contractors ordering fast from the jobsite.",
  d6: "A flagship, future-facing digital experience.",
  d7: "Purchasing managers running repeat B2B procurement.",
  d8: "Buyers who shop by the project they're building.",
  d9: "An aspirational, premium brand showroom.",
  d10: "Buyers who want to find anything instantly."
};

export function DesignLabHome() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hydrated, setHydrated] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as string[];
        const known = saved.filter((id) => DEFAULT_ORDER.includes(id));
        const missing = DEFAULT_ORDER.filter((id) => !known.includes(id));
        setOrder([...known, ...missing]);
      }
    } catch {
      // ignore unreadable / malformed saved order
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // ignore storage failures
    }
  }, [order, hydrated]);

  function move(id: string, direction: -1 | 1) {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function dropOn(targetId: string) {
    setDragOverId(null);
    setOrder((prev) => {
      if (!dragId || dragId === targetId) return prev;
      const from = prev.indexOf(dragId);
      const to = prev.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
    setDragId(null);
  }

  const orderedDesigns = order
    .map((id) => designLabDesigns.find((design) => design.id === id))
    .filter((design): design is (typeof designLabDesigns)[number] => Boolean(design));

  const isCustomOrder = hydrated && order.join(",") !== DEFAULT_ORDER.join(",");

  return (
    <main className="min-h-screen bg-[#f7f7f4] pb-20">
      {/* Hero */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-industrial-pine">
            Gateworks Design Lab
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[1.06] tracking-tight text-industrial-ink sm:text-5xl">
            Ten ways to build Gateworks. Pick your favorite.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-industrial-steel sm:text-base">
            Every concept below is a complete, working storefront and operations
            console &mdash; all wired to the same live catalog, cart, and order
            data. Preview each home page in the box, open any concept to walk
            its pages, compare a single page across all ten, and drag the cards
            to rank them in your order of preference.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] px-5">
        {/* Compare bar */}
        <div className="mt-8 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-industrial-ink">
                Compare one page across all ten concepts
              </p>
              <p className="mt-0.5 text-xs text-industrial-muted">
                Open a synchronized side-by-side of every design&apos;s take on
                the same page.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {designLabPages.map((page) => (
                <Link
                  className="inline-flex h-9 items-center rounded-md border border-black/10 bg-white px-3 text-xs font-bold text-industrial-ink transition hover:border-industrial-ink hover:bg-[#f7f7f4]"
                  href={`/design-lab/compare/${page.slug}`}
                  key={page.slug}
                >
                  {page.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Ranking header */}
        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-industrial-ink">
              The concepts &mdash; ranked
            </h2>
            <p className="mt-1 text-sm text-industrial-steel">
              Drag a card, or use the arrows. Your ranking is saved on this
              device.
            </p>
          </div>
          {isCustomOrder ? (
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 text-xs font-bold text-industrial-ink transition hover:border-industrial-ink"
              onClick={() => setOrder(DEFAULT_ORDER)}
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset order
            </button>
          ) : null}
        </div>

        {/* Ranked design cards with live home-page previews */}
        <ol className="mt-5 flex flex-wrap justify-center gap-6 sm:justify-start">
          {orderedDesigns.map((design, index) => {
            const rank = index + 1;
            const isTop = rank === 1;

            return (
              <li
                className={`flex w-[384px] max-w-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                  dragOverId === design.id
                    ? "border-industrial-ink ring-2 ring-industrial-ink"
                    : "border-black/10"
                } ${dragId === design.id ? "opacity-50" : "opacity-100"}`}
                draggable
                key={design.id}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOverId(null);
                }}
                onDragEnter={() => setDragOverId(design.id)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragId(design.id)}
                onDrop={() => dropOn(design.id)}
              >
                {/* Live home-page preview */}
                <Link
                  className="group relative block overflow-hidden border-b border-black/10 bg-white"
                  draggable={false}
                  href={`/design-lab/${design.id}/home`}
                  style={{ height: PREVIEW_HEIGHT }}
                >
                  <iframe
                    aria-hidden="true"
                    className="pointer-events-none origin-top-left border-0"
                    loading="lazy"
                    src={`/design-lab/${design.id}/home`}
                    style={{
                      width: FRAME_WIDTH,
                      height: FRAME_HEIGHT,
                      transform: `scale(${PREVIEW_SCALE})`
                    }}
                    tabIndex={-1}
                    title={`${design.name} home preview`}
                  />
                  <span className="absolute left-3 top-3 rounded bg-black/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                    {design.name}
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink">
                      Open home <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${
                        isTop
                          ? "bg-industrial-ink text-white"
                          : "border border-black/15 bg-white text-industrial-ink"
                      }`}
                    >
                      {isTop ? <Star className="h-4 w-4" /> : rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-lg font-black text-industrial-ink">
                          {design.name}
                        </h3>
                        {isTop ? (
                          <span className="rounded bg-industrial-pine px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                            Top pick
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-industrial-steel">
                        {design.note}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="hidden cursor-grab text-industrial-muted active:cursor-grabbing sm:block"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-5 w-5" />
                    </span>
                  </div>

                  <p className="text-xs text-industrial-muted">
                    <span className="font-bold text-industrial-ink">
                      Best for:
                    </span>{" "}
                    {bestForById[design.id] ??
                      "A complete, working storefront concept."}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {designLabPages.map((page) => (
                      <Link
                        className="inline-flex h-7 items-center rounded border border-black/10 bg-[#f7f7f4] px-2 text-[10px] font-bold text-industrial-ink transition hover:border-industrial-ink hover:bg-white"
                        draggable={false}
                        href={`/design-lab/${design.id}/${page.slug}`}
                        key={page.slug}
                      >
                        {page.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/10 pt-3">
                    <div className="flex gap-1">
                      <button
                        aria-label={`Move ${design.name} up`}
                        className="grid h-8 w-8 place-items-center rounded-md border border-black/10 bg-white text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => move(design.id, -1)}
                        type="button"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Move ${design.name} down`}
                        className="grid h-8 w-8 place-items-center rounded-md border border-black/10 bg-white text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={index === orderedDesigns.length - 1}
                        onClick={() => move(design.id, 1)}
                        type="button"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <Link
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-industrial-ink px-3 text-[11px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine"
                      draggable={false}
                      href={`/design-lab/${design.id}/home`}
                    >
                      Preview <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-xs text-industrial-muted">
          The original Gateworks site is untouched. Every concept renders the
          same live data, so your ranking reflects design and experience &mdash;
          not the content.
        </p>
      </div>
    </main>
  );
}
