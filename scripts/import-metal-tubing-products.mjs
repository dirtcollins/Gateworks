import fs from "node:fs/promises";
import path from "node:path";

const catalogPath = path.resolve("data/national_hardware_gate_products.json");

const squareTubing = [
  ['1/2" x 1/2"', ".049 / .065", "20 ft", "Decorative inserts, scroll work"],
  ['5/8" x 5/8"', ".049 / .065", "20 ft", "Decorative accents"],
  ['3/4" x 3/4"', ".049 / .065 / .083", "20 ft", "Small ornamental frames"],
  ['1" x 1"', ".065 / .083", "20 ft", "Fence inserts, decorative gates"],
  ['1-1/4" x 1-1/4"', ".065 / .083 / .120", "20 ft", "Light pedestrian gates"],
  ['1-1/2" x 1-1/2"', ".083 / .120", "20 ft", "Fence panels, small gates"],
  ['2" x 2"', ".083 / .120 / .188", "20 ft", "Most common residential gate frame"],
  ['2-1/2" x 2-1/2"', ".120 / .188", "20 ft", "Heavy residential gates"],
  ['3" x 3"', ".120 / .188 / .250", "20 ft", "Driveway gates, posts"],
  ['4" x 4"', ".120 / .188 / .250", "20 ft", "Gate posts, structural posts"],
  ['5" x 5"', ".188 / .250", "20 ft", "Heavy posts"],
  ['6" x 6"', ".188 / .250 / .375", "20 ft", "Commercial gate posts"],
  ['8" x 8"', ".250 / .375", "20 ft", "Industrial posts"]
];

const rectangleTubing = [
  ['1" x 2"', ".065 / .083", "20 ft", "Gate rails"],
  ['1" x 3"', ".065 / .083 / .120", "20 ft", "Modern gate rails and slats"],
  ['1" x 4"', ".083 / .120", "20 ft", "Modern slat gates"],
  ['1-1/2" x 2"', ".083 / .120", "20 ft", "Light gate frames"],
  ['1-1/2" x 3"', ".083 / .120", "20 ft", "Decorative gates"],
  ['2" x 3"', ".083 / .120 / .188", "20 ft", "Most common rectangle gate frame"],
  ['2" x 4"', ".120 / .188", "20 ft", "Heavy driveway gates"],
  ['2" x 6"', ".120 / .188", "20 ft", "Top rails / structural members"],
  ['3" x 4"', ".120 / .188 / .250", "20 ft", "Heavy frames"],
  ['3" x 6"', ".188 / .250", "20 ft", "Structural gate members"],
  ['4" x 6"', ".188 / .250 / .375", "20 ft", "Commercial gate structures"],
  ['4" x 8"', ".250 / .375", "20 ft", "Industrial framing"]
];

const gaugeMap = new Map([
  [".065", "16 Gauge"],
  [".083", "14 Gauge"],
  [".120", "11 Gauge"],
  [".188", "3/16 inch"],
  [".250", "1/4 inch"],
  [".375", "3/8 inch"],
  [".049", "18 Gauge"]
]);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/"/g, "")
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wallOptions(value) {
  return value.split("/").map((item) => item.trim());
}

function gaugeLabel(wall) {
  return gaugeMap.get(wall) || `${wall} wall`;
}

function dimensionsFor(size) {
  return size.replace(/"/g, " inch");
}

function sourceUrlFor(shape) {
  return shape === "square"
    ? "https://jwmmetalsupply.com/products/1x1-16ga-square-steel-tubing"
    : "https://jwmmetalsupply.com/products/1x2-16ga-rectangle-tube";
}

function imageFor(shape) {
  return shape === "square"
    ? "/assets/metal-products/square-steel-tubing.webp"
    : "/assets/metal-products/rectangle-steel-tubing.webp";
}

function buildProducts(rows, shape) {
  const categorySlug = `${shape}-steel-tubing`;
  const categoryName = shape === "square" ? "Square Steel Tubing" : "Rectangle Steel Tubing";
  const image = imageFor(shape);

  return rows.flatMap(([tubeSize, wallText, length, typicalUse]) => {
    const productSlug = `${shape}-steel-tubing-${slugify(tubeSize)}`;
    const walls = wallOptions(wallText);

    return walls.map((wall) => {
      const gauge = gaugeLabel(wall);
      const sku = `METAL-${shape === "square" ? "SQ" : "REC"}-${slugify(tubeSize)}-${slugify(wall)}`;
      const displayName = `${categoryName} ${tubeSize}`;

      return {
        source: "JWM Metal Supply",
        brand: "Steel Supply",
        source_category_slug: categorySlug,
        source_category: categoryName,
        product_grouping: productSlug,
        slug: productSlug,
        stock_number: sku.toUpperCase(),
        upc: "",
        catalog_number: `${tubeSize} ${wall}`,
        display_name: displayName,
        website_name: `${displayName}, ${gauge} (${wall}") wall, ${length}`,
        additional_display_name: "",
        size: `${length} / ${gauge} (${wall}") wall`,
        finish: "Raw Mill Finish",
        price: 0,
        price_label: "Quote required",
        availability: "Active",
        is_discontinued: false,
        url: sourceUrlFor(shape),
        image,
        secondary_image: "",
        features: [
          `${categoryName} for gate fabrication`,
          `${tubeSize} outside dimensions`,
          `${length} stock length`,
          typicalUse
        ],
        technical_documents: [],
        safe_working_load_range: null,
        collection: "Metal Supply",
        web_type: `${categoryName} ${dimensionsFor(tubeSize)}`,
        self_closing: false,
        keyed: false,
        pin_type: "",
        source_categories: [categoryName, "Metal Supply"],
        tube_shape: shape,
        tube_size: tubeSize,
        wall_thickness: wall,
        gauge,
        stock_length: length,
        typical_use: typicalUse,
        photo_source: sourceUrlFor(shape)
      };
    });
  });
}

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const existingProducts = catalog.products.filter(
  (product) =>
    !(
      product.source === "JWM Metal Supply" &&
      ["square-steel-tubing", "rectangle-steel-tubing"].includes(product.source_category_slug)
    )
);

const metalProducts = [
  ...buildProducts(squareTubing, "square"),
  ...buildProducts(rectangleTubing, "rectangle")
];

catalog.products = [...existingProducts, ...metalProducts];
catalog.metal_tubing_import = {
  imported_at: new Date().toISOString(),
  source_workbook: "/Users/brendan-macpro/Desktop/gate_tubing_and_supplier_reference.xlsx",
  product_count: metalProducts.length,
  product_groups: squareTubing.length + rectangleTubing.length,
  photo_sources: {
    square_tubing: "https://jwmmetalsupply.com/products/1x1-16ga-square-steel-tubing",
    rectangle_tubing: "https://jwmmetalsupply.com/products/1x2-16ga-rectangle-tube"
  }
};

await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Imported ${metalProducts.length} metal tubing variants.`);
