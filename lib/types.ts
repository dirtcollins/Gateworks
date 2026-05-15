export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  manual_price?: number | null;
  calculated_price?: number;
  rounded_price?: number;
  final_price?: number;
  pricing_method?: "manual" | "cwt_calculated";
  width_in?: number;
  height_in?: number;
  wall_thickness_in?: number;
  length_ft?: number;
  material_density_lb_per_in3?: number;
  steel_cwt_price?: number;
  calculated_weight_lb?: number;
  inventory: "in_stock" | "out_of_stock";
  inventoryQuantity: number;
  image: string;
  options: {
    length?: string;
    material?: string;
    finish?: string;
    color?: string;
    wall?: string;
  };
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  manual_price?: number | null;
  calculated_price?: number;
  rounded_price?: number;
  final_price?: number;
  pricing_method?: "manual" | "cwt_calculated";
  steel_cwt_price?: number;
  calculated_weight_lb?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  details: string[];
};

export type CartItem = {
  orderItemId?: string;
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  image: string;
  price: number;
  weightLbs?: number;
  cwtPrice?: number;
  pricingMethod?: "manual" | "cwt_calculated";
  quantity: number;
  quantityNeeded?: number;
  quantityPulled?: number;
  pulled?: boolean;
  pulledAt?: string;
  pulledBy?: string;
  pickNotes?: string;
  options: ProductVariant["options"];
};
