"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  PackagePlus,
  Plus,
  CheckCircle2,
  Truck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { CartItem, Product, ProductVariant } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type QuoteDetailPageProps = {
  quoteId: string;
  backHref: string;
  catalogProducts?: Product[];
};

const taxRate = 0.0825;
const unitOptions = ["EA", "FT", "SET", "ROLL", "BOX", "PCS"];

const sampleQuoteFallbacks: OrderRecord[] = [
  {
    id: "sample-quote-1",
    orderNumber: "Quote-10042",
    userId: "sample",
    customerName: "Manny Ortega",
    companyName: "Anderson Fabrication",
    email: "quotes@example.com",
    phone: "555-0188",
    items: [
      {
        productId: "ornamental-panel-48",
        variantId: "ornamental-panel-48-black",
        title: "Ornamental iron panel 48 in",
        sku: "ORN-PANEL-48-BLK",
        image: "/assets/logo.svg",
        price: 420,
        quantity: 8,
        quantityNeeded: 8,
        quantityPulled: 0,
        pulled: false,
        pickNotes: "",
        options: { finish: "Black primer" }
      }
    ],
    fulfillmentMethod: "delivery",
    requestedDate: "2026-05-18",
    requestedWindow: "9:00 AM - 11:00 AM",
    jobName: "North yard gate rebuild",
    jobsiteAddress: {
      name: "Manny Ortega",
      company: "Anderson Fabrication",
      email: "quotes@example.com",
      phone: "555-0188",
      addressLine1: "1200 Industrial Way",
      addressLine2: "Receiving gate 3",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      notes: "Quote delivery with forklift unload and contractor terms."
    },
    drawings: [],
    pickupContact: "Manny Ortega",
    subtotal: 3360,
    tax: 0,
    deliveryFee: 0,
    total: 3360,
    status: "submitted",
    paymentStatus: "unpaid",
    isQuoteRequest: true,
    createdAt: "2026-05-14T16:00:00.000Z",
    updatedAt: "2026-05-14T16:00:00.000Z",
    activity: [
      {
        id: "sample-quote-activity-1",
        label: "Quote request submitted",
        detail: "Customer requested delivery pricing and lead time.",
        createdAt: "2026-05-14T16:00:00.000Z"
      }
    ]
  },
  {
    id: "sample-quote-2",
    orderNumber: "Quote-10041",
    userId: "sample",
    customerName: "Dana Price",
    companyName: "Valley Gate Co.",
    email: "estimating@example.com",
    phone: "555-0162",
    items: [
      {
        productId: "square-tube-2",
        variantId: "square-tube-2-11ga",
        title: "2 in square tubing, 11 ga",
        sku: "TUBE-SQ-2-11GA",
        image: "/assets/logo.svg",
        price: 52,
        quantity: 24,
        quantityNeeded: 24,
        quantityPulled: 0,
        pulled: false,
        pickNotes: "",
        options: { material: "Steel", length: "20 ft" }
      }
    ],
    fulfillmentMethod: "pickup",
    requestedDate: "2026-05-16",
    requestedWindow: "1:00 PM - 3:00 PM",
    jobName: "Repeat driveway gate stock",
    jobsiteAddress: {
      name: "Dana Price",
      company: "Valley Gate Co.",
      email: "estimating@example.com",
      phone: "555-0162",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      notes: "Repeat contractor pricing from last month if available."
    },
    drawings: [],
    pickupContact: "Dana Price",
    subtotal: 1248,
    tax: 0,
    deliveryFee: 0,
    total: 1248,
    status: "draft",
    paymentStatus: "unpaid",
    isQuoteRequest: true,
    createdAt: "2026-05-13T17:20:00.000Z",
    updatedAt: "2026-05-13T17:20:00.000Z",
    activity: [
      {
        id: "sample-quote-activity-2",
        label: "Counter quote started",
        detail: "Sales counter started quote from repeat material list.",
        createdAt: "2026-05-13T17:20:00.000Z"
      }
    ]
  }
];

const quoteStatusStyles: Record<OrderRecord["status"], string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-800",
  submitted: "border-slate-300 bg-slate-100 text-slate-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-800",
  picking: "border-indigo-200 bg-indigo-50 text-indigo-800",
  ready_for_pickup: "border-emerald-200 bg-emerald-50 text-emerald-800",
  out_for_delivery: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700"
};

