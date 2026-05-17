import type { Metadata } from "next";
import type { Product } from "@/lib/types";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gateworks.com"
).replace(/\/$/, "");

export const SITE_NAME = "Gateworks";

export const SITE_DESCRIPTION =
  "Construction and gate hardware for contractors and builders — hinges, latches, gate hardware, fencing, and steel supply.";

function truncate(value: string, max = 160) {
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function productMetadata(product: Product): Metadata {
  const socialTitle = `${product.title} | ${SITE_NAME}`;
  const description = truncate(
    product.description || `${product.title} from ${SITE_NAME}.`
  );
  const url = `${SITE_URL}/products/${product.slug}`;
  const image = product.images[0]?.url;

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: product.title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION
  };
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`
    }))
  };
}

export function productJsonLd(product: Product) {
  const inStock = product.variants.some((variant) => variant.inventory === "in_stock");

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.variants[0]?.sku,
    category: product.category.name,
    brand: {
      "@type": "Brand",
      name: product.specifications.Brand ?? SITE_NAME
    },
    image: product.images.map((image) => image.url).filter(Boolean),
    ...(product.price > 0
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: product.price.toFixed(2),
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${SITE_URL}/products/${product.slug}`
          }
        }
      : {})
  };
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
