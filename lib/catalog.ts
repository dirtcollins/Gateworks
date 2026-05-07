import rawCatalog from "@/data/national_hardware_gate_products.json";
import type { Category, Product, ProductVariant } from "@/lib/types";
import { slugify } from "@/lib/utils";

type RawProduct = {
  source?: string;
  brand?: string;
  source_category_slug: string;
  source_category: string;
  product_grouping: string;
  slug: string;
  stock_number: string;
  upc?: string;
  catalog_number: string;
  display_name: string;
  website_name: string;
  size?: string;
  finish?: string;
  price?: number;
  price_label?: string;
  availability?: string;
  is_discontinued?: boolean;
  url?: string;
  image?: string;
  secondary_image?: string;
  features?: string[];
  technical_documents?: string[];
  safe_working_load_range?: string | null;
  collection?: string;
  web_type?: string;
  self_closing?: boolean;
  keyed?: boolean;
  pin_type?: string;
  source_categories?: string[];
};

const rawProducts = (rawCatalog as { products: RawProduct[] }).products;

function inferMaterial(item: RawProduct) {
  const text = `${item.display_name} ${item.website_name} ${item.web_type}`.toLowerCase();
  if (text.includes("stainless")) return "Stainless Steel";
  if (text.includes("aluminum")) return "Aluminum";
  if (text.includes("vinyl")) return "Vinyl";
  if (text.includes("wood")) return "Wood";
  return "Steel";
}

function inferColor(finish?: string) {
  const normalized = finish?.trim();
  if (!normalized) return "Standard";
  if (/black/i.test(normalized)) return "Black";
  if (/white/i.test(normalized)) return "White";
  if (/zinc|galvanized/i.test(normalized)) return "Silver";
  if (/brass|gold/i.test(normalized)) return "Brass";
  return normalized;
}

function getHighResolutionImageUrl(url?: string) {
  if (!url || url.includes("/noimage")) return undefined;
  if (!url.includes("images.national-hardware.com/is/image/nh/")) return url;

  const [baseUrl] = url.split("?");
  return `${baseUrl}?wid=1600&hei=1600&fmt=png-alpha`;
}

function getInferredNationalImageUrl(item: RawProduct) {
  const numericSku = item.stock_number?.replace(/\D/g, "");
  if (!numericSku) return undefined;

  return `https://images.national-hardware.com/is/image/nh/nh_${numericSku}_c1?wid=1600&hei=1600&fmt=png-alpha`;
}

