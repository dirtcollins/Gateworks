"use client";

import { useEffect } from "react";
import { hydrateCartForUser } from "@/lib/cart-store";
import { hydrateListsForUser } from "@/lib/list-store";
import { hydrateQuotesForUser } from "@/lib/quote-store";
import { useUserStore } from "@/lib/user-store";

export function UserStorageScope() {
  const userId = useUserStore((state) => state.userId);

  useEffect(() => {
    hydrateCartForUser(userId);
    hydrateListsForUser(userId);
    hydrateQuotesForUser(userId);
  }, [userId]);

  return null;
}

