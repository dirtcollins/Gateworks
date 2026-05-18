// Wayfinder — search results / catalog browse route. The search component is
// client-side and reads the q / category params via useSearchParams, so it is
// wrapped in Suspense as Next requires for that hook.
import { Suspense } from "react";
import { WayfinderSearch } from "@/features/sites/wayfinder/search-page";

export const metadata = {
  title: "Catalog search"
};

export default function WayfinderSearchPage() {
  return (
    <Suspense fallback={null}>
      <WayfinderSearch />
    </Suspense>
  );
}
