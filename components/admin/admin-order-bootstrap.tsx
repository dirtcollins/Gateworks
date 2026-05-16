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
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    async function hydrateOrders() {
      setRemoteOrdersLoading(true);

      try {
        const response = await fetch("/api/orders?limit=75&includeItems=false", {
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

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => void hydrateOrders(), {
        timeout: 1800
      });
    } else {
      timeoutHandle = globalThis.setTimeout(() => void hydrateOrders(), 500);
    }

    return () => {
      mounted = false;
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) {
        globalThis.clearTimeout(timeoutHandle);
      }
    };
  }, [hasRemoteOrdersLoaded, isRemoteOrdersLoading, setOrders, setRemoteOrdersLoading, setRemoteOrdersLoaded]);

  return null;
}
