"use client";

import Image from "next/image";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Boxes,
  Check,
  Copy,
  Download,
  FileText,
  Save,
  ImagePlus,
  Layers3,
  Pencil,
  Settings,
  Plus,
  Search,
  Trash2
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
type ProductStatusFilter = "all" | "active" | "draft" | "archived" | "low_stock";
type CatalogTab = "overview" | "editor" | "variants" | "pricing" | "media" | "sourcing" | "taxonomy" | "history";
type ModalMode =
  | "variant"
  | "category"
  | "import"
  | "bulk_price"
  | "document"
  | null;

type QuickEditDraft = {
  status: CatalogStatus;
  price: string;
  cwtPrice: string;
  quantityOnHand: string;
  reorderPoint: string;
};

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
  isDeleted: boolean;
  deletedAt?: string;
  auditEvents: CatalogAuditEvent[];
  documents: Array<{ id: string; label: string; url: string }>;
};

type CatalogManagerProps = {
  products: Product[];
  initialMode?: "default" | "create" | "editor";
  initialProductId?: string;
};

type ProductsPerPage = 50 | 100 | "all";
const DEFAULT_PRODUCTS_PER_PAGE: ProductsPerPage = 100;

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
    isDeleted: false,
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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined) {
  return value && uuidPattern.test(value);
}

function buildQuickEditDraft(product: CatalogItem): QuickEditDraft {
  const firstVariant = product.variants[0];

  return {
    status: product.status,
    price: String(firstVariant?.price ?? product.price ?? 0),
    cwtPrice: String(firstVariant?.steel_cwt_price ?? 0),
    quantityOnHand: String(firstVariant?.inventoryQuantity ?? 0),
    reorderPoint: product.specifications["Reorder Point"] || ""
  };
}

function getStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.inventoryQuantity, 0);
}

function isLowStock(item: CatalogItem) {
  const reorderPoint = Number.parseInt(item.specifications["Reorder Point"] || "5", 10);
  return getStock(item) <= (Number.isFinite(reorderPoint) ? reorderPoint : 5);
}

