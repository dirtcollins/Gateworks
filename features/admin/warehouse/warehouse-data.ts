import type { InventoryRow } from "@/features/admin/inventory/inventory-data";
import type { OrderRecord } from "@/lib/order-store";
import type { CartItem } from "@/lib/types";
import type { OrderStatus } from "@/lib/platform-backend";

export type PickTicketStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_pickup"
  | "ready_for_delivery"
  | "completed";

export type PickLineStatus = "open" | "short" | "picked" | "substitute";

export type PickLine = {
  id: string;
  orderItemId: string;
  productId: string;
  variantId: string;
  image: string;
  sku: string;
  title: string;
  quantityNeeded: number;
  quantityPulled: number;
  pulled: boolean;
  pulledAt?: string;
  pulledBy?: string;
  notes: string;
  binCode: string;
  locationCode: string;
  available: number;
  status: PickLineStatus;
  inventoryNote: string;
};

export type PickTicketProgress = {
  lineCount: number;
  totalQuantity: number;
  pulledQuantity: number;
  pulledLines: number;
  isFullyPicked: boolean;
  status: PickTicketStatus;
};

export const operationalStatuses: OrderStatus[] = [
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery",
  "completed"
];

export const pickTicketStatusLabels: Record<PickTicketStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  ready_for_pickup: "Ready for Pickup",
  ready_for_delivery: "Ready for Delivery",
  completed: "Completed"
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  confirmed: "Confirmed",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

const sampleProductImages: Record<string, string> = {
  "TUBE-SQ-2-11GA": "/assets/product-images/50-tca3s3-p.png",
  "GATE-LATCH-COM-BLK": "/assets/product-images/28-nw38308q-p.png",
  "PAINT-PRIMER-BLK-GAL": "/assets/product-images/24-dac-7000.png",
  "ORN-PANEL-48-BLK": "/assets/product-images/21-6149-latch.png",
  "CANE-BOLT-24-BLK": "/assets/product-images/16-lakqu2-kit.png"
};

function resolvePickImage(item: CartItem) {
  if (item.image && !item.image.endsWith("/logo.svg")) return item.image;
  return sampleProductImages[item.sku] || "/assets/product-images/21-6149-latch.png";
}

export const sampleWarehouseOrders: OrderRecord[] = [
  {
    id: "warehouse-sample-1",
    orderNumber: "ORD-102401",
    userId: "sample",
    customerName: "Rafael Torres",
    companyName: "Torres Ironworks",
    email: "warehouse@example.com",
    phone: "555-0148",
    items: [
      {
        productId: "square-tube-2",
        variantId: "square-tube-2-11ga",
        title: "2 in square tubing, 11 ga",
        sku: "TUBE-SQ-2-11GA",
        image: sampleProductImages["TUBE-SQ-2-11GA"],
        price: 52,
        quantity: 12,
        options: { material: "Steel", length: "20 ft" }
      },
      {
        productId: "gate-latch-kit",
        variantId: "gate-latch-kit-black",
        title: "Commercial gate latch kit",
        sku: "GATE-LATCH-COM-BLK",
        image: sampleProductImages["GATE-LATCH-COM-BLK"],
        price: 185,
        quantity: 2,
        options: { finish: "Black" }
      },
      {
        productId: "paint-primer-black",
        variantId: "paint-primer-black-gal",
        title: "Black metal primer",
        sku: "PAINT-PRIMER-BLK-GAL",
        image: sampleProductImages["PAINT-PRIMER-BLK-GAL"],
        price: 38,
        quantity: 4,
        options: { color: "Black" }
      }
    ],
    fulfillmentMethod: "pickup",
    requestedDate: "2026-05-15",
    requestedWindow: "11:00 AM - 1:00 PM",
    jobName: "Shop pickup rack order",
    jobsiteAddress: {
      name: "Rafael Torres",
      company: "Torres Ironworks",
      email: "warehouse@example.com",
      phone: "555-0148",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      notes: "Stage long material by south roll-up door."
    },
    drawings: [],
    pickupContact: "Rafael Torres",
    subtotal: 1146,
    tax: 94.55,
    deliveryFee: 0,
    total: 1240.55,
    status: "confirmed",
    paymentStatus: "unpaid",
    fulfillmentStatus: "queued",
    deliveryStatus: "none",
    isQuoteRequest: false,
    createdAt: "2026-05-14T17:30:00.000Z",
    updatedAt: "2026-05-14T17:30:00.000Z",
    activity: [
      {
        id: "warehouse-sample-activity-1",
        label: "Order confirmed",
        detail: "Ready for warehouse picking.",
        createdAt: "2026-05-14T17:30:00.000Z"
      }
    ]
  },
  {
    id: "warehouse-sample-2",
    orderNumber: "ORD-102402",
    userId: "sample",
    customerName: "Elena Ruiz",
    companyName: "Ruiz Gate Co.",
    email: "dispatch@example.com",
    phone: "555-0173",
    items: [
      {
        productId: "ornamental-panel-48",
        variantId: "ornamental-panel-48-black",
        title: "Ornamental iron panel 48 in",
        sku: "ORN-PANEL-48-BLK",
        image: sampleProductImages["ORN-PANEL-48-BLK"],
        price: 420,
        quantity: 6,
        options: { finish: "Black primer" }
      },
      {
        productId: "cane-bolt-24",
        variantId: "cane-bolt-24-black",
        title: "24 in cane bolt",
        sku: "CANE-BOLT-24-BLK",
        image: sampleProductImages["CANE-BOLT-24-BLK"],
        price: 48,
        quantity: 2,
        options: { finish: "Black" }
      }
    ],
    fulfillmentMethod: "delivery",
    requestedDate: "2026-05-16",
    requestedWindow: "9:00 AM - 11:00 AM",
    jobName: "West gate delivery",
    jobsiteAddress: {
      name: "Elena Ruiz",
      company: "Ruiz Gate Co.",
      email: "dispatch@example.com",
      phone: "555-0173",
      addressLine1: "8800 Yard Road",
      addressLine2: "Gate B",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90002",
      notes: "Forklift unload required. Driver needs photos at drop."
    },
    drawings: [],
    pickupContact: "Elena Ruiz",
    subtotal: 2616,
    tax: 215.82,
    deliveryFee: 0,
    total: 2831.82,
    status: "picking",
    paymentStatus: "unpaid",
    fulfillmentStatus: "picking",
    deliveryStatus: "loaded",
    isQuoteRequest: false,
    createdAt: "2026-05-14T18:15:00.000Z",
    updatedAt: "2026-05-14T18:15:00.000Z",
    activity: [
      {
        id: "warehouse-sample-activity-2",
        label: "Sent to picking",
        detail: "Delivery order staged for route planning.",
        createdAt: "2026-05-14T18:15:00.000Z"
      }
    ]
  }
];

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function formatWarehouseDate(value: string) {
  if (!value) return "Unscheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function fallbackBinFromSku(sku: string) {
  const seed = sku
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  const aisle = ["A", "B", "C", "D", "E", "F"][seed % 6];
  const rack = String((seed % 12) + 1).padStart(2, "0");
  const bin = String((seed % 18) + 1).padStart(2, "0");
  return `${aisle}-${rack}-${bin}`;
}

