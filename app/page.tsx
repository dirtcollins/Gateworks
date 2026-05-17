import { redirect } from "next/navigation";

// The original storefront has been retired (preserved on the
// backup/original-site branch). The root now lands on the Ledger site.
export default function RootPage() {
  redirect("/ledger");
}
