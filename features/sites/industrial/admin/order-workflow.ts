import type { OrderRecord } from "@/lib/order-store";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin order workflow helpers. Shared status labels,
 * pill tones, and the next-action mapping (ported from the real
 * orders dashboard) used by the orders list and order detail.
 * ------------------------------------------------------------------ */

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overpaid: "Overpaid",
  refunded: "Refunded",
  failed: "Failed"
};

export type PillTone = "neutral" | "pine" | "amber" | "red" | "ink";

export function orderStatusTone(status: OrderStatus): PillTone {
  if (status === "completed") return "ink";
  if (status === "cancelled") return "red";
  if (status === "ready_for_pickup" || status === "out_for_delivery") return "pine";
  if (status === "submitted" || status === "draft") return "amber";
  return "neutral";
}

export function paymentStatusTone(status: PaymentStatus): PillTone {
  if (status === "paid") return "pine";
  if (status === "partial" || status === "unpaid") return "amber";
  if (status === "failed" || status === "overpaid") return "red";
  return "neutral";
}

export type WorkflowAction = {
  label: string;
  next: OrderStatus;
  detail: string;
};

export function getNextWorkflowAction(order: OrderRecord): WorkflowAction {
  if (order.status === "draft" || order.status === "submitted") {
    return {
      label: "Confirm",
      next: "confirmed",
      detail: "Order confirmed and sent to the warehouse."
    };
  }

  if (order.status === "confirmed") {
    return {
      label: "Start picking",
      next: "picking",
      detail: "Order moved to the picking queue."
    };
  }

  if (order.status === "picking") {
    return order.fulfillmentMethod === "pickup"
      ? {
          label: "Ready for pickup",
          next: "ready_for_pickup",
          detail: "Picking complete; staged for will-call pickup."
        }
      : {
          label: "Out for delivery",
          next: "out_for_delivery",
          detail: "Order dispatched for delivery."
        };
  }

  if (order.status === "ready_for_pickup" || order.status === "out_for_delivery") {
    return {
      label: "Mark complete",
      next: "completed",
      detail: "Order completed and closed."
    };
  }

  if (order.status === "completed") {
    return {
      label: "Reopen",
      next: "confirmed",
      detail: "Order moved back to processing for correction."
    };
  }

  return {
    label: "Resume",
    next: "confirmed",
    detail: "Order resumed from a cancelled state."
  };
}

// Persists a status change to the order store + the real /api/orders route.
export function persistOrderStatus(orderId: string, status: OrderStatus) {
  void fetch("/api/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, status })
  }).catch(() => null);
}