function sizeSortValue(size?: string) {
  if (!size) return Number.MAX_SAFE_INTEGER;
  const [whole, fraction] = size.replace(/"/g, "").split("-");
  const wholeNumber = Number(whole) || 0;

  if (!fraction?.includes("/")) {
    return wholeNumber;
  }

  const [numerator, denominator] = fraction.split("/").map(Number);
  return wholeNumber + (denominator ? numerator / denominator : 0);
}

function uniqueValues(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getProductTitle(first: RawProduct, variants: ProductVariant[]) {
  const baseTitle = first.display_name || first.website_name;

  if (variants.length !== 1) {
    return baseTitle;
  }

  const [variant] = variants;
  const titleParts = [
    variant.options.length !== "Standard" ? variant.options.length : undefined,
    variant.options.finish !== "Standard" ? variant.options.finish : undefined,
    baseTitle
  ].filter(Boolean);

  return titleParts.join(" ");
}

function getOptionSummary(values: string[]) {
  return values.length > 1 ? "Varies by option" : values[0] || "N/A";
}

function getDisplayPrice(variants: ProductVariant[]) {
  const inStockPrices = variants
    .filter((variant) => variant.inventory === "in_stock")
    .map((variant) => variant.price);
  const prices = inStockPrices.length
    ? inStockPrices
    : variants.map((variant) => variant.price);

  return Math.min(...prices);
}

function uniqueCategories(items: RawProduct[]): Category[] {
  const categoryMap = new Map<string, Category>();

  items.forEach((item) => {
    categoryMap.set(item.source_category_slug, {
      id: item.source_category_slug,
      name: item.source_category,
      slug: item.source_category_slug
    });
  });

  return Array.from(categoryMap.values());
}

function buildProduct(groupSlug: string, groupItems: RawProduct[]): Product {
  const first = groupItems[0];
  const fallbackImage =
    groupItems
      .flatMap((item) => [
        getHighResolutionImageUrl(item.image),
        getHighResolutionImageUrl(item.secondary_image),
        getInferredNationalImageUrl(item)
      ])
      .find(Boolean) || "/assets/logo.svg";
  const category = {
    id: first.source_category_slug,
    name: first.source_category,
    slug: first.source_category_slug
  };

  const variants: ProductVariant[] = groupItems
    .map((item, index) => {
      const id = `${groupSlug}-${slugify(item.stock_number || String(index))}`;
      const image =
        getHighResolutionImageUrl(item.image) ||
        getHighResolutionImageUrl(item.secondary_image) ||
        getInferredNationalImageUrl(item) ||
        fallbackImage;

      return {
        id,
        productId: groupSlug,
        sku: item.stock_number || item.catalog_number || id,
        price: Number(item.price || first.price || 0),
        inventory: "in_stock" as const,
        inventoryQuantity: 100,
        image,
        options: {
          length: item.size || "Standard",
          material: inferMaterial(item),
          finish: item.finish || "Standard",
          color: inferColor(item.finish)
        }
      };
    })
    .sort((a, b) => {
      if (a.inventory !== b.inventory) {
        return a.inventory === "in_stock" ? -1 : 1;
      }

      return sizeSortValue(a.options.length) - sizeSortValue(b.options.length);
    });

  const imageUrls = Array.from(
    new Set(
      groupItems
        .flatMap((item) => [
          getHighResolutionImageUrl(item.image),
          getHighResolutionImageUrl(item.secondary_image),
          !item.image && !item.secondary_image
            ? getInferredNationalImageUrl(item)
            : undefined
        ])
        .filter((url): url is string => Boolean(url))
    )
  );

  const title = getProductTitle(first, variants);
  const featureText = first.features?.length
    ? ` Built for ${first.features.join(", ")} applications.`
    : "";
  const lengthValues = uniqueValues(variants.map((variant) => variant.options.length));
  const finishValues = uniqueValues(variants.map((variant) => variant.options.finish));
  const hasOptions = variants.length > 1;
  const details = hasOptions
    ? [
        "Choose the available variant by size, material, finish, or color.",
        "Variant changes update image, SKU, price, and inventory without a page reload.",
        "Suitable for Phase 1 construction ecommerce catalog workflows."
      ]
    : [
        `${title} is a single-SKU product with fixed size, finish, price, and inventory.`,
        "Add to cart, quantity changes, specifications, and reviews are available on this product page.",
        "Suitable for Phase 1 construction ecommerce catalog workflows."
      ];

  return {
    id: groupSlug,
    slug: first.slug || groupSlug,
    title,
    description:
      `${first.website_name || title} for gates, fencing, and exterior construction work.${featureText}`.trim(),
    category,
    price: getDisplayPrice(variants),
    images: imageUrls.map((url, index) => ({
      id: `${groupSlug}-image-${index + 1}`,
      productId: groupSlug,
      variantId: index === 0 ? variants[0]?.id : undefined,
      url,
      alt: `${title} image ${index + 1}`,
      sortOrder: index + 1
    })),
    variants,
    specifications: {
      Brand: first.brand || first.source || "Construction Supply",
      Category: first.source_category,
      "Catalog Number": first.catalog_number || "N/A",
      "Primary SKU": first.stock_number || "N/A",
      Finish: getOptionSummary(finishValues),
      Size: getOptionSummary(lengthValues),
      "Self Closing": first.self_closing ? "Yes" : "No",
      Keyed: first.keyed ? "Yes" : "No",
      "Pin Type": first.pin_type || "Standard"
    },
    details
  };
}

const groupedProducts = rawProducts.reduce<Map<string, RawProduct[]>>((map, item) => {
  const key = item.product_grouping || item.slug;
  const current = map.get(key) || [];
  current.push(item);
  map.set(key, current);
  return map;
}, new Map());

function withDecorativeTHingeVariants(product: Product): Product {
  if (product.slug !== "1118-decorative-t-hinge") {
    return product;
  }

  const variantGroups = [
    "1118-decorative-t-hinge",
    "841-ornamental-reversible-t-hinges",
    "843-ornamental-t-hinge",
    "849-ornamental-t-hinges",
    "859-ornamental-t-hinges"
  ];
  const variantRows: RawProduct[] = [
    ...rawProducts.filter((item) =>
      variantGroups.includes(item.product_grouping || item.slug)
    ),
    {
      source: "Lowes",
      source_category_slug: "gate-hinges",
      source_category: "Gate Hinges",
      product_grouping: "1118-decorative-t-hinge",
      slug: "1118-decorative-t-hinge",
      stock_number: "N109-041",
      upc: "",
      catalog_number: "Ornamental/Reversible",
      display_name: "Decorative T Hinge",
      website_name: "National Hardware Ornamental 4-in Black Gate hinge",
      size: "4\"",
      finish: "Black",
      price: 5.98,
      price_label: "Lowe's retail reference price",
      availability: "Active",
      is_discontinued: false,
      url: "https://www.lowes.com/pd/National-Hardware-9-11-16-in-Black-Gate-Hinge/50414156",
      image: "https://images.national-hardware.com/is/image/nh/nh_881904_c1?$nhwProductThumbs$",
      secondary_image: "",
      features: ["outdoor", "weatherguard"],
      technical_documents: [],
      safe_working_load_range: null,
      collection: "",
      web_type: "Gate_Hinges T-Hinges",
      self_closing: false,
      keyed: false,
      pin_type: "",
      source_categories: ["Gate Hinges"]
    },
    {
      source: "Lowes",
      source_category_slug: "gate-hinges",
      source_category: "Gate Hinges",
      product_grouping: "1118-decorative-t-hinge",
      slug: "1118-decorative-t-hinge",
      stock_number: "N109-042",
      upc: "",
      catalog_number: "Ornamental/Reversible",
      display_name: "Decorative T Hinge",
      website_name: "National Hardware 6-in Black Gate hinge",
      size: "6\"",
      finish: "Black",
      price: 8.98,
      price_label: "Lowe's retail reference price",
      availability: "Active",
      is_discontinued: false,
      url: "https://www.lowes.com/pd/National-Hardware-Black-Strap-Door-Hinge/50414050",
      image: "https://images.national-hardware.com/is/image/nh/snh_165480_c1?$nhwProductThumbs$",
      secondary_image: "",
      features: ["outdoor", "weatherguard"],
      technical_documents: [],
      safe_working_load_range: null,
      collection: "",
      web_type: "Gate_Hinges T-Hinges",
      self_closing: false,
      keyed: false,
      pin_type: "",
      source_categories: ["Gate Hinges"]
    },
    {
      source: "Lowes",
      source_category_slug: "gate-hinges",
      source_category: "Gate Hinges",
      product_grouping: "1118-decorative-t-hinge",
      slug: "1118-decorative-t-hinge",
      stock_number: "N109-037",
      upc: "",
      catalog_number: "Ornamental/Reversible",
      display_name: "Decorative T Hinge",
      website_name: "National Hardware Ornamental 8-in Black Gate hinge",
      size: "8\"",
      finish: "Black",
      price: 10.78,
      price_label: "Lowes retail price",
      availability: "Active",
      is_discontinued: false,
      url: "https://www.lowes.com/pd/National-Hardware-9-11-16-in-Black-Gate-Hinge/50414156",
      image: "https://images.national-hardware.com/is/image/nh/snh_165480_c1?$nhwProductThumbs$",
      secondary_image: "",
      features: ["outdoor", "weatherguard"],
      technical_documents: [],
      safe_working_load_range: null,
      collection: "",
      web_type: "Gate_Hinges T-Hinges",
      self_closing: false,
      keyed: false,
      pin_type: "",
      source_categories: ["Gate Hinges"]
    }
  ];
  const variantProduct = buildProduct(
    "1118-decorative-t-hinge",
    variantRows.sort((a, b) => sizeSortValue(a.size) - sizeSortValue(b.size))
  );
  const variantsByOptions = new Map<string, ProductVariant>();

  variantProduct.variants.forEach((variant) => {
    const optionKey = [
      variant.options.length,
      variant.options.material,
      variant.options.finish,
      variant.options.color
    ].join("|");
    const existing = variantsByOptions.get(optionKey);

    if (
      !existing ||
      variant.price < existing.price ||
      (existing.image.includes("noimage") && !variant.image.includes("noimage"))
    ) {
      variantsByOptions.set(optionKey, variant);
    }
  });

  const variants = Array.from(variantsByOptions.values()).sort(
    (a, b) => sizeSortValue(a.options.length) - sizeSortValue(b.options.length)
  );
  const images = variantProduct.images.filter((image) =>
    variants.some((variant) => variant.image === image.url)
  );

  return {
    ...variantProduct,
    price: getDisplayPrice(variants),
    variants,
    images,
    slug: product.slug,
    title: "Decorative T Hinge",
    description:
      "Decorative and ornamental T-hinges for gates, sheds, and rustic doors, with size, finish, and material options grouped on one product page.",
    details: [
      "Choose from decorative and ornamental T-hinge options by size, material, finish, and color.",
      "Variant changes update image, SKU, price, and inventory without a page reload.",
      "Built for exterior gate, shed, and rustic door applications."
    ],
    specifications: {
      ...variantProduct.specifications,
      Brand: "National Hardware",
      Category: "Gate Hinges",
      "Product Family": "Decorative / Ornamental T-Hinge",
      "Available Sizes": Array.from(
        new Set(variantProduct.variants.map((variant) => variant.options.length))
      )
        .filter(Boolean)
        .join(", "),
      "Available Finishes": Array.from(
        new Set(variantProduct.variants.map((variant) => variant.options.finish))
      )
        .filter(Boolean)
        .join(", ")
    }
  };
}

function withAdjustOMaticLatchDetails(product: Product): Product {
  if (product.slug !== "21-adjust-o-matic-latch") {
    return product;
  }

  return {
    ...product,
    description:
      "Adjust-O-Matic latch for in-swing gates and doors with an automatic latch action, reversible installation, and a strike that can mount on either the gate or the post.",
    details: [
      "Suitable for in-swing gates, doors, and similar exterior openings.",
      "Hot-rolled steel case and strike with a steel rod bar.",
      "Strike can be mounted either on the gate or on the post.",
      "Latches automatically after closing.",
      "Designed for right-hand or left-hand applications.",
      "Mounting screws are included."
    ],
    specifications: {
      ...product.specifications,
      Brand: "National Hardware",
      Category: "Gate Latches & Locks",
      "Product Family": "Adjust-O-Matic Latch",
      "Available Sizes": "4\", 6\"",
      "Available Finishes": "Black, Zinc Plated",
      "Available Packaging": "Visual Pack, Bagged",
      "Each UPCs": product.variants
        .map((variant) => {
          const source = rawProducts.find((item) => item.stock_number === variant.sku);
          return source?.upc ? `${variant.sku}: ${source.upc}` : undefined;
        })
        .filter(Boolean)
        .join("; "),
      "Technical Drawing":
        "https://nationalhardwarestorage.blob.core.windows.net/documents/nh_td_v21a_n101-220.pdf",
      "Weather Protection": "WeatherGuard finish protection",
      "Installation Handing": "Right-hand or left-hand",
      "Included Hardware": "Mounting screws"
    }
  };
}

const displayProductEntries = Array.from(groupedProducts.entries()).filter(
  ([, groupItems], index) =>
    index < 50 || groupItems.some((item) => item.source === "Hoover Fence")
);

export const products: Product[] = displayProductEntries
  .map(([groupSlug, groupItems]) => buildProduct(groupSlug, groupItems))
  .map(withDecorativeTHingeVariants)
  .map(withAdjustOMaticLatchDetails);

export const categories = uniqueCategories(rawProducts);

function mergeProductData(fallback: Product, primary: Product): Product {
  const variantMap = new Map<string, ProductVariant>();

  fallback.variants.forEach((variant) => {
    variantMap.set(variant.sku, variant);
  });
  primary.variants.forEach((variant) => {
    variantMap.set(variant.sku, variant);
  });

  const variants = Array.from(variantMap.values()).sort(
    (a, b) => sizeSortValue(a.options.length) - sizeSortValue(b.options.length)
  );

  const imageMap = new Map<string, Product["images"][number]>();
  fallback.images.forEach((image) => imageMap.set(image.url, image));
  primary.images.forEach((image) => imageMap.set(image.url, image));
  variants.forEach((variant, index) => {
    if (!imageMap.has(variant.image)) {
      imageMap.set(variant.image, {
        id: `${primary.id}-variant-image-${index + 1}`,
        productId: primary.id,
        variantId: variant.id,
        url: variant.image,
        alt: `${primary.title} image ${index + 1}`,
        sortOrder: index + 1
      });
    }
  });

  const details =
    fallback.details.length > primary.details.length ? fallback.details : primary.details;
  const description =
    fallback.description.length > primary.description.length
      ? fallback.description
      : primary.description;

  return {
    ...fallback,
    ...primary,
    description,
    price: getDisplayPrice(variants),
    images: Array.from(imageMap.values()).map((image, index) => ({
      ...image,
      sortOrder: index + 1
    })),
    variants,
    specifications: {
      ...fallback.specifications,
      ...primary.specifications
    },
    details
  };
}

export function mergeCatalogProducts(
  primaryProducts: Product[] | null | undefined,
  fallbackProducts: Product[] = products
) {
  const productMap = new Map<string, Product>();

  fallbackProducts.forEach((product) => {
    productMap.set(product.slug, product);
  });

  primaryProducts?.forEach((product) => {
    const fallback = productMap.get(product.slug);
    productMap.set(product.slug, fallback ? mergeProductData(fallback, product) : product);
  });

  return Array.from(productMap.values());
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug || product.id === slug);
}

export function getRelatedProducts(product: Product, limit = 8) {
  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.category.slug === product.category.slug
    )
    .slice(0, limit);
}

export function searchProducts(query: string, categorySlug = "all") {
  const normalized = query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      categorySlug === "all" || product.category.slug === categorySlug;
    const matchesSearch =
      !normalized ||
      product.title.toLowerCase().includes(normalized) ||
      product.category.name.toLowerCase().includes(normalized) ||
      product.variants.some((variant) =>
        variant.sku.toLowerCase().includes(normalized)
      );

    return matchesCategory && matchesSearch;
  });
}
