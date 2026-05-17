"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type QuickAddToCartButtonProps = {
  item: CartItem | null;
  compact?: boolean;
};

export function QuickAddToCartButton({ item, compact = false }: QuickAddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const isDisabled = !item;

  function updateQuantity(value: number) {
    setQuantity(Math.max(1, Number.isFinite(value) ? value : 1));
  }

  function handleAddToCart() {
    if (!item) return;

    addItem({ ...item, quantity });
    setJustAdded(true);
    setQuantity(1);
    window.setTimeout(() => setJustAdded(false), 1100);
  }

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-[104px_1fr]" : "grid-cols-[112px_1fr]")}>
      <div className="flex h-10 overflow-hidden rounded-md border border-black/10 bg-white">
        <button
          aria-label="Decrease quantity"
          className="grid w-9 place-items-center text-industrial-muted transition hover:bg-[#f7f7f4] hover:text-industrial-ink disabled:cursor-not-allowed disabled:text-industrial-muted/50"
          disabled={isDisabled || quantity <= 1}
          type="button"
          onClick={() => updateQuantity(quantity - 1)}
        >
          <Minus size={15} />
        </button>
        <input
          aria-label="Quick add quantity"
          className="h-full min-w-0 flex-1 border-x border-black/10 text-center text-sm font-semibold text-industrial-ink outline-none"
          disabled={isDisabled}
          min={1}
          type="number"
          value={quantity}
          onChange={(event) => updateQuantity(Number(event.target.value))}
        />
        <button
          aria-label="Increase quantity"
          className="grid w-9 place-items-center text-industrial-muted transition hover:bg-[#f7f7f4] hover:text-industrial-ink disabled:cursor-not-allowed disabled:text-industrial-muted/50"
          disabled={isDisabled}
          type="button"
          onClick={() => updateQuantity(quantity + 1)}
        >
          <Plus size={15} />
        </button>
      </div>
      <button
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-[#f7f7f4] disabled:text-industrial-muted",
          justAdded
            ? "border-[#235b4b] bg-[#235b4b] text-white"
            : "border-black/10 bg-industrial-ink text-white hover:bg-[#235b4b]"
        )}
        disabled={isDisabled}
        type="button"
        onClick={handleAddToCart}
      >
        {justAdded ? <Check size={16} /> : <Plus size={16} />}
        {justAdded ? "Added" : "Add"}
      </button>
    </div>
  );
}
