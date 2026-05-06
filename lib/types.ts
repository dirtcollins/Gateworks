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
  inventory: "in_stock" | "out_of_stock";
  image: string;
  options: {
    length?: string;
    material?: string;
    finish?: string;
    color?: string;
  };
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  details: string[];
};

export type CartItem = {
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  options: ProductVariant["options"];
};
