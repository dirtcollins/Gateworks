"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  CircleDashed,
  CreditCard,
  FileText,
  Package,
  Printer,
  RefreshCw,
  Trash2,
  UserPlus,
  X,
  Truck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderProgressBar } from "@/components/order-progress";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { useOrderStore, type OrderPayment, type OrderRecord } from "@/lib/order-store";
import { getPaymentStatusTone } from "@/lib/order-status";
import { useUserStore, type SavedUser } from "@/lib/user-store";
import type { CartItem, Product, ProductVariant } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { type FulfillmentMethod, type OrderStatus, type PaymentStatus } from "@/lib/platform-backend";
import { customerDirectory, type CustomerRecord } from "@/lib/customers";

type OrderDetailPageProps = {
  orderId: string;
  backHref: string;
  createMode?: boolean;
  catalogProducts?: Product[];
};

type OrderItemView = {
  key: string;
  image: string;
  product: string;
  variant: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  stockStatus: string;
  pulledStatus: string;
  pulledQuantity: number;
  totalQuantity: number;
};

type DraftDiscountMode = "amount" | "percent";
type CustomerPopupTab = "customer" | "billing" | "shipping" | "more";

type VariantOptionKey = keyof ProductVariant["options"];

type PullMap = Record<string, { pulled: boolean; pulledQuantity: number }>;
type DraftNote = {
  id: string;
  text: string;
  createdAt: string;
};

type SiteUserClient = {
  id: string;
  displayName: string;
  lastUsedAt?: string;
};

const staffRoster = ["Maya Ortiz", "Cody Lee", "Jordan Blake", "Priya Mehta"];

const TAX_RATE = 0.0825;
const unitOptions = ["EA", "FT", "SET", "ROLL", "BOX", "PCS"];
const paymentMethodOptions = [
  "Cash",
  "Check",
  "Credit Card",
  "Debit Card",
  "ACH",
  "Wire Transfer",
  "Financing",
  "Other"
] as const;

function getProductImageUrl(product: Product, variant?: ProductVariant | null) {
  return (
    variant?.image ||
    product.images?.[0]?.sizes?.thumb ||
    product.images?.[0]?.url ||
    ""
  );
}

function isProductImageUrl(value?: string) {
  return Boolean(value && value !== "/assets/logo.svg");
}

function getCatalogSearchResultKey(result: CatalogSearchResult) {
  return `${result.product.id}-${result.variant.id}`;
}

function makeShopperCustomer(user: SavedUser): CustomerRecord {
  return {
    id: `shopper-${user.id}`,
    name: user.displayName,
    company: user.displayName,
    email: user.email,
    phone: "",
    billingAddress: "Add billing address",
    jobsiteAddress: "Add jobsite or delivery address",
    terms: "Due on receipt"
  };
}

function makeSiteUserCustomer(user: SiteUserClient): CustomerRecord {
  return {
    id: `site-user-${user.id}`,
    name: user.displayName,
    company: user.displayName,
    email: "",
    phone: "",
    billingAddress: "Add billing address",
    jobsiteAddress: "Add jobsite or delivery address",
    terms: "Due on receipt"
  };
}

function mergeCustomerRecords(customers: CustomerRecord[]) {
  const customersByKey = new Map<string, CustomerRecord>();

  for (const customer of customers) {
    const key = customer.email
      ? `email:${customer.email.toLowerCase()}`
      : `id:${customer.id}`;

    if (!customersByKey.has(key)) {
      customersByKey.set(key, customer);
    }
  }

  return Array.from(customersByKey.values());
}

type CatalogSearchResult = {
  product: Product;
  variant: ProductVariant;
  score: number;
};

const fulfillmentLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Draft queue",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

const statusLabel: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Processing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overpaid: "Overpaid",
  refunded: "Refunded",
  failed: "Failed"
};

type PopupId = "customer" | "billing" | "delivery" | "payment" | "product" | "notes";

type ModalSnapshot = {
  customerName: string;
  customerCompanyName: string;
  customerEmail: string;
  customerPhone: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  deliveryFulfillmentMethod: FulfillmentMethod;
  deliveryDate: string;
  deliveryWindow: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZip: string;
  deliveryNotes: string;
};

type AppModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
  isDirty?: () => boolean;
  focusReturnRef?: RefObject<HTMLElement | null>;
  initialFocusSelector?: string;
};

