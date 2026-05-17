import type { Metadata } from "next";
import { D11Category } from "@/features/design-lab/d11/category";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Category",
  robots: { index: false, follow: false }
};

export default function D11CategoryPage() {
  return <D11Category />;
}
