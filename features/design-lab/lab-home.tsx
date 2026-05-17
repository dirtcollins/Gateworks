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

type DesignMeta = {
  palette: string[];
  bestFor: string;
};

// Representative palette + positioning line for each concept, used to give
// every card a distinct visual identity on the selection page.
const designMeta: Record<string, DesignMeta> = {
  d1: {
    palette: ["#16150f", "#2f6f4e", "#d6a93f", "#f6f3ec"],
    bestFor: "Trade counters that want a premium, established feel."
  },
  d2: {
    palette: ["#0a0a0a", "#404040", "#a3a3a3", "#ffffff"],
    bestFor: "Brands that sell through restraint and typography."
  },
  d3: {
    palette: ["#1c1c1c", "#8a7a5c", "#efece4", "#ffffff"],
    bestFor: "Storytelling-led catalogs with strong photography."
  },
  d4: {
    palette: ["#2563eb", "#f97316", "#0f172a", "#ffffff"],
    bestFor: "High-velocity retail and the broadest consumer reach."
  },
  d5: {
    palette: ["#16140f", "#ff5a1f", "#3f3a30", "#e8e4da"],
    bestFor: "Contractors ordering fast from the jobsite."
  },
  d6: {
    palette: ["#0a0a0c", "#5b9dff", "#1a1a22", "#e8e8f0"],
    bestFor: "A flagship, future-facing digital experience."
  }
};

const fallbackMeta: DesignMeta = {
  palette: ["#16150f", "#6c685c", "#c8c4ba", "#f6f3ec"],
  bestFor: "A complete, fully-working storefront concept."
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
      // ignore storage failures (private mode, quota)
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

  const isCustomOrder =
    hydrated && order.join(",") !== DEFAULT_ORDER.join(",");

  return (
    <main className="min-h-screen bg-[#f7f7f4]">
      {/* Hero */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1100px] px-5 py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-industrial-pine">
            Gateworks Design Lab
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-industrial-ink sm:text-6xl">
            Six directions for the future of Gateworks.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-industrial-steel">
            Every concept below is a complete, fully-working storefront and
            operations console &mdash; wired to the same live catalog, cart, and
            order data. Explore each one, compare any single page side by side,
            then drag to rank the directions in your order of preference.
          </p>
          <dl className="mt-9 grid max-w-xl grid-cols-3 divide-x divide-black/10 border-y border-black/10">
            {[
              { value: designLabDesigns.length, label: "Concepts" },
              {
                value: designLabDesigns.length * designLabPages.length,
                label: "Live pages"
              },
              { value: "1", label: "Real dataset" }
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-3 first:pl-0">
                <dt className="text-2xl font-black text-industrial-ink">
                  {stat.value}
                </dt>
                <dd className="text-[11px] font-bold uppercase tracking-[0.14em] text-industrial-muted">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-5 py-12">
        {/* Compare bar */}
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-industrial-ink">
                Compare one page across all six concepts
              </p>
              <p className="mt-0.5 text-xs text-industrial-muted">
                See every design&apos;s take on the same page, side by side.
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
              Rank the concepts
            </h2>
            <p className="mt-1 text-sm text-industrial-steel">
              Drag a card by its handle, or use the arrows. Your ranking is
              saved on this device.
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

        {/* Ranked design cards */}
        <ol className="mt-5 flex flex-col gap-4">
          {orderedDesigns.map((design, index) => {
            const meta = designMeta[design.id] ?? fallbackMeta;
            const rank = index + 1;
            const isTop = rank === 1;

            return (
              <li
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition ${
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
                {/* Palette identity banner */}
                <div className="flex h-14">
                  {meta.palette.map((color, swatchIndex) => (
                    <div
                      className="flex-1"
                      key={`${design.id}-${swatchIndex}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  {/* Rank + reorder controls */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${
                        isTop
                          ? "bg-industrial-ink text-white"
                          : "border border-black/15 bg-white text-industrial-ink"
                      }`}
                    >
                      {isTop ? <Star className="h-4 w-4" /> : rank}
                    </span>
                    <div className="flex gap-1 sm:flex-col">
                      <button
                        aria-label={`Move ${design.name} up`}
                        className="grid h-7 w-7 place-items-center rounded-md border border-black/10 bg-white text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => move(design.id, -1)}
                        type="button"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Move ${design.name} down`}
                        className="grid h-7 w-7 place-items-center rounded-md border border-black/10 bg-white text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={index === orderedDesigns.length - 1}
                        onClick={() => move(design.id, 1)}
                        type="button"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detail */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isTop ? (
                        <span className="rounded bg-industrial-pine px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                          Top pick
                        </span>
                      ) : null}
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-industrial-muted">
                        Concept {design.id.replace("d", "")}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-xl font-black text-industrial-ink">
                      {design.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-industrial-steel">
                      {design.note}
                    </p>
                    <p className="mt-1.5 text-xs text-industrial-muted">
                      <span className="font-bold text-industrial-ink">
                        Best for:
                      </span>{" "}
                      {meta.bestFor}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {designLabPages.map((page) => (
                        <Link
                          className="inline-flex h-8 items-center rounded-md border border-black/10 bg-[#f7f7f4] px-2.5 text-[11px] font-bold text-industrial-ink transition hover:border-industrial-ink hover:bg-white"
                          href={`/design-lab/${design.id}/${page.slug}`}
                          key={page.slug}
                        >
                          {page.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-industrial-ink px-4 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine"
                      href={`/design-lab/${design.id}/home`}
                    >
                      Preview <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span
                      aria-hidden="true"
                      className="hidden cursor-grab items-center justify-center gap-1 rounded-md border border-black/10 px-3 py-1.5 text-[11px] font-bold text-industrial-muted active:cursor-grabbing sm:inline-flex"
                    >
                      <GripVertical className="h-4 w-4" />
                      Drag
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-xs text-industrial-muted">
          The original Gateworks site is untouched. Every concept here renders
          the same live data, so your ranking reflects design and experience
          &mdash; not the content.
        </p>
      </div>
    </main>
  );
}
