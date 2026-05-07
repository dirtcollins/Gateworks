#!/usr/bin/env python3
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


BASE_URL = "https://www.national-hardware.com"
API_URL = f"{BASE_URL}/api/nh/product-filtering"
OUT_DIR = Path("data")

CATEGORIES = [
    ("gate-hinges", "Gate Hinges"),
    ("gate-kits", "Gate Kits"),
    ("gate-latches-locks", "Gate Latches & Locks"),
    ("gate-parts-accessories", "Gate Parts & Accessories"),
    ("gate-springs", "Gate Springs"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/c/gate-hardware",
}


def fetch_page(category_slug, page_number):
    body = json.dumps(
        {
            "category": category_slug,
            "filterOptions": {"sort": "DisplayNameAsc", "pageNumber": page_number},
        }
    ).encode("utf-8")
    req = Request(API_URL, data=body, headers=HEADERS, method="POST")
    try:
        with urlopen(req, timeout=45) as res:
            return json.loads(res.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(f"failed to fetch {category_slug} page {page_number}: {exc}") from exc


def full_url(value):
    return urljoin(BASE_URL, value or "")


def image_url(value):
    if not value:
        return ""
    return value if "?" in value else f"{value}?$nhwProductThumbs$"


def feature_names(product):
    return sorted({item.get("name", "") for item in product.get("features", []) if item.get("name")})


def document_urls(product):
    return [
        item.get("documentUrl", "")
        for item in product.get("technicalDocuments", [])
        if item.get("documentUrl")
    ]


def flatten_product(product, category_slug, category_name):
    variants = product.get("alternateFinishes") or [product]
    rows = []
    for variant in variants:
        finish = variant.get("finish") or {}
        rows.append(
            {
                "source": "National Hardware",
                "source_category_slug": category_slug,
                "source_category": category_name,
                "product_grouping": product.get("productGrouping", ""),
                "slug": variant.get("slug") or product.get("slug", ""),
                "stock_number": variant.get("stockNumber") or product.get("stockNumber", ""),
                "upc": product.get("upc", ""),
                "catalog_number": variant.get("catalogNumber") or product.get("catalogNumber", ""),
                "display_name": variant.get("displayName") or product.get("displayName", ""),
                "website_name": variant.get("websiteName") or product.get("websiteName", ""),
                "additional_display_name": variant.get("additionalDisplayName")
                or product.get("additionalDisplayName", ""),
                "size": variant.get("size") or product.get("size", ""),
                "finish": finish.get("name", ""),
                "price": variant.get("listPrice"),
                "price_label": "National Hardware list price",
                "availability": variant.get("availability") or product.get("availability", ""),
                "is_discontinued": bool(variant.get("isDiscontinued") or product.get("isDiscontinued")),
                "url": full_url(variant.get("productDetailUrl") or product.get("productDetailUrl")),
                "image": image_url(variant.get("primaryImageUrl") or product.get("primaryImageUrl")),
                "secondary_image": image_url(
                    variant.get("secondaryImageUrl") or product.get("secondaryImageUrl")
                ),
                "features": feature_names(product),
                "technical_documents": document_urls(product),
                "safe_working_load_range": product.get("safeWorkingLoadRange", ""),
                "collection": product.get("collection") or "",
                "web_type": product.get("webType") or "",
                "self_closing": bool(product.get("selfClosing")),
                "keyed": bool(product.get("keyed")),
                "pin_type": product.get("pinType") or "",
            }
        )
    return rows


def dedupe_products(rows):
    merged = {}
    for row in rows:
        key = row["stock_number"] or f"{row['source_category_slug']}:{row['url']}"
        if key not in merged:
            merged[key] = {**row, "source_categories": [row["source_category"]]}
            continue
        current = merged[key]
        if row["source_category"] not in current["source_categories"]:
            current["source_categories"].append(row["source_category"])
        if not current.get("price") and row.get("price"):
            current["price"] = row["price"]
        for field in ("features", "technical_documents"):
            current[field] = sorted(set(current.get(field, [])) | set(row.get(field, [])))
    return sorted(merged.values(), key=lambda item: (item["display_name"], item["stock_number"]))


def scrape():
    all_rows = []
    category_stats = []
    for slug, name in CATEGORIES:
        first = fetch_page(slug, 1)
        data = first.get("data") or {}
        paging = data.get("paging") or {}
        total_pages = int(paging.get("totalPages") or 1)
        total_products = int(paging.get("totalProducts") or 0)
        category_rows = []
        for product in data.get("products", []):
            category_rows.extend(flatten_product(product, slug, name))
        for page in range(2, total_pages + 1):
            payload = fetch_page(slug, page)
            for product in (payload.get("data") or {}).get("products", []):
                category_rows.extend(flatten_product(product, slug, name))
        all_rows.extend(category_rows)
        category_stats.append(
            {
                "slug": slug,
                "name": name,
                "product_families": total_products,
                "sku_variants": len({item["stock_number"] for item in category_rows}),
            }
        )
        print(f"{name}: {total_products} families, {category_stats[-1]['sku_variants']} SKUs")

    products = dedupe_products(all_rows)
    generated_at = datetime.now(timezone.utc).isoformat()
    return {
        "source": f"{BASE_URL}/c/gate-hardware",
        "api": API_URL,
        "generated_at": generated_at,
        "pricing_note": "Prices are National Hardware listPrice values returned by the public product-filtering API.",
        "category_stats": category_stats,
        "products": products,
    }


def write_outputs(payload):
    OUT_DIR.mkdir(exist_ok=True)
    json_path = OUT_DIR / "national_hardware_gate_products.json"
    csv_path = OUT_DIR / "national_hardware_gate_products.csv"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    columns = [
        "stock_number",
        "upc",
        "catalog_number",
        "display_name",
        "website_name",
        "source_categories",
        "size",
        "finish",
        "price",
        "price_label",
        "availability",
        "is_discontinued",
        "url",
        "image",
        "secondary_image",
        "features",
        "safe_working_load_range",
        "collection",
        "web_type",
        "self_closing",
        "keyed",
        "pin_type",
        "technical_documents",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=columns)
        writer.writeheader()
        for product in payload["products"]:
            writer.writerow(
                {
                    key: (
                        "|".join(str(value) for value in product.get(key, []))
                        if isinstance(product.get(key), list)
                        else product.get(key, "")
                    )
                    for key in columns
                }
            )
    return json_path, csv_path


def main():
    payload = scrape()
    json_path, csv_path = write_outputs(payload)
    print(f"Wrote {len(payload['products'])} unique SKUs to {json_path} and {csv_path}")


if __name__ == "__main__":
    main()
