import fs from "node:fs/promises";
import path from "node:path";

const catalogPath = path.resolve("data/national_hardware_gate_products.json");
const importPath = "/tmp/home-depot-milwaukee-m18-products.json";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function imageFor(product, existingProducts) {
  const existing = existingProducts.find(
    (item) => item.source === "Home Depot" && item.stock_number === product.model
  );

  if (existing?.image && existing.image !== "/assets/logo.svg") {
    return existing.image;
  }

  return "/assets/milwaukee-m18.svg";
}

function categoryFor(product) {
  if (product.category?.slug && product.category?.name) {
    return product.category;
  }

  const text = `${product.title} ${product.sourceQuery}`.toLowerCase();

  if (text.includes("circular saw")) {
    return {
      slug: "milwaukee-m18-circular-saws",
      name: "Milwaukee M18 Circular Saws"
    };
  }

  if (
    text.includes("sawzall") ||
    text.includes("hackzall") ||
    text.includes("reciprocating saw")
  ) {
    return {
      slug: "milwaukee-m18-sawzalls",
      name: "Milwaukee M18 SAWZALLS"
    };
  }

  if (text.includes("drill")) {
    return {
      slug: "milwaukee-m18-drills",
      name: "Milwaukee M18 Drills"
    };
  }

  return {
    slug: "milwaukee-m18-impacts",
    name: "Milwaukee M18 Impacts"
  };
}

function toolFamily(product) {
  const text = `${product.title} ${product.sourceQuery}`.toLowerCase();

  if (text.includes("circular saw")) return "Circular Saw";
  if (text.includes("sawzall")) return "SAWZALL Reciprocating Saw";
  if (text.includes("hackzall")) return "HACKZALL Reciprocating Saw";
  if (text.includes("reciprocating saw")) return "Reciprocating Saw";
  if (text.includes("impact wrench")) return "Impact Wrench";
  if (text.includes("impact driver")) return "Impact Driver";
  if (text.includes("hammer drill")) return "Hammer Drill/Driver";
  if (text.includes("drill")) return "Drill/Driver";
  return "M18 Power Tool";
}

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const importedProducts = JSON.parse(await fs.readFile(importPath, "utf8"));
const existingProducts = catalog.products;
const nonHomeDepotProducts = existingProducts.filter((item) => item.source !== "Home Depot");

const homeDepotProducts = importedProducts.map((product) => {
  const category = categoryFor(product);
  const slug =
    product.model === "2953-20"
      ? "milwaukee-m18-fuel-18v-1-4-in-hex-impact-driver-tool-only-2953-20"
      : `home-depot-${slugify(product.model)}`;

  return {
    source: "Home Depot",
    brand: "Milwaukee",
    source_category_slug: category.slug,
    source_category: category.name,
    product_grouping: slug,
    slug,
    stock_number: product.model,
    upc: "",
    catalog_number: product.model,
    display_name: product.title,
    website_name: product.title,
    additional_display_name: "",
    size: "Standard",
    finish: "Red/Black",
    price: Number(product.price || 0),
    price_label: "Home Depot retail price",
    availability: "Active",
    is_discontinued: false,
    url: product.url,
    image: imageFor(product, existingProducts),
    secondary_image: "",
    features: [
      "M18 18V battery platform",
      toolFamily(product),
      "Home Depot catalog item"
    ],
    technical_documents: [],
    safe_working_load_range: null,
    collection: "M18",
    web_type: `Milwaukee ${toolFamily(product)}`,
    self_closing: false,
    keyed: false,
    pin_type: "",
    source_categories: [category.name],
    home_depot_url: product.url,
    home_depot_query: product.sourceQuery
  };
});

catalog.products = [...nonHomeDepotProducts, ...homeDepotProducts];
catalog.home_depot_m18_import = {
  imported_at: new Date().toISOString(),
  source: "Home Depot search results crawled through Chrome",
  product_count: homeDepotProducts.length,
  categories: homeDepotProducts.reduce((counts, product) => {
    counts[product.source_category] = (counts[product.source_category] || 0) + 1;
    return counts;
  }, {}),
  filters: ["Milwaukee", "M18", "impact", "drill", "SAWZALL", "reciprocating saw", "circular saw"],
  exclusions: ["12V subcompact platform listings"]
};

await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
