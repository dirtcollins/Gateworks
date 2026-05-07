"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type RecentlyViewedState = {
  productIds: string[];
  addProduct: (productId: string) => void;
};

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      addProduct: (productId) =>
        set((state) => ({
          productIds: [
            productId,
            ...state.productIds.filter((current) => current !== productId)
          ].slice(0, 8)
        }))
    }),
    {
      name: "construction-commerce-recently-viewed"
    }
  )
);