export function getOperationalOrders(orders: OrderRecord[]) {
  return orders.filter(
    (order) => !order.isQuoteRequest && operationalStatuses.includes(order.status)
  );
}

export function buildPickLines(
  order: OrderRecord,
  inventoryRows: InventoryRow[]
): PickLine[] {
  return order.items.map((item) => {
    const inventoryRow = inventoryRows.find(
      (row) =>
        normalize(row.sku) === normalize(item.sku) ||
        row.variantId === item.variantId ||
        row.productId === item.productId
    );
    const available = inventoryRow?.quantityAvailable ?? Math.max(0, 18 - item.quantity);
    const status: PickLineStatus =
      available <= 0 ? "short" : available < item.quantity ? "substitute" : "open";

    return {
      id: `${order.id}-${item.variantId}`,
      orderItemId: item.orderItemId || item.variantId,
      productId: item.productId,
      variantId: item.variantId,
      image: resolvePickImage(item),
      sku: item.sku,
      title: item.title,
      quantityNeeded: item.quantityNeeded || item.quantity,
      quantityPulled: item.quantityPulled || 0,
      pulled: item.pulled || false,
      pulledAt: item.pulledAt,
      pulledBy: item.pulledBy,
      notes: item.pickNotes || "",
      binCode: inventoryRow?.binCode || fallbackBinFromSku(item.sku),
      locationCode: inventoryRow?.locationCode || fallbackBinFromSku(item.sku).slice(0, 1),
      available,
      status,
      inventoryNote:
        status === "short"
          ? "No available stock. Escalate before staging."
          : status === "substitute"
          ? "Available stock is below requested quantity."
          : "Scan SKU and confirm count."
    };
  });
}

export function getBasePickStatus(order: OrderRecord): PickTicketStatus {
  if (order.status === "completed") return "completed";
  if (order.status === "ready_for_pickup") return "ready_for_pickup";
  if (order.status === "out_for_delivery") return "ready_for_delivery";
  if (order.status === "picking") return "in_progress";
  return "not_started";
}

export function getPickTicketProgress(
  order: OrderRecord,
  lines: PickLine[],
  progressByLine: Record<string, { quantityPulled: number; pulled: boolean }>
): PickTicketProgress {
  const totalQuantity = lines.reduce((total, line) => total + line.quantityNeeded, 0);
  const pulledQuantity = lines.reduce((total, line) => {
    const progress = progressByLine[line.id];
    return (
      total +
      Math.min(line.quantityNeeded, progress?.quantityPulled ?? line.quantityPulled)
    );
  }, 0);
  const pulledLines = lines.filter((line) => {
    const progress = progressByLine[line.id];
    const quantityPulled = progress?.quantityPulled ?? line.quantityPulled;
    return Boolean(progress?.pulled ?? line.pulled) || quantityPulled >= line.quantityNeeded;
  }).length;
  const isFullyPicked = totalQuantity > 0 && pulledQuantity >= totalQuantity;
  const baseStatus = getBasePickStatus(order);
  const status: PickTicketStatus =
    baseStatus === "completed" ||
    baseStatus === "ready_for_pickup" ||
    baseStatus === "ready_for_delivery"
      ? baseStatus
      : isFullyPicked
      ? order.fulfillmentMethod === "pickup"
        ? "ready_for_pickup"
        : "ready_for_delivery"
      : pulledQuantity > 0 || baseStatus === "in_progress"
      ? "in_progress"
      : "not_started";

  return {
    lineCount: lines.length,
    totalQuantity,
    pulledQuantity,
    pulledLines,
    isFullyPicked,
    status
  };
}
