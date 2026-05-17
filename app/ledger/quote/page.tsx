"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LedgerPage, LEDGER } from "@/features/sites/ledger/kit";
import { useUserStore } from "@/lib/user-store";
import { saveQuote } from "@/lib/quotes-data";

/* Quote builder entry — creates a fresh DB-backed draft quote for the
 * logged-in account, then routes to its builder. Falls back to the
 * quotes list when the quote database is not configured. */
export default function LedgerQuotePage() {
  const router = useRouter();
  const userId = useUserStore((state) => state.userId);
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await saveQuote({
        status: "draft",
        siteUserId: userId,
        customerName: displayName === "Guest" ? "" : displayName,
        customerEmail: email,
        terms: "Net 30",
        items: []
      });
      if (result.quote) {
        router.replace(`/ledger/quotes/${result.quote.id}`);
      } else {
        router.replace("/ledger/quotes");
      }
    })();
  }, [router, userId, displayName, email]);

  return (
    <LedgerPage>
      <div
        className="py-24 text-center text-[13px]"
        style={{ color: LEDGER.muted }}
      >
        Opening your quote builder…
      </div>
    </LedgerPage>
  );
}
