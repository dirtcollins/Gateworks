import type { ProductVariant } from "@/lib/types";

export type ProductField = "title" | "description";
export type OptionField = keyof ProductVariant["options"];
export type EditorMode = "pricing" | "full";

export type AdminPatchPayload =
  | {
      action: "update_product";
      productId: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "update_variant";
      variantId?: string;
      sku?: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "update_image";
      imageId: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "add_image";
      productId: string;
      image: {
        url: string;
        alt: string;
        sort_order: number;
      };
    }
  | {
      action: "delete_image";
      imageId: string;
    };
