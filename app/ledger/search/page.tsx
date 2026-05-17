import { Suspense } from "react";
import { LedgerSearchView } from "@/features/sites/ledger/search";

export const metadata = {
  title: "Catalog search"
};

export default function LedgerSearchPage() {
  return (
    <Suspense fallback={null}>
      <LedgerSearchView />
    </Suspense>
  );
}
