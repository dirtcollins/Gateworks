"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useListStore } from "@/lib/list-store";
import { cn } from "@/lib/utils";

export function ListLink() {
  const itemCount = useListStore((state) =>
    state.lists.reduce(
      (total, list) =>
        total + list.items.reduce((listTotal, item) => listTotal + item.quantity, 0),
      0
    )
  );
  const previousItemCount = useRef(itemCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (itemCount > previousItemCount.current) {
      setIsAnimating(false);
      window.requestAnimationFrame(() => setIsAnimating(true));
      const timer = window.setTimeout(() => setIsAnimating(false), 650);
      previousItemCount.current = itemCount;
      return () => window.clearTimeout(timer);
    }

    previousItemCount.current = itemCount;
  }, [itemCount]);

  return (
    <Link
      aria-label="Open lists"
      className={cn(
        "relative grid size-10 place-items-center border border-jobsite-rail bg-white text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper",
        isAnimating && "animate-cart-bump"
      )}
      href="/lists"
    >
      <Heart size={20} />
      {itemCount > 0 ? (
        <span
          className={cn(
            "absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full bg-red-700 px-1 text-xs font-bold text-white ring-2 ring-white",
            isAnimating && "animate-cart-badge"
          )}
        >
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