function getPrimarySize(item: CatalogItem) {
  const variant = item.variants[0];
  const parts = [
    variant?.options?.length,
    variant?.options?.material,
    variant?.options?.finish,
    variant?.options?.color
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Standard";
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

export function CatalogManager({
  products,
  initialMode = "default",
  initialProductId
}: CatalogManagerProps) {
  const [catalog, setCatalog] = useState(() => products.map(toCatalogItem));
  const [selectedId, setSelectedId] = useState(catalog[0]?.id || "");
  const [initialCreateModeHandled, setInitialCreateModeHandled] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [activeTab, setActiveTab] = useState<CatalogTab>(
    () => (initialMode === "editor" ? "editor" : "overview")
  );
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [message, setMessage] = useState("");
  const [inlineQuickEditProductId, setInlineQuickEditProductId] = useState<string | null>(null);
  const [inlineQuickEditDraft, setInlineQuickEditDraft] = useState<QuickEditDraft | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState<ProductsPerPage>(DEFAULT_PRODUCTS_PER_PAGE);
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
  const searchParams = useSearchParams();
  const isCreateMode = initialMode === "create";
  const isEditorMode = initialMode === "editor";
  const isDeletedView = searchParams.get("view") === "deleted";
  const visibleCatalog = isDeletedView ? catalog.filter((item) => item.isDeleted) : catalog.filter((item) => !item.isDeleted);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return visibleCatalog.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.category.name.toLowerCase().includes(normalized) ||
        item.supplier.toLowerCase().includes(normalized) ||
        item.variants.some((variant) => variant.sku.toLowerCase().includes(normalized));
      const matchesStatus = isDeletedView
        ? true
        : statusFilter === "all" ||
          (statusFilter === "low_stock" ? isLowStock(item) : item.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [statusFilter, query, visibleCatalog, isDeletedView]);

  const totalPages = productsPerPage === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / productsPerPage));
  const pageStart = (productPage - 1) * (productsPerPage === "all" ? filtered.length : productsPerPage);
  const pageEnd = productsPerPage === "all" ? filtered.length : pageStart + productsPerPage;
  const pagedProducts = productsPerPage === "all" ? filtered : filtered.slice(pageStart, pageEnd);
  const pageRange = filtered.length === 0 ? "0" : `${pageStart + 1}-${Math.min(pageEnd, filtered.length)}`;

  useEffect(() => {
    setProductPage(1);
  }, [statusFilter, query, isDeletedView, productsPerPage]);

  useEffect(() => {
    if (productPage > totalPages) {
      setProductPage(totalPages);
    }
  }, [productPage, totalPages]);

  const summary = useMemo(
    () => ({
      products: catalog.filter((item) => !item.isDeleted).length,
      skus: catalog.reduce((total, item) => total + item.variants.length, 0),
      active: catalog.filter((item) => !item.isDeleted && item.status === "active").length,
      drafts: catalog.filter((item) => !item.isDeleted && item.status === "draft").length,
      incomplete: catalog.filter((item) => !item.isDeleted && item.missingFields.length).length,
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
      isDeleted: false,
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

  useEffect(() => {
    if (initialMode !== "create" || initialCreateModeHandled) {
      return;
    }

    setInitialCreateModeHandled(true);
    addProduct();
  }, [initialMode, initialCreateModeHandled]);

  function duplicateProduct(item: CatalogItem) {
    const copiedTime = Date.now();
    const duplicated: CatalogItem = {
      ...item,
      id: `${item.id}-copy-${copiedTime}`,
      slug: `${item.slug}-copy-${copiedTime}`,
      title: `Copy of ${item.title}`,
      variants: item.variants.map((variant, index) => ({
        ...variant,
        id: `${variant.id}-copy-${copiedTime}-${index}`,
        sku: `${variant.sku}-COPY`
      })),
      images: item.images.map((image, index) => ({
        ...image,
        id: `${image.id}-copy-${copiedTime}-${index}`
      })),
      supplierSku: `${item.supplierSku}-COPY`,
      documents: item.documents.map((document) => ({
        ...document,
        id: `${document.id}-copy-${copiedTime}`
      })),
      auditEvents: [
        createAudit(
          "Product duplicated",
          `Duplicated ${item.title} locally as ${`Copy of ${item.title}`}`
        ),
        ...item.auditEvents
      ]
    };

    setCatalog((current) => [duplicated, ...current]);
    setSelectedId(duplicated.id);
    setActiveTab("editor");
    setMessage("Product duplicated locally");
  }

  function deleteProduct(productId: string) {
    setCatalog((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              auditEvents: [createAudit("Product deleted", `Deleted ${item.title}`), ...item.auditEvents]
            }
          : item
      )
    );

    setInlineQuickEditProductId(null);
    setInlineQuickEditDraft(null);

    const visibleNext = catalog.filter((item) => item.id !== productId && !item.isDeleted);
    if (selected?.id === productId) {
      setSelectedId((visibleNext[0]?.id || "") || "");
      setSelectedVariantId("");
    }
    setMessage("Product moved to deleted products");
  }

  function restoreProduct(productId: string) {
    setCatalog((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              isDeleted: false,
              deletedAt: undefined,
              auditEvents: [createAudit("Product restored", `Restored ${item.title}`), ...item.auditEvents]
            }
          : item
      )
    );
    setMessage("Product restored");
  }

  function openFullEditor(product: CatalogItem) {
    router.push(`/admin/products/${encodeURIComponent(product.id)}/edit`);
  }

  function setPrimaryImageUrl(imageUrl: string) {
    if (!selected) return;
    const normalized = imageUrl.trim();
    if (!normalized) return;

    updateProduct(
      {
        images: selected.images.length
          ? selected.images.map((image, index) => (index === 0 ? { ...image, url: normalized } : image))
          : [
              {
                id: `image-${Date.now()}`,
                productId: selected.id,
                url: normalized,
                alt: selected.title,
                sortOrder: 1
              }
            ]
      },
      "Featured image updated"
    );
  }

  function addImageFromFile(file: File | null) {
    if (!selected || !file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === "string" ? reader.result : "";
      if (!imageUrl) {
        return;
      }

      const image = {
        id: `image-${Date.now()}`,
        productId: selected.id,
        url: imageUrl,
        alt: selected.title,
        sortOrder: selected.images.length + 1
      };
      updateProduct(
        {
          images: selected.images.length ? [...selected.images, image] : [image],
          title: selected.title || selected.title
        },
        "Image added"
      );

      if (!selected.images.length) {
        setPrimaryImageUrl(imageUrl);
      }
    };

    reader.readAsDataURL(file);
  }

  function handleImageUploadFiles(files: FileList | null) {
    const firstFile = files?.item(0);
    addImageFromFile(firstFile ?? null);
  }

  useEffect(() => {
    if (initialMode === "editor" && initialProductId) {
      const target = catalog.find((item) => item.id === initialProductId);
      const next = target || catalog[0];

      if (!next) {
        return;
      }

      if (selected?.id !== next.id) {
        setSelectedId(next.id);
      }

      setSelectedVariantId(next.variants[0]?.id || "");
      setActiveTab("editor");
      setInlineQuickEditProductId(null);
      setInlineQuickEditDraft(null);
      return;
    }

    const openEditor = searchParams.get("editor") === "1";
    const productId = searchParams.get("product");
    if (!openEditor || !productId) {
      return;
    }

    const target = catalog.find((item) => item.id === productId);
    if (!target || target.isDeleted) {
      return;
    }

    if (selected?.id === target.id && activeTab === "editor") {
      return;
    }

    setSelectedId(target.id);
    setSelectedVariantId(target.variants[0]?.id || "");
    setActiveTab("editor");
    setInlineQuickEditProductId(null);
    setInlineQuickEditDraft(null);

    requestAnimationFrame(() => {
      const editorSection = document.getElementById("product-full-editor");
      editorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialMode, initialProductId, catalog, searchParams, selected?.id]);

  useEffect(() => {
    if (!isDeletedView && selected?.isDeleted) {
      const nextActive = catalog.find((item) => !item.isDeleted);
      setSelectedId(nextActive?.id || "");
      setSelectedVariantId("");
    }
  }, [catalog, isDeletedView, selected]);

  if (isCreateMode) {
    if (!selected) {
      return (
        <PageShell
          description="Build and publish one complete product with structured sections for images, pricing, variants, inventory, and shipping."
          eyebrow="Gateworks Operations"
          title="Add Product"
        >
          <section className="rounded-md border border-industrial-rail bg-industrial-paper px-4 py-3 text-sm text-industrial-pine">
            Preparing a new product workspace...
          </section>
        </PageShell>
      );
    }

    return (
      <PageShell
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveProductSnapshot()} size="sm" variant="primary">
              <Save size={15} />
              Save Product
            </Button>
            <Button onClick={saveDraft} size="sm">
              <FileText size={15} />
              Save Draft
            </Button>
          </div>
        }
        description="Build and publish one complete product with structured sections for images, pricing, variants, inventory, and shipping."
        eyebrow="Gateworks Operations"
        title="Add Product"
      >
        <section className="grid gap-5" onKeyDown={(event) => handleProductEditKeyDown(event, saveProductSnapshot)}>
          {message && <p className="rounded-md border border-industrial-rail bg-industrial-paper px-3 py-2 text-sm font-black text-industrial-pine">{message}</p>}

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">1) Basic Product Information</h3>
              <p className="text-sm text-industrial-steel">Product title, description, and category are the core identity fields.</p>
            </CardHeader>
            <CardBody className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Product title</span>
                <Input
                  value={selected.title}
                  onChange={(event) => updateProduct({ title: event.target.value }, "Title update", { title: event.target.value })}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Product type / category</span>
                <Select
                  value={selected.category.slug}
                  onChange={(event) => {
                    const category = categories.find((item) => item.slug === event.target.value);
                    if (category) {
                      updateProduct({ category }, "Category update", { category_id: category.id });
                    }
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-bold text-industrial-ink">Product description</span>
                <Textarea
                  value={selected.description}
                  onChange={(event) => updateProduct({ description: event.target.value }, "Description update", { description: event.target.value })}
                />
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">2) Media / Images</h3>
              <p className="text-sm text-industrial-steel">Upload product photos and choose the featured image.</p>
            </CardHeader>
            <CardBody className="grid gap-3">
              <div
                className="rounded-md border border-dashed border-industrial-rail bg-industrial-paper p-5 text-center"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  handleImageUploadFiles(event.dataTransfer.files);
                }}
              >
                <ImagePlus className="mx-auto text-industrial-muted" size={22} />
                <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-industrial-muted">Drop images here</p>
                <p className="text-xs text-industrial-steel">or browse to add product photos</p>
                <div className="mt-3">
                  <Button onClick={() => importRef.current?.click()} size="sm">
                    Browse files
                  </Button>
                  <input
                    ref={importRef}
                    accept="image/*"
                    className="sr-only"
                    type="file"
                    onChange={(event) => handleImageUploadFiles(event.currentTarget.files)}
                  />
                </div>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Featured image URL</span>
                <Input value={selected.images[0]?.url || ""} onChange={(event) => setPrimaryImageUrl(event.target.value)} />
              </label>
              {selected.images.length > 0 && (
                <div className="grid gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Thumbnail preview</p>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {selected.images.map((image, index) => (
                      <div className="rounded-md border border-industrial-rail bg-white p-2" key={image.id}>
                        <div className="relative h-20 overflow-hidden rounded-sm border border-industrial-rail bg-white">
                          <Image alt={image.alt || selected.title} className="object-contain p-1" fill sizes="180px" src={image.url} />
                        </div>
                        <p className="mt-2 text-[11px] text-industrial-muted">
                          {index === 0 ? "Featured" : `Image ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">3) Pricing</h3>
            </CardHeader>
            <CardBody className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Retail price</span>
                <Input
                  min="0"
                  step="0.01"
                  type="number"
                  value={selected.variants[0]?.price || ""}
                  onChange={(event) =>
                    updateVariant(selected.variants[0]?.id || "", { price: Number(event.target.value) || 0 }, { price: Number(event.target.value) || 0 })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Cost</span>
                <Input
                  min="0"
                  step="0.01"
                  type="number"
                  value={selected.specifications.Cost || ""}
                  onChange={(event) =>
                    updateProduct(
                      { specifications: { ...selected.specifications, Cost: event.target.value } },
                      "Cost update",
                      { specifications: { ...selected.specifications, Cost: event.target.value } }
                    )
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">CWT price</span>
                <Input
                  min="0"
                  step="0.01"
                  type="number"
                  value={selected.variants[0]?.steel_cwt_price || ""}
                  onChange={(event) =>
                    updateVariant(
                      selected.variants[0]?.id || "",
                      { steel_cwt_price: Number(event.target.value) || 0 },
                      { steel_cwt_price: Number(event.target.value) || 0 }
                    )
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Margin</span>
                <Input readOnly value={`${getMargin(selected)}%`} />
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">4) Variants / Specifications</h3>
            </CardHeader>
            <CardBody className="grid gap-3">
              {selected.variants.map((variant) => (
                <div className="grid gap-3 rounded border border-industrial-rail p-3" key={variant.id}>
                  <div className="grid gap-2 md:grid-cols-5">
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-industrial-ink">SKU</span>
                      <Input value={variant.sku} onChange={(event) => updateVariant(variant.id, { sku: event.target.value }, { sku: event.target.value })} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-industrial-ink">Size</span>
                      <Input value={variant.options.length || ""} onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, length: event.target.value } }, { length: event.target.value })} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-industrial-ink">Gauge</span>
                      <Input
                        min="0"
                        step="0.001"
                        type="number"
                        value={variant.wall_thickness_in || ""}
                        onChange={(event) =>
                          updateVariant(variant.id, { wall_thickness_in: Number(event.target.value) || 0 }, { wall_thickness_in: Number(event.target.value) || 0 })
                        }
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-industrial-ink">Length</span>
                      <Input
                        min="0"
                        step="0.25"
                        type="number"
                        value={variant.length_ft || ""}
                        onChange={(event) =>
                          updateVariant(variant.id, { length_ft: Number(event.target.value) || 0 }, { length_ft: Number(event.target.value) || 0 })
                        }
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-black text-industrial-ink">Finish</span>
                      <Input value={variant.options.finish || ""} onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, finish: event.target.value } }, { finish: event.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
              <Button onClick={() => setModal("variant")} size="sm" variant="secondary">
                <Plus size={14} />
                Add variant
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">5) Inventory</h3>
            </CardHeader>
            <CardBody className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Quantity on hand</span>
                <Input
                  min="0"
                  type="number"
                  value={selected.variants[0]?.inventoryQuantity || ""}
                  onChange={(event) => {
                    const quantity = Number(event.target.value) || 0;
                    updateVariant(
                      selected.variants[0]?.id || "",
                      { inventoryQuantity: quantity, inventory: quantity > 0 ? "in_stock" : "out_of_stock" },
                      { inventory_quantity: quantity, inventory_status: quantity > 0 ? "in_stock" : "out_of_stock" }
                    );
                  }}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Reorder point</span>
                <Input
                  min="0"
                  type="number"
                  value={selected.specifications["Reorder Point"] || "0"}
                  onChange={(event) =>
                    updateProduct(
                      { specifications: { ...selected.specifications, "Reorder Point": event.target.value } },
                      "Reorder point update",
                      { specifications: { ...selected.specifications, "Reorder Point": event.target.value } }
                    )
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Bin location</span>
                <Input
                  value={selected.specifications["Bin Location"] || "MAIN"}
                  onChange={(event) =>
                    updateProduct(
                      { specifications: { ...selected.specifications, "Bin Location": event.target.value } },
                      "Bin location update",
                      { specifications: { ...selected.specifications, "Bin Location": event.target.value } }
                    )
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Bin code</span>
                <Input
                  value={selected.specifications["Bin Code"] || "UNASSIGNED"}
                  onChange={(event) =>
                    updateProduct(
                      { specifications: { ...selected.specifications, "Bin Code": event.target.value } },
                      "Bin code update",
                      { specifications: { ...selected.specifications, "Bin Code": event.target.value } }
                    )
                  }
                />
              </label>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-black text-industrial-ink">6) Shipping / Weight</h3>
            </CardHeader>
            <CardBody className="grid gap-3 md:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Product weight</span>
                <Input value={`${selected.variants[0]?.calculated_weight_lb?.toFixed(2) || "0.00"} lb`} readOnly />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Width (in)</span>
                <Input
                  min="0"
                  step="0.25"
                  type="number"
                  value={selected.variants[0]?.width_in || ""}
                  onChange={(event) =>
                    updateVariant(selected.variants[0]?.id || "", { width_in: Number(event.target.value) || 0 }, { width_in: Number(event.target.value) || 0 })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Height (in)</span>
                <Input
                  min="0"
                  step="0.25"
                  type="number"
                  value={selected.variants[0]?.height_in || ""}
                  onChange={(event) =>
                    updateVariant(selected.variants[0]?.id || "", { height_in: Number(event.target.value) || 0 }, { height_in: Number(event.target.value) || 0 })
                  }
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-industrial-ink">Freight / bundle</span>
                <Input
                  value={selected.specifications["Bundle Info"] || ""}
                  onChange={(event) =>
                    updateProduct(
                      { specifications: { ...selected.specifications, "Bundle Info": event.target.value } },
                      "Bundle info update",
                      { specifications: { ...selected.specifications, "Bundle Info": event.target.value } }
                    )
                  }
                />
              </label>
            </CardBody>
          </Card>
        </section>
      </PageShell>
    );
  }

  function setQuickEditField(productId: string, field: keyof QuickEditDraft, value: string) {
    if (!inlineQuickEditProductId || inlineQuickEditProductId !== productId) return;
    setInlineQuickEditDraft((current) => {
      if (!current) return current;
      if (field === "status") {
        if (!statuses.includes(value as CatalogStatus)) return current;
        return { ...current, status: value as CatalogStatus };
      }
      return { ...current, [field]: value };
    });
  }

  function startQuickEdit(product: CatalogItem) {
    setInlineQuickEditProductId(product.id);
    setInlineQuickEditDraft(buildQuickEditDraft(product));
  }

  function updateRowStatus(productId: string, status: CatalogStatus) {
    setCatalog((current) =>
      current.map((item) => (item.id === productId ? { ...item, status } : item))
    );

    setMessage(`Status set to ${statusLabels[status]}`);

    void persistAdminChange(
      {
        action: "update_product",
        productId,
        changes: { status }
      },
      `Status set to ${statusLabels[status]}`
    ).then((result) => setMessage(result.message));
  }

  function cancelQuickEdit() {
    setInlineQuickEditProductId(null);
    setInlineQuickEditDraft(null);
  }

  function applyQuickEditChanges(product: CatalogItem) {
    if (!inlineQuickEditProductId || inlineQuickEditProductId !== product.id || !inlineQuickEditDraft) {
      return;
    }

    const primaryVariant = product.variants[0];
    if (!primaryVariant) {
      setMessage("No SKU available for quick edit.");
      return;
    }

    const status = inlineQuickEditDraft.status;
    const price = Number.parseFloat(inlineQuickEditDraft.price) || 0;
    const cwtPrice = Number.parseFloat(inlineQuickEditDraft.cwtPrice) || 0;
    const quantityOnHand = Number.parseInt(inlineQuickEditDraft.quantityOnHand, 10) || 0;
    const reorderPoint = inlineQuickEditDraft.reorderPoint.trim()
      ? Number.parseInt(inlineQuickEditDraft.reorderPoint, 10) || 0
      : null;

    const nextProduct: CatalogItem = {
      ...product,
      status,
      specifications: {
        ...product.specifications,
        "Reorder Point": reorderPoint === null ? "" : String(reorderPoint)
      },
      variants: product.variants.map((variant, index) =>
        index === 0
          ? {
              ...variant,
              price,
              steel_cwt_price: cwtPrice,
              inventoryQuantity: Math.max(0, quantityOnHand),
              inventory: quantityOnHand > 0 ? "in_stock" : "out_of_stock"
            } as ProductVariant
          : variant
      )
    };

    setCatalog((current) => current.map((item) => (item.id === product.id ? nextProduct : item)));

    const productChanges = {
      status,
      specifications: {
        ...product.specifications,
        "Reorder Point": reorderPoint === null ? "" : String(reorderPoint)
      }
    };

    if (isUuid(product.id)) {
      void persistAdminChange(
        {
          action: "update_product",
          productId: product.id,
          changes: productChanges
        },
        "Quick edit product update"
      ).then((result) => setMessage(result.message));
    }

    if (price !== primaryVariant.price || cwtPrice !== (primaryVariant.steel_cwt_price || 0) || quantityOnHand !== primaryVariant.inventoryQuantity || status !== product.status) {
      void persistAdminChange(
        {
          action: "update_variant",
          variantId: isUuid(primaryVariant.id) ? primaryVariant.id : undefined,
          sku: primaryVariant.sku,
          changes: {
            price,
            steel_cwt_price: cwtPrice,
            inventory_quantity: quantityOnHand,
            inventory_status: quantityOnHand > 0 ? "in_stock" : "out_of_stock"
          }
        },
        "Quick edit variant update"
      ).then((result) => setMessage(result.message));
    }

    setMessage("Quick edit saved locally");
    cancelQuickEdit();
  }

  function isEnterKey(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLElement>) {
    return event.key === "Enter" || event.key === "NumpadEnter";
  }

  function handleQuickEditKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, product: CatalogItem) {
    if (!isEnterKey(event) || inlineQuickEditProductId !== product.id) {
      return;
    }

    event.preventDefault();
    applyQuickEditChanges(product);
  }

  function handleQuickEditBodyKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isEnterKey(event) || !inlineQuickEditProductId) {
      return;
    }

    const currentProduct = catalog.find((item) => item.id === inlineQuickEditProductId);
    if (!currentProduct) {
      return;
    }

    event.preventDefault();
    applyQuickEditChanges(currentProduct);
  }

  useEffect(() => {
    if (!inlineQuickEditProductId) {
      return;
    }

    function onQuickEditEnter(event: globalThis.KeyboardEvent) {
      if (!isEnterKey(event as unknown as KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLElement>)) {
        return;
      }

      const target = event.target as HTMLElement;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.tagName !== "INPUT" && target.tagName !== "SELECT") {
        return;
      }

      const activeProductRow = target.closest('[data-quick-edit-row]');
      if (!(activeProductRow instanceof HTMLElement)) {
        return;
      }

      const activeProductId = activeProductRow.getAttribute("data-quick-edit-row");
      if (activeProductId !== inlineQuickEditProductId) {
        return;
      }

      event.preventDefault();
      const activeProduct = catalog.find((item) => item.id === inlineQuickEditProductId);
      if (!activeProduct) {
        return;
      }

      applyQuickEditChanges(activeProduct);
    }

    window.addEventListener("keydown", onQuickEditEnter);
    return () => {
      window.removeEventListener("keydown", onQuickEditEnter);
    };
  }, [catalog, inlineQuickEditProductId]);

  function saveProductSnapshot() {
    if (!selected) return;

    const primaryVariant = selected.variants[0];
    void persistAdminChange(
      {
        action: "update_product",
        productId: selected.id,
        changes: {
          title: selected.title,
          slug: selected.slug,
          description: selected.description,
          details: selected.details,
          specifications: selected.specifications,
          category_id: selected.category.id,
          status: selected.status
        }
      },
      "Save product"
    ).then((result) => setMessage(result.message));

    if (primaryVariant) {
      void persistAdminChange(
        {
          action: "update_variant",
          variantId: isUuid(primaryVariant.id) ? primaryVariant.id : undefined,
          sku: primaryVariant.sku,
          changes: {
            sku: primaryVariant.sku,
            price: primaryVariant.price,
            steel_cwt_price: primaryVariant.steel_cwt_price,
            inventory_quantity: primaryVariant.inventoryQuantity,
            inventory_status: primaryVariant.inventory,
            image_url: primaryVariant.image,
            width_in: primaryVariant.width_in,
            height_in: primaryVariant.height_in,
            wall_thickness_in: primaryVariant.wall_thickness_in,
            length_ft: primaryVariant.length_ft,
            material_density_lb_per_in3: primaryVariant.material_density_lb_per_in3
          }
        },
        "Save primary variant"
      ).then((result) => setMessage(result.message));
    }
  }

  function saveDraft() {
    if (!selected) return;
    updateProduct({ status: "draft" }, "Saved as draft", { status: "draft" });
  }

  function handleProductEditKeyDown(event: KeyboardEvent<HTMLElement>, submit: () => void) {
    const target = event.target as HTMLElement;
    if (event.key !== "Enter") {
      return;
    }

    if (target.tagName === "TEXTAREA" || (target.tagName !== "INPUT" && target.tagName !== "SELECT")) {
      return;
    }

    event.preventDefault();
    submit();
  }

  function previewProduct() {
    if (typeof window === "undefined" || !selected) return;
    window.open(`/products/${selected.slug}`, "_blank", "noopener,noreferrer");
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
              isDeleted: item.isDeleted,
              deletedAt: item.deletedAt,
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
    <>
      <PageShell
        actions={
          isEditorMode ? (
            <Button onClick={() => router.push("/admin/products")} size="sm" variant="secondary">
              Back to Products
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push("/admin/products/new")} size="sm" variant="primary">
                <Plus size={15} />
                Add Product
              </Button>
              <Button onClick={() => router.push(isDeletedView ? "/admin/products" : "/admin/products?view=deleted")} size="sm" variant="secondary">
                {isDeletedView ? "Back to Products" : "Deleted Products"}
              </Button>
            </div>
          )
        }
        description={
          isEditorMode
            ? "Dedicated full editor for product setup, pricing, inventory, and publishing controls."
            : "Manage product records, prices, inventory, and publishing state from one operational workspace."
        }
        eyebrow="Gateworks Operations"
        title={isEditorMode ? `Edit ${selected?.title || "Product"}` : "Products"}
      >
        <div className="grid gap-5">
          {!isEditorMode && (
          <Card className="grid gap-5">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Gateworks Operations
                </p>
                <h2 className="text-xl font-black text-industrial-ink">{isDeletedView ? "Deleted Products" : "Products"}</h2>
              </div>
              <label className="relative block w-full max-w-xl">
                <span className="sr-only">Search products</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
                <Input
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products, SKU, category, supplier"
                  value={query}
                />
              </label>
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {(isDeletedView
                ? [{ id: "all", label: "All Deleted" }]
                : [
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "draft", label: "Draft" },
                { id: "archived", label: "Archived" },
                { id: "low_stock", label: "Low Stock" }
              ]).map((filter) => (
                <button
                  className={cn(
                    "h-8 rounded-full border border-industrial-rail px-3 font-black uppercase tracking-[0.08em]",
                    statusFilter === filter.id
                      ? "border-industrial-ink bg-industrial-ink text-white"
                      : "text-industrial-ink hover:bg-industrial-paper"
                  )}
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as ProductStatusFilter)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-industrial-rail">
              <table className="min-w-[1300px] w-full text-left text-sm">
                <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.08em] text-industrial-muted">
                  <tr>
                    <th className="px-3 py-3">Product image</th>
                    <th className="px-3 py-3">Product name</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Size</th>
                    <th className="w-28 px-3 py-3">Price</th>
                    <th className="w-36 px-3 py-3">CWT Price</th>
                    <th className="w-36 px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Reorder pt</th>
                    <th className="px-3 py-3">Status</th>
                    {isDeletedView && <th className="px-3 py-3">Deleted</th>}
                    <th className="w-80 whitespace-nowrap px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody onKeyDownCapture={handleQuickEditBodyKeyDown}>
                {pagedProducts.map((item) => {
                    const primaryVariant = item.variants[0];
                    const stockValue = getStock(item);
                    const isEditing = inlineQuickEditProductId === item.id;
                    const reorderPoint = Number.parseInt(item.specifications["Reorder Point"] || "0", 10) || 0;

                    return (
                      <tr
                        className={cn("group border-t border-industrial-rail hover:bg-industrial-paper", selected?.id === item.id && "bg-industrial-paper")}
                        onKeyDown={(event) => handleQuickEditKeyDown(event as unknown as KeyboardEvent<HTMLInputElement | HTMLSelectElement>, item)}
                        data-quick-edit-row={item.id}
                        key={item.id}
                      >
                        <td className="px-3 py-3">
                          <div className="relative size-12 overflow-hidden rounded border border-industrial-rail bg-white">
                            <Image
                              alt={item.title}
                              className="object-contain p-1"
                              fill
                              sizes="48px"
                              src={item.images[0]?.url || primaryVariant?.image || "/assets/logo.svg"}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            className="text-left font-bold text-industrial-ink transition hover:text-industrial-ink"
                            onClick={() => {
                              setSelectedId(item.id);
                              setSelectedVariantId(item.variants[0]?.id || "");
                              setActiveTab("overview");
                            }}
                            type="button"
                          >
                            {item.title}
                          </button>
                          <p className="text-xs text-industrial-steel">Supplier: {item.supplier}</p>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-industrial-steel">
                          {primaryVariant?.sku || "—"}
                        </td>
                        <td className="px-3 py-3 text-industrial-steel">{item.category.name}</td>
                        <td className="px-3 py-3 text-industrial-steel">{getPrimarySize(item)}</td>
                      <td className="min-w-[7rem] px-3 py-3 font-semibold text-industrial-ink">
                          {isEditing && inlineQuickEditDraft ? (
                            <Input
                              className="h-8 w-28"
                              type="number"
                              value={inlineQuickEditDraft.price}
                              onKeyDown={(event) => {
                                if (isEnterKey(event)) {
                                  event.preventDefault();
                                  applyQuickEditChanges(item);
                                }
                              }}
                              onChange={(event) => setQuickEditField(item.id, "price", event.target.value)}
                            />
                          ) : (
                            formatCurrency(item.final_price || primaryVariant?.price || item.price)
                          )}
                        </td>
                        <td className="min-w-[8rem] px-3 py-3 font-semibold text-industrial-ink">
                          {isEditing && inlineQuickEditDraft ? (
                            <Input
                              className="h-8 w-28"
                              type="number"
                              value={inlineQuickEditDraft.cwtPrice}
                              onKeyDown={(event) => {
                                if (isEnterKey(event)) {
                                  event.preventDefault();
                                  applyQuickEditChanges(item);
                                }
                              }}
                              onChange={(event) => setQuickEditField(item.id, "cwtPrice", event.target.value)}
                            />
                          ) : (
                            formatCurrency(primaryVariant?.steel_cwt_price || 0)
                          )}
                        </td>
                        <td className="min-w-[8rem] px-3 py-3 text-industrial-steel">
                          {isEditing && inlineQuickEditDraft ? (
                            <Input
                              className="h-8 w-28"
                              type="number"
                              value={inlineQuickEditDraft.quantityOnHand}
                              onKeyDown={(event) => {
                                if (isEnterKey(event)) {
                                  event.preventDefault();
                                  applyQuickEditChanges(item);
                                }
                              }}
                              onChange={(event) => setQuickEditField(item.id, "quantityOnHand", event.target.value)}
                            />
                          ) : (
                            `${formatNumber(stockValue)} / ${formatNumber(primaryVariant?.inventoryQuantity || 0)}`
                          )}
                        </td>
                        <td className="px-3 py-3 text-industrial-steel">
                          {isEditing && inlineQuickEditDraft ? (
                            <Input
                              className="h-8 w-24"
                              type="number"
                              value={inlineQuickEditDraft.reorderPoint}
                              onKeyDown={(event) => {
                                if (isEnterKey(event)) {
                                  event.preventDefault();
                                  applyQuickEditChanges(item);
                                }
                              }}
                              onChange={(event) => setQuickEditField(item.id, "reorderPoint", event.target.value)}
                            />
                          ) : (
                            formatNumber(reorderPoint)
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isDeletedView ? (
                            "—"
                          ) : isEditing && inlineQuickEditDraft ? (
                            <Select
                              value={inlineQuickEditDraft.status}
                              onKeyDown={(event) => {
                                if (isEnterKey(event)) {
                                  event.preventDefault();
                                  applyQuickEditChanges(item);
                                }
                              }}
                              onChange={(event) => setQuickEditField(item.id, "status", event.target.value)}
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <Select
                              className="h-8 w-40"
                              value={item.status}
                              onChange={(event) => updateRowStatus(item.id, event.target.value as CatalogStatus)}
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </Select>
                          )}
                        </td>
                        {isDeletedView && <td className="px-3 py-3 text-xs text-industrial-steel">{item.deletedAt ? formatDate(item.deletedAt) : "—"}</td>}
                        <td className="sticky right-0 z-10 w-80 bg-white px-3 py-3">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {isDeletedView ? (
                              <Button onClick={() => restoreProduct(item.id)} size="sm" variant="secondary">
                                <Archive size={14} />
                                Restore
                              </Button>
                            ) : isEditing ? (
                              <>
                                <Button onClick={() => applyQuickEditChanges(item)} size="sm" variant="primary">
                                  <Check size={14} />
                                  Save
                                </Button>
                                <Button onClick={cancelQuickEdit} size="sm">
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                className="normal-case tracking-normal text-sm font-bold"
                                onClick={() => startQuickEdit(item)}
                                size="sm"
                              >
                                <Pencil size={14} />
                                Quick Edit
                              </Button>
                            )}
                            <Button
                              className="normal-case tracking-normal text-sm font-bold"
                              onClick={() => openFullEditor(item)}
                              size="sm"
                              variant="secondary"
                            >
                              <Settings size={14} />
                              Full Edit
                            </Button>
                            <Button
                              className="normal-case tracking-normal text-sm font-bold"
                              onClick={() => duplicateProduct(item)}
                              size="sm"
                              variant="secondary"
                              aria-label={`Duplicate ${item.title}`}
                              title={`Duplicate ${item.title}`}
                            >
                              <Copy size={14} />
                            </Button>
                            {!isDeletedView && (
                              <button
                                aria-label={`Delete ${item.title}`}
                                className="grid h-8 w-8 place-items-center rounded border border-industrial-rail text-industrial-muted transition hover:bg-industrial-paper hover:text-industrial-ink"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteProduct(item.id);
                                }}
                                title="Delete"
                                type="button"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-industrial-rail px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-industrial-steel">
                {filtered.length ? `Showing ${pageRange} of ${filtered.length} products` : "No products match this view."}
              </p>
              <label className="mx-auto inline-flex items-center gap-2 text-sm text-industrial-steel whitespace-nowrap sm:relative sm:left-12">
                <span className="text-industrial-muted">Show per page</span>
                <Select
                  aria-label="Products per page"
                  className="inline-flex w-20"
                  value={productsPerPage}
                  onChange={(event) => {
                    const nextValue = event.target.value === "all" ? "all" : (Number(event.target.value) as ProductsPerPage);
                    setProductsPerPage(nextValue);
                  }}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </Select>
              </label>
              <div className="ml-auto flex flex-nowrap items-center gap-2">
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setProductPage((current) => Math.max(1, current - 1))}
                      disabled={productPage === 1}
                      size="sm"
                      variant="secondary"
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-black text-industrial-ink">
                      Page {productPage} / {totalPages}
                    </span>
                    <Button
                      onClick={() => setProductPage((current) => Math.min(totalPages, current + 1))}
                      disabled={productPage === totalPages}
                      size="sm"
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
            </CardBody>
          </Card>
          )}

          {isEditorMode && !selected && (
            <section className="rounded-md border border-industrial-rail bg-industrial-paper px-4 py-3 text-sm text-industrial-pine">
              Preparing selected product workspace...
            </section>
          )}

          {isEditorMode && selected && !isDeletedView && (
            <section className="grid gap-5" onKeyDown={(event) => handleProductEditKeyDown(event, saveProductSnapshot)}>
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  {selected.category.name}
                </p>
                <h2 className="text-2xl font-black text-industrial-ink">{selected.title}</h2>
                <p className="mt-2 text-sm text-industrial-steel">
                  {selected.variants.length} SKUs / {selected.supplier}
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
                <Button
                  className="normal-case tracking-normal text-sm font-bold"
                  onClick={() => startQuickEdit(selected)}
                  size="sm"
                >
                  <Pencil size={15} />
                  Quick edit
                </Button>
                <Button
                  className="normal-case tracking-normal text-sm font-bold"
                  onClick={() => openFullEditor(selected)}
                  size="sm"
                  variant="secondary"
                >
                  <Settings size={15} />
                  Full edit
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
                <Card id="product-full-editor">
                  <CardHeader>
                    <div>
                      <h3 className="text-lg font-black text-industrial-ink">Full product editor</h3>
                      <p className="text-sm text-industrial-steel">Clean two-column workspace for complete product management.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={saveProductSnapshot} size="sm" variant="primary">
                        <Save size={15} />
                        Save Product
                      </Button>
                      <Button onClick={saveDraft} size="sm">
                        <FileText size={15} />
                        Save Draft
                      </Button>
                      <Button onClick={previewProduct} size="sm">
                        <Search size={15} />
                        Preview Product
                      </Button>
                      <Button onClick={() => updateProduct({ status: "archived" }, "Archived", { status: "archived" })} size="sm">
                        <Archive size={15} />
                        Archive Product
                      </Button>
                      <Button onClick={() => duplicateProduct(selected)} size="sm">
                        <Copy size={15} />
                        Duplicate Product
                      </Button>
                      <Button onClick={() => deleteProduct(selected.id)} size="sm" variant="danger">
                        <Trash2 size={15} />
                        Delete Product
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody className="grid gap-5 lg:grid-cols-[1fr_340px]">
                    <div className="grid gap-5">
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Basic info</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Product name</span>
                            <Input
                              value={selected.title}
                              onChange={(event) => updateProduct({ title: event.target.value }, "Title update", { title: event.target.value })}
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Category</span>
                            <Select
                              value={selected.category.slug}
                              onChange={(event) => {
                                const category = categories.find((item) => item.slug === event.target.value);
                                if (category) {
                                  updateProduct({ category }, "Category update", { category_id: category.id });
                                }
                              }}
                            >
                              {categories.map((category) => (
                                <option key={category.slug} value={category.slug}>
                                  {category.name}
                                </option>
                              ))}
                            </Select>
                          </label>
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="grid gap-2">
                              <span className="text-sm font-bold text-industrial-ink">Brand</span>
                              <Input
                                value={selected.specifications.Brand || ""}
                                onChange={(event) =>
                                  updateProduct(
                                    { specifications: { ...selected.specifications, Brand: event.target.value } },
                                    "Brand update",
                                    { specifications: { ...selected.specifications, Brand: event.target.value } }
                                  )
                                }
                              />
                            </label>
                            <label className="grid gap-2">
                              <span className="text-sm font-bold text-industrial-ink">SKU</span>
                              <Input
                                value={selected.variants[0]?.sku || ""}
                                onChange={(event) =>
                                  updateVariant(selected.variants[0]?.id || "", { sku: event.target.value }, { sku: event.target.value })
                                }
                              />
                            </label>
                          </div>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Description</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Product description</span>
                            <Textarea
                              value={selected.description}
                              onChange={(event) => updateProduct({ description: event.target.value }, "Description update", { description: event.target.value })}
                            />
                          </label>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Images</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Featured image</span>
                            <Input
                              value={selected.images[0]?.url || ""}
                              onChange={(event) =>
                                updateProduct(
                                  {
                                    images: selected.images.length
                                      ? selected.images.map((image, index) => (index === 0 ? { ...image, url: event.target.value } : image))
                                      : [
                                          {
                                            id: `image-${Date.now()}`,
                                            productId: selected.id,
                                            url: event.target.value,
                                            alt: selected.title,
                                            sortOrder: 1
                                          }
                                        ]
                                  },
                                  "Featured image update"
                                )
                              }
                            />
                          </label>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Variants / sizes</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          {selected.variants.map((variant) => (
                            <div className="grid gap-3 border border-industrial-rail p-3" key={variant.id}>
                              <label className="grid gap-2">
                                <span className="text-sm font-bold text-industrial-ink">SKU</span>
                                <Input
                                  value={variant.sku}
                                  onChange={(event) => updateVariant(variant.id, { sku: event.target.value }, { sku: event.target.value })}
                                />
                              </label>
                              <div className="grid gap-3 md:grid-cols-3">
                                <label className="grid gap-2">
                                  <span className="text-sm font-bold text-industrial-ink">Length</span>
                                  <Input
                                    value={variant.options.length || ""}
                                    onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, length: event.target.value } }, { length: event.target.value })}
                                  />
                                </label>
                                <label className="grid gap-2">
                                  <span className="text-sm font-bold text-industrial-ink">Material</span>
                                  <Input
                                    value={variant.options.material || ""}
                                    onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, material: event.target.value } }, { material: event.target.value })}
                                  />
                                </label>
                                <label className="grid gap-2">
                                  <span className="text-sm font-bold text-industrial-ink">Finish</span>
                                  <Input
                                    value={variant.options.finish || ""}
                                    onChange={(event) => updateVariant(variant.id, { options: { ...variant.options, finish: event.target.value } }, { finish: event.target.value })}
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                          <Button onClick={() => setModal("variant")} size="sm" variant="secondary">
                            <Plus size={14} />
                            Add variant
                          </Button>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Pricing and weight formula</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Price</span>
                            <Input
                              min="0"
                              step="0.01"
                              type="number"
                              value={selected.variants[0]?.price || ""}
                              onChange={(event) =>
                                updateVariant(selected.variants[0]?.id || "", { price: Number(event.target.value) || 0 }, { price: Number(event.target.value) || 0 })
                              }
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Steel CWT price</span>
                            <Input
                              type="number"
                              value={selected.variants[0]?.steel_cwt_price || ""}
                              onChange={(event) =>
                                updateVariant(
                                  selected.variants[0]?.id || "",
                                  { steel_cwt_price: Number(event.target.value) || 0 },
                                  { steel_cwt_price: Number(event.target.value) || 0 }
                                )
                              }
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Wall thickness (in)</span>
                            <Input
                              type="number"
                              step="0.001"
                              value={selected.variants[0]?.wall_thickness_in || ""}
                              onChange={(event) =>
                                updateVariant(
                                  selected.variants[0]?.id || "",
                                  { wall_thickness_in: Number(event.target.value) || 0 },
                                  { wall_thickness_in: Number(event.target.value) || 0 }
                                )
                              }
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Length (ft)</span>
                            <Input
                              type="number"
                              step="0.25"
                              value={selected.variants[0]?.length_ft || ""}
                              onChange={(event) =>
                                updateVariant(
                                  selected.variants[0]?.id || "",
                                  { length_ft: Number(event.target.value) || 0 },
                                  { length_ft: Number(event.target.value) || 0 }
                                )
                              }
                            />
                          </label>
                        </CardBody>
                      </Card>
                    </div>
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Status</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Publishing status</span>
                            <Select
                              value={selected.status}
                              onChange={(event) => updateProduct({ status: event.target.value as CatalogStatus }, "Status update", { status: event.target.value })}
                            >
                              {statuses.map((status) => (
                                <option key={status} value={status}>
                                  {statusLabels[status]}
                                </option>
                              ))}
                            </Select>
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Taxable</span>
                            <Select value={selected.taxable ? "yes" : "no"} onChange={(event) => updateProduct({ taxable: event.target.value === "yes" }, "Tax setting update")}>
                              <option value="yes">Taxable</option>
                              <option value="no">Tax exempt</option>
                            </Select>
                          </label>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Inventory summary</h4>
                        </CardHeader>
                        <CardBody className="grid gap-2 text-sm">
                          <p className="flex justify-between text-industrial-steel">
                            <span>Stock total</span>
                            <span className="font-black text-industrial-ink">{formatNumber(getStock(selected))}</span>
                          </p>
                          <p className="flex justify-between text-industrial-steel">
                            <span>Primary SKU qty</span>
                            <span className="font-black text-industrial-ink">{formatNumber(selected.variants[0]?.inventoryQuantity || 0)}</span>
                          </p>
                          <p className="flex justify-between text-industrial-steel">
                            <span>Reorder point</span>
                            <span className="font-black text-industrial-ink">{selected.specifications["Reorder Point"] || "0"}</span>
                          </p>
                          <p className="flex justify-between text-industrial-steel">
                            <span>Location / bin</span>
                            <span className="font-black text-industrial-ink">{selected.specifications["Bin Location"] || "MAIN"} / {selected.specifications["Bin Code"] || "UNASSIGNED"}</span>
                          </p>
                          <p className="flex justify-between text-industrial-steel">
                            <span>Low stock alert</span>
                            <span className={cn("font-black", isLowStock(selected) ? "text-amber-800" : "text-emerald-800")}>
                              {isLowStock(selected) ? "Yes" : "No"}
                            </span>
                          </p>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Supplier / vendor</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Supplier</span>
                            <Input
                              value={selected.supplier}
                              onChange={(event) => updateProduct({ supplier: event.target.value }, "Supplier update", { supplier: event.target.value })}
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">Supplier SKU</span>
                            <Input
                              value={selected.supplierSku}
                              onChange={(event) => updateProduct({ supplierSku: event.target.value }, "Supplier SKU update")}
                            />
                          </label>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">SEO</h4>
                        </CardHeader>
                        <CardBody className="grid gap-3">
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">SEO title</span>
                            <Input
                              value={selected.specifications["SEO Title"] || ""}
                              onChange={(event) =>
                                updateProduct(
                                  { specifications: { ...selected.specifications, "SEO Title": event.target.value } },
                                  "SEO title update",
                                  { specifications: { ...selected.specifications, "SEO Title": event.target.value } }
                                )
                              }
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">SEO slug</span>
                            <Input
                              value={selected.specifications["SEO Slug"] || ""}
                              onChange={(event) =>
                                updateProduct(
                                  { specifications: { ...selected.specifications, "SEO Slug": event.target.value } },
                                  "SEO slug update",
                                  { specifications: { ...selected.specifications, "SEO Slug": event.target.value } }
                                )
                              }
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-bold text-industrial-ink">SEO description</span>
                            <Input
                              value={selected.specifications["SEO Description"] || ""}
                              onChange={(event) =>
                                updateProduct(
                                  { specifications: { ...selected.specifications, "SEO Description": event.target.value } },
                                  "SEO description update",
                                  { specifications: { ...selected.specifications, "SEO Description": event.target.value } }
                                )
                              }
                            />
                          </label>
                        </CardBody>
                      </Card>
                      <Card>
                        <CardHeader>
                          <h4 className="font-black text-industrial-ink">Internal notes</h4>
                        </CardHeader>
                        <CardBody>
                          <Textarea
                            value={selected.specifications["Internal Notes"] || ""}
                            onChange={(event) =>
                              updateProduct(
                                { specifications: { ...selected.specifications, "Internal Notes": event.target.value } },
                                "Internal notes update",
                                { specifications: { ...selected.specifications, "Internal Notes": event.target.value } }
                              )
                            }
                          />
                        </CardBody>
                      </Card>
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
                          <Image alt={image.alt} className="object-contain p-2" fill sizes="96px" src={image.url} />
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
      </PageShell>

      {modal && (
        <div className={cn("fixed inset-0 z-50 grid bg-black/30 p-4 lg:place-items-center")}>
          <div className={cn("w-full border border-industrial-rail bg-white shadow-xl max-w-2xl")}>
            <div className="flex items-start justify-between gap-4 border-b border-industrial-rail p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Catalog workflow</p>
                <h2 className="text-xl font-black text-industrial-ink">
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
            <div className="h-full">
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
    </>
  );
}
