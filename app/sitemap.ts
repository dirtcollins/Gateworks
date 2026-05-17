import type { MetadataRoute } from "next";
import { categories, products } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = ["", "/search", "/quote", "/cart"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6
  }));

  const slugsWithProducts = new Set(products.map((product) => product.category.slug));
  const categoryRoutes = categories
    .filter((category) => slugsWithProducts.has(category.slug))
    .map((category) => ({
      url: `${SITE_URL}/categories/${category.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }));

  const productRoutes = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
