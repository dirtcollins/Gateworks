// Wayfinder — account route. Consolidated account area: overview / auth,
// purchase history, and saved carts + lists.
import type { Metadata } from "next";
import { WayfinderAccount } from "@/features/sites/wayfinder/account-page";

export const metadata: Metadata = { title: "Account" };

export default function WayfinderAccountPage() {
  return <WayfinderAccount />;
}
