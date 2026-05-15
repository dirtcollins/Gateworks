"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";

export type SavedCart = {
  id: string;
  name: string;
  jobName: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};

type SavedCartState = {
  carts: SavedCart[];
  setCarts: (carts: SavedCart[]) => void;
  saveCart: (name: string, jobName: string, items: CartItem[]) => string;
  deleteCart: (cartId: string) => void;
};

const savedCartStoreName = "gateworks-saved-carts";

function savedCartDefaults() {
  return { carts: [] };
}

function makeCartId(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "cart"}-${Date.now()}`;
}

export const useSavedCartStore = create<SavedCartState>()(
  persist(
    (set) => ({
      carts: [],
      setCarts: (carts) => set({ carts }),
      saveCart: (name, jobName, items) => {
        const cartId = makeCartId(name || jobName || "saved-cart");
        const now = new Date().toISOString();
        const savedCart: SavedCart = {
          id: cartId,
          name: name.trim() || "Saved cart",
          jobName: jobName.trim(),
          items,
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({ carts: [savedCart, ...state.carts] }));
        return cartId;
      },
      deleteCart: (cartId) =>
        set((state) => ({ carts: state.carts.filter((cart) => cart.id !== cartId) }))
    }),
    {
      name: makeScopedStoreName(savedCartStoreName, "guest"),
      skipHydration: true
    }
  )
);

export function hydrateSavedCartsForUser(userId: string) {
  const scopedStoreName = makeScopedStoreName(savedCartStoreName, userId);
  const persistedState = readScopedPersistedState(
    savedCartStoreName,
    userId,
    savedCartDefaults
  );

  useSavedCartStore.persist.setOptions({ name: scopedStoreName });
  useSavedCartStore.setState(persistedState);
}
