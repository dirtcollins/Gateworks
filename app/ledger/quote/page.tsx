"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LedgerPage, LEDGER } from "@/features/sites/ledger/kit";
import { useLedgerScope } from "@/features/sites/ledger/scope";
import { useQuoteStore } from "@/lib/quote-store";

/* Quote builder entry — hydrates stores, then routes to the active
 * quote's detail/builder page. Mirrors the real /quote behavior. */
export default function LedgerQuotePage() {
  const hydrated = useLedgerScope();
  const router = useRouter();
  const activeQuoteId = useQuoteStore((state) => state.activeQuoteId);

  useEffect(() => {
    if (hydrated && activeQuoteId) {
      router.replace(`/ledger/quotes/${activeQuoteId}`);
    }
  }, [hydrated, activeQuoteId, router]);

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
