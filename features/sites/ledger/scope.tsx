"use client";

import { useEffect, useState } from "react";
import { hydrateCartForUser } from "@/lib/cart-store";
import { hydrateListsForUser } from "@/lib/list-store";
import { hydrateOrdersForUser } from "@/lib/order-store";
import { hydrateQuotesForUser } from "@/lib/quote-store";
import { hydrateSavedCartsForUser } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";

/* Hydrates every persisted, user-scoped Zustand store for the Ledger
 * site. All Ledger store-driven pages mount this once so cart, quotes,
 * orders, lists, and saved carts reflect the active account. */
export function useLedgerScope() {
  const userId = useUserStore((state) => state.userId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateCartForUser(userId);
    hydrateListsForUser(userId);
    hydrateOrdersForUser(userId);
    hydrateQuotesForUser(userId);
    hydrateSavedCartsForUser(userId);
    setHydrated(true);
  }, [userId]);

  return hydrated;
}
