"use client";

import { useEffect, useState } from "react";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";

type LiveOrders = {
  orders: OrderRecord[];
  isLoading: boolean;
};

// Loads real orders from the API into the order store. Shared by the Design
// Lab admin-orders pages so each design renders live order data.
export function useLiveOrders(): LiveOrders {
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };

        if (payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [setOrders]);

  return { orders, isLoading };
}
