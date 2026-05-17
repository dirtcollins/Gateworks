import fs from "node:fs/promises";

const catalogPath = "data/national_hardware_gate_products.json";
const photoMapPath = "milwaukee-product-photo-map.json";
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));

const modelPattern = /\b\d{4}[A-Z]?-\d{2}[A-Z]*\b/g;

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function productModelsFor(item) {
  const text = `${item.stock_number} ${item.catalog_number} ${item.display_name}`;
  const models = text.match(modelPattern) || [];
  const bareToolFallbacks = models.map((model) => model.replace(/-\d{2}[A-Z]*$/, "-20"));
  return unique([...models, ...bareToolFallbacks]);
}

function normalizeImageUrl(url) {
  const cleaned = url.replace(/&amp;/g, "&");
  const absolute = cleaned.startsWith("/")
    ? `https://www.milwaukeetool.com${cleaned}`
    : cleaned;
  const [base, query = ""] = absolute.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", params.get("lang") || "en");
  params.set("w", "600");
  params.set("h", "600");
  return `${base}?${params.toString()}`;
}

async function fetchMilwaukeePhoto(model) {
  const response = await fetch(`https://www.milwaukeetool.com/products/${model}`, {
    redirect: "follow"
  });

  if (!response.ok) return null;

  const html = await response.text();
  const matches = unique(
    html.match(/(?:https:\/\/www\.milwaukeetool\.com)?\/--\/web-images\/sc\/[^"' <]+/g) || []
  );
  const productImage =
    matches.find((url) => /[?&](w=200|mw=150|h=200)/.test(url)) ||
    matches.find((url) => url.includes("web-images/sc/"));

  return productImage ? normalizeImageUrl(productImage) : null;
}

let photoMap = {};
try {
  photoMap = JSON.parse(await fs.readFile(photoMapPath, "utf8"));
} catch {
  photoMap = {};
}

const homeDepotProducts = catalog.products.filter((item) => item.source === "Home Depot");
const models = unique(homeDepotProducts.flatMap(productModelsFor));

for (const model of models) {
  if (photoMap[model]) continue;
  const photo = await fetchMilwaukeePhoto(model);
  if (photo) photoMap[model] = photo;
}

let updated = 0;
for (const product of homeDepotProducts) {
  const model = productModelsFor(product).find((item) => photoMap[item]);
  if (!model) continue;
  const nextImage = photoMap[model];
  if (product.image !== nextImage) {
    product.image = nextImage;
    updated++;
  }
}

await fs.writeFile(photoMapPath, `${JSON.stringify(photoMap, null, 2)}\n`);
await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const placeholdersRemaining = homeDepotProducts.filter(
  (item) => item.image === "/assets/milwaukee-m18.svg"
).length;

console.log(
  JSON.stringify(
    {
      models: models.length,
      mappedModels: Object.keys(photoMap).length,
      updated,
      placeholdersRemaining
    },
    null,
    2
  )
);
