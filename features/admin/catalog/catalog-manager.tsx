"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Boxes,
  Check,
  Copy,
  Download,
  FileText,
  ImagePlus,
  Layers3,
  Plus,
  Search,
  Trash2,
  Upload
} from "lucide-react";
import { persistAdminChange } from "@/features/admin/catalog/api";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import {
  DEFAULT_STEEL_CWT_PRICE,
  applyTubingPricing,
  formatPricingMethod,
  isTubingProduct
} from "@/lib/pricing";
import type { Category, Product, ProductImage, ProductVariant } from "@/lib/types";
import { cn, formatCurrency, slugify } from "@/lib/utils";

type CatalogStatus = "draft" | "active" | "hidden" | "special_order" | "backorder" | "discontinued" | "archived";
type CatalogTab = "overview" | "editor" | "variants" | "pricing" | "media" | "sourcing" | "taxonomy" | "history";
type ModalMode = "product" | "variant" | "category" | "import" | "bulk_price" | "document" | null;

type CatalogAuditEvent = {
  id: string;
  action: string;
  staffName: string;
  createdAt: string;
  detail: string;
};

type CatalogItem = Product & {
  status: CatalogStatus;
  supplier: string;
  supplierSku: string;
  leadTimeDays: number;
  moq: number;
  packSize: number;
  contractorPrice: number;
  taxable: boolean;
  missingFields: string[];
  auditEvents: CatalogAuditEvent[];
  documents: Array<{ id: string; label: string; url: string }>;
};

type CatalogManagerProps = {
  products: Product[];
};

const statuses: CatalogStatus[] = [
  "draft",
  "active",
  "hidden",
  "special_order",
  "backorder",
  "discontinued",
  "archived"
];

const statusLabels: Record<CatalogStatus, string> = {
  draft: "Draft",
  active: "Active",
  hidden: "Hidden",
  special_order: "Special order",
  backorder: "Backorder",
  discontinued: "Discontinued",
  archived: "Archived"
};

const statusClasses: Record<CatalogStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  hidden: "border-zinc-200 bg-zinc-50 text-zinc-700",
  special_order: "border-blue-200 bg-blue-50 text-blue-800",
  backorder: "border-amber-200 bg-amber-50 text-amber-900",
  discontinued: "border-red-200 bg-red-50 text-red-800",
  archived: "border-neutral-300 bg-neutral-100 text-neutral-700"
};

const tabs: Array<{ id: CatalogTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "editor", label: "Full editor" },
  { id: "variants", label: "SKU variants" },
  { id: "pricing", label: "Pricing" },
  { id: "media", label: "Media" },
  { id: "sourcing", label: "Sourcing" },
  { id: "taxonomy", label: "Taxonomy" },
  { id: "history", label: "History" }
];

function toCatalogItem(product: Product, index: number): CatalogItem {
  const brand = product.specifications.Brand || product.specifications["Retail Source"] || "Primary supplier";
  const primaryVariant = product.variants[0];
  const missingFields = [
    !product.images.length ? "photo" : "",
    !product.description ? "description" : "",
    !product.details.length ? "details" : "",
    !primaryVariant?.sku ? "SKU" : "",
    !product.specifications.Brand ? "brand" : ""
  ].filter(Boolean);

  return {
    ...product,
    status: index % 17 === 0 ? "draft" : index % 23 === 0 ? "backorder" : "active",
    supplier: brand,
    supplierSku: product.specifications["Catalog Number"] || primaryVariant?.sku || "SUP-SKU",
    leadTimeDays: index % 5 === 0 ? 14 : 5,
    moq: index % 7 === 0 ? 12 : 1,
    packSize: index % 3 === 0 ? 6 : 1,
    contractorPrice: Number((product.price * 0.88).toFixed(2)),
    taxable: true,
    missingFields,
    documents: [
      product.specifications["Technical Drawing"]
        ? {
            id: `${product.id}-technical-drawing`,
            label: "Technical drawing",
            url: product.specifications["Technical Drawing"]
          }
        : undefined
    ].filter((item): item is { id: string; label: string; url: string } => Boolean(item)),
    auditEvents: [
      {
        id: `${product.id}-seed`,
        action: "Catalog import",
        staffName: "System import",
        createdAt: new Date("2026-05-14T08:00:00.000Z").toISOString(),
        detail: "Product loaded into the admin catalog manager."
      }
    ]
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.inventoryQuantity, 0);
}

function getMargin(item: CatalogItem) {
  const cost = Number(item.specifications.Cost || item.price * 0.58);
  if (!item.price) return 0;
  return Math.round(((item.price - cost) / item.price) * 100);
}

