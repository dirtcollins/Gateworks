"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function CartLink() {
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
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
      aria-label="Open cart"
      className={cn(
        "relative grid size-10 place-items-center border border-jobsite-ink bg-jobsite-ink text-white transition-transform hover:bg-white hover:text-jobsite-ink",
        isAnimating && "animate-cart-bump"
      )}
      href="/cart"
    >
      <ShoppingBag size={20} />
      {itemCount > 0 ? (
        <span
          className={cn(
            "absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-full bg-jobsite-safety px-1 text-xs font-bold text-white ring-2 ring-white",
            isAnimating && "animate-cart-badge"
          )}
        >
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
