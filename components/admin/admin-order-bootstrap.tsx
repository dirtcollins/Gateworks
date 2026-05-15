"use client";

import { useEffect } from "react";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";

export function AdminOrderBootstrap() {
  const setOrders = useOrderStore((state) => state.setOrders);
  const setRemoteOrdersLoading = useOrderStore((state) => state.setRemoteOrdersLoading);
  const setRemoteOrdersLoaded = useOrderStore((state) => state.setRemoteOrdersLoaded);
  const isRemoteOrdersLoading = useOrderStore((state) => state.isRemoteOrdersLoading);
  const hasRemoteOrdersLoaded = useOrderStore((state) => state.hasRemoteOrdersLoaded);

  useEffect(() => {
    if (hasRemoteOrdersLoaded || isRemoteOrdersLoading) return;

    let mounted = true;
    setRemoteOrdersLoading(true);

    async function hydrateOrders() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });

        if (!mounted) return;

        if (response.ok) {
          const payload = (await response.json()) as {
            orders?: OrderRecord[];
            persisted?: boolean;
          };

          if (payload.persisted && payload.orders) {
            setOrders(payload.orders);
          }
        }
      } catch {
        // Best effort only; keep local workspace active when API is unavailable.
      } finally {
        if (mounted) {
          setRemoteOrdersLoaded(true);
          setRemoteOrdersLoading(false);
        }
      }
    }

    void hydrateOrders();

    return () => {
      mounted = false;
    };
  }, [hasRemoteOrdersLoaded, isRemoteOrdersLoading, setOrders, setRemoteOrdersLoading, setRemoteOrdersLoaded]);

  return null;
}