function csvEscape(value: string | number | boolean) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function createAudit(action: string, detail: string): CatalogAuditEvent {
  return {
    id: `${Date.now()}-${action}`,
    action,
    detail,
    staffName: "Admin user",
    createdAt: new Date().toISOString()
  };
}

function createBlankVariant(productId: string): ProductVariant {
  const id = `${productId}-variant-${Date.now()}`;
  return {
    id,
    productId,
    sku: `NEW-${Date.now().toString().slice(-6)}`,
    price: 0,
    inventory: "out_of_stock",
    inventoryQuantity: 0,
    image: "/assets/logo.svg",
    options: {
      length: "Standard",
      material: "Steel",
      finish: "Raw",
      color: "Standard"
    }
  };
}

export function CatalogManager({ products }: CatalogManagerProps) {
  const [catalog, setCatalog] = useState(() => products.map(toCatalogItem));
  const [selectedId, setSelectedId] = useState(catalog[0]?.id || "");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CatalogStatus>("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<CatalogTab>("overview");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [message, setMessage] = useState("");
  const [steelCwtPrice, setSteelCwtPrice] = useState(() => {
    const firstTubingVariant = products
      .flatMap((product) => product.variants)
      .find((variant) => variant.steel_cwt_price);

    return firstTubingVariant?.steel_cwt_price || DEFAULT_STEEL_CWT_PRICE;
  });
  const importRef = useRef<HTMLInputElement>(null);

  const selected = catalog.find((item) => item.id === selectedId) || catalog[0];
  const selectedVariant = selected?.variants.find((variant) => variant.id === selectedVariantId) || selected?.variants[0];
  const categories = useMemo(
    () => Array.from(new Map(catalog.map((item) => [item.category.slug, item.category])).values()).sort((a, b) => a.name.localeCompare(b.name)),
    [catalog]
  );
  const suppliers = useMemo(
    () => Array.from(new Set(catalog.map((item) => item.supplier))).sort((a, b) => a.localeCompare(b)),
    [catalog]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.category.name.toLowerCase().includes(normalized) ||
        item.supplier.toLowerCase().includes(normalized) ||
        item.variants.some((variant) => variant.sku.toLowerCase().includes(normalized));
      const matchesCategory = categoryFilter === "all" || item.category.slug === categoryFilter;
      const matchesSupplier = supplierFilter === "all" || item.supplier === supplierFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesQuality =
        qualityFilter === "all" ||
        (qualityFilter === "missing_photos" && !item.images.length) ||
        (qualityFilter === "missing_cost" && !item.specifications.Cost) ||
        (qualityFilter === "low_margin" && getMargin(item) < 30) ||
        (qualityFilter === "incomplete" && item.missingFields.length > 0);

      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus && matchesQuality;
    });
  }, [catalog, categoryFilter, qualityFilter, query, statusFilter, supplierFilter]);

  const summary = useMemo(
    () => ({
      products: catalog.length,
      skus: catalog.reduce((total, item) => total + item.variants.length, 0),
      active: catalog.filter((item) => item.status === "active").length,
      drafts: catalog.filter((item) => item.status === "draft").length,
      incomplete: catalog.filter((item) => item.missingFields.length).length,
      units: catalog.reduce((total, item) => total + getStock(item), 0)
    }),
    [catalog]
  );

  function saveItem(nextItem: CatalogItem, action: string, detail: string) {
    const itemWithAudit = {
      ...nextItem,
      auditEvents: [createAudit(action, detail), ...nextItem.auditEvents]
    };
    setCatalog((current) => current.map((item) => (item.id === itemWithAudit.id ? itemWithAudit : item)));
    setMessage(`${action} saved locally`);
  }

  function updateProduct(changes: Partial<CatalogItem>, action: string, backendChanges?: Record<string, unknown>) {
    if (!selected) return;
    const nextItem = {
      ...selected,
      ...changes,
      price: changes.variants ? Math.min(...changes.variants.map((variant) => variant.price)) : selected.price
    };
    saveItem(nextItem, action, `Updated ${selected.title}`);

    if (backendChanges) {
      void persistAdminChange(
        {
          action: "update_product",
          productId: selected.id,
          changes: backendChanges
        },
        action
      ).then((result) => setMessage(result.message));
    }
  }

  function updateVariant(variantId: string, changes: Partial<ProductVariant>, backendChanges?: Record<string, unknown>) {
    if (!selected) return;
    const variants = selected.variants.map((variant) =>
      variant.id === variantId ? { ...variant, ...changes } : variant
    );
    saveItem(
      {
        ...selected,
        variants,
        price: Math.min(...variants.map((variant) => variant.price))
      },
      "Variant update",
      `Updated SKU ${variantId}`
    );

    if (backendChanges) {
      void persistAdminChange(
        {
          action: "update_variant",
          variantId,
          changes: backendChanges
        },
        "Variant update"
      ).then((result) => setMessage(result.message));
    }
  }

  function addProduct() {
    const id = `manual-product-${Date.now()}`;
    const category = categories[0] || { id: "gate-hardware", name: "Gate Hardware", slug: "gate-hardware" };
    const variant = createBlankVariant(id);
    const item: CatalogItem = {
      id,
      slug: slugify(`New product ${Date.now()}`),
      title: "New product",
      description: "",
      category,
      price: 0,
      images: [],
      variants: [variant],
      specifications: {
        Brand: "Gateworks",
        Cost: "0"
      },
      details: [],
      status: "draft",
      supplier: "Primary supplier",
      supplierSku: variant.sku,
      leadTimeDays: 5,
      moq: 1,
      packSize: 1,
      contractorPrice: 0,
      taxable: true,
      missingFields: ["photo", "description", "details"],
      documents: [],
      auditEvents: [createAudit("Product created", "New draft product created.")]
    };
    setCatalog((current) => [item, ...current]);
    setSelectedId(item.id);
    setActiveTab("editor");
    setModal(null);
    setMessage("New draft product created");
  }

  function addVariant() {
    if (!selected) return;
    const variant = createBlankVariant(selected.id);
    saveItem(
      { ...selected, variants: [...selected.variants, variant] },
      "Variant created",
      `Added SKU ${variant.sku}`
    );
    setSelectedVariantId(variant.id);
    setModal(null);
  }

  function duplicateVariant(variant: ProductVariant) {
    if (!selected) return;
    const copyVariant = {
      ...variant,
      id: `${variant.id}-copy-${Date.now()}`,
      sku: `${variant.sku}-COPY`
    };
    saveItem(
      { ...selected, variants: [...selected.variants, copyVariant] },
      "Variant duplicated",
      `Duplicated ${variant.sku}`
    );
  }

  function deleteVariant(variantId: string) {
    if (!selected || selected.variants.length <= 1) return;
    saveItem(
      { ...selected, variants: selected.variants.filter((variant) => variant.id !== variantId) },
      "Variant deleted",
      `Removed SKU ${variantId}`
    );
  }

  function addCategory() {
    const category: Category = {
      id: `category-${Date.now()}`,
      name: "New category",
      slug: `new-category-${Date.now()}`
    };
    if (!selected) return;
    updateProduct(
      {
        category,
        specifications: {
          ...selected.specifications,
          Category: category.name
        }
      },
      "Category created"
    );
    setModal(null);
  }

  function addImage() {
    if (!selected) return;
    const image: ProductImage = {
      id: `${selected.id}-image-${Date.now()}`,
      productId: selected.id,
      url: selected.variants[0]?.image || "/assets/logo.svg",
      alt: selected.title,
      sortOrder: selected.images.length + 1
    };
    saveItem({ ...selected, images: [...selected.images, image] }, "Photo added", "Added product photo.");
    void persistAdminChange(
      {
        action: "add_image",
        productId: selected.id,
        image: { url: image.url, alt: image.alt, sort_order: image.sortOrder }
      },
      "Photo added"
    ).then((result) => setMessage(result.message));
  }

  function exportCsv() {
    const header = ["Title", "SKU count", "Category", "Supplier", "Status", "Retail price", "Contractor price", "Stock", "Missing fields"];
    const rows = filtered.map((item) =>
      [
        item.title,
        item.variants.length,
        item.category.name,
        item.supplier,
        statusLabels[item.status],
        item.price,
        item.contractorPrice,
        getStock(item),
        item.missingFields.join("; ")
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gateworks-catalog.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyBulkPrice(percent: number) {
    setCatalog((current) =>
      current.map((item) => {
        const variants = item.variants.map((variant) => ({
          ...variant,
          price: Number((variant.price * (1 + percent / 100)).toFixed(2))
        }));
        return {
          ...item,
          variants,
          price: Math.min(...variants.map((variant) => variant.price)),
          auditEvents: [createAudit("Bulk price update", `Adjusted prices by ${percent}%.`), ...item.auditEvents]
        };
      })
    );
    setMessage(`Bulk price update applied: ${percent}%`);
    setModal(null);
  }

  function updateSteelCwtPrice(value: number) {
    const nextPrice = Number.isFinite(value) && value > 0 ? value : DEFAULT_STEEL_CWT_PRICE;
    setSteelCwtPrice(nextPrice);
    setCatalog((current) =>
      current.map((item) =>
        isTubingProduct(item)
          ? {
              ...applyTubingPricing(item, nextPrice),
              status: item.status,
              supplier: item.supplier,
              supplierSku: item.supplierSku,
              leadTimeDays: item.leadTimeDays,
              moq: item.moq,
              packSize: item.packSize,
              contractorPrice: item.contractorPrice,
              taxable: item.taxable,
              missingFields: item.missingFields,
              documents: item.documents,
              auditEvents: [
                createAudit("CWT setting update", `Recalculated steel prices at $${nextPrice} CWT.`),
                ...item.auditEvents
              ]
            }
          : item
      )
    );
    setMessage(`Steel CWT updated locally to $${nextPrice}`);

    void fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "steel_cwt_price",
        value: nextPrice,
        label: "Steel CWT price"
      })
    })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as { reason?: string } | null;
        setMessage(response.ok ? "Steel CWT setting saved" : result?.reason || "Steel CWT saved locally only");
      })
      .catch(() => setMessage("Steel CWT saved locally only"));
  }

  return (
    <PageShell
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setModal("product")} size="sm" variant="primary">
            <Plus size={15} />
            Add product
          </Button>
          <Button onClick={() => importRef.current?.click()} size="sm">
            <Upload size={15} />
            Import CSV
          </Button>
          <Button onClick={exportCsv} size="sm">
            <Download size={15} />
            Export CSV
          </Button>
          <Button onClick={() => setModal("bulk_price")} size="sm">
            Bulk price
          </Button>
          <input
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setMessage(`CSV import staged: ${file.name}`);
                setModal("import");
              }
            }}
            ref={importRef}
            type="file"
          />
        </div>
      }
      description="Catalog operations for product creation, publishing, SKU variants, categories, pricing, supplier sourcing, media, documents, bulk import/export, validation, and audit history."
      eyebrow="Gateworks Operations"
      title="Catalog management"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-6"
          stats={[
            { label: "Products", value: formatNumber(summary.products) },
            { label: "SKUs", value: formatNumber(summary.skus) },
            { label: "Active", value: formatNumber(summary.active) },
            { label: "Drafts", value: formatNumber(summary.drafts) },
            { label: "Incomplete", value: formatNumber(summary.incomplete) },
            { label: "Units", value: formatNumber(summary.units) }
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <Card className="min-h-[720px]">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Product Library
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Catalog records</h2>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3">
              <label className="relative">
                <span className="sr-only">Search catalog</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
                <Input
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product, SKU, supplier"
                  value={query}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
                  <option value="all">All suppliers</option>
                  {suppliers.map((supplierName) => (
                    <option key={supplierName} value={supplierName}>
                      {supplierName}
                    </option>
                  ))}
                </Select>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | CatalogStatus)}>
                  <option value="all">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </Select>
                <Select value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)}>
                  <option value="all">All quality states</option>
                  <option value="missing_photos">Missing photos</option>
                  <option value="missing_cost">Missing cost</option>
                  <option value="low_margin">Low margin</option>
                  <option value="incomplete">Incomplete</option>
                </Select>
              </div>

              <div className="max-h-[520px] overflow-auto border border-industrial-rail">
                {filtered.map((item) => (
                  <button
                    className={cn(
                      "grid w-full grid-cols-[64px_1fr] gap-3 border-b border-industrial-rail p-3 text-left transition hover:bg-industrial-paper",
                      selected?.id === item.id && "bg-industrial-amber"
                    )}
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setSelectedVariantId(item.variants[0]?.id || "");
                    }}
                    type="button"
                  >
                    <div className="relative aspect-square border border-industrial-rail bg-white">
                      <Image
                        alt={item.title}
                        className="object-contain p-1"
                        fill
                        quality={45}
                        sizes="64px"
                        src={item.images[0]?.url || item.variants[0]?.image || "/assets/logo.svg"}
                      />
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-industrial-ink">{item.title}</span>
                      <span className="mt-1 block text-xs font-semibold text-industrial-steel">
                        {item.category.name} / {item.variants.length} SKU{item.variants.length === 1 ? "" : "s"}
                      </span>
                      <span className="mt-1 block text-xs font-black text-industrial-pine">
                        {formatCurrency(item.final_price ?? item.price)} / {formatPricingMethod(item.pricing_method || item.variants[0]?.pricing_method)}
                      </span>
                      {item.variants[0]?.pricing_method === "cwt_calculated" && (
                        <span className="mt-1 block text-xs font-semibold text-industrial-steel">
                          {item.variants[0].calculated_weight_lb?.toFixed(2)} lb / CWT {formatCurrency(item.variants[0].steel_cwt_price || DEFAULT_STEEL_CWT_PRICE)}
                        </span>
                      )}
                      <span className={`mt-2 inline-flex border px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClasses[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {selected && (
            <section className="grid content-start gap-5">
              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      {selected.category.name}
                    </p>
                    <h2 className="text-2xl font-black text-industrial-ink">{selected.title}</h2>
                    <p className="mt-2 text-sm text-industrial-steel">
                      {selected.variants.length} SKUs / {selected.supplier} / Margin {getMargin(selected)}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      className="w-44"
                      value={selected.status}
                      onChange={(event) => updateProduct({ status: event.target.value as CatalogStatus }, "Status update")}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </Select>
                    <Button onClick={() => updateProduct({ status: "active" }, "Published")} size="sm" variant="primary">
                      <Check size={15} />
                      Publish
                    </Button>
                    <Button onClick={() => updateProduct({ status: "archived" }, "Archived")} size="sm">
                      <Archive size={15} />
                      Archive
                    </Button>
                  </div>
                </CardHeader>
                {message && (
                  <div className="border-b border-industrial-rail bg-industrial-paper px-4 py-2 text-sm font-black text-industrial-pine">
                    {message}
                  </div>
                )}
                <CardBody className="grid gap-4">
                  {selected.missingFields.length > 0 && (
                    <div className="flex gap-3 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <AlertTriangle className="mt-1 shrink-0" size={16} />
                      <p>
                        Missing publish data: {selected.missingFields.join(", ")}. Complete these fields before this becomes a polished public product.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        className={cn(
                          "h-9 border px-3 text-xs font-black uppercase tracking-[0.08em]",
                          activeTab === tab.id
                            ? "border-industrial-ink bg-industrial-ink text-white"
                            : "border-industrial-rail bg-white text-industrial-ink hover:border-industrial-ink"
                        )}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {activeTab === "overview" && (
                <div className="grid gap-5 lg:grid-cols-3">
                  {[
                    ["Final price", formatCurrency(selected.final_price ?? selected.price), <FileText key="i" size={18} />],
                    ["Contractor price", formatCurrency(selected.contractorPrice), <Boxes key="i" size={18} />],
                    ["Stock units", formatNumber(getStock(selected)), <Layers3 key="i" size={18} />]
                  ].map(([label, value, icon]) => (
                    <Card key={String(label)}>
                      <CardBody>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">{label}</p>
                            <p className="mt-2 text-2xl font-black text-industrial-ink">{value}</p>
                          </div>
                          {icon}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <h3 className="text-lg font-black text-industrial-ink">Validation and publishing checklist</h3>
                    </CardHeader>
                    <CardBody className="grid gap-3 md:grid-cols-2">
                      {["Photos assigned", "Description written", "Cost and margin set", "Supplier assigned", "Variant SKUs valid", "Category assigned"].map((item, index) => (
                        <div className="flex items-center gap-3 border border-industrial-rail p-3 text-sm font-bold" key={item}>
                          <span className={cn("grid size-6 place-items-center border text-xs", index < 4 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900")}>
                            {index < 4 ? "✓" : "!"}
                          </span>
                          {item}
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </div>
              )}

              {activeTab === "editor" && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-black text-industrial-ink">Full product editor</h3>
                  </CardHeader>
                  <CardBody className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-industrial-ink">Product name</span>
                        <Input
                          value={selected.title}
                          onChange={(event) => updateProduct({ title: event.target.value }, "Title update", { title: event.target.value })}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-industrial-ink">Slug</span>
                        <Input
                          value={selected.slug}
                          onChange={(event) => updateProduct({ slug: event.target.value }, "Slug update")}
                        />
                      </label>
                    </div>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Description</span>
                      <Textarea
                        value={selected.description}
                        onChange={(event) => updateProduct({ description: event.target.value }, "Description update", { description: event.target.value })}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Product details</span>
                      <Textarea
                        value={selected.details.join("\n")}
                        onChange={(event) => updateProduct({ details: event.target.value.split("\n").filter(Boolean) }, "Details update", { details: event.target.value.split("\n").filter(Boolean) })}
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-industrial-ink">Brand</span>
                        <Input
                          value={selected.specifications.Brand || ""}
                          onChange={(event) =>
                            updateProduct(
                              {
                                specifications: { ...selected.specifications, Brand: event.target.value }
                              },
                              "Brand update",
                              { specifications: { ...selected.specifications, Brand: event.target.value } }
                            )
                          }
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-industrial-ink">Taxable</span>
                        <Select value={selected.taxable ? "yes" : "no"} onChange={(event) => updateProduct({ taxable: event.target.value === "yes" }, "Tax setting update")}>
                          <option value="yes">Taxable</option>
                          <option value="no">Tax exempt</option>
                        </Select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-industrial-ink">Product family</span>
                        <Input
                          value={selected.specifications["Product Family"] || ""}
                          onChange={(event) =>
                            updateProduct(
                              { specifications: { ...selected.specifications, "Product Family": event.target.value } },
                              "Family update",
                              { specifications: { ...selected.specifications, "Product Family": event.target.value } }
                            )
                          }
                        />
                      </label>
                    </div>
                  </CardBody>
                </Card>
              )}

              {activeTab === "variants" && (
                <Card>
                  <CardHeader>
                    <div>
                      <h3 className="text-lg font-black text-industrial-ink">SKU variant manager</h3>
                      <p className="text-sm text-industrial-steel">Add, delete, duplicate, and edit dimensions for every sellable item.</p>
                    </div>
                    <Button onClick={() => setModal("variant")} size="sm" variant="primary">
                      <Plus size={15} />
                      Add SKU
                    </Button>
                  </CardHeader>
                  <CardBody>
                    <div className="overflow-x-auto border border-industrial-rail">
                      <table className="min-w-[1120px] w-full text-left text-sm">
                        <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                          <tr>
                            <th className="px-3 py-3">SKU</th>
                            <th className="px-3 py-3">Size</th>
                            <th className="px-3 py-3">Material</th>
                            <th className="px-3 py-3">Finish</th>
                            <th className="px-3 py-3">Qty</th>
                            <th className="px-3 py-3">Retail</th>
                            <th className="px-3 py-3">Image</th>
                            <th className="px-3 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.variants.map((variant) => (
                            <tr className="border-t border-industrial-rail" key={variant.id}>
                              <td className="px-3 py-3">
                                <Input value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value }, { sku: event.target.value })} />
                              </td>
                              {(["length", "material", "finish"] as const).map((field) => (
                                <td className="px-3 py-3" key={field}>
                                  <Input
                                    value={variant.options[field] || ""}
                                    onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, [field]: event.target.value } }, { [field]: event.target.value })}
                                  />
                                </td>
                              ))}
                              <td className="px-3 py-3">
                                <Input
                                  min="0"
                                  type="number"
                                  value={variant.inventoryQuantity}
                                  onChange={(event) => {
                                    const quantity = Number(event.target.value) || 0;
                                    updateVariant(variant.id, { inventoryQuantity: quantity, inventory: quantity > 0 ? "in_stock" : "out_of_stock" }, { inventory_quantity: quantity, inventory_status: quantity > 0 ? "in_stock" : "out_of_stock" });
                                  }}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <Input
                                  min="0"
                                  step="0.01"
                                  type="number"
                                  value={variant.price}
                                  onChange={(event) => updateVariant(variant.id, { price: Number(event.target.value) || 0 }, { price: Number(event.target.value) || 0 })}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <Input value={variant.image} onChange={(event) => updateVariant(variant.id, { image: event.target.value }, { image_url: event.target.value })} />
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-2">
                                  <Button onClick={() => duplicateVariant(variant)} size="icon">
                                    <Copy size={15} />
                                  </Button>
                                  <Button onClick={() => deleteVariant(variant.id)} size="icon" variant="danger">
                                    <Trash2 size={15} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardBody>
                </Card>
              )}

              {activeTab === "pricing" && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-black text-industrial-ink">Pricing, cost, and margin</h3>
                  </CardHeader>
                  <CardBody className="grid gap-4 md:grid-cols-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Steel CWT price</span>
                      <Input
                        min="0"
                        step="1"
                        type="number"
                        value={steelCwtPrice}
                        onChange={(event) => updateSteelCwtPrice(Number(event.target.value))}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Base cost</span>
                      <Input
                        min="0"
                        step="0.01"
                        type="number"
                        value={selected.specifications.Cost || ""}
                        onChange={(event) => updateProduct({ specifications: { ...selected.specifications, Cost: event.target.value } }, "Cost update", { specifications: { ...selected.specifications, Cost: event.target.value } })}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Contractor price</span>
                      <Input
                        min="0"
                        step="0.01"
                        type="number"
                        value={selected.contractorPrice}
                        onChange={(event) => updateProduct({ contractorPrice: Number(event.target.value) || 0 }, "Contractor price update")}
                      />
                    </label>
                    <div className="border border-industrial-rail p-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Margin</p>
                      <p className="mt-2 text-2xl font-black text-industrial-ink">{getMargin(selected)}%</p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Pricing method</p>
                      <p className="mt-2 text-sm font-black text-industrial-ink">
                        {formatPricingMethod(selectedVariant?.pricing_method)}
                      </p>
                    </div>
                    {selectedVariant?.pricing_method === "cwt_calculated" && (
                      <div className="grid gap-3 md:col-span-4 md:grid-cols-4">
                        <div className="border border-industrial-rail p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Final price</p>
                          <p className="mt-2 text-2xl font-black text-industrial-ink">{formatCurrency(selectedVariant.final_price ?? selectedVariant.price)}</p>
                        </div>
                        <div className="border border-industrial-rail p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Weight</p>
                          <p className="mt-2 text-2xl font-black text-industrial-ink">{selectedVariant.calculated_weight_lb?.toFixed(2)} lb</p>
                        </div>
                        <div className="border border-industrial-rail p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Calculated</p>
                          <p className="mt-2 text-2xl font-black text-industrial-ink">{formatCurrency(selectedVariant.calculated_price || 0)}</p>
                        </div>
                        <div className="border border-industrial-rail p-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">CWT used</p>
                          <p className="mt-2 text-2xl font-black text-industrial-ink">{formatCurrency(selectedVariant.steel_cwt_price || steelCwtPrice)}</p>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {activeTab === "media" && (
                <Card>
                  <CardHeader>
                    <div>
                      <h3 className="text-lg font-black text-industrial-ink">Media and documents</h3>
                      <p className="text-sm text-industrial-steel">Manage photos, primary image, alt text, spec sheets, drawings, and install PDFs.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addImage} size="sm">
                        <ImagePlus size={15} />
                        Add photo
                      </Button>
                      <Button onClick={() => setModal("document")} size="sm">
                        <FileText size={15} />
                        Add document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="grid gap-4">
                    {selected.images.map((image, index) => (
                      <div className="grid gap-3 border border-industrial-rail p-3 lg:grid-cols-[96px_1fr_auto]" key={image.id}>
                        <div className="relative aspect-square border border-industrial-rail bg-white">
                          <Image alt={image.alt} className="object-contain p-2" fill quality={45} sizes="96px" src={image.url} />
                        </div>
                        <div className="grid gap-2">
                          <Input value={image.url} onChange={(event) => updateProduct({ images: selected.images.map((item) => (item.id === image.id ? { ...item, url: event.target.value } : item)) }, "Photo URL update")} />
                          <Input value={image.alt} onChange={(event) => updateProduct({ images: selected.images.map((item) => (item.id === image.id ? { ...item, alt: event.target.value } : item)) }, "Photo alt update")} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => updateProduct({ images: selected.images.map((item) => ({ ...item, sortOrder: item.id === image.id ? 1 : item.sortOrder + 1 })).sort((a, b) => a.sortOrder - b.sortOrder) }, "Primary photo update")} size="sm">
                            {index === 0 ? "Primary" : "Make primary"}
                          </Button>
                          <Button onClick={() => updateProduct({ images: selected.images.filter((item) => item.id !== image.id) }, "Photo removed")} size="icon" variant="danger">
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="grid gap-2">
                      {selected.documents.map((document) => (
                        <div className="flex items-center justify-between gap-3 border border-industrial-rail p-3" key={document.id}>
                          <span className="text-sm font-bold text-industrial-ink">{document.label}</span>
                          <span className="truncate text-xs text-industrial-steel">{document.url}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {activeTab === "sourcing" && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-black text-industrial-ink">Supplier and sourcing controls</h3>
                  </CardHeader>
                  <CardBody className="grid gap-4 md:grid-cols-3">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Supplier</span>
                      <Input value={selected.supplier} onChange={(event) => updateProduct({ supplier: event.target.value }, "Supplier update")} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Supplier SKU</span>
                      <Input value={selected.supplierSku} onChange={(event) => updateProduct({ supplierSku: event.target.value }, "Supplier SKU update")} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Lead time days</span>
                      <Input type="number" value={selected.leadTimeDays} onChange={(event) => updateProduct({ leadTimeDays: Number(event.target.value) || 0 }, "Lead time update")} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">MOQ</span>
                      <Input type="number" value={selected.moq} onChange={(event) => updateProduct({ moq: Number(event.target.value) || 1 }, "MOQ update")} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Purchase pack size</span>
                      <Input type="number" value={selected.packSize} onChange={(event) => updateProduct({ packSize: Number(event.target.value) || 1 }, "Pack size update")} />
                    </label>
                    <div className="border border-industrial-rail p-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Alternate suppliers</p>
                      <p className="mt-2 text-sm text-industrial-steel">Ready for supplier_products rows in Supabase.</p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {activeTab === "taxonomy" && (
                <Card>
                  <CardHeader>
                    <div>
                      <h3 className="text-lg font-black text-industrial-ink">Category and product family controls</h3>
                      <p className="text-sm text-industrial-steel">Manage categories for sheet metal, tubing, angle iron, ornamental iron, hardware, and motors.</p>
                    </div>
                    <Button onClick={() => setModal("category")} size="sm">
                      <Plus size={15} />
                      Add category
                    </Button>
                  </CardHeader>
                  <CardBody className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-industrial-ink">Assigned category</span>
                      <Select
                        value={selected.category.slug}
                        onChange={(event) => {
                          const category = categories.find((item) => item.slug === event.target.value);
                          if (category) updateProduct({ category }, "Category assignment update", { category_id: category.id });
                        }}
                      >
                        {categories.map((category) => (
                          <option key={category.slug} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </label>
                    <div className="grid gap-2">
                      {categories.map((category) => (
                        <div className="flex items-center justify-between border border-industrial-rail p-2 text-sm" key={category.slug}>
                          <span className="font-bold">{category.name}</span>
                          <span className="text-industrial-muted">{category.slug}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {activeTab === "history" && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-black text-industrial-ink">Audit history</h3>
                  </CardHeader>
                  <CardBody className="grid gap-3">
                    {selected.auditEvents.map((event) => (
                      <div className="border border-industrial-rail p-3" key={event.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-black text-industrial-ink">{event.action}</p>
                          <p className="text-xs font-bold text-industrial-muted">
                            {formatDate(event.createdAt)} / {event.staffName}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-industrial-steel">{event.detail}</p>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </section>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 grid bg-black/30 p-4 lg:place-items-center">
          <div className="w-full max-w-2xl border border-industrial-rail bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-industrial-rail p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Catalog workflow</p>
                <h2 className="text-xl font-black text-industrial-ink">
                  {modal === "product" && "Add product"}
                  {modal === "variant" && "Add SKU variant"}
                  {modal === "category" && "Add category"}
                  {modal === "import" && "Import inventory CSV"}
                  {modal === "bulk_price" && "Bulk price update"}
                  {modal === "document" && "Add product document"}
                </h2>
              </div>
              <Button onClick={() => setModal(null)} size="sm" variant="ghost">
                Close
              </Button>
            </div>
            <div className="grid gap-4 p-4">
              {modal === "product" && (
                <>
                  <p className="text-sm leading-6 text-industrial-steel">Creates a draft product with one starter SKU. Complete product content, sourcing, media, and pricing before publishing.</p>
                  <Button onClick={addProduct} variant="primary">
                    Create draft product
                  </Button>
                </>
              )}
              {modal === "variant" && (
                <>
                  <p className="text-sm leading-6 text-industrial-steel">Adds a new editable SKU to this product for another length, gauge, finish, package, or motor configuration.</p>
                  <Button onClick={addVariant} variant="primary">
                    Add SKU variant
                  </Button>
                </>
              )}
              {modal === "category" && (
                <>
                  <p className="text-sm leading-6 text-industrial-steel">Creates a local category record and assigns it to the selected product. Supabase category CRUD is the next persistence step.</p>
                  <Button onClick={addCategory} variant="primary">
                    Add category
                  </Button>
                </>
              )}
              {modal === "bulk_price" && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => applyBulkPrice(5)}>Increase 5%</Button>
                  <Button onClick={() => applyBulkPrice(10)}>Increase 10%</Button>
                  <Button onClick={() => applyBulkPrice(-5)}>Decrease 5%</Button>
                </div>
              )}
              {modal === "import" && (
                <div className="grid gap-3">
                  <p className="text-sm leading-6 text-industrial-steel">CSV import is staged. The production version should add a column mapper, validation preview, duplicate SKU detection, and failed-row report before writing to Supabase.</p>
                  <Button onClick={() => setModal(null)} variant="primary">
                    Mark import reviewed
                  </Button>
                </div>
              )}
              {modal === "document" && selected && (
                <div className="grid gap-3">
                  <Input placeholder="Document label" id="document-label" />
                  <Input placeholder="Document URL" id="document-url" />
                  <Button
                    onClick={() => {
                      const label = (document.getElementById("document-label") as HTMLInputElement | null)?.value || "Product document";
                      const url = (document.getElementById("document-url") as HTMLInputElement | null)?.value || "#";
                      updateProduct(
                        {
                          documents: [
                            ...selected.documents,
                            { id: `${selected.id}-document-${Date.now()}`, label, url }
                          ]
                        },
                        "Document added"
                      );
                      setModal(null);
                    }}
                    variant="primary"
                  >
                    Add document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