const quoteStatusLabel: Record<OrderRecord["status"], string> = {
  draft: "Draft",
  submitted: "Submitted",
  confirmed: "Approved",
  picking: "Converted",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

function formatDate(value: string) {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatVariantSummary(variant?: ProductVariant) {
  if (!variant) return "";
  return Object.entries(variant.options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function getCatalogProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId);
}

function getCatalogVariant(product: Product, variantId: string) {
  return product.variants.find((variant) => variant.id === variantId);
}

function normalizeProductSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeProductQuery(value: string) {
  return normalizeProductSearchText(value).split(" ").filter(Boolean);
}

function getProductSearchBlob(product: Product) {
  const variantBits = product.variants.flatMap((variant) => [
    variant.sku,
    variant.options.material,
    variant.options.finish,
    variant.options.length,
    variant.options.color
  ]);
  return normalizeProductSearchText(
    `${product.title} ${product.category?.name || ""} ${variantBits.join(" ")}`
  );
}

function scoreCatalogMatch(product: Product, normalizedQuery: string, queryTokens: string[]) {
  const titleNormalized = normalizeProductSearchText(product.title);
  const blobNormalized = getProductSearchBlob(product);
  const skuMatch = product.variants.some((variant) =>
    normalizeProductSearchText(variant.sku).includes(normalizedQuery)
  );

  if (normalizedQuery && titleNormalized === normalizedQuery) return 1000;
  if (skuMatch) return 700;
  if (normalizedQuery && titleNormalized.includes(normalizedQuery)) return 500;

  if (!queryTokens.length) return 0;
  const tokenMatches = queryTokens.filter((token) => blobNormalized.includes(token)).length;
  if (tokenMatches === 0) return 0;
  return tokenMatches + (queryTokens.every((token) => blobNormalized.includes(token)) ? 50 : 0);
}

function findBestCatalogMatch(catalogItems: Product[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query);
  if (!normalizedQuery) return null;
  const queryTokens = tokenizeProductQuery(normalizedQuery);
  let best: { score: number; product: Product } | null = null;

  for (const product of catalogItems) {
    const score = scoreCatalogMatch(product, normalizedQuery, queryTokens);
    if (!score) continue;
    if (!best || score > best.score) {
      best = { score, product };
      if (score >= 1000) break;
    }
  }
  return best;
}

function findQuickAddCatalogMatches(catalogItems: Product[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query);
  const queryTokens = tokenizeProductQuery(normalizedQuery);

  if (!normalizedQuery) {
    return catalogItems.map((product) => ({ product, score: 0 }));
  }

  return catalogItems
    .map((product) => ({ product, score: scoreCatalogMatch(product, normalizedQuery, queryTokens) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.product.title.localeCompare(right.product.title);
    });
}

function unitFromVariant(variant: ProductVariant | undefined) {
  if (!variant) return "EA";
  if (variant.options.length && variant.options.length !== "Standard") return "FT";
  if (variant.options.material?.toLowerCase() === "sets") return "SET";
  return "EA";
}

function makeDraftLine(overrides?: Partial<CartItem>) {
  return {
    productId: `manual-${Date.now()}`,
    variantId: `manual-variant-${Date.now() + 1}`,
    title: "",
    sku: "",
    image: "/assets/logo.svg",
    price: 0,
    quantity: 1,
    quantityNeeded: 1,
    quantityPulled: 0,
    pulled: false,
    pickNotes: "",
    ...overrides,
    options: { unit: "EA", ...(overrides?.options || {}) }
  };
}

function getQuoteSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
}

function isValidQuote(quote: OrderRecord | null): quote is OrderRecord {
  return Boolean(quote);
}

function parseTemporaryOrderTimestamp(value: string) {
  const match = /^order-(\d{12,})$/i.exec(value);
  if (!match) return null;
  const timestamp = Number(match[1]);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function findQuoteByTemporaryTimestamp(orders: OrderRecord[], temporaryId: string) {
  const timestamp = parseTemporaryOrderTimestamp(temporaryId);
  if (!timestamp) return null;

  const matches = orders
    .filter((order) => order.isQuoteRequest)
    .map((order) => ({
      order,
      distance: Math.abs(new Date(order.createdAt).getTime() - timestamp)
    }))
    .filter((entry) => Number.isFinite(entry.distance) && entry.distance <= 15 * 60 * 1000)
    .sort((left, right) => left.distance - right.distance);

  return matches[0]?.order || null;
}

export function QuoteDetailPage({
  quoteId,
  backHref,
  catalogProducts: externalCatalogProducts
}: QuoteDetailPageProps) {
  const catalogItems = externalCatalogProducts?.length
    ? externalCatalogProducts
    : fallbackCatalogProducts;

  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const upsertOrder = useOrderStore((state) => state.upsertOrder);

  const [backendNotice, setBackendNotice] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [quickAddProductQuery, setQuickAddProductQuery] = useState("");
  const [quickAddProductId, setQuickAddProductId] = useState("");
  const [quickAddVariantId, setQuickAddVariantId] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState("1");
  const [quickAddUnit, setQuickAddUnit] = useState("EA");
  const [quickAddPrice, setQuickAddPrice] = useState("0");

  const [internalNotes, setInternalNotes] = useState(
    "Track stock availability before saving this quote to customer."
  );

  const normalizedQuoteId = useMemo(() => {
    try {
      return decodeURIComponent(quoteId);
    } catch {
      return quoteId;
    }
  }, [quoteId]);
  const [remoteMatchedQuote, setRemoteMatchedQuote] = useState<OrderRecord | null>(null);
  const [isResolvingQuote, setIsResolvingQuote] = useState(true);

  const quote = useMemo(() => {
    const matched =
      storedOrders.find((item) => item.id === normalizedQuoteId || item.orderNumber === normalizedQuoteId) ||
      storedOrders.find(
        (item) => item.id === quoteId || item.orderNumber === quoteId
      ) ||
      remoteMatchedQuote;

    if (matched) return matched;

    return (
      sampleQuoteFallbacks.find(
        (item) => item.id === normalizedQuoteId || item.orderNumber === normalizedQuoteId
      ) ||
      sampleQuoteFallbacks.find(
        (item) => item.id === quoteId || item.orderNumber === quoteId
      ) ||
      null
    );
  }, [normalizedQuoteId, quoteId, storedOrders, remoteMatchedQuote]);

  useEffect(() => {
    async function loadQuotes() {
      try {
        const exactResponse = await fetch(
          `/api/orders?limit=1&orderId=${encodeURIComponent(normalizedQuoteId)}&includeItems=true`
        );

        const exactPayload = (await exactResponse.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
          reason?: string;
        };

        if (exactResponse.ok && exactPayload.persisted) {
          const nextOrders = exactPayload.orders || [];
          setOrders(nextOrders);
          const directMatch = nextOrders.find(
            (item) => item.id === normalizedQuoteId || item.orderNumber === normalizedQuoteId
          );

          if (directMatch) {
            setRemoteMatchedQuote(directMatch);
            setBackendNotice("");
            return;
          }
        }

        const exactByNumberResponse = await fetch(
          `/api/orders?limit=1&orderNumber=${encodeURIComponent(normalizedQuoteId)}&includeItems=true`
        );

        if (exactByNumberResponse.ok) {
          const exactByNumberPayload = (await exactByNumberResponse.json()) as {
            orders?: OrderRecord[];
            persisted?: boolean;
            reason?: string;
          };
          const numberMatched = (exactByNumberPayload.orders || []).find(
            (item) => item.id === normalizedQuoteId || item.orderNumber === normalizedQuoteId
          );
          if (numberMatched) {
            setRemoteMatchedQuote(numberMatched);
            setBackendNotice("");
            setOrders(exactByNumberPayload.orders || []);
            return;
          }
        }

        const response = await fetch("/api/orders?limit=250&includeItems=true");
        if (!response.ok) {
          setBackendNotice("Unable to load quotes from backend right now.");
          setRemoteMatchedQuote(null);
          return;
        }

        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
          reason?: string;
        };

        if (payload.persisted && payload.orders) {
          setOrders(payload.orders);
          const backendMatch = payload.orders.find(
            (item) => item.id === normalizedQuoteId || item.orderNumber === normalizedQuoteId
          ) || findQuoteByTemporaryTimestamp(payload.orders, normalizedQuoteId);
          setRemoteMatchedQuote(backendMatch || null);
          setBackendNotice("");
        } else {
          setBackendNotice(
            payload.reason || "Supabase not connected. Quote changes are saved in the local workspace."
          );
          setRemoteMatchedQuote(null);
        }
      } catch (error) {
        setBackendNotice(
          error instanceof Error && error.message
            ? error.message
            : "Unable to load quote from backend right now."
        );
        setRemoteMatchedQuote(null);
      } finally {
        setIsResolvingQuote(false);
      }
    }

    setIsResolvingQuote(true);
    void loadQuotes();
  }, [normalizedQuoteId, setOrders]);

  const filteredCatalogProducts = useMemo(() => {
    return quickAddProductQuery.trim()
      ? findQuickAddCatalogMatches(catalogItems, quickAddProductQuery).map(
          (entry) => entry.product
        )
      : [...catalogItems].sort((left, right) => left.title.localeCompare(right.title));
  }, [catalogItems, quickAddProductQuery]);

  const activeCatalogProduct = useMemo(() => {
    if (quickAddProductId) return getCatalogProduct(catalogItems, quickAddProductId);
    const normalized = normalizeProductSearchText(quickAddProductQuery);
    if (!normalized) return null;
    return findBestCatalogMatch(catalogItems, quickAddProductQuery)?.product || null;
  }, [catalogItems, quickAddProductId, quickAddProductQuery]);

  const availableVariants = activeCatalogProduct?.variants || [];
  const activeCatalogVariant = useMemo(() => {
    if (!activeCatalogProduct) return null;
    return getCatalogVariant(activeCatalogProduct, quickAddVariantId) || activeCatalogProduct.variants[0] || null;
  }, [activeCatalogProduct, quickAddVariantId]);

  useEffect(() => {
    if (!activeCatalogProduct || !activeCatalogProduct.variants.length) return;
    const isMissing = !activeCatalogProduct.variants.some(
      (variant) => variant.id === quickAddVariantId
    );
    if (!isMissing) return;
    const fallbackVariant = activeCatalogProduct.variants[0];
    setQuickAddVariantId(fallbackVariant?.id || "");
    setQuickAddPrice((fallbackVariant?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(fallbackVariant));
  }, [activeCatalogProduct, quickAddVariantId]);

  useEffect(() => {
    const normalized = quickAddProductQuery.trim().toLowerCase();
    if (!normalized || quickAddProductId) return;
    const fallbackProduct = filteredCatalogProducts[0];
    if (!fallbackProduct) {
      setQuickAddProductId("");
      setQuickAddVariantId("");
      setQuickAddPrice("0");
      setQuickAddUnit("EA");
      return;
    }
    setQuickAddProductId(fallbackProduct.id);
    setQuickAddVariantId(fallbackProduct.variants[0]?.id || "");
    setQuickAddPrice((fallbackProduct.variants[0]?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(fallbackProduct.variants[0]));
  }, [quickAddProductId, quickAddProductQuery, filteredCatalogProducts]);

  function setProductBySearch(value: string) {
    setQuickAddProductQuery(value);
    const bestMatch = findBestCatalogMatch(catalogItems, value);
    if (!bestMatch) {
      setQuickAddProductId("");
      setQuickAddVariantId("");
      setQuickAddPrice("0");
      setQuickAddUnit("EA");
      return;
    }
    const nextProduct = bestMatch.product;
    setQuickAddProductId(nextProduct.id);
    setQuickAddVariantId(nextProduct.variants[0]?.id || "");
    setQuickAddPrice((nextProduct.variants[0]?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(nextProduct.variants[0]));
  }

  function selectQuickAddProduct(product: Product | null) {
    if (!product) {
      setQuickAddProductId("");
      setQuickAddVariantId("");
      setQuickAddPrice("0");
      setQuickAddUnit("EA");
      return;
    }

    setQuickAddProductId(product.id);
    setQuickAddProductQuery(product.title);
    const nextVariant = product.variants[0];
    setQuickAddVariantId(nextVariant?.id || "");
    setQuickAddPrice((nextVariant?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(nextVariant));
  }

  function clearQuickAddForm() {
    setQuickAddProductQuery("");
    setQuickAddProductId("");
    setQuickAddVariantId("");
    setQuickAddQuantity("1");
    setQuickAddUnit("EA");
    setQuickAddPrice("0");
  }

  function getQuickAddStatusNote() {
    if (!quickAddProductQuery.trim()) {
      return "Search or choose a catalog product to load live pricing.";
    }
    if (!activeCatalogProduct) return "No matching catalog product found.";
    if (!activeCatalogVariant) return "Select a variant to load pricing.";
    return "";
  }

  function addCatalogItemToQuote() {
    if (!isValidQuote(quote)) {
      setActionNotice("Quote not loaded.");
      return;
    }

    const product = activeCatalogProduct;
    const variant = activeCatalogVariant;
    if (!product) {
      setActionNotice("Select a real catalog product before adding.");
      return;
    }
    if (!variant) {
      setActionNotice("Select a product variant before adding.");
      return;
    }

    const quantityValue = Number.parseFloat(quickAddQuantity);
    const priceValue = Number.parseFloat(quickAddPrice);
    const addedQuantity = Number.isFinite(quantityValue) ? Math.max(0, quantityValue) : 1;
    const addedPrice = Number.isFinite(priceValue) ? Math.max(0, priceValue) : 0;
    const variantSummary = formatVariantSummary(variant);

    const nextItem = makeDraftLine({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      sku: variant.sku,
      image: variant.image,
      quantity: addedQuantity,
      quantityNeeded: addedQuantity,
      price: addedPrice,
      options: {
        ...variant.options,
        length: variantSummary || quickAddUnit || "default"
      },
      pickNotes: ""
    });

    const nextItems = [...quote.items, nextItem];
    const subtotal = getQuoteSubtotal(nextItems);
    const deliveryFee =
      quote.fulfillmentMethod === "delivery" && subtotal < 500 ? 85 : quote.deliveryFee;
    const tax = quote.status === "confirmed" ? subtotal * taxRate : 0;
    const nextTotal = subtotal + tax + deliveryFee;

    const updatedQuote: OrderRecord = {
      ...quote,
      items: nextItems,
      subtotal,
      tax,
      deliveryFee,
      total: nextTotal,
      jobsiteAddress: {
        ...quote.jobsiteAddress,
        notes: internalNotes || quote.jobsiteAddress.notes
      },
      activity: [
        {
          id: `quote-item-${Date.now()}`,
          label: "Quote item added",
          detail: `${product.title} added to quote.`,
          createdAt: new Date().toISOString()
        },
        ...quote.activity
      ],
      updatedAt: new Date().toISOString()
    };

    upsertOrder(updatedQuote);
    clearQuickAddForm();
    setActionNotice(`Added ${product.title} to ${quote.orderNumber}.`);

    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: quote.id,
        status: quote.status,
        items: nextItems,
        subtotal,
        tax,
        deliveryFee,
        total: nextTotal
      })
    })
      .then((response) => response.json())
      .then(
        (payload: { persisted?: boolean; reason?: string }) =>
          !payload.persisted &&
          setBackendNotice(
            payload.reason ||
              "Supabase is not configured. Quote line items are saved in the local workspace."
          )
      )
      .catch(() =>
        setBackendNotice("Quote line item changes are stored locally until backend sync is connected.")
      );
  }

  if (!isValidQuote(quote)) {
    if (isResolvingQuote) {
      return (
        <PageShell description="Loading quote workspace" eyebrow="Gateworks Operations" title="Quote">
          <Card>
            <CardBody>
              <p className="text-sm text-industrial-steel">
                Loading {quoteId} from local and backend workspace...
              </p>
            </CardBody>
          </Card>
        </PageShell>
      );
    }

    return (
      <PageShell description="Quote detail not found yet" eyebrow="Gateworks Operations" title="Quote">
        <Card>
          <CardBody>
            <div className="grid gap-4">
              <p className="text-sm text-industrial-steel">
                Quote <strong>{quoteId}</strong> is not loaded in this workspace yet.
              </p>
              <Link
                className="inline-flex h-10 w-fit items-center justify-center gap-2 border border-industrial-ink bg-industrial-ink px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
                href={backHref}
              >
                <ArrowLeft size={15} />
                Back to quotes
              </Link>
            </div>
          </CardBody>
        </Card>
      </PageShell>
    );
  }

  const lineItems = quote.items;
  const subtotal = getQuoteSubtotal(lineItems);
  const deliveryFee = quote.fulfillmentMethod === "delivery" && subtotal < 500 ? 85 : quote.deliveryFee;
  const tax = quote.status === "confirmed" ? subtotal * taxRate : quote.tax;
  const total = subtotal + tax + deliveryFee;
  const quickAddVariantLabel = formatVariantSummary(activeCatalogVariant || undefined);

  return (
    <PageShell
      description="Operational quote workspace"
      eyebrow="Gateworks Operations"
      title={`Quote ${quote.orderNumber}`}
      actions={
        <Link
          className="inline-flex h-10 items-center gap-2 border border-industrial-ink px-4 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink"
          href={backHref}
        >
          <ArrowLeft size={15} />
          Back to quotes
        </Link>
      }
    >
      <div className="grid gap-5">
        {actionNotice ? (
          <div className="border border-industrial-pine bg-industrial-paper p-3 text-sm font-black text-industrial-pine">
            {actionNotice}
          </div>
        ) : null}

        {backendNotice ? (
          <div className="border border-amber-700 bg-amber-50 p-3 text-sm font-black text-amber-900">
            Backend notice: {backendNotice}
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex-wrap">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                {quote.orderNumber}
              </p>
              <h2 className="text-2xl font-black text-industrial-ink">
                {quote.jobName || quote.customerName}
              </h2>
              <p className="text-sm text-industrial-steel">
                {quote.companyName || quote.customerName} · {quote.email} · {quote.phone}
              </p>
            </div>
            <span
              className={`inline-flex border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${quoteStatusStyles[quote.status]}`}
            >
              {quoteStatusLabel[quote.status]}
            </span>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Requested
              </p>
              <p className="mt-1 text-sm font-black text-industrial-ink">
                {formatDate(quote.requestedDate)} · {quote.requestedWindow}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Fulfillment
              </p>
              <p className="mt-1 text-sm font-black capitalize text-industrial-ink">
                {quote.fulfillmentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Payment status
              </p>
              <p className="mt-1 text-sm font-black text-industrial-ink">
                {quote.paymentStatus}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Total
              </p>
              <p className="mt-1 text-lg font-black text-industrial-ink">
                {formatCurrency(total)}
              </p>
            </div>
          </CardBody>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PackagePlus size={18} />
                <h3 className="text-lg font-black text-industrial-ink">Line items</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid gap-2 border-b border-industrial-rail pb-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  Add from catalog
                </p>
                <div className="grid gap-2 md:grid-cols-[1.6fr_1.3fr_1fr_100px_110px_120px_auto]">
                  <Input
                    list="quote-product-suggestions"
                    placeholder="Search product name or SKU"
                    value={quickAddProductQuery}
                    onChange={(event) => setProductBySearch(event.target.value)}
                  />
                  <Select
                    onChange={(event) => selectQuickAddProduct(getCatalogProduct(catalogItems, event.target.value) || null)}
                    value={quickAddProductId}
                  >
                    <option value="">Select product</option>
                    {filteredCatalogProducts.slice(0, 160).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label="Catalog variant"
                    onChange={(event) => {
                      const variant = activeCatalogProduct
                        ? getCatalogVariant(activeCatalogProduct, event.target.value)
                        : undefined;
                      setQuickAddVariantId(event.target.value);
                      setQuickAddPrice((variant?.price || 0).toFixed(2));
                      setQuickAddUnit(unitFromVariant(variant || undefined));
                    }}
                    disabled={!activeCatalogProduct}
                    value={quickAddVariantId}
                  >
                    <option value="">{activeCatalogProduct ? "Select variant" : "Select product first"}</option>
                    {availableVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku} · {formatVariantSummary(variant)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    inputMode="decimal"
                    placeholder="Qty"
                    value={quickAddQuantity}
                    onChange={(event) => setQuickAddQuantity(event.target.value)}
                  />
                  <Select
                    aria-label="Unit"
                    onChange={(event) => setQuickAddUnit(event.target.value)}
                    value={quickAddUnit}
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                  <Input
                    inputMode="decimal"
                    placeholder="Unit price"
                    value={quickAddPrice}
                    onChange={(event) => setQuickAddPrice(event.target.value)}
                  />
                  <Button onClick={addCatalogItemToQuote} type="button">
                    <Plus size={14} />
                    Add product
                  </Button>
                </div>
                <p className="text-xs text-industrial-muted">
                  {quickAddProductQuery || activeCatalogProduct ? (
                    getQuickAddStatusNote() || `Using: ${quickAddVariantLabel || "Product variant"}`
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <AlertCircle size={12} />
                      Start typing to search catalog products.
                    </span>
                  )}
                </p>
                <datalist id="quote-product-suggestions">
                  {filteredCatalogProducts.slice(0, 200).map((product) => (
                    <option key={product.id} value={product.title} />
                  ))}
                  {filteredCatalogProducts.flatMap((product) =>
                    product.variants
                      .filter((variant) => variant.sku)
                      .map((variant) => (
                        <option key={`${product.id}-${variant.id}`} value={variant.sku} />
                      ))
                  )}
                </datalist>
              </div>

              <div className="overflow-x-auto">
                <table className="mt-4 w-full min-w-[1200px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-industrial-rail bg-white">
                    <tr>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Product</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Size / Variant</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Quantity</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Unit</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Unit Price</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length ? (
                      lineItems.map((item) => (
                        <tr className="border-b border-industrial-rail/70" key={item.orderItemId || `${item.productId}-${item.variantId}`}>
                          <td className="px-3 py-3">
                            <p className="font-black text-industrial-ink">{item.title}</p>
                            <p className="text-xs text-industrial-steel">{item.sku}</p>
                          </td>
                          <td className="px-3 py-3 text-industrial-steel">
                            {Object.entries(item.options || {})
                              .filter(([, value]) => Boolean(value))
                              .map((entry) => entry[1])
                              .join(" · ") || "Standard"}
                          </td>
                          <td className="px-3 py-3 text-industrial-steel">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-industrial-steel">
                            {(item.options as Record<string, string | undefined> | undefined)?.unit || "EA"}
                          </td>
                          <td className="px-3 py-3 text-industrial-steel">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-3 py-3 font-black text-industrial-ink">
                            {formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-3 py-6 text-sm text-industrial-steel" colSpan={6}>
                          No products added yet. Use the form above to add catalog products.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <div className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <h3 className="text-lg font-black text-industrial-ink">Quote summary</h3>
                </div>
              </CardHeader>
              <CardBody className="grid gap-3 text-sm">
                <div className="flex justify-between text-industrial-steel">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="flex justify-between text-industrial-steel">
                  <span>Delivery</span>
                  <strong>{formatCurrency(deliveryFee)}</strong>
                </div>
                <div className="flex justify-between text-industrial-steel">
                  <span>Tax</span>
                  <strong>{quote.status === "confirmed" ? formatCurrency(tax) : "Pending"}</strong>
                </div>
                <div className="border-t border-industrial-rail pt-3 text-lg font-black text-industrial-ink">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <strong>{formatCurrency(total)}</strong>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} />
                  <h3 className="text-lg font-black text-industrial-ink">Job / Delivery</h3>
                </div>
              </CardHeader>
              <CardBody className="grid gap-3 text-sm">
                <p className="font-black text-industrial-ink">{quote.jobName || "Customer project"}</p>
                <p className="text-industrial-steel">
                  {quote.jobsiteAddress.addressLine1}
                  {quote.jobsiteAddress.addressLine2
                    ? `, ${quote.jobsiteAddress.addressLine2}`
                    : null}
                </p>
                <p className="text-industrial-steel">
                  {[quote.jobsiteAddress.city, quote.jobsiteAddress.state, quote.jobsiteAddress.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <div className="grid gap-2 pt-2">
                  <Truck size={15} />
                  <Textarea
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                  />
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
