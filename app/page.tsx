import { redirect } from "next/navigation";

// Wayfinder is the production storefront. The root lands on it until
// Wayfinder's routes are promoted to the root path.
export default function RootPage() {
  redirect("/wayfinder");
}
