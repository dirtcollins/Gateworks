import type { BadgeTone } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";

export function getOrderStatusTone(status: OrderStatus): BadgeTone {
  switch (status) {
    case "submitted":
      return "warning";
    case "confirmed":
    case "picking":
    case "out_for_delivery":
      return "info";
    case "ready_for_pickup":
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "draft":
    default:
      return "neutral";
  }
}

export function getPaymentStatusTone(status: PaymentStatus): BadgeTone {
  switch (status) {
    case "partial":
      return "warning";
    case "paid":
      return "success";
    case "overpaid":
      return "info";
    case "refunded":
      return "neutral";
    case "unpaid":
    case "failed":
    default:
      return "danger";
  }
}
