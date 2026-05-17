"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  RotateCcw,
  Star
} from "lucide-react";
import { designLabDesigns, designLabPages } from "@/features/design-lab/registry";
import {
  StarRating,
  ratingFor,
  useRatings,
  useReviewer,
  votesFor
} from "@/features/design-lab/ratings";

const STORAGE_KEY = "gateworks-design-lab-order";
const VIEW_KEY = "gateworks-design-lab-view";

const DEFAULT_ORDER = designLabDesigns.map((design) => design.id);

// A 1440x1125 render of each design's home page, scaled into the preview box.
const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 1125;

type ViewMode = "compact" | "standard" | "large" | "list";

const VIEW_MODES: {
  id: ViewMode;
  label: string;
  previewWidth: number;
  list: boolean;
}[] = [
  { id: "compact", label: "Compact", previewWidth: 300, list: false },
  { id: "standard", label: "Standard", previewWidth: 384, list: false },
  { id: "large", label: "Large", previewWidth: 560, list: false },
  { id: "list", label: "List", previewWidth: 248, list: true }
];

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
  const [viewMode, setViewMode] = useState<ViewMode>("standard");

  const { reviewer, reviewers, setReviewer, addReviewer } = useReviewer();
  const { ratings, configured, loading, rate } = useRatings();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as string[];
        const known = saved.filter((id) => DEFAULT_ORDER.includes(id));
        const missing = DEFAULT_ORDER.filter((id) => !known.includes(id));
        setOrder([...known, ...missing]);
      }
      const savedView = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (savedView && VIEW_MODES.some((mode) => mode.id === savedView)) {
        setViewMode(savedView);
      }
    } catch {
      // ignore unreadable / malformed saved state
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

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      // ignore storage failures
    }
  }

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

  function promptReviewer() {
    const name = window.prompt("Add a reviewer name");
    if (name) addReviewer(name);
  }

  const orderedDesigns = order
    .map((id) => designLabDesigns.find((design) => design.id === id))
    .filter((design): design is (typeof designLabDesigns)[number] => Boolean(design));

  const isCustomOrder = hydrated && order.join(",") !== DEFAULT_ORDER.join(",");

  const mode = VIEW_MODES.find((item) => item.id === viewMode) ?? VIEW_MODES[1];
  const previewWidth = mode.previewWidth;
  const previewHeight = Math.round((previewWidth * FRAME_HEIGHT) / FRAME_WIDTH);
  const previewScale = previewWidth / FRAME_WIDTH;

  return (
    <main className="min-h-screen bg-[#f7f7f4] pb-24">
      {/* Hero */}
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-12 sm:py-16">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-industrial-pine">
                Gateworks Design Lab
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-[1.06] tracking-tight text-industrial-ink sm:text-5xl">
                Ten ways to build Gateworks. Pick your favorite.
              </h1>
            </div>
            <Link
              className="inline-flex h-10 items-center gap-1.5 rounded-md border border-black/15 bg-white px-4 text-xs font-bold text-industrial-ink transition hover:border-industrial-ink"
              href="/"
            >
              Exit to live site <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-industrial-steel sm:text-base">
            Every concept below is a complete, working storefront and operations
            console &mdash; all wired to the same live catalog, cart, and order
            data. Preview each home page, open a concept to walk its pages,
            compare a single page across all ten, drag the cards to rank them,
            and give each one a star rating.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5">
        {/* Compare bar */}
        <div className="mt-8 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-industrial-ink">
                Compare one page across all ten concepts
              </p>
              <p className="mt-0.5 text-xs text-industrial-muted">
                Open a side-by-side of every design&apos;s take on the same
                page.
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

        {/* Controls: view mode + reviewer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
              View
            </span>
            <div className="flex items-center gap-0.5 rounded-md border border-black/10 bg-[#f7f7f4] p-0.5">
              {VIEW_MODES.map((item) => (
                <button
                  className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                    item.id === viewMode
                      ? "bg-industrial-ink text-white"
                      : "text-industrial-ink hover:bg-white"
                  }`}
                  key={item.id}
                  onClick={() => changeView(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
              Reviewing as
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {reviewers.map((name) => (
                <button
                  className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${
                    name === reviewer
                      ? "bg-industrial-pine text-white"
                      : "border border-black/10 bg-white text-industrial-ink hover:border-industrial-ink"
                  }`}
                  key={name}
                  onClick={() => setReviewer(name)}
                  type="button"
                >
                  {name}
                </button>
              ))}
              <button
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-black/20 px-2 py-1 text-xs font-bold text-industrial-muted transition hover:border-industrial-ink hover:text-industrial-ink"
                onClick={promptReviewer}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
        </div>

        {!loading && !configured ? (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Star votes are live in this session but won&apos;t save or sync
            between reviewers until the <code>design_lab_ratings</code> table is
            applied in Supabase (<code>supabase/design-lab-ratings.sql</code>).
          </p>
        ) : null}

        {/* Ranking header */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-industrial-ink">
              The concepts &mdash; ranked
            </h2>
            <p className="mt-1 text-sm text-industrial-steel">
              Drag a card or use the arrows to rank. Rate each concept with the
              stars. Your ranking is saved on this device.
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
        <ol
          className={
            mode.list
              ? "mt-5 flex flex-col items-center gap-4"
              : "mt-5 flex flex-wrap justify-center gap-6"
          }
        >
          {orderedDesigns.map((design, index) => {
            const rank = index + 1;
            const isTop = rank === 1;
            const myStars = ratingFor(ratings, reviewer, design.id, "overall");
            const otherVotes = votesFor(ratings, design.id, "overall").filter(
              (vote) => vote.reviewer !== reviewer
            );

            return (
              <li
                className={`flex overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                  mode.list ? "w-full max-w-[880px] flex-row" : "flex-col"
                } ${
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
                style={mode.list ? undefined : { width: previewWidth }}
              >
                {/* Live home-page preview */}
                <Link
                  className={`group relative block shrink-0 overflow-hidden bg-white ${
                    mode.list
                      ? "border-r border-black/10"
                      : "border-b border-black/10"
                  }`}
                  draggable={false}
                  href={`/design-lab/${design.id}/home`}
                  style={{ width: previewWidth, height: previewHeight }}
                >
                  <iframe
                    aria-hidden="true"
                    className="pointer-events-none origin-top-left border-0"
                    loading="lazy"
                    src={`/design-lab/${design.id}/home`}
                    style={{
                      width: FRAME_WIDTH,
                      height: FRAME_HEIGHT,
                      transform: `scale(${previewScale})`
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

                  {/* Rating */}
                  <div className="rounded-lg border border-black/10 bg-[#f7f7f4] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRating
                        label={`Rate ${design.name}`}
                        onRate={(stars) =>
                          rate(reviewer, design.id, "overall", stars)
                        }
                        size={20}
                        value={myStars}
                      />
                      <span className="text-[11px] font-bold text-industrial-muted">
                        your rating &mdash; {reviewer}
                      </span>
                    </div>
                    {otherVotes.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-black/10 pt-1.5 text-[11px] text-industrial-steel">
                        {otherVotes.map((vote) => (
                          <span key={vote.reviewer}>
                            {vote.reviewer}:{" "}
                            <span className="font-bold text-amber-500">
                              {vote.stars}
                              &#9733;
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

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
