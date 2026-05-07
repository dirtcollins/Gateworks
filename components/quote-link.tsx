"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/lib/quote-store";
import { cn } from "@/lib/utils";

export function QuoteLink() {
  const itemCount = useQuoteStore((state) =>
    state.quotes.reduce(
      (total, quote) =>
        total +
        quote.items.reduce((quoteTotal, item) => quoteTotal + item.quantity, 0),
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
      aria-label="Open quote"
      className={cn(
        "relative grid size-10 place-items-center border border-jobsite-rail bg-white text-jobsite-ink transition hover:border-jobsite-ink hover:bg-jobsite-paper",
        isAnimating && "animate-cart-bump"
      )}
      href="/quotes"
    >
      <ClipboardList size={20} />
      {itemCount > 0 ? (
        <span
          className={cn(
            "absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full bg-jobsite-pine px-1 text-xs font-bold text-white ring-2 ring-white",
            isAnimating && "animate-cart-badge"
          )}
        >
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
