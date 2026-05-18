// Wayfinder — home route. Renders the storefront homepage. Site-level
// Organization JSON-LD is emitted globally from the root app/layout.tsx.
import type { Metadata } from "next";
import { WayfinderHome } from "@/features/sites/wayfinder/home-page";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  // Absolute title overrides the layout's "%s · Wayfinder" template on the
  // home page so the brand name leads.
  title: {
    absolute: `${SITE_NAME} — Gate Hardware, Steel & Fence Supply`
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Gate Hardware, Steel & Fence Supply`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    siteName: SITE_NAME
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Gate Hardware, Steel & Fence Supply`,
    description: SITE_DESCRIPTION
  }
};

export default function WayfinderHomePage() {
  return <WayfinderHome />;
}
