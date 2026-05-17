"use client";

import { useEffect } from "react";
import { hydrateCartForUser } from "@/lib/cart-store";
import { hydrateListsForUser } from "@/lib/list-store";
import { hydrateOrdersForUser } from "@/lib/order-store";
import { hydrateQuotesForUser } from "@/lib/quote-store";
import { hydrateSavedCartsForUser } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";

export function UserStorageScope() {
  const userId = useUserStore((state) => state.userId);

  useEffect(() => {
    hydrateCartForUser(userId);
    hydrateListsForUser(userId);
    hydrateOrdersForUser(userId);
    hydrateQuotesForUser(userId);
    hydrateSavedCartsForUser(userId);
  }, [userId]);

  return null;
}
