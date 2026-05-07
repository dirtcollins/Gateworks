"use client";

import { Minus, Plus } from "lucide-react";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({ value, onChange }: QuantitySelectorProps) {
  return (
    <div className="flex h-12 w-36 items-center overflow-hidden border border-jobsite-rail bg-white">
      <button
        aria-label="Decrease quantity"
        className="grid h-full w-12 place-items-center text-jobsite-steel hover:bg-jobsite-paper"
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={18} />
      </button>
      <input
        aria-label="Quantity"
        className="h-full w-12 border-x border-jobsite-rail text-center text-base font-semibold outline-none"
        min={1}
        type="number"
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}
      />
      <button
        aria-label="Increase quantity"
        className="grid h-full w-12 place-items-center text-jobsite-steel hover:bg-jobsite-paper"
        type="button"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
