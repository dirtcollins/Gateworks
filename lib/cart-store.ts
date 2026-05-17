"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  replaceCart: (items: CartItem[]) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
};

const cartStoreName = "construction-commerce-cart";

function cartDefaults() {
  return { items: [] };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId
          );

          if (!existing) {
            return { items: [...state.items, item] };
          }

          return {
            items: state.items.map((cartItem) =>
              cartItem.variantId === item.variantId
                ? {
                    ...cartItem,
                    quantity: cartItem.quantity + item.quantity
                  }
                : cartItem
            )
          };
        }),
      replaceCart: (items) => set({ items }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId)
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          )
        })),
      clearCart: () => set({ items: [] })
    }),
    {
      name: makeScopedStoreName(cartStoreName, "guest"),
      skipHydration: true
    }
  )
);

export function hydrateCartForUser(userId: string) {
  const scopedStoreName = makeScopedStoreName(cartStoreName, userId);
  const persistedState = readScopedPersistedState(cartStoreName, userId, cartDefaults);

  useCartStore.persist.setOptions({ name: scopedStoreName });
  useCartStore.setState(persistedState);
}
