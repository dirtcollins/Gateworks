"use client";

import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";

const REVIEWER_KEY = "gateworks-design-lab-reviewer";
const REVIEWERS_KEY = "gateworks-design-lab-reviewers";
const DEFAULT_REVIEWERS = ["Nathan", "Brendan"];

export type Rating = {
  reviewer: string;
  designId: string;
  scope: string;
  stars: number;
};

type ApiRow = {
  reviewer: string;
  design_id: string;
  scope: string;
  stars: number;
};

// Tracks who is doing the reviewing. Stored per-device so the hub and the
// in-demo dock agree on the active reviewer.
export function useReviewer() {
  const [reviewer, setReviewerState] = useState<string>(DEFAULT_REVIEWERS[0]);
  const [reviewers, setReviewers] = useState<string[]>(DEFAULT_REVIEWERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedList = JSON.parse(
        localStorage.getItem(REVIEWERS_KEY) || "null"
      ) as string[] | null;
      const list =
        savedList && savedList.length ? savedList : DEFAULT_REVIEWERS;
      setReviewers(list);
      const savedActive = localStorage.getItem(REVIEWER_KEY);
      setReviewerState(
        savedActive && list.includes(savedActive) ? savedActive : list[0]
      );
    } catch {
      // ignore unreadable storage
    }
    setReady(true);
  }, []);

  const setReviewer = useCallback((name: string) => {
    setReviewerState(name);
    try {
      localStorage.setItem(REVIEWER_KEY, name);
    } catch {
      // ignore storage failures
    }
  }, []);

  const addReviewer = useCallback(
    (name: string) => {
      const clean = name.trim().slice(0, 40);
      if (!clean) return;
      setReviewers((prev) => {
        const next = prev.includes(clean) ? prev : [...prev, clean];
        try {
          localStorage.setItem(REVIEWERS_KEY, JSON.stringify(next));
        } catch {
          // ignore storage failures
        }
        return next;
      });
      setReviewer(clean);
    },
    [setReviewer]
  );

  return { reviewer, reviewers, ready, setReviewer, addReviewer };
}

// Loads every reviewer's ratings and writes new ones through the API. Pass
// `enabled: false` to skip the network fetch where ratings aren't shown.
export function useRatings(enabled = true) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let active = true;
    fetch("/api/design-lab/ratings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { configured?: boolean; ratings?: ApiRow[] }) => {
        if (!active) return;
        setConfigured(data.configured !== false);
        setRatings(
          (data.ratings || []).map((row) => ({
            reviewer: row.reviewer,
            designId: row.design_id,
            scope: row.scope,
            stars: row.stars
          }))
        );
      })
      .catch(() => {
        if (active) setConfigured(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  const rate = useCallback(
    (reviewer: string, designId: string, scope: string, stars: number) => {
      setRatings((prev) => {
        const rest = prev.filter(
          (item) =>
            !(
              item.reviewer === reviewer &&
              item.designId === designId &&
              item.scope === scope
            )
        );
        return stars > 0
          ? [...rest, { reviewer, designId, scope, stars }]
          : rest;
      });
      void fetch("/api/design-lab/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewer, designId, scope, stars })
      }).catch(() => {
        // keep the optimistic value; persistence retry is not critical here
      });
    },
    []
  );

  return { ratings, configured, loading, rate };
}

export function ratingFor(
  ratings: Rating[],
  reviewer: string,
  designId: string,
  scope: string
): number {
  return (
    ratings.find(
      (item) =>
        item.reviewer === reviewer &&
        item.designId === designId &&
        item.scope === scope
    )?.stars ?? 0
  );
}

export function votesFor(
  ratings: Rating[],
  designId: string,
  scope: string
): Rating[] {
  return ratings
    .filter((item) => item.designId === designId && item.scope === scope)
    .sort((a, b) => a.reviewer.localeCompare(b.reviewer));
}

export function StarRating({
  value,
  onRate,
  size = 18,
  readOnly = false,
  dark = false,
  label
}: {
  value: number;
  onRate?: (stars: number) => void;
  size?: number;
  readOnly?: boolean;
  dark?: boolean;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const emptyClass = dark ? "fill-none text-white/30" : "fill-none text-black/25";

  return (
    <div aria-label={label} className="flex items-center gap-0.5" role="group">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={
            readOnly
              ? "cursor-default"
              : "cursor-pointer transition hover:scale-110"
          }
          disabled={readOnly}
          key={star}
          onClick={() => {
            if (!readOnly) onRate?.(value === star ? 0 : star);
          }}
          onMouseEnter={() => {
            if (!readOnly) setHover(star);
          }}
          onMouseLeave={() => {
            if (!readOnly) setHover(0);
          }}
          type="button"
        >
          <Star
            className={
              star <= shown ? "fill-current text-amber-400" : emptyClass
            }
            style={{ width: size, height: size }}
          />
        </button>
      ))}
    </div>
  );
}
