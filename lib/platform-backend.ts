export const staffRoles = [
  "admin",
  "manager",
  "warehouse",
  "driver",
  "accounting",
  "sales_counter",
  "purchasing"
] as const;

export const orderStatuses = [
  "draft",
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled"
] as const;

export const documentStatuses = [
  "draft",
  "sent",
  "accepted",
  "converted",
  "void"
] as const;

export const paymentStatuses = [
  "unpaid",
  "partial",
  "paid",
  "overpaid",
  "refunded",
  "failed"
] as const;

export const fulfillmentStatuses = [
  "queued",
  "picking",
  "ready",
  "partially_fulfilled",
  "fulfilled",
  "cancelled"
] as const;

export const deliveryStatuses = [
  "none",
  "scheduled",
  "assigned",
  "loaded",
  "out_for_delivery",
  "delivered",
  "failed",
  "cancelled"
] as const;

export const inventoryEventTypes = [
  "receive",
  "adjust",
  "reserve",
  "release",
  "pick",
  "ship",
  "return",
  "cycle_count"
] as const;

export const fulfillmentMethods = ["pickup", "delivery"] as const;

export const platformStorageBuckets = [
  "product-photos",
  "customer-drawings",
  "supplier-invoices",
  "delivery-photos",
  "documents"
] as const;

export type StaffRole = (typeof staffRoles)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type DocumentStatus = (typeof documentStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type FulfillmentStatus = (typeof fulfillmentStatuses)[number];
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type InventoryEventType = (typeof inventoryEventTypes)[number];
export type FulfillmentMethod = (typeof fulfillmentMethods)[number];
export type PlatformStorageBucket = (typeof platformStorageBuckets)[number];

export type OperationsSummary = {
  pendingOrders: number;
  lowInventoryAlerts: number;
  openInvoices: number;
  pendingDeliveries: number;
  supplierOrders: number;
};
