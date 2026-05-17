export type DesignLabDesign = {
  id: string;
  name: string;
  note: string;
};

export type DesignLabPage = {
  slug: string;
  label: string;
};

export const designLabDesigns: DesignLabDesign[] = [
  { id: "d1", name: "Industrial Pro", note: "Refined industrial — warm, confident, premium." },
  { id: "d2", name: "Warehouse Dark", note: "Dark, high-contrast B2B operations terminal." },
  { id: "d3", name: "Editorial Catalog", note: "Magazine-grade — big imagery, art-directed." },
  { id: "d4", name: "Modern Marketplace", note: "Bright, friendly, conversion-optimized retail." },
  { id: "d5", name: "Compact Utility", note: "Ultra-dense, fast, terminal-like." }
];

export const designLabPages: DesignLabPage[] = [
  { slug: "home", label: "Home" },
  { slug: "product", label: "Product" },
  { slug: "category", label: "Category" },
  { slug: "cart", label: "Cart" },
  { slug: "orders", label: "Admin Orders" },
  { slug: "reports", label: "Admin Reports" }
];
