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
  { id: "d2", name: "Mono", note: "Pure monochrome minimalism — hairline grid, type-driven, gallery calm." },
  { id: "d3", name: "Editorial Catalog", note: "Magazine-grade — big imagery, art-directed." },
  { id: "d4", name: "Modern Marketplace", note: "Bright, friendly, conversion-optimized retail." },
  { id: "d5", name: "Field Ops", note: "Rugged field-ready — high-contrast safety-orange, big-touch, fast." },
  { id: "d6", name: "Apex", note: "Flagship — cinematic dark, spatial depth, high-tech precision." }
];

export const designLabPages: DesignLabPage[] = [
  { slug: "home", label: "Home" },
  { slug: "product", label: "Product" },
  { slug: "category", label: "Category" },
  { slug: "cart", label: "Cart" },
  { slug: "orders", label: "Admin Orders" },
  { slug: "reports", label: "Admin Reports" }
];
