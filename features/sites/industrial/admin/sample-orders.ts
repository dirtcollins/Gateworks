import type { OrderRecord } from "@/lib/order-store";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin sample orders. Used as a fallback when the
 * order store and /api/orders return nothing, so the back-office
 * always demonstrates a populated queue.
 * ------------------------------------------------------------------ */

function makeSample(overrides: Partial<OrderRecord>): OrderRecord {
  const now = new Date();

  return {
    id: `sample-${Math.random().toString(36).slice(2, 10)}`,
    orderNumber: "Order-10027",
    userId: "sample",
    customerName: "Guest Customer",
    companyName: "Guest Customer",
    email: "orders@example.com",
    phone: "555-0100",
    items: [],
    fulfillmentMethod: "delivery",
    requestedDate: new Date(now.getTime() + 86400000).toISOString().slice(0, 10),
    requestedWindow: "10:00 AM - 1:00 PM",
    jobName: "Metal supply project",
    jobsiteAddress: {
      name: "Guest Customer",
      company: "Guest Customer",
      email: "orders@example.com",
      phone: "555-0100",
      addressLine1: "1100 Industrial Ave",
      addressLine2: "",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90025",
      notes: "Call before arrival."
    },
    drawings: [],
    pickupContact: "Guest Customer",
    subtotal: 860,
    tax: 72.6,
    deliveryFee: 35,
    total: 967.6,
    status: "submitted",
    paymentStatus: "unpaid",
    isQuoteRequest: false,
    createdAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    updatedAt: new Date(now.getTime() - 20 * 60000).toISOString(),
    activity: [
      {
        id: `sample-activity-${Math.random().toString(36).slice(2, 8)}`,
        label: "Order submitted",
        detail: "Order captured and placed in the active queue.",
        createdAt: new Date(now.getTime() - 12 * 3600000).toISOString()
      }
    ],
    ...overrides
  };
}

export const sampleAdminOrders: OrderRecord[] = [
  makeSample({
    id: "sample-order-1",
    orderNumber: "Order-10021",
    customerName: "Jessie Metal Supply",
    companyName: "Jessie Metal Supply",
    fulfillmentMethod: "delivery",
    status: "submitted",
    paymentStatus: "unpaid",
    jobName: "North yard rebuild",
    items: [
      {
        productId: "square-tube-2",
        variantId: "square-tube-2-11ga",
        title: "2 in square tubing, 11 ga",
        sku: "TUBE-SQ-2-11GA",
        image: "/assets/logo.svg",
        price: 52,
        quantity: 18,
        options: { material: "Steel" }
      }
    ],
    subtotal: 936,
    tax: 77.22,
    deliveryFee: 0,
    total: 1013.22
  }),
  makeSample({
    id: "sample-order-2",
    orderNumber: "Order-10022",
    customerName: "Coastal Fencing LLC",
    companyName: "Coastal Fencing LLC",
    fulfillmentMethod: "pickup",
    status: "confirmed",
    paymentStatus: "partial",
    jobName: "Harbor fence run",
    items: [
      {
        productId: "flat-bar-2",
        variantId: "flat-bar-2-14",
        title: "2 in flat bar",
        sku: "BAR-FLAT-2-14",
        image: "/assets/logo.svg",
        price: 31,
        quantity: 40,
        options: { material: "Steel" }
      }
    ],
    subtotal: 1240,
    tax: 102.3,
    deliveryFee: 0,
    total: 1342.3
  }),
  makeSample({
    id: "sample-order-3",
    orderNumber: "Order-10023",
    customerName: "Ironworks Depot",
    companyName: "Ironworks Depot",
    fulfillmentMethod: "pickup",
    status: "ready_for_pickup",
    paymentStatus: "paid",
    jobName: "Shop stock replenishment",
    subtotal: 11500,
    tax: 948.75,
    deliveryFee: 0,
    total: 12448.75
  }),
  makeSample({
    id: "sample-order-4",
    orderNumber: "Order-10024",
    customerName: "Forge Lane Group",
    companyName: "Forge Lane Group",
    fulfillmentMethod: "delivery",
    status: "out_for_delivery",
    paymentStatus: "paid",
    jobName: "Driveway gate install",
    subtotal: 5180,
    tax: 427.35,
    deliveryFee: 0,
    total: 5607.35
  }),
  makeSample({
    id: "sample-order-5",
    orderNumber: "Order-10025",
    customerName: "Summit Gates",
    companyName: "Summit Gates",
    fulfillmentMethod: "delivery",
    status: "completed",
    paymentStatus: "paid",
    jobName: "Ranch perimeter",
    subtotal: 2865,
    tax: 236.36,
    deliveryFee: 0,
    total: 3101.36
  })
];