function AppModal({
  open,
  title,
  onClose,
  onConfirm,
  onCancel,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  children,
  isDirty,
  focusReturnRef,
  initialFocusSelector
}: AppModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  const isDirtyRef = useRef(isDirty);
  const focusReturnRefCurrent = focusReturnRef;

  onCloseRef.current = onClose;
  onCancelRef.current = onCancel;
  onConfirmRef.current = onConfirm;
  isDirtyRef.current = isDirty;

  function requestClose() {
    if (isDirtyRef.current?.() && !window.confirm("You have unsaved changes. Close this popup without saving?")) {
      return;
    }

    onCloseRef.current();
    onCancelRef.current?.();
  }

  useEffect(() => {
    if (!open) {
      didAutoFocusRef.current = false;
      return;
    }

    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const modal = modalRef.current;
    if (!modal) return;

    const focusFrame = requestAnimationFrame(() => {
      const focusTarget =
        (initialFocusSelector ? modal.querySelector<HTMLElement>(initialFocusSelector) : null)
        || modal.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
      focusTarget?.focus();
    });

    return () => {
      cancelAnimationFrame(focusFrame);
    };
  }, [open, initialFocusSelector]);

  useEffect(() => {
    if (!open) return;

    function getFocusableElements() {
      if (!modalRef.current) return [];
      const elements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(elements).filter((element) => !element.hasAttribute("disabled"));
    }

    function handleModalKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      const target = event.target as HTMLElement | null;
      if (event.key === "Enter") {
        if (target?.tagName === "TEXTAREA" && !event.shiftKey) {
          event.preventDefault();
          return;
        }
        if (target?.tagName === "TEXTAREA" && event.shiftKey) {
          return;
        }

        event.preventDefault();
        onConfirmRef.current();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.addEventListener("keydown", handleModalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleModalKeyDown);
      const restoreTarget = focusReturnRefCurrent?.current || previousActiveElementRef.current;
      restoreTarget?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30"
        onClick={requestClose}
        type="button"
      />
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-black/10 bg-[#f7f7f4] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-4">
          <p className="text-2xl font-semibold tracking-[-0.03em] text-industrial-ink">{title}</p>
          <button
            aria-label="Close popup"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-industrial-muted hover:text-industrial-ink hover:bg-industrial-paper"
            onClick={requestClose}
            type="button"
          >
            <X size={28} strokeWidth={1.6} />
          </button>
        </div>
        <div className="h-[620px] overflow-y-auto px-6 py-6">{children}</div>
        <div className="flex justify-end gap-3 border-t border-black/10 bg-white px-6 py-4">
          <Button className="min-w-32" onClick={requestClose} size="sm" variant="secondary" type="button">
            {cancelLabel}
          </Button>
          <Button className="min-w-32" onClick={() => onConfirmRef.current()} size="sm" type="button">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

const sampleOrder: OrderRecord = {
  id: "sample-order-2001",
  orderNumber: "Order-10021",
  userId: "sample",
  customerName: "Jessie Metal Supply",
  companyName: "Jessie Metal Supply",
  email: "orders@example.com",
  phone: "555-0101",
  items: [
    {
      orderItemId: "order-item-square-tube",
      productId: "prod-square-tube",
      variantId: "var-square-tube-2x4",
      title: "Square tubing",
      sku: "SQ-TUBE-2X4",
      image: "/assets/product-images/50-tca3s3-p.png",
      price: 48.5,
      quantity: 10,
      quantityNeeded: 10,
      quantityPulled: 6,
      pulled: false,
      options: { length: "2 x 4 x 1/8", material: "ASTM A500" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-rect-tube",
      productId: "prod-rect-tube",
      variantId: "var-rect-tube",
      title: "Rectangle tubing",
      sku: "RECT-TUBE-2X3",
      image: "/assets/product-images/49-tca3l2s3-p.png",
      price: 62.0,
      quantity: 6,
      quantityNeeded: 6,
      quantityPulled: 2,
      pulled: false,
      options: { length: "2 x 3 x 1/4", material: "ASTM A500" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-sheet-metal",
      productId: "prod-sheet-metal",
      variantId: "var-sheet",
      title: "Sheet metal",
      sku: "SH-MTL-14GA",
      image: "/assets/product-images/48-tca2s3-p.png",
      price: 95,
      quantity: 4,
      quantityNeeded: 4,
      quantityPulled: 4,
      pulled: true,
      options: { length: "4 x 8", material: "14-ga steel", finish: "powder" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-hinge",
      productId: "prod-hinges",
      variantId: "var-hinges",
      title: "Heavy gate hinges",
      sku: "HNG-16",
      image: "/assets/product-images/03-ml3tp-p.png",
      price: 18.4,
      quantity: 18,
      quantityNeeded: 18,
      quantityPulled: 7,
      pulled: false,
      options: { length: "6 in", material: "steel", finish: "black" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-latch",
      productId: "prod-latches",
      variantId: "var-latch",
      title: "Latches",
      sku: "LCT-12",
      image: "/assets/product-images/21-6149-latch.png",
      price: 9.75,
      quantity: 32,
      quantityNeeded: 32,
      quantityPulled: 12,
      pulled: false,
      options: { length: "12 in", material: "stainless steel" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-cap",
      productId: "prod-post-cap",
      variantId: "var-cap",
      title: "Post caps",
      sku: "CAP-20",
      image: "/assets/product-images/43-7403.png",
      price: 12.25,
      quantity: 12,
      quantityNeeded: 12,
      quantityPulled: 12,
      pulled: true,
      options: { length: "2 in", material: "cast aluminum" },
      pickNotes: ""
    },
    {
      orderItemId: "order-item-hardware",
      productId: "prod-gate-hardware",
      variantId: "var-hardware",
      title: "Gate hardware set",
      sku: "GH-40",
      image: "/assets/product-images/16-lakqu2-kit.png",
      price: 24.6,
      quantity: 8,
      quantityNeeded: 8,
      quantityPulled: 0,
      pulled: false,
      options: { length: "set", material: "stainless steel" },
      pickNotes: ""
    }
  ],
  fulfillmentMethod: "delivery",
  requestedDate: "2026-05-15",
  requestedWindow: "9:00 AM - 12:00 PM",
  jobName: "North yard gate rebuild",
  jobsiteAddress: {
    name: "Jessie Metal Supply",
    company: "Jessie Metal Supply",
    email: "orders@example.com",
    phone: "555-0101",
    addressLine1: "1200 Industrial Way",
    addressLine2: "",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90001",
    notes: "Call before arrival, dock 4."
  },
  drawings: [],
  pickupContact: "Jessie dispatch",
  subtotal: 1888.7,
  tax: 157.4,
  deliveryFee: 75,
  total: 2121.1,
  status: "out_for_delivery",
  paymentStatus: "partial",
  isQuoteRequest: false,
  createdAt: "2026-05-14T08:20:00.000Z",
  updatedAt: "2026-05-14T17:10:00.000Z",
  activity: [
    {
      id: "sample-activity-1",
      label: "Order loaded",
      detail: "Order pulled from store fallback.",
      createdAt: "2026-05-14T08:20:00.000Z"
    },
    {
      id: "sample-activity-2",
      label: "Payment received",
      detail: "Partial payment posted.",
      createdAt: "2026-05-14T10:15:00.000Z"
    },
    {
      id: "sample-activity-3",
      label: "Pick ticket printed",
      detail: "Customer-facing pick ticket printed for internal staging.",
      createdAt: "2026-05-14T14:32:00.000Z"
    },
    {
      id: "sample-activity-4",
      label: "Items pulled",
      detail: "Warehousing team has partially pulled materials.",
      createdAt: "2026-05-14T15:02:00.000Z"
    },
    {
      id: "sample-activity-5",
      label: "Order marked ready",
      detail: "Out for delivery status set from admin workspace.",
      createdAt: "2026-05-14T16:03:00.000Z"
    }
  ]
};

const sampleOrders: OrderRecord[] = [sampleOrder];

function createDraftOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  const now = new Date().toISOString();
  return {
    id: `order-draft-${Date.now()}`,
    orderNumber: "Order-NEW",
    userId: "admin-user",
    customerName: "New Customer",
    companyName: "New Customer",
    email: "customer@example.com",
    phone: "555-0187",
    items: [],
    fulfillmentMethod: "delivery",
    requestedDate: now.slice(0, 10),
    requestedWindow: "12:00 PM - 2:00 PM",
    jobName: "New order",
    jobsiteAddress: {
      name: "New Customer",
      company: "New Customer",
      email: "customer@example.com",
      phone: "555-0187",
      addressLine1: "500 Main Street",
      addressLine2: "",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      notes: ""
    },
    drawings: [],
    pickupContact: "New Customer",
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0,
    status: "draft",
    paymentStatus: "unpaid",
    isQuoteRequest: false,
    createdAt: now,
    updatedAt: now,
    activity: [
      {
        id: `order-activity-${Date.now()}`,
        label: "Order started",
        detail: "Draft order opened in admin workspace.",
        createdAt: now
      }
    ],
    ...overrides
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAssignedStaff(orderId: string) {
  const seed = [...orderId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return staffRoster[seed % staffRoster.length];
}

function getOptionSummary(item: CartItem) {
  return Object.entries(item.options || {})
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function toOrderItemView(item: CartItem, pullState: PullMap): OrderItemView {
  const lineKey = item.orderItemId || `${item.productId}-${item.variantId}`;
  const state = pullState[lineKey] || {
    pulled: Boolean(item.pulled),
    pulledQuantity:
      typeof item.quantityPulled === "number" ? item.quantityPulled : Math.round(item.quantity * 0)
  };
  const pulledQuantity = state.pulled ? item.quantity : Math.max(0, state.pulledQuantity);
  const stockStatus = pulledQuantity >= item.quantity ? "In-stock stage-ready" : "Stock available";
  const pulledStatus =
    pulledQuantity >= item.quantity
      ? "Pulled"
      : state.pulled
        ? "Pulled manually"
        : `${pulledQuantity} / ${item.quantity} pulled`;
  const optionSummary = getOptionSummary(item);
  const unit = "EA";

  return {
    key: lineKey,
    image: isProductImageUrl(item.image) ? item.image : "",
    product: item.title,
    variant: optionSummary || "default",
    quantity: item.quantity,
    unit,
    unitPrice: item.price,
    lineTotal: item.price * item.quantity,
    stockStatus,
    pulledStatus,
    pulledQuantity,
    totalQuantity: item.quantity
  };
}

function toOrderItems(order: OrderRecord, pullState: PullMap): OrderItemView[] {
  return order.items.map((item) => toOrderItemView(item, pullState));
}

function formatVariantSummary(variant?: ProductVariant) {
  if (!variant) return "";

  return Object.entries(variant.options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function formatCartItemSize(options: CartItem["options"]) {
  if (!options) return "";

  return Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
}

function getVariantInventoryText(variant: ProductVariant | null) {
  const qty = variant?.inventoryQuantity;
  if (typeof qty !== "number") return "0";
  return `${qty} in stock`;
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
    `${product.title} ${product.description} ${product.category.name} ${variantBits.join(" ")}`
  );
}

function getCatalogVariantSearchBlob(product: Product, variant: ProductVariant) {
  const sizeBits = [
    variant.options.length,
    variant.options.material,
    variant.options.finish,
    variant.options.color,
    variant.options.wall
  ];

  return normalizeProductSearchText(
    `${product.title} ${product.description} ${product.category.name} ${variant.sku} ${sizeBits.join(" ")}`
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

  const allTokensMatch = queryTokens.every((token) => blobNormalized.includes(token));
  return allTokensMatch ? tokenMatches + 50 : tokenMatches;
}

function scoreCatalogVariantMatch(
  product: Product,
  variant: ProductVariant,
  normalizedQuery: string,
  queryTokens: string[]
) {
  const baseScore = scoreCatalogMatch(product, normalizedQuery, queryTokens);
  const variantBlob = getCatalogVariantSearchBlob(product, variant);

  if (!normalizedQuery) return baseScore;
  if (!variantBlob) return baseScore;

  const variantSku = normalizeProductSearchText(variant.sku);
  const variantSize = normalizeProductSearchText(variant.options.length || "");

  const exactVariantMatch = variantSku === normalizedQuery || variantSize === normalizedQuery;
  const tokenMatches = queryTokens.filter((token) => variantBlob.includes(token)).length;

  if (exactVariantMatch) return baseScore + 120 + tokenMatches;
  if (!queryTokens.length) return baseScore;

  return baseScore + tokenMatches + (tokenMatches === queryTokens.length ? 30 : 0);
}

function getCatalogProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId) || null;
}

function getCatalogVariant(product: Product, variantId: string) {
  return product.variants.find((variant) => variant.id === variantId) || null;
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

function unitFromVariant(variant: ProductVariant | undefined | null) {
  if (!variant) return "EA";
  if (variant.options.length && variant.options.length !== "Standard") return "FT";
  if (variant.options.material?.toLowerCase() === "sets") return "SET";
  return "EA";
}

function findCatalogVariantMatches(catalogItems: Product[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query);
  const queryTokens = tokenizeProductQuery(normalizedQuery);

  const withVariants = catalogItems.flatMap((product) =>
    product.variants.map((variant) => ({
      product,
      variant,
      score: scoreCatalogVariantMatch(product, variant, normalizedQuery, queryTokens)
    }))
  );

  if (!normalizedQuery) {
    return withVariants
      .map((entry) => ({ ...entry, score: entry.score || 1 }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.product.title.localeCompare(right.product.title);
      });
  }

  return withVariants
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.product.title.localeCompare(right.product.title);
    });
}

function toMoneyInputValue(value: number | string) {
  if (typeof value === "number") return Number.isFinite(value) ? value.toFixed(2) : "0.00";

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function parseMoney(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatNoteTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}

function parseOrderNotes(rawNotes: string): DraftNote[] {
  const entries = rawNotes.split("\n\n").map((entry) => entry.trim()).filter(Boolean);
  const parsed = entries
    .map((entry) => {
      const bracketMatch = entry.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
      if (bracketMatch) {
        return {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: bracketMatch[1],
          text: bracketMatch[2].trim()
        };
      }

      return {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        text: entry
      };
    })
    .filter((note) => note.text.length > 0);

  if (!parsed.length) return [];

  return parsed;
}

function formatOrderNotesForStorage(notes: DraftNote[]) {
  return notes
    .map((note) => `[${note.createdAt}] ${note.text.trim()}`)
    .filter((note) => note.length > 0)
    .join("\n\n");
}

function formatNewOrderNotes(messageOnOrder: string, deliveryNotes: string, extraNotes: DraftNote[]) {
  return [
    messageOnOrder.trim() ? `Message on order:\n${messageOnOrder.trim()}` : "",
    deliveryNotes.trim() ? `Jobsite or delivery notes:\n${deliveryNotes.trim()}` : "",
    formatOrderNotesForStorage(extraNotes)
  ]
    .filter(Boolean)
    .join("\n\n");
}

function getVariantDisplaySize(variant: ProductVariant) {
  return variant.options.length || variant.options.wall || "Standard";
}

function getVariantDisplayPrice(variant: ProductVariant) {
  return Number.isFinite(variant.price) ? variant.price : 0;
}

function makePullMap(order: OrderRecord) {
  const map: PullMap = {};
  for (const item of order.items) {
    const key = item.orderItemId || `${item.productId}-${item.variantId}`;
    map[key] = {
      pulled: Boolean(item.pulled),
      pulledQuantity:
        typeof item.quantityPulled === "number" ? item.quantityPulled : 0
    };
  }

  return map;
}

function makeDraftLine(overrides?: Partial<CartItem>) {
  const baseLine: CartItem = {
    productId: `manual-${Date.now()}`,
    variantId: `manual-variant-${Date.now() + 1}`,
    title: "",
    sku: "",
    image: "",
    price: 0,
    quantity: 1,
    quantityNeeded: 1,
    quantityPulled: 0,
    pulled: false,
    pickNotes: "",
    options: {
      ...(overrides?.options || {})
    }
  };

  return {
    ...baseLine,
    ...overrides,
    options: {
      ...baseLine.options,
      ...(overrides?.options || {})
    }
  };
}

function toStatusTimeline(order: OrderRecord) {
  const labels = new Set(order.activity.map((item) => item.label));
  const events = [...order.activity];

  const synthetic: Array<{ id: string; label: string; detail: string; createdAt: string }> = [];

  if (!labels.has("Order marked ready") && ["ready_for_pickup", "out_for_delivery", "completed"].includes(order.status)) {
    synthetic.push({
      id: `${order.id}-ready`,
      label: "Order marked ready",
      detail: "Order moved to fulfillment ready status.",
      createdAt: order.updatedAt
    });
  }

  if (!labels.has("Customer picked up") && order.status === "completed" && order.fulfillmentMethod === "pickup") {
    synthetic.push({
      id: `${order.id}-picked-up`,
      label: "Customer picked up",
      detail: "Carrier marked as picked up by customer.",
      createdAt: order.updatedAt
    });
  }

  if (!labels.has("Delivered") && order.status === "completed" && order.fulfillmentMethod === "delivery") {
    synthetic.push({
      id: `${order.id}-delivered`,
      label: "Delivered",
      detail: "Delivery completion marked by operations.",
      createdAt: order.updatedAt
    });
  }

  return [...events, ...synthetic].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );
}

export function OrderDetailPage({
  orderId,
  backHref,
  createMode = false,
  catalogProducts: externalCatalogProducts
}: OrderDetailPageProps) {
  const searchParams = useSearchParams();
  const catalogItems = externalCatalogProducts?.length
    ? externalCatalogProducts
    : fallbackCatalogProducts;
  const catalogImageBySku = useMemo(() => {
    const images = new Map<string, string>();

    for (const product of catalogItems) {
      for (const variant of product.variants) {
        const image = getProductImageUrl(product, variant);
        if (image) images.set(variant.sku, image);
      }
    }

    return images;
  }, [catalogItems]);
  const resolveOrderItemImage = (item: CartItem) =>
    isProductImageUrl(item.image) ? item.image : catalogImageBySku.get(item.sku) || "";
  const withResolvedOrderItemImages = (items: CartItem[]) =>
    items.map((item) => ({
      ...item,
      image: resolveOrderItemImage(item)
    }));
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const createOrder = useOrderStore((state) => state.createOrder);
  const upsertOrder = useOrderStore((state) => state.upsertOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((state) => state.updatePaymentStatus);
  const savedShopperAccounts = useUserStore((state) => state.savedUsers);
  const router = useRouter();
  const [backendNotice, setBackendNotice] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [isEditing, setIsEditing] = useState(createMode);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [draftItems, setDraftItems] = useState<CartItem[]>([]);
  const [draftDiscount, setDraftDiscount] = useState("0");
  const [draftDiscountMode, setDraftDiscountMode] = useState<DraftDiscountMode>("amount");
  const [draftDeliveryFee, setDraftDeliveryFee] = useState("0");
  const [draftCustomerNotes, setDraftCustomerNotes] = useState("");
  const [draftInternalNotes, setDraftInternalNotes] = useState("");
  const [customerPopupTab, setCustomerPopupTab] = useState<CustomerPopupTab>("customer");
  const [draftCustomerFirstName, setDraftCustomerFirstName] = useState("");
  const [draftCustomerLastName, setDraftCustomerLastName] = useState("");
  const [draftTaxExempt, setDraftTaxExempt] = useState(false);
  const [draftPaymentTerms, setDraftPaymentTerms] = useState("Due on receipt");
  const [sameAsBillingAddress, setSameAsBillingAddress] = useState(true);
  const [draftShippingAddress, setDraftShippingAddress] = useState("");
  const [draftShippingCity, setDraftShippingCity] = useState("");
  const [draftShippingState, setDraftShippingState] = useState("");
  const [draftShippingZip, setDraftShippingZip] = useState("");
  const [draftCustomerName, setDraftCustomerName] = useState("");
  const [draftCompanyName, setDraftCompanyName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftState, setDraftState] = useState("");
  const [draftZip, setDraftZip] = useState("");
  const [draftFulfillmentMethod, setDraftFulfillmentMethod] =
    useState<FulfillmentMethod>("delivery");
  const [draftRequestedDate, setDraftRequestedDate] = useState("");
  const [draftRequestedWindow, setDraftRequestedWindow] = useState("");
  const [draftDeliveryNotes, setDraftDeliveryNotes] = useState("");
  const [draftOrderNotes, setDraftOrderNotes] = useState<DraftNote[]>([]);
  const [draftOrderNoteInput, setDraftOrderNoteInput] = useState("");
  const [draftPaymentStatus, setDraftPaymentStatus] =
    useState<PaymentStatus>("unpaid");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [siteUserCustomers, setSiteUserCustomers] = useState<CustomerRecord[]>([]);
  const [pulledMap, setPulledMap] = useState<PullMap>({});
  const [quickAddProductQuery, setQuickAddProductQuery] = useState("");
  const [quickAddProductId, setQuickAddProductId] = useState("");
  const [quickAddVariantId, setQuickAddVariantId] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState("1");
  const [quickAddUnit, setQuickAddUnit] = useState("EA");
  const [quickAddPrice, setQuickAddPrice] = useState("0");
  const [quickAddResultIndex, setQuickAddResultIndex] = useState(0);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupId | null>(null);
  const popupTriggerRef = useRef<HTMLElement | null>(null);
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const productSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const createDraftInitializedRef = useRef(false);
  const modalSnapshotRef = useRef<ModalSnapshot>({
    customerName: "",
    customerCompanyName: "",
    customerEmail: "",
    customerPhone: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    deliveryFulfillmentMethod: "delivery",
    deliveryDate: "",
    deliveryWindow: "",
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryNotes: ""
  });

  const isCustomerPopupOpen = activePopup === "customer";
  const isBillingPopupOpen = activePopup === "billing";
  const isDeliveryPopupOpen = activePopup === "delivery";
  const isPaymentPopupOpen = activePopup === "payment";

  const availableCustomers = useMemo(
    () =>
      mergeCustomerRecords([
        ...savedShopperAccounts.map((user) => makeShopperCustomer(user)),
        ...siteUserCustomers,
        ...customerDirectory
      ]),
    [savedShopperAccounts, siteUserCustomers]
  );

  const draftOrderTemplate = useMemo(
    () => (createMode ? createDraftOrder({ id: orderId }) : null),
    [createMode, orderId]
  );
  const fallbackOrder = useMemo(
    () =>
      createMode
        ? draftOrderTemplate || sampleOrders[0]
        : {
            ...sampleOrders[0],
            id: orderId
          },
    [createMode, draftOrderTemplate, orderId]
  );
  const order = useMemo(() => {
    const resolved =
      (storedOrders.length ? storedOrders : sampleOrders).find(
        (item) => item.id === orderId || item.orderNumber === orderId
      ) || fallbackOrder;

    if (createMode && orderId !== resolved.id) {
      return fallbackOrder;
    }

    return resolved;
  }, [createMode, orderId, storedOrders, fallbackOrder]);

  useEffect(() => {
    async function loadOrders() {
      const response = await fetch("/api/orders?limit=250&includeItems=true");
      if (!response.ok) return;
      const payload = (await response.json()) as {
        orders?: typeof storedOrders;
        persisted?: boolean;
        reason?: string;
      };
      if (payload.persisted && payload.orders) {
        setOrders(payload.orders);
        setBackendNotice("");
      } else {
        setBackendNotice(
          payload.reason || "Supabase not connected. Order detail stays in local workspace."
        );
      }
    }

    void loadOrders();
  }, [setOrders]);

  useEffect(() => {
    let isMounted = true;

    async function loadSiteUsers() {
      const response = await fetch("/api/site-users");
      if (!response.ok) return;

      const payload = (await response.json()) as { users?: SiteUserClient[] };
      if (!isMounted) return;

      setSiteUserCustomers(
        (payload.users || [])
          .filter((user) => user.id && user.displayName)
          .map((user) => makeSiteUserCustomer(user))
      );
    }

    void loadSiteUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isProductSearchOpen) return;

    function closeProductSearchFromOutside(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (productSearchContainerRef.current?.contains(target)) return;
      setIsProductSearchOpen(false);
    }

    function closeProductSearchWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsProductSearchOpen(false);
      productSearchInputRef.current?.blur();
    }

    document.addEventListener("mousedown", closeProductSearchFromOutside);
    document.addEventListener("touchstart", closeProductSearchFromOutside);
    document.addEventListener("keydown", closeProductSearchWithEscape);

    return () => {
      document.removeEventListener("mousedown", closeProductSearchFromOutside);
      document.removeEventListener("touchstart", closeProductSearchFromOutside);
      document.removeEventListener("keydown", closeProductSearchWithEscape);
    };
  }, [isProductSearchOpen]);

  useEffect(() => {
    setPulledMap(makePullMap(order));
    if (!createMode && !isEditing) {
      setDraftItems(withResolvedOrderItemImages(order.items));
      setDraftCustomerNotes(order.jobsiteAddress.notes || "");
      setDraftInternalNotes("");
      setDraftOrderNotes(parseOrderNotes(order.jobsiteAddress.notes || ""));
      setDraftOrderNoteInput("");
      setDraftDiscount("0");
      setDraftDeliveryFee(String(order.deliveryFee || 0));
      setDraftCustomerName(order.customerName || "");
      setDraftCompanyName(order.companyName || "");
      setDraftEmail(order.email || "");
      setDraftPhone(order.phone || "");
      setDraftAddress(order.jobsiteAddress.addressLine1 || "");
      setDraftCity(order.jobsiteAddress.city || "");
      setDraftState(order.jobsiteAddress.state || "");
      setDraftZip(order.jobsiteAddress.postalCode || "");
      setDraftFulfillmentMethod(order.fulfillmentMethod);
      setDraftRequestedDate(order.requestedDate || "");
      setDraftRequestedWindow(order.requestedWindow || "");
      setDraftDeliveryNotes(order.jobsiteAddress.notes || "");
      setDraftPaymentStatus(order.paymentStatus || "unpaid");
    }
    if (createMode && isEditing && !createDraftInitializedRef.current) {
      createDraftInitializedRef.current = true;
      setDraftItems(withResolvedOrderItemImages(order.items));
      setDraftCustomerNotes(order.jobsiteAddress.notes || "");
      setDraftInternalNotes("");
      setDraftOrderNotes(parseOrderNotes(order.jobsiteAddress.notes || ""));
      setDraftOrderNoteInput("");
      setDraftDiscount("0");
      setDraftDeliveryFee(String(order.deliveryFee || 0));
      setDraftCustomerName(order.customerName || "");
      setDraftCompanyName(order.companyName || "");
      setDraftEmail(order.email || "");
      setDraftPhone(order.phone || "");
      setDraftAddress(order.jobsiteAddress.addressLine1 || "");
      setDraftCity(order.jobsiteAddress.city || "");
      setDraftState(order.jobsiteAddress.state || "");
      setDraftZip(order.jobsiteAddress.postalCode || "");
      setDraftFulfillmentMethod(order.fulfillmentMethod);
      setDraftRequestedDate(order.requestedDate || "");
      setDraftRequestedWindow(order.requestedWindow || "");
      setDraftDeliveryNotes(order.jobsiteAddress.notes || "");
      setDraftPaymentStatus(order.paymentStatus || "unpaid");
    }
    if (searchParams.get("edit") === "1") {
      setIsEditing(true);
    }
  }, [order, isEditing, searchParams, createMode, catalogImageBySku]);

  const hasRealData = storedOrders.some((storedOrder) => storedOrder.id === order.id);
  const filteredCatalogProducts = useMemo(() => {
    return quickAddProductQuery.trim()
      ? findQuickAddCatalogMatches(catalogItems, quickAddProductQuery).map((entry) => entry.product)
      : [...catalogItems].sort((left, right) => left.title.localeCompare(right.title));
  }, [catalogItems, quickAddProductQuery]);
  const quickAddCatalogResults = useMemo<CatalogSearchResult[]>(
    () => findCatalogVariantMatches(catalogItems, quickAddProductQuery).slice(0, 60),
    [catalogItems, quickAddProductQuery]
  );

  const quickAddHasResults = quickAddCatalogResults.length > 0;
  const productSearchResults = quickAddCatalogResults.slice(0, 10);
  const activeCatalogProduct = useMemo(() => {
    if (quickAddProductId) return getCatalogProduct(catalogItems, quickAddProductId);
    if (!quickAddProductQuery.trim()) return null;
    return findBestCatalogMatch(catalogItems, quickAddProductQuery)?.product || null;
  }, [catalogItems, quickAddProductId, quickAddProductQuery]);
  const availableVariants = activeCatalogProduct?.variants || [];
  const activeCatalogVariant = useMemo(() => {
    if (!activeCatalogProduct) return null;
    return getCatalogVariant(activeCatalogProduct, quickAddVariantId) || activeCatalogProduct.variants[0] || null;
  }, [activeCatalogProduct, quickAddVariantId]);
  const quickAddVariantLabel = formatVariantSummary(activeCatalogVariant || undefined);
  const draftSubtotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0),
    [draftItems]
  );
  const draftDeliveryCharge = parseMoney(draftDeliveryFee);
  const draftDiscountAmount = useMemo(() => {
    const parsedDiscount = parseMoney(draftDiscount);
    if (draftDiscountMode === "percent") {
      const percent = Math.min(100, Math.max(0, parsedDiscount));
      return Math.min(draftSubtotal, (draftSubtotal * percent) / 100);
    }

    return Math.min(draftSubtotal, parsedDiscount);
  }, [draftDiscount, draftDiscountMode, draftSubtotal]);
  const draftDiscountLabel = useMemo(() => {
    const parsedDiscount = parseMoney(draftDiscount);
    return draftDiscountMode === "percent" ? `Discount (${Math.min(100, Math.max(0, parsedDiscount)).toFixed(2)}%)` : "Discount";
  }, [draftDiscount, draftDiscountMode]);

  const editableLineItems = toOrderItems(order, pulledMap);
  const draftLineItems = useMemo(
    () => draftItems.map((item) => toOrderItemView(item, pulledMap)),
    [draftItems, pulledMap]
  );
  const lineItems = isEditing ? draftLineItems : editableLineItems;
  const assignedStaff = getAssignedStaff(order.id);
  const pulledQuantity = lineItems.reduce((sum, item) => sum + item.pulledQuantity, 0);
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  const remainingQuantity = totalQuantity - pulledQuantity;
  const pickTicketStatus = remainingQuantity === 0 ? "Complete" : "In progress";
  const draftTax = draftTaxExempt
    ? 0
    : createMode
      ? draftSubtotal * TAX_RATE
    : order.subtotal > 0
      ? (order.tax / order.subtotal) * draftSubtotal
      : draftSubtotal * 0.0834;
  const draftTotal = draftSubtotal + draftTax + draftDeliveryCharge - draftDiscountAmount;
  const draftOrderNotesText = useMemo(
    () => formatNewOrderNotes(draftCustomerNotes, draftDeliveryNotes, draftOrderNotes),
    [draftCustomerNotes, draftDeliveryNotes, draftOrderNotes]
  );
  const summarySubtotal = draftSubtotal;
  const summaryTax = draftTax;
  const invoiceTotal = draftTotal;
  const summaryTotal = invoiceTotal;
  const recordedPayments = order.payments || [];
  const recordedPaymentTotal = recordedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const balanceDue = Math.max(0, summaryTotal - recordedPaymentTotal);
  const overpaidAmount = Math.max(0, recordedPaymentTotal - summaryTotal);
  const timelineEvents = toStatusTimeline(order);
  const isReadyStatus = order.status === "ready_for_pickup" || order.status === "out_for_delivery";
  const canToggleReady =
    order.status === "submitted" ||
    order.status === "confirmed" ||
    order.status === "picking" ||
    isReadyStatus;
  const canMarkPickupOrDelivery =
    order.status === "ready_for_pickup" ||
    order.status === "out_for_delivery";
  const deliveryAddressAvailable = order.fulfillmentMethod === "delivery";
  const visibleQuickAddResults = quickAddCatalogResults.slice(0, 10);

  useEffect(() => {
    if (!activeCatalogProduct) return;
    if (activeCatalogProduct.variants.length === 0) return;

    const isMissing = !activeCatalogProduct.variants.some(
      (variant) => variant.id === quickAddVariantId
    );

    if (isMissing) {
      const fallbackVariant = activeCatalogProduct.variants[0];
      setQuickAddVariantId(fallbackVariant?.id || "");
      setQuickAddPrice((fallbackVariant?.price || 0).toFixed(2));
      setQuickAddUnit(unitFromVariant(fallbackVariant));
    }
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

    const fallbackVariant = fallbackProduct.variants[0];
    setQuickAddProductId(fallbackProduct.id);
    setQuickAddVariantId(fallbackVariant?.id || "");
    setQuickAddPrice((fallbackVariant?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(fallbackVariant));
  }, [quickAddProductId, quickAddProductQuery, filteredCatalogProducts]);

  function beginEditing() {
    setDraftItems(withResolvedOrderItemImages(order.items));
    setDraftCustomerNotes(order.jobsiteAddress.notes || "");
    setIsEditing(true);
    setActionNotice("Editing order items. Save to keep changes, cancel to revert.");
  }

  function exitEditing() {
    setDraftItems(withResolvedOrderItemImages(order.items));
    setDraftCustomerNotes(order.jobsiteAddress.notes || "");
    setIsEditing(false);
    setActionNotice("Edit mode canceled.");
  }

  function normalizeDraftItems(items: CartItem[]) {
    return items
      .filter((item) => item.title.trim().length > 0 || item.sku.trim().length > 0)
      .map((item) => ({
        ...item,
        title: item.title.trim() || "Unnamed product",
        sku: item.sku.trim() || `${item.productId.slice(0, 8)}-${Date.now()}`,
        quantity: Math.max(0, Number(item.quantity) || 0),
        quantityNeeded: Math.max(0, Number(item.quantity) || 0),
        price: Math.max(0, Number(item.price) || 0),
        quantityPulled: Math.max(0, Number(item.quantityPulled) || 0),
        options: { ...item.options }
      }));
  }

  function saveOrderEdits() {
    const updatedItems = normalizeDraftItems(draftItems);
    const updatedOrder: OrderRecord = {
      ...order,
      items: updatedItems,
      subtotal: draftSubtotal,
      tax: draftTax,
      deliveryFee: draftDeliveryCharge,
      total: draftTotal,
      customerName: draftCustomerName.trim() || order.customerName,
      companyName: draftCompanyName.trim() || draftCustomerName.trim() || order.companyName,
      email: draftEmail.trim(),
      phone: draftPhone.trim(),
      fulfillmentMethod: draftFulfillmentMethod,
      requestedDate: draftRequestedDate,
      requestedWindow: draftRequestedWindow,
      paymentStatus: draftPaymentStatus,
      jobsiteAddress: {
        ...order.jobsiteAddress,
        name: draftCustomerName.trim() || order.jobsiteAddress.name,
        company: draftCompanyName.trim() || draftCustomerName.trim() || order.jobsiteAddress.company,
        email: draftEmail.trim(),
        phone: draftPhone.trim(),
        addressLine1: sameAsBillingAddress ? draftAddress : draftShippingAddress,
        city: sameAsBillingAddress ? draftCity : draftShippingCity,
        state: sameAsBillingAddress ? draftState : draftShippingState,
        postalCode: sameAsBillingAddress ? draftZip : draftShippingZip,
        notes: draftOrderNotesText
      },
      activity: [
        {
          id: `updated-${Date.now()}`,
          label: "Order updated",
          detail: "Order details and line items were edited from admin workspace.",
          createdAt: new Date().toISOString()
        },
        ...order.activity
      ],
      updatedAt: new Date().toISOString()
    };
    upsertOrder(updatedOrder);
    setIsEditing(false);
    setActionNotice("Order edits saved in local workspace.");
    setBackendNotice(
      hasRealData
        ? "Order items edited in local workspace; backend order item editing API is not connected yet."
        : "Order changes are saved in the current session."
    );
    setDraftItems(updatedItems);
  }

  function getPaymentStatusForPaidAmount(paidAmount: number, orderTotal: number): PaymentStatus {
    if (paidAmount <= 0) return "unpaid";
    if (paidAmount > orderTotal) return "overpaid";
    if (paidAmount === orderTotal) return "paid";
    return "partial";
  }

  async function recordPayment() {
    if (createMode) {
      setActionNotice("Create the order before recording payments.");
      return;
    }

    const amount = Number.parseFloat(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionNotice("Enter a payment amount greater than zero.");
      return;
    }

    const now = new Date().toISOString();
    const localPayment: OrderPayment = {
      id: `payment-${Date.now()}`,
      amount,
      method: paymentMethod.trim() || "Payment",
      paidAt: paymentDate ? new Date(`${paymentDate}T12:00:00`).toISOString() : now,
      reference: paymentReference.trim(),
      note: paymentNote.trim(),
      createdBy: "Admin",
      createdAt: now
    };
    const nextPayments = [localPayment, ...recordedPayments];
    const nextPaymentTotal = nextPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const nextPaymentStatus = getPaymentStatusForPaidAmount(nextPaymentTotal, summaryTotal);
    const updatedOrder: OrderRecord = {
      ...order,
      payments: nextPayments,
      paymentStatus: nextPaymentStatus,
      updatedAt: now,
      activity: [
        {
          id: `payment-${Date.now()}`,
          label: "Payment recorded",
          detail: `${formatCurrency(amount)} ${localPayment.method} payment recorded.`,
          createdAt: now
        },
        ...order.activity
      ]
    };

    upsertOrder(updatedOrder);
    setDraftPaymentStatus(nextPaymentStatus);
    setPaymentAmount("");
    setPaymentReference("");
    setPaymentNote("");
    setActivePopup(null);
    setActionNotice(`Recorded ${formatCurrency(amount)} payment.`);

    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        payment: {
          amount,
          method: localPayment.method,
          paidAt: localPayment.paidAt,
          reference: localPayment.reference,
          note: localPayment.note,
          createdBy: localPayment.createdBy
        }
      })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string; paymentStatus?: PaymentStatus }) => {
        if (payload.paymentStatus) setDraftPaymentStatus(payload.paymentStatus);
        setBackendNotice(
          payload.persisted
            ? ""
            : payload.reason || "Payment was recorded locally. Backend payment save is not connected."
        );
      })
      .catch(() => {
        setBackendNotice("Payment was recorded locally. Backend payment save failed.");
      });
  }

  function buildDraftOrderRecord(nextStatus: "draft" | "submitted", nextPaymentStatus: PaymentStatus) {
    const normalizedItems = normalizeDraftItems(draftItems);

    if (!draftCustomerName.trim()) {
      throw new Error("Customer name is required.");
    }

    const orderDate = draftRequestedDate || new Date().toISOString().slice(0, 10);
    const requestedWindow = draftRequestedWindow || "12:00 PM - 2:00 PM";
    const orderAddress = sameAsBillingAddress ? draftAddress : draftShippingAddress;
    const orderCity = sameAsBillingAddress ? draftCity : draftShippingCity;
    const orderState = sameAsBillingAddress ? draftState : draftShippingState;
    const orderZip = sameAsBillingAddress ? draftZip : draftShippingZip;

    return createOrder({
      userId: "admin-user",
      customerName: draftCustomerName.trim(),
      companyName: draftCompanyName.trim() || draftCustomerName.trim(),
      email: draftEmail.trim(),
      phone: draftPhone.trim(),
      items: normalizedItems,
      fulfillmentMethod: draftFulfillmentMethod,
      requestedDate: orderDate,
      requestedWindow,
      jobName: "Order created in admin", 
      jobsiteAddress: {
        name: draftCustomerName.trim(),
        company: draftCompanyName.trim() || draftCustomerName.trim(),
        email: draftEmail.trim(),
        phone: draftPhone.trim(),
        addressLine1: orderAddress,
        addressLine2: "",
        city: orderCity,
        state: orderState,
        postalCode: orderZip,
        notes: draftOrderNotesText
      },
      drawings: [],
      pickupContact: draftCustomerName.trim(),
      subtotal: draftSubtotal,
      tax: draftSubtotal * TAX_RATE,
      deliveryFee: draftDeliveryCharge,
      total: draftTotal,
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      isQuoteRequest: false
    });
  }

  async function persistOrderToBackend(orderRecord: ReturnType<typeof buildDraftOrderRecord>) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderRecord)
    }).catch(() => null);

    const payload = (await response?.json().catch(() => null)) as
      | { persisted?: boolean; reason?: string }
      | null;

    if (!response?.ok || !payload?.persisted) {
      throw new Error(payload?.reason || "Order saved locally but not persisted to backend.");
    }
  }

  async function handleCreateOrderSubmit(nextStatus: "draft" | "submitted") {
    if (isSubmittingOrder) return;

    if (!draftItems.length) {
      setActionNotice("Add at least one product before creating an order.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const nextPaymentStatus = nextStatus === "draft" ? draftPaymentStatus : "unpaid";
      const created = buildDraftOrderRecord(nextStatus, nextPaymentStatus);
      await persistOrderToBackend(created);
      setActionNotice(
        `${nextStatus === "submitted" ? "Order created" : "Draft order saved"}: ${created.orderNumber}`
      );
      setBackendNotice("");
      setIsSubmittingOrder(false);
      setTimeout(() => {
        router.push("/admin/orders");
      }, 300);
    } catch (error) {
      setIsSubmittingOrder(false);
      setBackendNotice(
        error instanceof Error
          ? error.message
          : "Order could not be saved at this time."
      );
    }
  }

  function cancelCreateOrder() {
    router.push(backHref);
  }

  function updateDraftItem(index: number, field: keyof CartItem, value: CartItem[keyof CartItem]) {
    setDraftItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          [field]: value
        } as CartItem;
      })
    );
  }

  function updateDraftOption(index: number, key: VariantOptionKey, value: string) {
    setDraftItems((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          options: {
            ...(item.options || {}),
            [key]: value
          }
        };
      })
    );
  }

  function removeDraftItem(index: number) {
    setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index));
  }

  function addCatalogSearchResult(result: CatalogSearchResult) {
    const product = result.product;
    const variant = result.variant;
    const image = getProductImageUrl(product, variant);
    const lineKey = getCatalogSearchResultKey(result);
    const addQuantity = 1;

    setDraftItems((items) => {
      const existingIndex = items.findIndex((item) => `${item.productId}-${item.variantId}` === lineKey);

      if (existingIndex >= 0) {
        return items.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: (Number(item.quantity) || 0) + addQuantity,
                quantityNeeded: (Number(item.quantityNeeded) || Number(item.quantity) || 0) + addQuantity
              }
            : item
        );
      }

      return [
        ...items,
        makeDraftLine({
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          sku: variant.sku,
          image,
          quantity: addQuantity,
          quantityNeeded: addQuantity,
          price: getVariantDisplayPrice(variant),
          options: {
            ...variant.options,
            length: formatVariantSummary(variant) || getVariantDisplaySize(variant)
          },
          pickNotes: ""
        })
      ];
    });

    setQuickAddProductQuery("");
    setQuickAddProductId("");
    setQuickAddVariantId("");
    setQuickAddPrice("0");
    setIsProductSearchOpen(false);
    setActionNotice(`Added ${product.title} to order.`);
    productSearchInputRef.current?.blur();
  }

  function handleQuickAddProductInput(value: string) {
    setQuickAddProductQuery(value);
    setIsProductSearchOpen(true);
    setQuickAddResultIndex(0);
    const bestMatch = findBestCatalogMatch(catalogItems, value);

    if (!bestMatch) {
      setQuickAddProductId("");
      setQuickAddVariantId("");
      setQuickAddPrice("0");
      setQuickAddUnit("EA");
      return;
    }

    const nextProduct = bestMatch.product;
    const nextVariant = nextProduct.variants[0];
    setQuickAddProductId(nextProduct.id);
    setQuickAddVariantId(nextVariant?.id || "");
    setQuickAddPrice((nextVariant?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(nextVariant));
  }

  function selectQuickAddProduct(product: Product | null) {
    if (!product) {
      setQuickAddProductId("");
      setQuickAddVariantId("");
      setQuickAddPrice("0");
      setQuickAddUnit("EA");
      return;
    }

    const nextVariant = product.variants[0];
    setQuickAddProductId(product.id);
    setQuickAddProductQuery(product.title);
    setQuickAddVariantId(nextVariant?.id || "");
    setQuickAddPrice((nextVariant?.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(nextVariant));
  }

  function selectQuickAddResult(result: CatalogSearchResult | null, resultIndex = 0) {
    if (!result) {
      selectQuickAddProduct(null);
      setQuickAddResultIndex(0);
      return;
    }

    setQuickAddProductId(result.product.id);
    setQuickAddProductQuery(result.product.title);
    setQuickAddVariantId(result.variant.id);
    setQuickAddPrice((result.variant.price || 0).toFixed(2));
    setQuickAddUnit(unitFromVariant(result.variant));
    setQuickAddResultIndex(resultIndex);
  }

  useEffect(() => {
    if (!quickAddHasResults) {
      setQuickAddResultIndex(0);
      return;
    }

    if (quickAddResultIndex >= quickAddCatalogResults.length) {
      setQuickAddResultIndex(0);
    }
  }, [quickAddCatalogResults, quickAddHasResults, quickAddResultIndex]);

  function getQuickAddStatusNote() {
    if (!quickAddProductQuery.trim()) {
      return "Search or choose a catalog product to load live pricing.";
    }

    if (!activeCatalogProduct) return "No matching catalog product found.";
    if (!activeCatalogVariant) return "Select a variant to load pricing.";

    return "";
  }

  function clearQuickAddForm() {
    setQuickAddProductQuery("");
    setQuickAddProductId("");
    setQuickAddVariantId("");
    setQuickAddQuantity("1");
    setQuickAddUnit("EA");
    setQuickAddPrice("0");
  }

  function createDraftNote() {
    const noteText = draftOrderNoteInput.trim();
    if (!noteText) {
      return;
    }

    const now = new Date().toISOString();
    setDraftOrderNotes((previous) => [
      { id: `note-${Date.now()}`, text: noteText, createdAt: now },
      ...previous
    ]);
    setDraftOrderNoteInput("");
    setActionNotice("Order note added.");
  }

  function deleteDraftNote(noteId: string) {
    setDraftOrderNotes((previous) => previous.filter((note) => note.id !== noteId));
    setActionNotice("Order note deleted.");
  }

  function handleQuickAddKeyDown(event: ReactKeyboardEvent) {
    if (!quickAddHasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const maxIndex = quickAddCatalogResults.length - 1;
      setQuickAddResultIndex((current) => (current >= maxIndex ? 0 : current + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const maxIndex = quickAddCatalogResults.length - 1;
      setQuickAddResultIndex((current) => (current <= 0 ? maxIndex : current - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      addDraftItem();
    }
  }

  function addDraftItem() {
    const product = activeCatalogProduct;
    if (!product) {
      setActionNotice("Select a real catalog product before adding.");
      return;
    }

    const variant = activeCatalogVariant;
    if (!variant) {
      setActionNotice("Select a product variant before adding.");
      return;
    }

    const quantityValue = Number.parseFloat(quickAddQuantity);
    const priceValue = Number.parseFloat(quickAddPrice);
    const draftLine = makeDraftLine({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      sku: variant.sku,
      image: variant.image,
      quantity: Number.isFinite(quantityValue) ? Math.max(0, quantityValue) : 1,
      quantityNeeded: Number.isFinite(quantityValue) ? Math.max(0, quantityValue) : 1,
      price: Number.isFinite(priceValue) ? Math.max(0, priceValue) : getVariantDisplayPrice(variant),
      options: {
        ...variant.options,
        length: formatVariantSummary(variant) || getVariantDisplaySize(variant)
      },
      pickNotes: ""
    });

    setDraftItems((items) => [...items, draftLine]);
    clearQuickAddForm();
    setActionNotice(`Added ${product.title} to order.`);
  }

  function persistOrderStatus(nextStatus: OrderStatus, detail: string) {
    updateOrderStatus(order.id, nextStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: nextStatus })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        setBackendNotice(
          payload.persisted
            ? ""
            : payload.reason ||
                "Supabase is not configured. Changes are stored in the browser session."
        );
      })
      .catch(() => null);
  }

  function markReady() {
    if (isReadyStatus) {
      persistOrderStatus("picking", "Marked not ready from order detail.");
      setActionNotice("Order moved back to picking.");
      return;
    }

    const readyStatus =
      order.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery";
    persistOrderStatus(readyStatus, "Marked ready from order detail.");
    setActionNotice("Order moved to ready fulfillment state.");
  }

  function markPickedUpOrDelivered() {
    persistOrderStatus("completed", "Customer pickup/delivery completed.");
    setActionNotice("Order marked completed.");
  }

  function markItemsPulled() {
    const map: PullMap = {};
    for (const item of lineItems) {
      map[item.key] = {
        pulled: true,
        pulledQuantity: item.totalQuantity
      };
    }
    setPulledMap(map);
    setActionNotice("Items marked as pulled in the current session.");
  }

  function printPickTicket() {
    window.print();
  }

  function printInvoice() {
    setActionNotice("Invoice print action placeholder. Backend binding pending.");
  }

  function sendCustomerUpdate() {
    setActionNotice("Customer update action placeholder. Notifications integration pending.");
  }

  function cancelOrder() {
    persistOrderStatus("cancelled", "Order cancelled from operations admin.");
    setActionNotice("Order cancelled.");
  }

  function refundOrder() {
    updatePaymentStatus(order.id, "refunded", "Refund action marked from admin workspace.");
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, paymentStatus: "refunded" })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        setBackendNotice(
          payload.persisted
            ? ""
            : payload.reason ||
                "Supabase is not configured. Payment updates are session-local."
        );
      })
      .catch(() => null);
    setActionNotice("Refund action attempted. If backend is connected, payment status updates to refunded.");
  }

  function closeOrderDraftPopups() {
    setActivePopup(null);
  }

  function openPopup(target: HTMLElement | null, popup: PopupId) {
    popupTriggerRef.current = target || (document.activeElement as HTMLElement | null) || null;

    if (popup === "customer") {
      modalSnapshotRef.current.customerName = draftCustomerName;
      modalSnapshotRef.current.customerCompanyName = draftCompanyName;
      modalSnapshotRef.current.customerEmail = draftEmail;
      modalSnapshotRef.current.customerPhone = draftPhone;
    } else if (popup === "billing") {
      modalSnapshotRef.current.billingAddress = draftAddress;
      modalSnapshotRef.current.billingCity = draftCity;
      modalSnapshotRef.current.billingState = draftState;
      modalSnapshotRef.current.billingZip = draftZip;
    } else if (popup === "delivery") {
      modalSnapshotRef.current.deliveryFulfillmentMethod = draftFulfillmentMethod;
      modalSnapshotRef.current.deliveryDate = draftRequestedDate;
      modalSnapshotRef.current.deliveryWindow = draftRequestedWindow;
      modalSnapshotRef.current.deliveryAddress = draftAddress;
      modalSnapshotRef.current.deliveryCity = draftCity;
      modalSnapshotRef.current.deliveryState = draftState;
      modalSnapshotRef.current.deliveryZip = draftZip;
      modalSnapshotRef.current.deliveryNotes = draftDeliveryNotes;
    }

    setActivePopup(popup);
  }

  function isPopupDirty(popup: PopupId) {
    if (popup === "customer") {
      return (
        modalSnapshotRef.current.customerName !== draftCustomerName ||
        modalSnapshotRef.current.customerCompanyName !== draftCompanyName ||
        modalSnapshotRef.current.customerEmail !== draftEmail ||
        modalSnapshotRef.current.customerPhone !== draftPhone
      );
    }

    if (popup === "billing") {
      return (
        modalSnapshotRef.current.billingAddress !== draftAddress ||
        modalSnapshotRef.current.billingCity !== draftCity ||
        modalSnapshotRef.current.billingState !== draftState ||
        modalSnapshotRef.current.billingZip !== draftZip
      );
    }

    if (popup === "delivery") {
      return (
        modalSnapshotRef.current.deliveryFulfillmentMethod !== draftFulfillmentMethod ||
        modalSnapshotRef.current.deliveryDate !== draftRequestedDate ||
        modalSnapshotRef.current.deliveryWindow !== draftRequestedWindow ||
        modalSnapshotRef.current.deliveryAddress !== draftAddress ||
        modalSnapshotRef.current.deliveryCity !== draftCity ||
        modalSnapshotRef.current.deliveryState !== draftState ||
        modalSnapshotRef.current.deliveryZip !== draftZip ||
        modalSnapshotRef.current.deliveryNotes !== draftDeliveryNotes
      );
    }

    return false;
  }

  function saveCustomerPopup() {
    const composedName = [draftCustomerFirstName, draftCustomerLastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ");
    const nextCustomerName = composedName || draftCompanyName.trim();

    if (nextCustomerName && (!draftCustomerName.trim() || draftCustomerName === "New Customer")) {
      setDraftCustomerName(nextCustomerName);
    }

    if (sameAsBillingAddress) {
      setDraftShippingAddress(draftAddress);
      setDraftShippingCity(draftCity);
      setDraftShippingState(draftState);
      setDraftShippingZip(draftZip);
    }

    closeOrderDraftPopups();
    setActionNotice("Customer added to order.");
  }

  function saveBillingPopup() {
    closeOrderDraftPopups();
    setActionNotice("Billing details updated.");
  }

  function saveDeliveryPopup() {
    closeOrderDraftPopups();
    setActionNotice("Delivery details updated.");
  }

  function parseCustomerAddress(value: string) {
    const [addressLine = "", cityLine = ""] = value.split("\n");
    const parts = cityLine.trim().split(/\s+/).filter(Boolean);

    return {
      addressLine,
      city: parts.length > 2 ? parts.slice(0, -2).join(" ") : "",
      state: parts.length > 1 ? parts.at(-2) || "" : "",
      postalCode: parts.length ? parts.at(-1) || "" : ""
    };
  }

  function applyCustomerToDraft(customer: CustomerRecord) {
    const billingAddress = parseCustomerAddress(customer.billingAddress);
    const jobsiteAddress = parseCustomerAddress(customer.jobsiteAddress);
    const [firstName = "", ...lastNameParts] = customer.name.split(" ");

    setDraftCustomerName(customer.name);
    setDraftCustomerFirstName(firstName);
    setDraftCustomerLastName(lastNameParts.join(" "));
    setDraftCompanyName(customer.company);
    setDraftEmail(customer.email);
    setDraftPhone(customer.phone);
    setDraftAddress(billingAddress.addressLine || jobsiteAddress.addressLine);
    setDraftCity(billingAddress.city || jobsiteAddress.city);
    setDraftState(billingAddress.state || jobsiteAddress.state);
    setDraftZip(billingAddress.postalCode || jobsiteAddress.postalCode);
    setDraftShippingAddress(jobsiteAddress.addressLine || billingAddress.addressLine);
    setDraftShippingCity(jobsiteAddress.city || billingAddress.city);
    setDraftShippingState(jobsiteAddress.state || billingAddress.state);
    setDraftShippingZip(jobsiteAddress.postalCode || billingAddress.postalCode);
    setDraftPaymentTerms(customer.terms || "Due on receipt");
    setSameAsBillingAddress(customer.billingAddress === customer.jobsiteAddress);
    setIsCustomerPickerOpen(false);
    setActionNotice(`${customer.company || customer.name} added to order.`);
  }

  function startNewCustomerDraft() {
    popupTriggerRef.current = (document.activeElement as HTMLElement | null) || null;
    setCustomerPopupTab("customer");
    setDraftCustomerName("");
    setDraftCustomerFirstName("");
    setDraftCustomerLastName("");
    setDraftCompanyName("");
    setDraftEmail("");
    setDraftPhone("");
    setDraftAddress("");
    setDraftCity("");
    setDraftState("");
    setDraftZip("");
    setDraftTaxExempt(false);
    setDraftPaymentTerms("Due on receipt");
    setSameAsBillingAddress(true);
    setDraftShippingAddress("");
    setDraftShippingCity("");
    setDraftShippingState("");
    setDraftShippingZip("");
    setDraftCustomerNotes("");
    setDraftDeliveryNotes("");
    setIsCustomerPickerOpen(false);
    setActivePopup("customer");
  }

  if (true) {
    return (
      <>
      <main className="px-3 py-4 md:px-6 md:py-6">
        <div className="mx-auto grid max-w-[1280px] gap-4">
          {!createMode ? (
            <section className="overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-sm backdrop-blur-xl">
              <div className="grid gap-4 border-b border-black/10 bg-[#fafaf8] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:items-end">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-industrial-muted">
                    Gateworks operations
                  </p>
                  <h1 className="mt-2 text-3xl font-black leading-none tracking-[-0.04em] text-industrial-ink md:text-5xl">
                    {order.orderNumber}
                  </h1>
                  <p className="mt-3 text-sm font-medium text-industrial-steel">
                    {order.customerName} · {order.jobName || "Customer order"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="rounded-full shadow-sm" tone="neutral">
                      {statusLabel[order.status]}
                    </Badge>
                    <Badge
                      className="rounded-full shadow-sm"
                      tone={getPaymentStatusTone(draftPaymentStatus)}
                    >
                      {paymentLabels[draftPaymentStatus]}
                    </Badge>
                    <Badge className="rounded-full shadow-sm" tone="neutral">
                      {fulfillmentLabels[order.status]}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                  <OrderProgressBar fulfillmentMethod={order.fulfillmentMethod} status={order.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-black/10 bg-white px-4 py-3">
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-ink transition hover:border-industrial-ink"
                  href={backHref}
                >
                  <ArrowLeft size={14} />
                  Back to orders
                </Link>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-ink transition hover:border-industrial-ink"
                  onClick={printPickTicket}
                  type="button"
                >
                  <Printer size={14} />
                  Print pick ticket
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canToggleReady}
                  onClick={markReady}
                  type="button"
                >
                  <CircleDashed size={14} />
                  {isReadyStatus ? "Mark not ready" : "Mark ready"}
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-ink transition hover:border-industrial-ink disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canMarkPickupOrDelivery}
                  onClick={markPickedUpOrDelivered}
                  type="button"
                >
                  <CheckCircle2 size={14} />
                  {order.fulfillmentMethod === "pickup" ? "Mark picked up" : "Mark delivered"}
                </button>
                <button
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-industrial-ink px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-jobsite-pine"
                  onClick={saveOrderEdits}
                  type="button"
                >
                  <Save size={14} />
                  Save changes
                </button>
                <details className="relative">
                  <summary className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-black/10 bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-ink transition hover:border-industrial-ink">
                    More actions
                  </summary>
                  <div className="absolute right-0 z-30 mt-2 w-60 rounded-lg border border-black/10 bg-white p-2 shadow-lg">
                    <button
                      className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold text-industrial-ink transition hover:bg-[#f7f7f4]"
                      onClick={() => {
                        void navigator.clipboard.writeText(order.id);
                        setActionNotice("Order ID copied.");
                      }}
                      type="button"
                    >
                      Copy order id
                    </button>
                    <button
                      className="mt-1 flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold text-industrial-ink transition hover:bg-[#f7f7f4]"
                      onClick={() =>
                        void navigator.clipboard.writeText(`${order.orderNumber} - ${order.customerName}`)
                      }
                      type="button"
                    >
                      Copy customer reference
                    </button>
                  </div>
                </details>
              </div>

              <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-emerald-900/10 bg-emerald-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-industrial-muted">Order total</p>
                  <p className="mt-0.5 text-xl font-black leading-tight text-industrial-ink">{formatCurrency(summaryTotal)}</p>
                  <p className="text-xs leading-tight text-industrial-steel">{paymentLabels[draftPaymentStatus]}</p>
                </div>
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-industrial-muted">Line items</p>
                  <p className="mt-0.5 text-xl font-black leading-tight text-industrial-ink">{draftItems.length}</p>
                  <p className="text-xs leading-tight text-industrial-steel">Material rows on this order</p>
                </div>
                <div className="rounded-lg border border-indigo-900/10 bg-indigo-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-industrial-muted">Pulled</p>
                  <p className="mt-0.5 text-xl font-black leading-tight text-industrial-ink">{pulledQuantity}/{totalQuantity}</p>
                  <p className="text-xs leading-tight text-industrial-steel">{pickTicketStatus}</p>
                </div>
                <div className="rounded-lg border border-violet-900/10 bg-violet-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-industrial-muted">Fulfillment</p>
                  <p className="mt-0.5 text-xl font-black capitalize leading-tight text-industrial-ink">{draftFulfillmentMethod}</p>
                  <p className="text-xs leading-tight text-industrial-steel">{draftRequestedDate || order.requestedDate || "No date set"}</p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-black/10 bg-white/86 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fafaf8] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  className="inline-flex items-center gap-2 text-sm font-medium text-industrial-muted hover:text-industrial-ink"
                  href={backHref}
                >
                  <ArrowLeft size={16} />
                  All orders
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                    {createMode ? "Draft" : statusLabel[order.status]}
                  </span>
                  <span className="text-sm font-medium text-industrial-muted">{order.orderNumber}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {createMode ? (
                  <>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-industrial-ink shadow-sm transition hover:bg-[#f7f7f4]"
                      disabled={isSubmittingOrder}
                      onClick={() => void handleCreateOrderSubmit("draft")}
                      type="button"
                    >
                      <Save size={16} />
                      Save Draft
                    </button>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-industrial-ink px-3 text-sm font-semibold text-white transition hover:bg-jobsite-pine disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmittingOrder}
                      onClick={() => void handleCreateOrderSubmit("submitted")}
                      type="button"
                    >
                      <CheckCircle2 size={16} />
                      Create Order
                    </button>
                  </>
                ) : (
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-industrial-ink px-3 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                    onClick={saveOrderEdits}
                    type="button"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            {(actionNotice || backendNotice) ? (
              <div className="border-b border-black/10 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {actionNotice || backendNotice}
              </div>
            ) : null}

            <div className="p-4 md:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted" htmlFor="order-title">
                    Order title
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-transparent bg-[#f7f7f4] px-3 py-3 text-2xl font-semibold text-industrial-ink outline-none focus:border-black/10 focus:bg-white"
                    id="order-title"
                    onChange={(event) => setDraftCompanyName(event.target.value)}
                    value={draftCompanyName || draftCustomerName || "New order"}
                  />
                </div>
                <div className="rounded-lg border border-black/10 bg-[#f7f7f4] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
                    Amount due
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-industrial-ink">
                    {formatCurrency(balanceDue)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border border-black/10 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Bill to</h2>
                  <div className="relative mt-3">
                    <button
                      className="flex min-h-[68px] w-full items-center justify-between gap-3 rounded-lg border border-black/10 bg-[#f8f7f2] px-3 text-left transition hover:border-black/20 hover:bg-white"
                      onClick={() => setIsCustomerPickerOpen((isOpen) => !isOpen)}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-industrial-muted">
                          <UserPlus size={19} strokeWidth={1.7} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-industrial-muted">
                            Bill to
                          </span>
                          <span className="block truncate text-sm font-semibold text-industrial-ink">
                            Add a Customer
                          </span>
                          <span className="block truncate text-xs text-industrial-muted">
                            {draftCompanyName || draftCustomerName || "Select an existing customer or create a new one"}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-industrial-ink">
                        Select
                      </span>
                    </button>
                    {isCustomerPickerOpen ? (
                      <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl">
                        <button
                          className="flex w-full items-center gap-3 border-b border-black/10 bg-[#fafaf8] px-4 py-3 text-left text-sm font-semibold text-blue-700 hover:bg-white"
                          onClick={startNewCustomerDraft}
                          type="button"
                        >
                          <UserPlus size={18} />
                          Create a New Customer
                        </button>
                        <div className="max-h-72 overflow-y-auto">
                          {availableCustomers.map((customer) => (
                            <button
                              className="grid w-full gap-1 border-b border-black/10 px-4 py-3 text-left text-sm hover:bg-[#fafaf8]"
                              key={customer.id}
                              onClick={() => applyCustomerToDraft(customer)}
                              type="button"
                            >
                              <span className="font-semibold text-industrial-ink">{customer.company || customer.name}</span>
                              <span className="text-xs text-industrial-muted">
                                {customer.name} · {customer.email}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {draftCustomerName || draftCompanyName || draftEmail || draftPhone ? (
                    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-industrial-ink">{draftCompanyName || draftCustomerName}</p>
                        <p className="truncate text-industrial-muted">
                          {[draftCustomerName, draftEmail, draftPhone].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#edf7f2] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-jobsite-pine">
                        Selected
                      </span>
                    </div>
                  ) : null}
                </section>
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Order details</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <InvoiceInput label="Order no." value={order.orderNumber} onChange={() => undefined} readOnly compact />
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                    Fulfillment
                    <select
                      className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white"
                      onChange={(event) => setDraftFulfillmentMethod(event.target.value as FulfillmentMethod)}
                      value={draftFulfillmentMethod}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>
                  <InvoiceInput
                    label="Requested date"
                    type="date"
                    value={draftRequestedDate}
                    onChange={setDraftRequestedDate}
                    compact
                  />
                  <InvoiceInput
                    label="Requested window"
                    value={draftRequestedWindow}
                    onChange={setDraftRequestedWindow}
                    compact
                  />
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted sm:col-span-2">
                    Payment status
                    <select
                      className="mt-1 h-9 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white"
                      onChange={(event) => setDraftPaymentStatus(event.target.value as PaymentStatus)}
                      value={draftPaymentStatus}
                    >
                      {Object.entries(paymentLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  </div>
                </section>
              </div>

              <Card className="mt-5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package size={18} />
                    <h3 className="text-lg font-black text-industrial-ink">Products</h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="relative border-b border-industrial-rail pb-4" ref={productSearchContainerRef}>
                    <input
                      ref={productSearchInputRef}
                      className="h-11 w-full rounded-lg border border-industrial-rail bg-white px-3 text-sm font-semibold text-industrial-ink outline-none transition placeholder:text-industrial-muted focus:border-industrial-ink"
                      onChange={(event) => handleQuickAddProductInput(event.target.value)}
                      onFocus={() => setIsProductSearchOpen(true)}
                      placeholder="Search products..."
                      value={quickAddProductQuery}
                    />

                    {isProductSearchOpen ? (
                      <div className="absolute left-0 right-0 top-12 z-40 max-h-96 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-xl">
                        {productSearchResults.length ? (
                          productSearchResults.map((result) => {
                            const imageUrl = getProductImageUrl(result.product, result.variant);
                            const resultKey = getCatalogSearchResultKey(result);

                            return (
                              <button
                                className="grid w-full grid-cols-[48px_minmax(0,1fr)_90px_90px] items-center gap-3 border-b border-industrial-rail px-3 py-2 text-left text-sm hover:bg-[#f7f7f4]"
                                key={resultKey}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => addCatalogSearchResult(result)}
                                type="button"
                              >
                                <span className="grid size-12 place-items-center overflow-hidden rounded-md border border-industrial-rail bg-[#f7f7f4]">
                                  {imageUrl ? (
                                    <img
                                      alt={result.product.title}
                                      className="h-full w-full object-contain p-1"
                                      src={imageUrl}
                                    />
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                                      No img
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-black text-industrial-ink">{result.product.title}</span>
                                  <span className="block truncate text-xs text-industrial-steel">SKU {result.variant.sku}</span>
                                </span>
                                <span className="text-right font-black text-industrial-ink">
                                  {formatCurrency(getVariantDisplayPrice(result.variant))}
                                </span>
                                <span className="text-right text-xs font-semibold text-industrial-muted">
                                  {getVariantInventoryText(result.variant)}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-6 text-sm font-semibold text-industrial-muted">
                            No products found
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="mt-4 w-full min-w-[980px] text-left text-sm">
                      <thead className="border-b border-industrial-rail bg-white">
                        <tr>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Product Image</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Product</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">SKU</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Qty</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Unit Price</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Line Total</th>
                          <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {draftItems.length ? (
                          draftItems.map((item, index) => (
                            <tr className="border-b border-industrial-rail/70" key={item.orderItemId || `${item.productId}-${item.variantId}-${index}`}>
                              <td className="px-3 py-3">
                                <span className="grid size-12 place-items-center overflow-hidden rounded-md border border-industrial-rail bg-[#f7f7f4]">
                                  {item.image ? (
                                    <img
                                      alt={item.title}
                                      className="h-full w-full object-contain p-1"
                                      src={item.image}
                                    />
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                                      No img
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-black text-industrial-ink">{item.title}</td>
                              <td className="px-3 py-3 text-industrial-steel">{item.sku}</td>
                              <td className="px-3 py-3">
                                <input
                                  className="h-9 w-20 rounded border border-industrial-rail bg-white px-2 text-right text-sm font-semibold text-industrial-ink outline-none focus:border-industrial-ink"
                                  inputMode="decimal"
                                  onChange={(event) => updateDraftItem(index, "quantity", Number(event.target.value))}
                                  value={item.quantity}
                                />
                              </td>
                              <td className="px-3 py-3">
                                <input
                                  className="h-9 w-28 rounded border border-industrial-rail bg-white px-2 text-right text-sm font-semibold text-industrial-ink outline-none focus:border-industrial-ink"
                                  inputMode="decimal"
                                  onChange={(event) => updateDraftItem(index, "price", Number(event.target.value))}
                                  value={item.price}
                                />
                              </td>
                              <td className="px-3 py-3 font-black text-industrial-ink">
                                {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                              </td>
                              <td className="px-3 py-3">
                                <button
                                  aria-label={`Remove ${item.title}`}
                                  className="grid size-9 place-items-center rounded-lg border border-industrial-rail text-industrial-muted transition hover:border-red-700 hover:text-red-700"
                                  onClick={() => removeDraftItem(index)}
                                  type="button"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-3 py-6 text-sm text-industrial-steel" colSpan={7}>
                              No products added yet. Search products above to add order line items.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px]">
                <section className="rounded-lg border border-black/10 bg-white p-4">
                  <InvoiceTextarea
                    label="Message on order"
                    value={draftCustomerNotes}
                    onChange={setDraftCustomerNotes}
                  />
                  <InvoiceTextarea
                    label="Jobsite or delivery notes"
                    value={draftDeliveryNotes}
                    onChange={setDraftDeliveryNotes}
                  />
                  <p className="mt-2 text-xs font-semibold text-industrial-muted">
                    These notes are saved with the order when you click {createMode ? "Save Draft or Create Order" : "Save Changes"}.
                  </p>
                </section>
                <div className="grid gap-4">
                  <section className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Payments</p>
                        <p className="mt-1 text-sm text-industrial-steel">Record cash, check, card, ACH, or other manual payments.</p>
                      </div>
                      <Badge
                        className="rounded-full"
                        tone={getPaymentStatusTone(draftPaymentStatus)}
                      >
                        {paymentLabels[draftPaymentStatus]}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-black/10 bg-[#f7f7f4]">
                      <div className="border-r border-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-industrial-muted">Invoice total</p>
                        <p className="mt-1 text-lg font-black text-industrial-ink">{formatCurrency(invoiceTotal)}</p>
                      </div>
                      <div className="border-r border-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-industrial-muted">Paid</p>
                        <p className="mt-1 text-lg font-black text-industrial-ink">{formatCurrency(recordedPaymentTotal)}</p>
                      </div>
                      <div className="p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-industrial-muted">Balance</p>
                        <p className="mt-1 text-lg font-black text-industrial-ink">{formatCurrency(balanceDue)}</p>
                      </div>
                    </div>
                    {overpaidAmount > 0 ? (
                      <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                        This order is overpaid by {formatCurrency(overpaidAmount)}.
                      </p>
                    ) : null}
                    <button
                      className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-industrial-ink px-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-jobsite-pine disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={createMode}
                      onClick={() => setActivePopup("payment")}
                      type="button"
                    >
                      Record payment
                    </button>
                    <div className="mt-4 border-t border-black/10 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-industrial-muted">Payment history</span>
                        <span className="font-black text-industrial-ink">{formatCurrency(recordedPaymentTotal)}</span>
                      </div>
                      <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto">
                        {recordedPayments.length ? (
                          recordedPayments.map((payment) => (
                            <div className="rounded-lg border border-black/10 bg-[#f7f7f4] px-3 py-2 text-xs" key={payment.id}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-industrial-ink">{formatCurrency(payment.amount)}</span>
                                <span className="text-industrial-muted">{new Date(payment.paidAt).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-1 truncate font-semibold text-industrial-steel">
                                {payment.method}{payment.reference ? ` · Ref ${payment.reference}` : ""}
                              </p>
                              {payment.note ? <p className="mt-1 text-industrial-muted">{payment.note}</p> : null}
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                                Recorded by {payment.createdBy || "Admin"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-semibold text-industrial-muted">No payments recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-black/10 bg-white p-4">
                    <SummaryRow label="Subtotal" value={formatCurrency(summarySubtotal)} />
                    <SummaryRow label="Tax" value={formatCurrency(summaryTax)} />
                    <div className="grid grid-cols-[1fr_120px] items-center gap-3 py-1.5 text-sm">
                      <span className="text-industrial-muted">Delivery</span>
                      <Input
                        className="h-9 rounded border-black/10 bg-[#f7f7f4] text-right text-sm normal-case"
                        inputMode="decimal"
                        onChange={(event) => setDraftDeliveryFee(event.target.value)}
                        value={draftDeliveryFee}
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_110px_120px] items-center gap-2 py-1.5 text-sm">
                      <span className="text-industrial-muted">{draftDiscountLabel}</span>
                      <Select
                        aria-label="Discount type"
                        className="h-9 rounded border-black/10 bg-[#f7f7f4] text-sm"
                        onChange={(event) => setDraftDiscountMode(event.target.value as DraftDiscountMode)}
                        value={draftDiscountMode}
                      >
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                      </Select>
                      <Input
                        className="h-9 rounded border-black/10 bg-[#f7f7f4] text-right text-sm normal-case"
                        inputMode="decimal"
                        onChange={(event) => setDraftDiscount(event.target.value)}
                        placeholder={draftDiscountMode === "percent" ? "0" : "0.00"}
                        value={draftDiscount}
                      />
                    </div>
                    <SummaryRow label="Invoice total" value={formatCurrency(invoiceTotal)} />
                    <SummaryRow label="Payments" value={formatCurrency(recordedPaymentTotal)} />
                    <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                      <span className="text-base font-semibold text-industrial-ink">Balance due</span>
                      <span className="text-2xl font-semibold text-industrial-ink">{formatCurrency(balanceDue)}</span>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
      {isPaymentPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close record payment popup"
            className="absolute inset-0 bg-black/30"
            onClick={closeOrderDraftPopups}
            type="button"
          />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-industrial-muted">Record payment</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-industrial-ink">{order.orderNumber}</h2>
                <p className="mt-1 text-sm text-industrial-steel">
                  Invoice total {formatCurrency(invoiceTotal)} · Balance {formatCurrency(balanceDue)}
                </p>
              </div>
              <button
                aria-label="Close payment popup"
                className="grid size-10 place-items-center rounded-lg text-industrial-muted transition hover:bg-[#f7f7f4] hover:text-industrial-ink"
                onClick={closeOrderDraftPopups}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">Amount</span>
                  <Input
                    className="mt-1 h-10 rounded border-black/10 bg-[#f7f7f4] text-sm normal-case"
                    inputMode="decimal"
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="0.00"
                    value={paymentAmount}
                  />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">Payment date</span>
                  <Input
                    className="mt-1 h-10 rounded border-black/10 bg-[#f7f7f4] text-sm normal-case"
                    onChange={(event) => setPaymentDate(event.target.value)}
                    type="date"
                    value={paymentDate}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">Payment method</span>
                  <Select
                    aria-label="Payment method"
                    className="mt-1 h-10 rounded border-black/10 bg-[#f7f7f4] text-sm"
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    value={paymentMethod}
                  >
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">Reference number</span>
                  <Input
                    className="mt-1 h-10 rounded border-black/10 bg-[#f7f7f4] text-sm normal-case"
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder="Check #, auth code, transaction id"
                    value={paymentReference}
                  />
                </label>
              </div>
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">Notes</span>
                <Textarea
                  className="mt-1 min-h-24 rounded border-black/10 bg-[#f7f7f4] text-sm normal-case"
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="Deposit, final payment, customer note..."
                  value={paymentNote}
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-black/10 bg-[#fafaf8] px-6 py-4">
              <Button onClick={closeOrderDraftPopups} size="sm" type="button" variant="secondary">
                Cancel
              </Button>
              <Button onClick={() => void recordPayment()} size="sm" type="button">
                Save payment
              </Button>
            </div>
          </section>
        </div>
      ) : null}
      {isCustomerPopupOpen ? (
        <AppModal
          focusReturnRef={popupTriggerRef}
          initialFocusSelector="[data-modal-autofocus]"
          isDirty={() => isPopupDirty("customer")}
          open
          title="New customer"
          onClose={closeOrderDraftPopups}
          onCancel={closeOrderDraftPopups}
          onConfirm={saveCustomerPopup}
          confirmLabel="Save"
        >
          <div className="grid h-full gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="grid content-start gap-2 rounded-xl border border-black/10 bg-white p-2">
              {[
                ["customer", "Customer Info"],
                ["billing", "Billing Info"],
                ["shipping", "Shipping Info"],
                ["more", "More"]
              ].map(([tab, label]) => (
                <button
                  className={`rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                    customerPopupTab === tab
                      ? "bg-industrial-ink text-white shadow-sm"
                      : "text-industrial-steel hover:bg-[#f7f7f4] hover:text-industrial-ink"
                  }`}
                  key={tab}
                  onClick={() => setCustomerPopupTab(tab as CustomerPopupTab)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </aside>

            <section className="h-full overflow-hidden rounded-xl border border-black/10 bg-white">
              <div className="border-b border-black/10 px-5 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-industrial-muted">
                  {customerPopupTab === "customer"
                    ? "Customer Info"
                    : customerPopupTab === "billing"
                      ? "Billing Info"
                      : customerPopupTab === "shipping"
                        ? "Shipping Info"
                        : "More"}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-industrial-ink">
                  {customerPopupTab === "customer"
                    ? "Who is this customer?"
                    : customerPopupTab === "billing"
                      ? "How should billing work?"
                      : customerPopupTab === "shipping"
                        ? "Where should orders go?"
                        : "Customer settings"}
                </h3>
              </div>
              <div className="h-[500px] overflow-y-auto p-5">
            {customerPopupTab === "customer" ? (
              <div className="grid gap-4">
                <InvoiceInput
                  label="Company name"
                  value={draftCompanyName}
                  onChange={setDraftCompanyName}
                  placeholder="Business or company"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <InvoiceInput
                    label="First name"
                    value={draftCustomerFirstName}
                    onChange={setDraftCustomerFirstName}
                    placeholder="First name"
                  />
                  <InvoiceInput
                    label="Last name"
                    value={draftCustomerLastName}
                    onChange={setDraftCustomerLastName}
                    placeholder="Last name"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InvoiceInput
                    label="Phone number"
                    value={draftPhone}
                    onChange={setDraftPhone}
                    placeholder="Phone"
                  />
                  <InvoiceInput
                    label="Email"
                    value={draftEmail}
                    onChange={setDraftEmail}
                    placeholder="customer@example.com"
                  />
                </div>
                <InvoiceTextarea
                  label="Customer notes"
                  value={draftCustomerNotes}
                  onChange={setDraftCustomerNotes}
                />
              </div>
            ) : null}

            {customerPopupTab === "billing" ? (
              <div className="grid gap-4">
                <InvoiceInput
                  label="Billing address"
                  value={draftAddress}
                  onChange={setDraftAddress}
                  placeholder="Street address"
                />
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_140px]">
                  <InvoiceInput label="Billing city" value={draftCity} onChange={setDraftCity} />
                  <InvoiceInput label="Billing state" value={draftState} onChange={setDraftState} />
                  <InvoiceInput label="Billing zip" value={draftZip} onChange={setDraftZip} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 rounded-lg border border-black/10 bg-[#f8f7f2] p-4 text-sm font-semibold text-industrial-ink">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Tax exempt
                    </span>
                    <select
                      className="h-11 rounded-lg border border-black/10 bg-white px-3 text-sm outline-none"
                      onChange={(event) => setDraftTaxExempt(event.target.value === "yes")}
                      value={draftTaxExempt ? "yes" : "no"}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  <InvoiceInput
                    label="Payment terms"
                    value={draftPaymentTerms}
                    onChange={setDraftPaymentTerms}
                    placeholder="Due on receipt"
                  />
                </div>
              </div>
            ) : null}

            {customerPopupTab === "shipping" ? (
              <div className="grid gap-4">
                <label className="flex items-center gap-3 rounded-lg border border-black/10 bg-[#f8f7f2] px-4 py-3 text-sm font-semibold text-industrial-ink">
                  <input
                    checked={sameAsBillingAddress}
                    className="size-4"
                    onChange={(event) => setSameAsBillingAddress(event.target.checked)}
                    type="checkbox"
                  />
                  Same as Billing Address
                </label>
                <InvoiceInput
                  label="Shipping address"
                  value={sameAsBillingAddress ? draftAddress : draftShippingAddress}
                  onChange={setDraftShippingAddress}
                  placeholder="Street address"
                  readOnly={sameAsBillingAddress}
                />
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_140px]">
                  <InvoiceInput
                    label="Shipping city"
                    value={sameAsBillingAddress ? draftCity : draftShippingCity}
                    onChange={setDraftShippingCity}
                    readOnly={sameAsBillingAddress}
                  />
                  <InvoiceInput
                    label="Shipping state"
                    value={sameAsBillingAddress ? draftState : draftShippingState}
                    onChange={setDraftShippingState}
                    readOnly={sameAsBillingAddress}
                  />
                  <InvoiceInput
                    label="Shipping zip"
                    value={sameAsBillingAddress ? draftZip : draftShippingZip}
                    onChange={setDraftShippingZip}
                    readOnly={sameAsBillingAddress}
                  />
                </div>
                <InvoiceTextarea
                  label="Delivery notes"
                  value={draftDeliveryNotes}
                  onChange={setDraftDeliveryNotes}
                />
              </div>
            ) : null}

            {customerPopupTab === "more" ? (
              <div className="grid gap-4">
                <InvoiceTextarea
                  label="Customer notes"
                  value={draftCustomerNotes}
                  onChange={setDraftCustomerNotes}
                />
                <InvoiceInput
                  label="Payment terms"
                  value={draftPaymentTerms}
                  onChange={setDraftPaymentTerms}
                  placeholder="Due on receipt"
                />
                <label className="flex items-center gap-3 rounded-lg border border-black/10 bg-[#f8f7f2] px-4 py-3 text-sm font-semibold text-industrial-ink">
                  <input
                    checked={draftTaxExempt}
                    className="size-4"
                    onChange={(event) => setDraftTaxExempt(event.target.checked)}
                    type="checkbox"
                  />
                  Customer is tax exempt
                </label>
              </div>
            ) : null}
              </div>
            </section>
          </div>
        </AppModal>
      ) : null}
      </>
    );
  }

  return (
    <PageShell
      className="max-w-none px-4 py-4 md:px-6 md:py-6"
    >
      <div className="grid gap-5">
        <section className="overflow-hidden rounded-xl border-2 border-industrial-ink/10 bg-gradient-to-br from-industrial-paper via-white to-[#f4f1e8] shadow-sm">
          <div className="grid gap-4 p-4 md:p-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-industrial-muted">
                Gateworks Operations
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-industrial-ink md:text-4xl">
                {`Order ${order.orderNumber}`}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-industrial-steel">
                {createMode
                  ? `${order.companyName || "New Customer"} · draft order`
                  : `${order.customerName} · ${order.jobName || "Customer order"}`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2">
                <Badge className="whitespace-nowrap rounded-full shadow-sm" tone="neutral">
                  {createMode ? "Draft order" : statusLabel[order.status]}
                </Badge>
                <Badge
                  className="whitespace-nowrap rounded-full shadow-sm"
                  tone={getPaymentStatusTone(createMode ? draftPaymentStatus : order.paymentStatus)}
                >
                  {createMode ? draftPaymentStatus : paymentLabels[order.paymentStatus]}
                </Badge>
                <Badge className="whitespace-nowrap rounded-full shadow-sm" tone="neutral">
                  {createMode ? "Create mode" : fulfillmentLabels[order.status]}
                </Badge>
                </div>
                {!createMode ? (
                  <div className="min-w-[280px] flex-1 rounded-lg border border-industrial-rail bg-white/85 px-3 py-2 shadow-sm">
                    <OrderProgressBar
                      fulfillmentMethod={order.fulfillmentMethod}
                      status={order.status}
                    />
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Link
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-ink transition hover:border-industrial-ink"
                href={backHref}
              >
                <ArrowLeft size={14} />
                {createMode ? "Cancel" : "Back to Orders"}
              </Link>
              {createMode ? (
                <>
                  <Button
                    className="h-9"
                    disabled={isSubmittingOrder}
                    onClick={() => void handleCreateOrderSubmit("submitted")}
                    size="sm"
                    type="button"
                  >
                    Create Order
                  </Button>
                  <Button
                    className="h-9"
                    disabled={isSubmittingOrder}
                    onClick={() => void handleCreateOrderSubmit("draft")}
                    size="sm"
                    variant="secondary"
                    type="button"
                  >
                    Save Draft
                  </Button>
                </>
              ) : (
                <>
                  <Button className="h-9" onClick={printPickTicket} size="sm" type="button">
                    <Printer size={14} />
                    Print Pick Ticket
                  </Button>
                  <Button
                    className="h-9"
                    disabled={!canToggleReady}
                    onClick={markReady}
                    size="sm"
                    type="button"
                  >
                    <CircleDashed size={14} />
                    {isReadyStatus ? "Mark Not Ready" : "Mark Ready"}
                  </Button>
                  <Button
                    className="h-9"
                    disabled={!canMarkPickupOrDelivery}
                    onClick={markPickedUpOrDelivered}
                    size="sm"
                    type="button"
                  >
                    <CheckCircle2 size={14} />
                    {order.fulfillmentMethod === "pickup" ? "Mark Picked Up" : "Mark Delivered"}
                  </Button>
                  {isEditing ? (
                    <>
                      <Button className="h-9" onClick={saveOrderEdits} size="sm" type="button">
                        <Save size={14} />
                        Save changes
                      </Button>
                      <Button className="h-9" onClick={exitEditing} size="sm" variant="secondary" type="button">
                        <X size={14} />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="h-9"
                      onClick={beginEditing}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Edit order
                    </Button>
                  )}
                </>
              )}
              <details className={`relative ${createMode ? "hidden" : ""}`}>
                <summary
                  className="inline-flex h-9 cursor-pointer items-center rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-ink transition hover:border-industrial-ink"
                >
                  More actions
                </summary>
                <div className="absolute right-0 z-10 mt-2 w-60 border border-industrial-rail bg-white p-2 shadow-sm">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                    onClick={() => {
                      void navigator.clipboard.writeText(order.id);
                      setActionNotice("Order ID copied.");
                    }}
                    type="button"
                  >
                    Copy order id
                  </button>
                  <button
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                    onClick={() =>
                      void navigator.clipboard.writeText(`${order.orderNumber} - ${order.customerName}`)
                    }
                    type="button"
                  >
                    Copy customer reference
                  </button>
                </div>
              </details>
            </div>
          </div>

          {(actionNotice || backendNotice) ? (
            <p className="border-t border-industrial-rail bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-industrial-ink md:px-5">
              {actionNotice || backendNotice}
            </p>
          ) : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-emerald-50/70">
            <CardBody>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Order total</p>
              <p className="mt-1 text-3xl font-black text-industrial-ink">{formatCurrency(summaryTotal)}</p>
              <p className="text-xs text-industrial-steel">{createMode ? "Draft value" : paymentLabels[order.paymentStatus]}</p>
            </CardBody>
          </Card>
          <Card className="bg-amber-50/70">
            <CardBody>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Line items</p>
              <p className="mt-1 text-3xl font-black text-industrial-ink">{lineItems.length}</p>
              <p className="text-xs text-industrial-steel">Material rows on this order</p>
            </CardBody>
          </Card>
          <Card className="bg-indigo-50/70">
            <CardBody>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Pulled</p>
              <p className="mt-1 text-3xl font-black text-industrial-ink">{pulledQuantity}/{totalQuantity}</p>
              <p className="text-xs text-industrial-steel">{pickTicketStatus}</p>
            </CardBody>
          </Card>
          <Card className="bg-violet-50/70">
            <CardBody>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Fulfillment</p>
              <p className="mt-1 text-3xl font-black capitalize text-industrial-ink">{createMode ? draftFulfillmentMethod : order.fulfillmentMethod}</p>
              <p className="text-xs text-industrial-steel">{createMode ? draftRequestedDate || "No date set" : order.requestedDate}</p>
            </CardBody>
          </Card>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-5">
            {createMode ? (
              <section className="grid gap-3 lg:grid-cols-3">
                <Card className="rounded-xl">
                  <CardHeader className="flex items-start justify-between">
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      Customer
                    </p>
                    <h2 className="text-lg font-black text-industrial-ink">Customer Details</h2>
                  </div>
                    <Button
                      onClick={(event) => openPopup(event.currentTarget, "customer")}
                      size="sm"
                      variant="secondary"
                      type="button"
                    >
                      Edit
                    </Button>
                  </CardHeader>
                  <CardBody className="grid gap-1 text-sm">
                    <p className="font-black text-industrial-ink">{draftCustomerName || "No customer selected"}</p>
                    <p className="text-industrial-steel">{draftCompanyName || "No company"}</p>
                    <p className="text-industrial-steel">{draftPhone || "No phone"}</p>
                    <p className="text-industrial-steel">{draftEmail || "No email"}</p>
                  </CardBody>
                </Card>
                <Card className="rounded-xl">
                  <CardHeader className="flex items-start justify-between">
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      Billing
                    </p>
                    <h2 className="text-lg font-black text-industrial-ink">Billing Info</h2>
                  </div>
                    <Button
                      onClick={(event) => openPopup(event.currentTarget, "billing")}
                      size="sm"
                      variant="secondary"
                      type="button"
                    >
                      Edit
                    </Button>
                  </CardHeader>
                  <CardBody className="grid gap-1 text-sm">
                    <p className="text-industrial-ink">{draftAddress || "No billing address"}</p>
                    <p className="text-industrial-steel">
                      {draftCity || draftState || draftZip
                        ? `${draftCity || ""} ${draftState || ""} ${draftZip || ""}`.trim()
                        : "No billing location"}
                    </p>
                  </CardBody>
                </Card>
                <Card className="rounded-xl">
                  <CardHeader className="flex items-start justify-between">
                    <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      Delivery
                    </p>
                    <h2 className="text-lg font-black text-industrial-ink">Delivery Info</h2>
                  </div>
                    <Button
                      onClick={(event) => openPopup(event.currentTarget, "delivery")}
                      size="sm"
                      variant="secondary"
                      type="button"
                    >
                      Edit
                    </Button>
                  </CardHeader>
                  <CardBody className="grid gap-1 text-sm">
                    <p className="text-industrial-ink capitalize">{draftFulfillmentMethod}</p>
                    <p className="text-industrial-steel">
                      {draftRequestedDate || "No date"} · {draftRequestedWindow || "No window"}
                    </p>
                    <p className="text-industrial-steel">
                      {(draftAddress || draftCity || draftState || draftZip)
                        ? `${draftAddress} ${draftCity || ""} ${draftState || ""} ${draftZip || ""}`.trim()
                        : draftFulfillmentMethod === "delivery"
                          ? "No delivery address on file"
                          : "Pickup selected"}
                    </p>
                  </CardBody>
                </Card>
              </section>
            ) : (
              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="rounded-xl">
                  <CardHeader>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Customer information
                      </p>
                      <h2 className="text-xl font-black text-industrial-ink">Customer</h2>
                    </div>
                    <span className="rounded-full border border-industrial-rail bg-industrial-paper px-2 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-industrial-muted">
                      Account
                    </span>
                  </CardHeader>
                  <CardBody className="grid gap-4 text-sm md:grid-cols-2">
                    <div className="rounded-lg border border-industrial-rail bg-industrial-paper p-3">
                      <p className="font-black text-industrial-ink">{order.customerName}</p>
                      <p className="text-industrial-steel">{order.companyName}</p>
                    </div>
                    <div className="rounded-lg border border-industrial-rail bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                        Contact
                      </p>
                      <p className="text-industrial-ink">{order.email}</p>
                      <p className="text-industrial-ink">{order.phone}</p>
                    </div>
                  </CardBody>
                </Card>
                <Card className="rounded-xl">
                  <CardHeader>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                        Billing information
                      </p>
                      <h2 className="text-xl font-black text-industrial-ink">Billing</h2>
                    </div>
                  </CardHeader>
                  <CardBody className="grid gap-2 text-sm leading-6">
                    <p className="text-industrial-ink">Payment profile: Account profile (operational view)</p>
                    <p className="text-industrial-ink">Tax status: Standard rate</p>
                    <p className="text-industrial-ink">Internal payer: {order.userId}</p>
                    <p className="text-industrial-ink">PO/Reference: not provided</p>
                    <p className="text-xs text-industrial-muted">Billing placeholder fields are pending upstream ERP binding.</p>
                  </CardBody>
                </Card>
              </section>
            )}

            {createMode ? null : (
              <section className="grid gap-4 rounded-xl border border-industrial-rail bg-white p-4 shadow-sm">
                <div className="grid gap-3 border-b border-industrial-rail pb-4 md:grid-cols-2">
                  <div className="rounded-lg border border-industrial-rail bg-industrial-paper p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Fulfillment method
                    </p>
                    <p className="mt-1 text-lg font-black capitalize text-industrial-ink">
                      {order.fulfillmentMethod}
                    </p>
                    <p className="text-sm text-industrial-steel">
                      Requested window: {order.requestedWindow}
                    </p>
                  </div>
                  {deliveryAddressAvailable ? (
                    <div className="rounded-lg border border-industrial-rail bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                        Delivery address
                      </p>
                      <p className="font-black text-industrial-ink">
                        {order.jobsiteAddress.name}
                      </p>
                      <p className="text-sm text-industrial-steel">{order.jobsiteAddress.addressLine1}</p>
                      <p className="text-sm text-industrial-steel">
                        {order.jobsiteAddress.city} {order.jobsiteAddress.state} {order.jobsiteAddress.postalCode}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-industrial-rail bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                        Pickup details
                      </p>
                      <p className="text-sm text-industrial-ink">{order.pickupContact}</p>
                      <p className="text-sm text-industrial-steel">Customer pickup at scheduled window.</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-2 text-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Customer notes</p>
                  <Textarea
                    value={draftCustomerNotes}
                    onChange={(event) => setDraftCustomerNotes(event.target.value)}
                    rows={3}
                    className="min-h-16"
                  />
                </div>
                <div className="grid gap-2 text-sm">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Internal notes</p>
                  <Textarea
                    value={draftInternalNotes}
                    onChange={(event) => setDraftInternalNotes(event.target.value)}
                    rows={2}
                    className="min-h-12"
                  />
                </div>
              </section>
            )}

            <Card className="overflow-hidden rounded-xl">
              <CardHeader className="flex-wrap">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Order items
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Items</h2>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  Main operational table
                </p>
              </CardHeader>
              {isEditing && createMode ? (
                <>
                  <div className="border-b border-industrial-rail px-4 py-3">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Search products to add to order
                    </label>
                    <div className="grid gap-2 md:grid-cols-[1.6fr_140px_140px_auto] md:items-end">
                      <Input
                        placeholder="Type name, SKU, size, category, description"
                        value={quickAddProductQuery}
                        onChange={(event) => handleQuickAddProductInput(event.target.value)}
                        onKeyDown={handleQuickAddKeyDown}
                      />
                      <Input
                        inputMode="decimal"
                        placeholder="Qty"
                        value={quickAddQuantity}
                        onChange={(event) => setQuickAddQuantity(event.target.value)}
                      />
                      <Input
                        inputMode="decimal"
                        placeholder="Price"
                        value={quickAddPrice}
                        onChange={(event) => setQuickAddPrice(event.target.value)}
                      />
                      <Button
                        className="w-full normal-case tracking-normal"
                        onClick={() => addDraftItem()}
                        size="sm"
                        type="button"
                      >
                        <Plus size={14} />
                        Add
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-industrial-muted">
                      {getQuickAddStatusNote()}
                    </p>
                    {quickAddHasResults ? (
                      <div className="mt-2 max-h-72 overflow-y-auto border border-industrial-rail">
                        {visibleQuickAddResults.map((result, index) => (
                          <button
                            type="button"
                            key={`${result.product.id}-${result.variant.id}`}
                            className={`flex w-full items-center gap-3 border-b border-industrial-paper px-3 py-2 text-left text-sm hover:bg-industrial-paper ${
                              index === quickAddResultIndex ? "bg-industrial-paper" : "bg-white"
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setQuickAddResultIndex(index)}
                            onClick={() => {
                              selectQuickAddResult(result, index);
                            }}
                          >
                            <img
                              src={result.variant.image || "/assets/logo.svg"}
                              alt={result.product.title}
                              className="h-10 w-10 rounded-md border border-industrial-rail bg-white object-contain p-1"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-black text-industrial-ink">
                                {result.product.title}
                              </span>
                              <span className="block truncate text-xs text-industrial-muted">
                                {result.variant.sku} · {formatVariantSummary(result.variant)}
                              </span>
                            </span>
                            <span className="min-w-[84px] text-right text-xs text-industrial-steel">
                              {formatCurrency(result.variant.price)}
                            </span>
                            <span className="min-w-[90px] text-right text-xs text-industrial-steel">
                              {getVariantInventoryText(result.variant)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : quickAddProductQuery.trim() ? (
                      <p className="mt-2 text-xs text-industrial-muted">
                        {getQuickAddStatusNote()}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-industrial-paper">
                    <tr className="border-b border-industrial-rail/70">
                      <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                        Product
                      </th>
                      {createMode ? (
                        <>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            SKU
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Size
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Line Total
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Size / Variant
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Unit
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Line Total
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Stock Status
                          </th>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                            Pulled Status
                          </th>
                        </>
                      )}
                      {(isEditing && !createMode) ? (
                        <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                          Actions
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {createMode
                      ? draftItems.map((item, index) => (
                          <tr
                            className="border-b border-industrial-rail/60 transition hover:bg-industrial-paper"
                            key={`create-${index}-${item.productId}-${item.variantId}`}
                          >
                            <td className="min-w-72 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.image || "/assets/logo.svg"}
                                  alt={item.title}
                                  className="h-10 w-10 rounded-md border border-industrial-rail bg-white object-contain p-1"
                                />
                                <Input
                                  className="h-10"
                                  onChange={(event) => updateDraftItem(index, "title", event.target.value)}
                                  value={draftItems[index]?.title || ""}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-industrial-steel">{item.sku}</td>
                            <td className="px-4 py-3 text-industrial-steel">{formatCartItemSize(item.options)}</td>
                            <td className="px-4 py-3">
                              <Input
                                className="h-10"
                                inputMode="decimal"
                                onChange={(event) => updateDraftItem(index, "price", Number(event.target.value))}
                                value={item.price || 0}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                className="h-10"
                                inputMode="decimal"
                                onChange={(event) => updateDraftItem(index, "quantity", Number(event.target.value))}
                                value={item.quantity || 0}
                              />
                            </td>
                            <td className="px-4 py-3 font-black text-industrial-ink">
                              {formatCurrency((item.price || 0) * (item.quantity || 0))}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() => removeDraftItem(index)}
                                size="sm"
                                type="button"
                                variant="danger"
                              >
                                <Trash2 size={14} />
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                      : isEditing
                        ? lineItems.map((item, index) => (
                          <tr
                            className="border-b border-industrial-rail/60 transition hover:bg-industrial-paper"
                            key={`edit-${index}-${item.key}`}
                          >
                            <td className="min-w-72 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.image || "/assets/logo.svg"}
                                  alt={item.product}
                                  className="h-10 w-10 rounded-md border border-industrial-rail bg-white object-contain p-1"
                                />
                                <Input
                                  className="h-10"
                                  onChange={(event) => updateDraftItem(index, "title", event.target.value)}
                                  value={draftItems[index]?.title || ""}
                                />
                              </div>
                            </td>
                            <td className="min-w-64 px-4 py-3">
                              <Input
                                className="h-10"
                                onChange={(event) => updateDraftItem(index, "title", event.target.value)}
                                value={draftItems[index]?.title || ""}
                              />
                            </td>
                            <td className="min-w-64 px-4 py-3">
                              <Input
                                className="h-10"
                                onChange={(event) => updateDraftOption(index, "length", event.target.value)}
                                placeholder="Size / variant"
                                value={draftItems[index]?.options?.length || ""}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                className="h-10"
                                inputMode="decimal"
                                onChange={(event) => updateDraftItem(index, "quantity", Number(event.target.value))}
                                value={draftItems[index]?.quantity || 0}
                              />
                            </td>
                            <td className="px-4 py-3 text-industrial-steel">EA</td>
                            <td className="px-4 py-3">
                              <Input
                                className="h-10"
                                inputMode="decimal"
                                onChange={(event) =>
                                  updateDraftItem(index, "price", Number(event.target.value))
                                }
                                value={draftItems[index]?.price || 0}
                              />
                            </td>
                            <td className="px-4 py-3 font-black text-industrial-ink">
                              {formatCurrency((draftItems[index]?.price || 0) * (draftItems[index]?.quantity || 0))}
                            </td>
                            <td className="px-4 py-3 text-industrial-steel">{item.stockStatus}</td>
                            <td className="px-4 py-3 text-industrial-ink">{item.pulledStatus}</td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() => removeDraftItem(index)}
                                size="sm"
                                type="button"
                                variant="danger"
                              >
                                <Trash2 size={14} />
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))
                        : lineItems.map((item) => (
                          <tr
                            className="border-b border-industrial-rail/60 transition hover:bg-industrial-paper"
                            key={`view-${item.key}`}
                          >
                            <td className="min-w-72 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.image || "/assets/logo.svg"}
                                  alt={item.product}
                                  className="h-10 w-10 rounded-md border border-industrial-rail bg-white object-contain p-1"
                                />
                                <span className="font-black text-industrial-ink">{item.product}</span>
                              </div>
                            </td>
                            <td className="min-w-64 px-4 py-3 text-industrial-steel">{item.variant}</td>
                            <td className="px-4 py-3 text-industrial-ink">{item.quantity}</td>
                            <td className="px-4 py-3 text-industrial-steel">{item.unit}</td>
                            <td className="px-4 py-3 font-black text-industrial-ink">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-industrial-ink">{formatCurrency(item.lineTotal)}</td>
                            <td className="px-4 py-3 text-industrial-steel">{item.stockStatus}</td>
                            <td className="px-4 py-3 text-industrial-ink">{item.pulledStatus}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Timeline
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Activity log</h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-3">
                {timelineEvents.length ? (
                  timelineEvents.map((event) => (
                    <div className="grid gap-1 rounded-lg border border-industrial-rail bg-white p-3" key={event.id}>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                        {formatDateTime(event.createdAt)}
                      </p>
                      <p className="font-black text-industrial-ink">{event.label}</p>
                      <p className="text-sm text-industrial-steel">{event.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                    No activity yet.
                  </p>
                )}
              </CardBody>
            </Card>
          </div>

          {createMode ? (
            <aside className="grid gap-4 self-start">
              <Card className="rounded-xl">
                <CardHeader>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Payment summary
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Draft totals</h2>
                </CardHeader>
                <CardBody className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-industrial-steel">Subtotal</span>
                    <span className="font-black text-industrial-ink">{formatCurrency(summarySubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-industrial-steel">Tax (8.25%)</span>
                    <span className="font-black text-industrial-ink">{formatCurrency(summaryTax)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-industrial-steel">Delivery fee</span>
                    <Input
                      inputMode="decimal"
                      value={draftDeliveryFee}
                      onChange={(event) => setDraftDeliveryFee(event.target.value)}
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-3 border-b border-industrial-rail pb-2">
                    <span className="text-industrial-steel">{draftDiscountLabel}</span>
                    <Select
                      aria-label="Discount type"
                      className="w-28"
                      onChange={(event) => setDraftDiscountMode(event.target.value as DraftDiscountMode)}
                      value={draftDiscountMode}
                    >
                      <option value="amount">Amount</option>
                      <option value="percent">Percent</option>
                    </Select>
                    <Input
                      inputMode="decimal"
                      value={draftDiscount}
                      onChange={(event) => setDraftDiscount(event.target.value)}
                      className="w-32"
                      placeholder={draftDiscountMode === "percent" ? "0" : "0.00"}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-black text-industrial-ink">Total</span>
                    <span className="text-xl font-black text-industrial-ink">{formatCurrency(summaryTotal)}</span>
                  </div>
                </CardBody>
              </Card>
              <Card className="rounded-xl">
                <CardHeader>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Notes
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Order notes</h2>
                </CardHeader>
                <CardBody className="grid gap-2 text-sm">
                  <label>
                    <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      New note
                    </span>
                    <Textarea
                      value={draftOrderNoteInput}
                      onChange={(event) => setDraftOrderNoteInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          createDraftNote();
                        }
                      }}
                      rows={3}
                      className="min-h-16"
                      placeholder="Type a note and save."
                    />
                  </label>
                  <div className="flex justify-end">
                    <Button className="normal-case tracking-normal" onClick={createDraftNote} size="sm" type="button">
                      Add note
                    </Button>
                  </div>
                  {draftOrderNotes.length > 0 ? (
                    <div className="grid gap-2">
                      {draftOrderNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-industrial-rail bg-white p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                              {formatNoteTimestamp(note.createdAt)}
                            </p>
                            <Button
                              className="h-7 px-2 text-[11px]"
                              onClick={() => deleteDraftNote(note.id)}
                              size="sm"
                              type="button"
                              variant="secondary"
                            >
                              <Trash2 size={12} />
                              Delete
                            </Button>
                          </div>
                          <p className="whitespace-pre-wrap text-industrial-ink">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-industrial-rail px-3 py-2 text-xs text-industrial-muted">
                      No notes yet.
                    </p>
                  )}
                </CardBody>
              </Card>
            </aside>
          ) : (
            <aside className="grid gap-4 self-start xl:sticky xl:top-4">
              <Card className="overflow-hidden rounded-xl border-2 border-industrial-ink/10">
                <CardHeader>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Fulfillment</p>
                  <h2 className="text-xl font-black text-industrial-ink">Warehouse panel</h2>
                </CardHeader>
                <CardBody className="grid gap-3 text-sm">
                  <div className="grid gap-2 rounded-lg border border-industrial-rail bg-industrial-paper p-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Pick ticket status</p>
                    <p className="text-2xl font-black text-industrial-ink">{pickTicketStatus}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="font-black text-industrial-ink">Assigned staff</p>
                    <p className="text-industrial-steel">{assignedStaff}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="font-black text-industrial-ink">Items pulled</p>
                    <p className="text-industrial-steel">
                      {pulledQuantity} / {totalQuantity}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="font-black text-industrial-ink">Items remaining</p>
                    <p className="text-industrial-steel">{remainingQuantity}</p>
                  </div>
                  <div className="grid gap-1">
                    <p className="font-black text-industrial-ink">Pickup/delivery time</p>
                    <p className="text-industrial-steel">{order.requestedDate} · {order.requestedWindow}</p>
                  </div>
                  <Button className="w-full normal-case tracking-normal" onClick={printPickTicket} size="sm" type="button">
                    <Printer size={14} />
                    Print pick ticket
                  </Button>
                  <Button className="w-full normal-case tracking-normal" onClick={markItemsPulled} size="sm" variant="secondary" type="button">
                    <RefreshCw size={14} />
                    Mark items pulled
                  </Button>
                </CardBody>
              </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Payment summary
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Totals</h2>
              </CardHeader>
              <CardBody className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-industrial-steel">Subtotal</span>
                  <span className="font-black text-industrial-ink">{formatCurrency(summarySubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-industrial-steel">Tax</span>
                  <span className="font-black text-industrial-ink">{formatCurrency(summaryTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-industrial-steel">Delivery fee</span>
                  <span className="font-black text-industrial-ink">{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-b border-industrial-rail pb-2">
                  <span className="text-industrial-steel">Discounts</span>
                  <span className="font-black text-industrial-ink">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-black text-industrial-ink">Total</span>
                  <span className="text-xl font-black text-industrial-ink">{formatCurrency(summaryTotal)}</span>
                </div>
                <div className="grid gap-1 rounded-lg border border-industrial-rail bg-industrial-paper p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Payment method</p>
                  <p className="flex items-center gap-2 text-sm text-industrial-steel">
                    <CreditCard size={14} />
                    Account / terminal payment (not connected)
                  </p>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Status</p>
                  <p className="text-sm text-industrial-steel">{paymentLabels[order.paymentStatus]}</p>
                </div>
              </CardBody>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Actions
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Right-side action panel</h2>
              </CardHeader>
              <CardBody className="grid gap-2">
                <Button
                  className="w-full normal-case tracking-normal"
                  onClick={isEditing ? saveOrderEdits : beginEditing}
                  size="sm"
                  type="button"
                >
                  <FileText size={14} />
                  {isEditing ? "Save changes" : "Edit order"}
                </Button>
                {isEditing ? (
                  <Button
                    className="w-full normal-case tracking-normal"
                    onClick={exitEditing}
                    size="sm"
                    variant="secondary"
                    type="button"
                  >
                    <X size={14} />
                    Cancel edit
                  </Button>
                ) : null}
                <Button className="w-full normal-case tracking-normal" onClick={printInvoice} size="sm" type="button">
                  <Printer size={14} />
                  Print invoice
                </Button>
                <Button className="w-full normal-case tracking-normal" onClick={printPickTicket} size="sm" variant="secondary" type="button">
                  <Truck size={14} />
                  Print pick ticket
                </Button>
                <Button className="w-full normal-case tracking-normal" onClick={sendCustomerUpdate} size="sm" variant="secondary" type="button">
                  <RefreshCw size={14} />
                  Send customer update
                </Button>
                <Button
                  className="w-full normal-case tracking-normal"
                  onClick={markReady}
                  size="sm"
                  variant="secondary"
                  type="button"
                >
                  Mark ready for pickup
                </Button>
                <Button
                  className="w-full normal-case tracking-normal"
                  onClick={markPickedUpOrDelivered}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Mark delivered
                </Button>
                <Button
                  className="w-full normal-case tracking-normal"
                  onClick={cancelOrder}
                  size="sm"
                  variant="danger"
                  type="button"
                >
                  Cancel order
                </Button>
                <Button
                  className="w-full normal-case tracking-normal"
                  onClick={refundOrder}
                  size="sm"
                  variant="secondary"
                  type="button"
                >
                  <RefreshCw size={14} />
                  Refund order
                </Button>
                {hasRealData ? null : (
                  <p className="grid gap-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-900">
                    <span className="flex items-center gap-2">
                      <AlertCircle size={12} />
                      Placeholder action status
                    </span>
                    Some actions are local UI actions until backend routes are connected.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Delivery route note
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Routing context</h2>
              </CardHeader>
              <CardBody className="text-sm text-industrial-steel">
                <p>
                  {order.fulfillmentMethod === "delivery"
                    ? "Driver route is generated from delivery window and yard priority."
                    : "Customer pickup queue is ready for loading and release."}
                </p>
              </CardBody>
            </Card>
          </aside>
          )}
        </div>
        {isCustomerPopupOpen ? (
          <AppModal
            focusReturnRef={popupTriggerRef}
            initialFocusSelector="[data-modal-autofocus]"
            isDirty={() => isPopupDirty("customer")}
            open
            title="Select / Edit Customer"
            onClose={closeOrderDraftPopups}
            onCancel={closeOrderDraftPopups}
            onConfirm={saveCustomerPopup}
            confirmLabel="Save Customer"
          >
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Customer Name
              </span>
              <Input
                data-modal-autofocus
                value={draftCustomerName}
                onChange={(event) => setDraftCustomerName(event.target.value)}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Company Name
              </span>
              <Input value={draftCompanyName} onChange={(event) => setDraftCompanyName(event.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Phone Number
              </span>
              <Input value={draftPhone} onChange={(event) => setDraftPhone(event.target.value)} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Email
              </span>
              <Input value={draftEmail} onChange={(event) => setDraftEmail(event.target.value)} />
            </label>
          </AppModal>
        ) : null}

        {isBillingPopupOpen ? (
          <AppModal
            focusReturnRef={popupTriggerRef}
            initialFocusSelector="[data-modal-autofocus]"
            isDirty={() => isPopupDirty("billing")}
            open
            title="Billing Info"
            onClose={closeOrderDraftPopups}
            onCancel={closeOrderDraftPopups}
            onConfirm={saveBillingPopup}
            confirmLabel="Save Billing Info"
          >
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Billing Address
              </span>
              <Input
                data-modal-autofocus
                value={draftAddress}
                onChange={(event) => setDraftAddress(event.target.value)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  City
                </span>
                <Input value={draftCity} onChange={(event) => setDraftCity(event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  State
                </span>
                <Input value={draftState} onChange={(event) => setDraftState(event.target.value)} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  ZIP
                </span>
                <Input value={draftZip} onChange={(event) => setDraftZip(event.target.value)} />
              </label>
            </div>
          </AppModal>
        ) : null}

        {isDeliveryPopupOpen ? (
          <AppModal
            focusReturnRef={popupTriggerRef}
            initialFocusSelector="[data-modal-autofocus]"
            isDirty={() => isPopupDirty("delivery")}
            open
            title="Delivery Info"
            onClose={closeOrderDraftPopups}
            onCancel={closeOrderDraftPopups}
            onConfirm={saveDeliveryPopup}
            confirmLabel="Save Delivery Info"
          >
            <label className="grid gap-1">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Fulfillment type
              </span>
              <select
                aria-label="Fulfillment type"
                data-modal-autofocus
                className="h-10 rounded-md border border-industrial-rail bg-white px-3 text-sm font-semibold text-industrial-ink outline-none transition focus:border-industrial-ink"
                value={draftFulfillmentMethod}
                onChange={(event) => setDraftFulfillmentMethod(event.target.value as FulfillmentMethod)}
              >
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  Requested date
                </span>
                <Input
                  value={draftRequestedDate}
                  onChange={(event) => setDraftRequestedDate(event.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                  Requested window
                </span>
                <Input
                  value={draftRequestedWindow}
                  onChange={(event) => setDraftRequestedWindow(event.target.value)}
                  placeholder="9:00 AM - 12:00 PM"
                />
              </label>
            </div>
            {draftFulfillmentMethod === "delivery" ? (
              <div className="grid gap-2">
                <label>
                  <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                    Delivery Address
                  </span>
                  <Input
                    value={draftAddress}
                    onChange={(event) => setDraftAddress(event.target.value)}
                    placeholder="Address line 1"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      City
                    </span>
                    <Input value={draftCity} onChange={(event) => setDraftCity(event.target.value)} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      State
                    </span>
                    <Input value={draftState} onChange={(event) => setDraftState(event.target.value)} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      ZIP
                    </span>
                    <Input value={draftZip} onChange={(event) => setDraftZip(event.target.value)} />
                  </label>
                </div>
              </div>
            ) : null}
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                Delivery Notes
              </span>
              <Textarea
                value={draftDeliveryNotes}
                onChange={(event) => setDraftDeliveryNotes(event.target.value)}
                rows={2}
                className="min-h-16"
              />
            </label>
          </AppModal>
        ) : null}
      </div>
    </PageShell>
  );
}

function InvoiceInput({
  label,
  value,
  type = "text",
  readOnly = false,
  placeholder = "",
  compact = false,
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
  compact?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={compact ? "block" : "mt-3 block"}>
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">{label}</span>
      <input
        className={`${compact ? "h-9" : "h-10"} mt-1 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white read-only:text-industrial-muted`}
        readOnly={readOnly}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InvoiceTextarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">{label}</span>
      <textarea
        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-black/10 bg-[#f7f7f4] px-3 py-2 text-sm leading-6 text-industrial-ink outline-none focus:bg-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-industrial-muted">{label}</span>
      <span className="font-medium text-industrial-ink">{value}</span>
    </div>
  );
}
