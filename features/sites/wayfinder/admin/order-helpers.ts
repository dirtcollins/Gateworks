// Wayfinder admin — order/quote presentation helpers. Pure functions shared by
// the orders list, order detail, new order, and quotes admin pages. The order
// workflow mirrors the real platform (lib/order-store + lib/platform-backend);
// these helpers only map statuses to Wayfinder-styled labels and pill tones.
import type { OrderRecord } from "@/lib/order-store";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Confirmed",
  picking: "Picking",
  ready_for_pickup: "Ready · will-call",
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

type PillTone = "neutral" | "open" | "active" | "done" | "warn" | "stop";

export function orderStatusTone(status: OrderStatus): PillTone {
  if (status === "completed") return "done";
  if (status === "cancelled") return "stop";
  if (status === "ready_for_pickup" || status === "out_for_delivery") return "active";
  if (status === "draft" || status === "submitted") return "open";
  return "warn";
}

export function paymentStatusTone(status: PaymentStatus): PillTone {
  if (status === "paid" || status === "overpaid") return "done";
  if (status === "partial") return "warn";
  if (status === "failed") return "stop";
  if (status === "refunded") return "neutral";
  return "open";
}

// Next step in the warehouse workflow for an order, mirroring the real admin.
export function nextWorkflowStep(order: OrderRecord): {
  label: string;
  next: OrderStatus;
  detail: string;
} | null {
  switch (order.status) {
    case "draft":
    case "submitted":
      return {
        label: "Confirm",
        next: "confirmed",
        detail: "Order confirmed and routed to the warehouse."
      };
    case "confirmed":
      return {
        label: "Start picking",
        next: "picking",
        detail: "Order moved to the picking queue."
      };
    case "picking":
      return order.fulfillmentMethod === "pickup"
        ? {
            label: "Stage for will-call",
            next: "ready_for_pickup",
            detail: "Picked and staged in aisle order at Bay 7."
          }
        : {
            label: "Dispatch delivery",
            next: "out_for_delivery",
            detail: "Order loaded and dispatched for delivery."
          };
    case "ready_for_pickup":
    case "out_for_delivery":
      return {
        label: "Mark complete",
        next: "completed",
        detail: "Order completed and closed."
      };
    case "completed":
      return null;
    case "cancelled":
      return {
        label: "Reopen",
        next: "confirmed",
        detail: "Order reopened from cancelled state."
      };
    default:
      return null;
  }
}

export function orderAmountDue(order: OrderRecord): number {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return 0;
  const paid = (order.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return Math.max(0, order.total - paid);
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function formatTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
