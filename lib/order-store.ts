"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makeScopedStoreName,
  readScopedPersistedState
} from "@/lib/scoped-store";
import type { CartItem } from "@/lib/types";
import type { FulfillmentMethod, OrderStatus, PaymentStatus } from "@/lib/platform-backend";

export type OrderAddress = {
  name: string;
  company: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  notes: string;
};

export type CustomerDrawing = {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath?: string;
  publicUrl?: string;
  uploadedAt: string;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  items: CartItem[];
  fulfillmentMethod: FulfillmentMethod;
  requestedDate: string;
  requestedWindow: string;
  jobName: string;
  jobsiteAddress: OrderAddress;
  drawings: CustomerDrawing[];
  pickupContact: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  isQuoteRequest: boolean;
  createdAt: string;
  updatedAt: string;
  activity: Array<{
    id: string;
    label: string;
    detail: string;
    createdAt: string;
  }>;
};

type CreateOrderInput = Omit<OrderRecord, "id" | "orderNumber" | "createdAt" | "updatedAt" | "activity">;

type OrderState = {
  orders: OrderRecord[];
  setOrders: (orders: OrderRecord[]) => void;
  isRemoteOrdersLoading: boolean;
  hasRemoteOrdersLoaded: boolean;
  setRemoteOrdersLoading: (value: boolean) => void;
  setRemoteOrdersLoaded: (value: boolean) => void;
  createOrder: (order: CreateOrderInput) => OrderRecord;
  updateOrderStatus: (orderId: string, status: OrderStatus, detail?: string) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus, detail?: string) => void;
  upsertOrder: (order: OrderRecord) => void;
  clearOrders: () => void;
};

const orderStoreName = "gateworks-orders";

function orderDefaults() {
  return { orders: [] };
}

function getNextOrderNumber(orders: OrderRecord[]) {
  const highest = orders.reduce((currentHighest, order) => {
    const number = Number(order.orderNumber.replace(/\D/g, ""));
    return Number.isFinite(number) ? Math.max(currentHighest, number) : currentHighest;
  }, 2000);

  return `GW-${highest + 1}`;
}

function makeActivity(label: string, detail: string) {
  return {
    id: `${Date.now()}-${label}`,
    label,
    detail,
    createdAt: new Date().toISOString()
  };
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      isRemoteOrdersLoading: false,
      hasRemoteOrdersLoaded: false,
      setRemoteOrdersLoading: (value) => set({ isRemoteOrdersLoading: value }),
      setRemoteOrdersLoaded: (value) => set({ hasRemoteOrdersLoaded: value }),
      setOrders: (orders) => set({ orders }),
      createOrder: (order) => {
        const now = new Date().toISOString();
        const record: OrderRecord = {
          ...order,
          id: `order-${Date.now()}`,
          orderNumber: getNextOrderNumber(get().orders),
          createdAt: now,
          updatedAt: now,
          activity: [
            makeActivity(
              order.isQuoteRequest ? "Quote request submitted" : "Order submitted",
              `${order.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"} requested for ${order.requestedDate}.`
            )
          ]
        };

        set((state) => ({ orders: [record, ...state.orders] }));
        return record;
      },
      updateOrderStatus: (orderId, status, detail) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  updatedAt: new Date().toISOString(),
                  activity: [
                    makeActivity("Order status updated", detail || `Status changed to ${status}.`),
                    ...order.activity
                  ]
                }
              : order
          )
        })),
      updatePaymentStatus: (orderId, paymentStatus, detail) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus,
                  updatedAt: new Date().toISOString(),
                  activity: [
                    makeActivity(
                      "Payment status updated",
                      detail || `Payment changed to ${paymentStatus}.`
                    ),
                    ...order.activity
                  ]
                }
              : order
          )
        })),
      upsertOrder: (order) =>
        set((state) => {
          const index = state.orders.findIndex((item) => item.id === order.id);
          const next = [...state.orders];

          if (index >= 0) {
            next[index] = {
              ...order,
              id: state.orders[index].id,
              updatedAt: new Date().toISOString()
            };
            return { orders: next };
          }

          return { orders: [order, ...state.orders] };
        }),
      clearOrders: () => set({ orders: [] })
    }),
    {
      name: makeScopedStoreName(orderStoreName, "guest"),
      skipHydration: true
    }
  )
);

export function hydrateOrdersForUser(userId: string) {
  const scopedStoreName = makeScopedStoreName(orderStoreName, userId);
  const persistedState = readScopedPersistedState(
    orderStoreName,
    userId,
    orderDefaults
  );

  useOrderStore.persist.setOptions({ name: scopedStoreName });
  useOrderStore.setState(persistedState);
}
